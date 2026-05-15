



















"use strict";
{
  let patchesByTab = new Map();
  let debugging;

  let cleanup = tabId => {
    if (tabId === -1) return;
    let byOrigin = patchesByTab.get(tabId);
    if (!byOrigin) return;
    patchesByTab.delete(tabId);
    if (debugging) {
      debugging.dispose(tabId);
    }
    let serviceWorkers = patchesByTab.get(-1);
    if (serviceWorkers) {
      for (let origin of byOrigin.keys()) {
        serviceWorkers.delete(origin);
      }
    }
  };

  const INIT_EVENT = JSON.stringify(`workerPatch:${uuid()}`);
  const wrapPatch = patch => `(() => {
    if (globalThis.dispatchEvent) {
      if (!dispatchEvent(new CustomEvent(${INIT_EVENT}, { cancelable: true }))) {

        return;
      }
      addEventListener(${INIT_EVENT}, e => e.preventDefault(), true);
    }
    ${patch}
  })();
  `;

  browser.tabs.onRemoved.addListener(tab => {
    cleanup(tab.id);
  });
  browser.webNavigation.onCommitted.addListener(({tabId, frameId}) => {
    if (frameId === 0) cleanup(tabId);
  });

  const updatePatch = (patch, tabId, documentUrl, url) => {
    let byOrigin = patchesByTab.get(tabId);
    if (!byOrigin) patchesByTab.set(tabId, byOrigin = new Map());
    if (tabId == -1) {
      documentUrl = new URL(documentUrl).origin;
    }
    patch = wrapPatch(patch);
    let patchInfo = byOrigin.get(documentUrl);
    if (!patchInfo) byOrigin.set(documentUrl, patchInfo = {
      patch,
      urls: new Set(),
    });
    else {
      patchInfo.patch = patch;
    }
    patchInfo.urls.add(url);

    byOrigin.set(url, patchInfo);
    return patchInfo;
  }


  const workerCreationListener = ({__patchWorkers__}, {tab, url: documentUrl}) => {
    if (!__patchWorkers__) return;
    try {
      const {url, patch, isServiceOrShared} = __patchWorkers__;
      const tabId = isServiceOrShared && !chrome.debugger ? -1 : tab.id;

      const patchInfo = updatePatch(patch, tabId, documentUrl, url);

      return init(tab.id, url, patchInfo);
    } catch (e) {
      console.error("Error on __patchWorkers__ message", e);
      return Promise.reject(e);
    }
  };

  browser.runtime.onMessage.addListener(workerCreationListener);

  let init = browser.webRequest.filterResponseData ? (() => {



    browser.webRequest.onBeforeSendHeaders.addListener(async request => {
      const { requestHeaders } = request;


      let type;
      for (const { name, value } of requestHeaders) {
        if (name == "Sec-Fetch-Dest") {
          if (!/work(er|let)/.test(value)) {
            return;
          }
          type = value;
          break;
        }
      }
      if (!type) {
        return;
      }

      const { tabId, frameId, url, documentUrl, originUrl, requestId  } = request;
      const byOrigin = patchesByTab.get(tabId);
      if (tabId == -1) {
        documentUrl = new URL(documentUrl).origin;
      }

      let patchInfo = byOrigin?.get(documentUrl);
      if (!patchInfo?.urls.has(url)) {

        patchInfo = byOrigin.get(originUrl);
        if (!patchInfo) {
          if (tabId == -1) {
            return;
          }
          try {
            const patch = await browser.tabs.sendMessage(tabId,
              { __getWorkerPatch__: { url } },
              { frameId }
            );
            if (!patch) {
              return;
            }
          } catch(e) {
            return;
          }
          patchInfo = updatePatch(patch, tabId, documentUrl, url);
        }
        byOrigin.set(url, patchInfo);
        patchInfo.urls.add(url);
      }


      let filter = browser.webRequest.filterResponseData(requestId);
      filter.onstart = () => {

        filter.write(new TextEncoder().encode(patchInfo.patch));
      };
      filter.ondata = e => {
        filter.write(e.data);
      };
      filter.onstop = () => {
        filter.close();
      };
    }, {
      urls: ["<all_urls>"],
      types: ["script"],
    }, ["blocking", "requestHeaders"]);


    return () => true;
  })() : async (...args) => {




    if (!chrome.debugger) {
      throw new Error("patchWorker.js - no debugger API: missing permission?");
    }

    const dbg = chrome.debugger;

    debugging = new Map();
    debugging.dispose = async function(tabId) {
      let dbgInfo = await this.get(tabId);
      if (dbgInfo) {
        try {
          return await dbgInfo.dispose();
        } catch (e) {
          console.error(e);
        }
      }
      return false;
    }

    dbg.onEvent.addListener(async (source, method, params) => {
      let { tabId } = source;
      const dbgInfo = await debugging.get(tabId);
      if (!dbgInfo) {
        return;
      }

      switch (method) {
        case "Network.requestWillBeSent":
          if (params.type == "Script" || params.type == "Other") {
            dbgInfo.requests.set(params.requestId, params.initiator.url);
            break;
          }
          return;
        case "Fetch.requestPaused":
          await dbgInfo.handleRequest(source, params);
          break;
        case "Network.loadingFinished":
        case "Network.loadingFailed":
          dbgInfo.requests.delete(params.requestId);
          return;
        default:
          return;
      }

    });

    dbg.onDetach.addListener((source, reason) => {

      if (source.tabId) debugging.dispose(source.tabId);
    });



    const fetchParams = {
      patterns: [
        {
          resourceType: "Other",
          requestStage: "Response",
        },
      ]
    };

    return await (init = async (tabId, url, {patch}) => {
      const target = { tabId };
      let dbgInfo = await debugging.get(tabId);
      if (!dbgInfo) {
        const startingDebugger = (async () => {
          try {

            try {
              await dbg.attach(target, "1.3");
            } catch (e) {

              console.error(e);
            }
            await dbg.sendCommand(target, "Fetch.enable", fetchParams);
            await dbg.sendCommand(target, "Network.enable");
          } catch (e) {
            console.error(e);
            throw e;
          }

          console.debug("NoScript's patchWorker started debugger on ", tabId);
          return {
            requests: new Map(),
            patches: new Map(),

            async handleRequest(source, params) {
              const { requestId, responseHeaders } = params;
              const contentTypeHeader = responseHeaders?.find(h => h.name.toLowerCase() === "content-type");
              const isJS = /\bjavascript\b/.test(contentTypeHeader?.value);
              if (isJS) {
                try {
                  const initiatorUrl = this.requests.get(params.networkId);
                  const codeChunks = [];
                  if (initiatorUrl) {
                    const { origin } = new URL(initiatorUrl);
                    if (this.patches.has(origin)) {
                      codeChunks.push(this.patches.get(origin).code);
                    }
                  }
                  const { origin } = new URL(params.request.url);
                  if (this.patches.has(origin)) {
                    codeChunks.push(this.patches.get(origin).code);
                  } else if (codeChunks[0]) {

                    this.patch(origin, codeChunks[0]);
                  }
                  const code = [...new Set(codeChunks)].join(";");

                  if (code) {
                    const response = await dbg.sendCommand(source, "Fetch.getResponseBody", { requestId });
                    const body = code.concat(
                      response.base64Encoded ? atob(response.body) : response.body);
                    await dbg.sendCommand(source, "Fetch.fulfillRequest", {
                      requestId,
                      responseHeaders,
                      responsePhrase: params.responseStatusText,
                      responseCode: params.responseStatusCode,
                      body: btoa(unescape(encodeURIComponent(body)))
                    });

                  }
                  return;
                } catch (e) {
                  console.error("Cannot patch worker via Fetch", e, params);
                }
              }
              console.debug("Fetch: continuing ", requestId);
              await dbg.sendCommand(source, "Fetch.continueRequest", { requestId });
            },

            patch(origin, code) {
              let patch = this.patches.get(origin);
              if (!patch) {
                this.patches.set(origin, patch = { origin, code, count: 1 });
              } else {
                patch.code = code;
                patch.count++;
              }
            },
            async dispose() {
              this.patches.clear();
              this.requests.clear();

              try {
                await dbg.detach(target);
              } catch (e) {
                console.error(e);
              }
              debugging.delete(target.tabId);
            }
          }
        })();
        debugging.set(tabId, startingDebugger);
        dbgInfo = await startingDebugger;
      }
      dbgInfo.patch(new URL(url).origin, patch);
    })(...args);
  };
}
