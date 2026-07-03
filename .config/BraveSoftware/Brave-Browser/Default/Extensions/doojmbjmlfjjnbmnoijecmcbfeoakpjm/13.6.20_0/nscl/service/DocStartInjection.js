






















"use strict";

var DocStartInjection = (() => {
  const MSG_ID = "__DocStartInjection__";
  const isGecko = "contentScripts" in browser;
  const mv3Callbacks = !browser.tabs.executeScript; 
  const isMv3Callback = script => typeof script == "object" && ("data" in script || "callback" in script || "assign" in script);

  let scriptBuilders = new Set();
  let getId = ({requestId, tabId, frameId, url}) => requestId || `${tabId}:${frameId}:${url}`;
  let pending = new Map();

  async function begin(request) {
    let scripts = new Set();
    let {tabId, frameId, cookieStoreId, url, type, documentId, documentLifecycle, frameType} = request;

    if (tabId < 0 || !/^(?:(?:https?|ftp|data|blob|file):|about:blank$)/.test(url)) return;

    if (!type && frameId == 0) {
      type = "main_frame"; 
    }
    if (documentLifecycle == "prerender" && frameType == "outmostframe") {

    }
    await Promise.allSettled([...scriptBuilders].map(async buildScript => {
      let script;
      try {
        script = await buildScript({tabId, frameId, cookieStoreId, url, type});
        if (!script) return;
        if (mv3Callbacks) {
          if (!isMv3Callback(script)) {
            throw new Error('On MV3 only {data: jsonObject, callback: "globalFunctionName", assign: "globalScopeVarName"} injection can work!')
          }
          const {data, callback, assign} = script;
          scripts.add({
            data,
            callback,
            assign,
          });
          return;
        }


        if (isMv3Callback(script)) {

          script = `
            const {data, callback, assign} = ${JSON.stringify(script)};
            if (assign && !(assign in globalThis)) {
              globalThis[assign] = data;
            }
            if (callback) {
              let cb = globalThis[callback];
              if (typeof cb == "function") {
                cb.call(globalThis, data);
              } else {
                console.warn(\`callback globalThis.${script.callback} is not a function.\`);
              }
            }
         `;
        }

        scripts.add(`try {
          ${typeof script === "function" ? `(${script})();` : script}
          } catch (e) {
            console.error("Error in DocStartInjection script", e);
          }`
        );
      } catch (e) {
        error(`Error calling DocStartInjection scriptBuilder: buildScript ${buildScript} - script: ${script}`, e);
      }
    }));

    if (scripts.size === 0) {
      debug(`DocStartInjection: no script to inject in ${url}`);
      return;
    }

    const id = getId(request);

    const injectionId = `injection:${uuid()}:${await sha256(Math.random().toString(16))}`;
    const args = mv3Callbacks ?

    {
      func: (url, injectionId, scripts) => {
        if (document.readyState === "complete" ||
            window[injectionId] ||
            document.URL !== url
        ) return window[injectionId];
        window[injectionId] = true;
        for (s of scripts) {
          const {data, callback, assign}  = s;
          try {
            if (assign && !(assign in globalThis)) {
              globalThis[assign] = data;
            }
            if (callback) {
              let cb = globalThis[callback];
              if (typeof cb == "function") {
                cb.call(globalThis, data);
              } else {
                console.warn(`callback globalThis.${callback} is not a function (${cb}).`);
              }
            }
          } catch (e) {
            console.error(`Error in DocStartInjection script ${JSON.stringify(s)}`, e);
          }
        }
        return document.readyState === "loading";
      },
      args: [url, injectionId, [...scripts]],
      target: documentId ? {tabId, documentIds: [documentId] } : {tabId, frameIds: [frameId]},
      injectImmediately: true,
    } :

    {
      code: `(() => {
        let injectionId = ${JSON.stringify(injectionId)};
        if (document.readyState === "complete" ||
            window[injectionId] ||
            document.URL !== ${JSON.stringify(url)}
        ) return window[injectionId];
        window[injectionId] = true;
        ${[...scripts].join("\n")}
        return document.readyState === "loading";
      })();`,
      runAt: "document_start",
      frameId,
    };
    pending.set(id, args);
    await run(request, true);
  }

  async function run(request, repeat = false) {
    const id = getId(request);
    const args = pending.get(id);
    if (!args) return;
    let {url, tabId} = request;
    let attempts = 0;
    let success = false;
    const execute = mv3Callbacks ?
      async () => {
        const ret = await browser.scripting.executeScript(args);
        return ret[0].result;
      }
    : async() => {
       const ret = await browser.tabs.executeScript(tabId, args);
       return ret[0];
    };
    for (; pending.has(id);) {
      attempts++;
      try {
        if (attempts % 1000 === 0) {
          let tab = await browser.tabs.get(request.tabId);
          if (tab.url !== url) {
            console.error(`Tab mismatch: ${tab.url} <> ${url} (download-triggered?)`);
            break;
          }
          console.error(`DocStartInjection at ${url} ${attempts} failed attempts so far...`);
        }
        if (await execute()) {
          success = true;
          break;
        }
      } catch (e) {
        if (/No tab\b/.test(e.message)) {
          break;
        }
        if (!/\baccess\b/.test(e.message)) {
          console.error(e.message);
        }
        if (!browser.tabs.executeScript && e.message != "Frame with ID 0 was removed.") {
          console.error(`MV3 fatality, cannot script tab ${tabId}! ${JSON.stringify(args)}`);
          break;
        }
        if (attempts % 1000 === 0) {
          console.error(`DocStartInjection at ${url} ${attempts} failed attempts`, e);
        }
      } finally {
        if (!repeat) break;
      }
    }
    pending.delete(id);
    debug(`DocStartInjection at ${url}, ${attempts} attempts, success = ${success}, repeat = ${repeat}.`);
  }

  function end(request) {
    const id = getId(request);
    const script = pending.get(id);
    if (script) {

      run(request, false);
    }
  }

  let listeners = {
    onBeforeNavigate: begin,
    onDomContentLoaded: end,
    onErrorOccurred: end, 
    onCompleted: end, 
  }

  function listen(enabled) {
    let {webNavigation, webRequest} = browser;
    let method = `${enabled ? "add" : "remove"}Listener`;
    let reqFilter =  {urls: ["<all_urls>"], types:  ["main_frame", "sub_frame", "object"]};
    function setup(api, eventName, listener, ...args) {
      let event = api[eventName];
      if (event) {
        event[method].apply(event, enabled ? [listener, ...args] : [listener]);
      }
    }

    setup(webRequest, "onResponseStarted", begin, reqFilter);
    if (isGecko) {

      let navFilter = enabled && {url: [{schemes: ["file", "ftp"]}]};
      for (let [eventName, listener] of Object.entries(listeners)) {
        setup(webNavigation, eventName, listener, navFilter);
      }
    }


    for (let [eventName, listener] of Object.entries(listeners)) {
       setup(webRequest, eventName, listener, reqFilter);
    }
  }

  return {
    mv3Callbacks,
    register(scriptBuilder) {
      if (scriptBuilders.size === 0) listen(true);
      scriptBuilders.add(scriptBuilder);
    },
    unregister(scriptBuilder) {
      scriptBuilders.delete(scriptBuilder);
      if (scriptBuilders.size === 0) listen(false);
    }
  };
})();
