



















"use strict";
(() => {
  let enabled = new Map();
  let corsInfoCache = new Map();
  browser.tabs.onRemoved.addListener(tab => {
    enabled.delete(tab.id);
  });
  let reqKey = (frameId, destination, origin) => `${frameId}|${destination}@${origin}`;

  browser.runtime.onMessage.addListener(
    ({__prefetchCSSResources__: msg}, sender) => {
      if (!msg) return;
      let {tab, url, origin} = sender;
      if (!origin) origin = new URL(url).origin;
      let requests = enabled.get(tab.id);
      switch(msg.type) {
        case "enableCORS":
         if (!requests) {
            enabled.set(tab.id, requests = new Set());
          }
          requests.add(reqKey(sender.frameId, msg.opts.url, origin));
          return Promise.resolve(true);
      }
      return Promise.resolve(false);
  });

  let corsInfo = (r, forget = false) => {
    let {tabId, frameId, url, requestId} = r;
    if (corsInfoCache.has(requestId)) {
      let cached = corsInfoCache.get(requestId);
      if (forget) corsInfoCache.delete(requestId);
      return cached;
    }
    let origin = new URL(r.initiator || r.originUrl || r.documentUrl).origin;
    let destination = new URL(url).origin;
    let info;
    if (destination !== origin) {
      info = {origin};
      let requests = enabled.get(tabId);
      if (requests) {
        let key = reqKey(frameId, url, origin);
        info.authorize = requests.has(key);
        requests.delete(key);
      }
    } else {
      info = null;
    }
    corsInfoCache.set(requestId, info);
    return info;
  }

  if (!UA.isMozilla) {
    console.warn("Cannot patch CORS header for prefetchCSSResource. TODO: use DNR if possible.");
    return;
  }

  const allCssFilter =  {
    urls: ['<all_urls>'],
    types: ['stylesheet']
  };

  const options = ["blocking"];
  try {
    browser.webRequest.onBeforeRequest.addListener(r => {
      corsInfo(r); 
    }, allCssFilter, options);
  } catch (e) {
    console.error(e);

  }

  options.push('requestHeaders');

  function patchHeaders(headers, patch) {
    for (const h of headers) {
      const name = h.name.toLowerCase();
      if (name in patch) {
        h.value = patch[name];
        delete patch[name];
      }
    }
    for (const [name, value] of Object.entries(patch)) {
      headers.push({name, value});
    }
  }

  browser.webRequest.onBeforeSendHeaders.addListener(r => {
    let crossSite = corsInfo(r);
    if (!(crossSite?.authorize)) return;

    let {requestHeaders} = r;
    patchHeaders(requestHeaders, {
      "cache-control": "max-age=604800",
    });
    return {requestHeaders};
  }, allCssFilter, options);

  options[1] = 'responseHeaders';
  if (!UA.isMozilla) {
    options.push('extraHeaders'); 
  }

  browser.webRequest.onHeadersReceived.addListener(r => {
    let crossSite = corsInfo(r);
    if (!crossSite) return;
    let {authorize, origin} = crossSite;
    let {responseHeaders} = r;

    patchHeaders(responseHeaders,
      authorize
      ? {
        "cache-control": "no-store",
        "vary": "origin",
        "access-control-allow-origin": origin
      }
      : {
        "cache-control": "private, max-age=604800, immutable"
      }
    );

    return {responseHeaders};
  }, allCssFilter, options);

  let cleanup = r => {
    let crossSite = corsInfo(r, true);
    if (!(crossSite?.authorize)) return;
    if (!r.fromCache) {
      debug("Warning: cross-site CSS request from CSS resource prefetching NOT from cache.");
    }
  }
  for (let ev of ["onCompleted", "onErrorOccurred"]) {
    browser.webRequest[ev].addListener(cleanup, allCssFilter);
  }
})();