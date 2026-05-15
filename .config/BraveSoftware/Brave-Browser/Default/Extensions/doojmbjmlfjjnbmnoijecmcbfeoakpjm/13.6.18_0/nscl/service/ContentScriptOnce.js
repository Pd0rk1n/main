



















var ContentScriptOnce = (() => {
  "use strict";

  let requestMap = new Map();

  let getId = r => r.requestId || `{r.tabId}:{r.frameId}:{r.url}`;

  let initOnce = () => {
    let initOnce = () => {};

    let cleanup = r => {
      let id = getId(r);

      let scripts = requestMap.get(id);
      if (scripts) {
        self.setTimeout(() => {
          requestMap.delete(id);
          for (let s of scripts) s.unregister();
        }, 0);
      }
    }

    let filter = {
      urls: ["<all_urls>"],
      types:  ["main_frame", "sub_frame", "object"]
    };

    for (let event of ["onCompleted", "onErrorOccurred"]) {
      browser.webRequest[event].addListener(cleanup, filter);
      browser.webNavigation[event].addListener(cleanup);
    }

    browser.runtime.onMessage.addListener(({__contentScriptOnce__}, sender)  => {
      if (!__contentScriptOnce__) return;
      let {requestId, tabId, frameId, url} = __contentScriptOnce__;
      let ret = false;
      if (tabId === sender.tab.id && frameId === sender.frameId && url === sender.url) {
        cleanup({requestId});
        ret = true;
      }
      return Promise.resolve(ret);
    });
  }

  return {
    async execute(request, options) {
      initOnce();
      let {tabId, frameId, url, requestId} = request;
      let scripts = requestMap.get(requestId);
      if (!scripts) requestMap.set(requestId, scripts = new Set());
      let match = url;
      try {
        let urlObj = new URL(url);
        if (urlObj.port) {
          urlObj.port = "";
          match = urlObj.toString();
        }
      } catch (e) {}
      let defOpts = {
        runAt: "document_start",
        matchAboutBlank: true,
        matches: [match],
        allFrames: true,
        js: [],
      };

      options = Object.assign(defOpts, options);
      let ackMsg = {
        __contentScriptOnce__: {requestId, tabId, frameId, url}
      };
      options.js.push({
        code: `if (document.readyState !== "complete") browser.runtime.sendMessage(${JSON.stringify(ackMsg)});`
      });

      scripts.add(await browser.contentScripts.register(options));
    }
  }
})();
