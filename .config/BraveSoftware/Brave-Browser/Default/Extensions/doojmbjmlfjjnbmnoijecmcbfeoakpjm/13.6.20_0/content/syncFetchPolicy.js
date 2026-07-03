





















"use strict";

if (/^(?:file|ftp):$/.test(location.protocol)) {

  (globalThis.ns ||= {}).syncFetchPolicy = function() {

    ns.pendingSyncFetchPolicy = false;
    ns.syncFetchPolicy = () => {};

    const url = document.URL;



    debug("No CSP yet for non-HTTP document load: fetching policy synchronously...", ns);

    let syncSetup = ns.setup.bind(ns);

    if (window.wrappedJSObject) {
      if (top === window) {
        let persistentPolicy = null;
        syncSetup = policy => {
          if (persistentPolicy) return;
          ns.setup(policy);
          persistentPolicy = JSON.stringify(policy);
          Object.freeze(persistentPolicy);
          try {
            Object.defineProperty(window.wrappedJSObject, "_noScriptPolicy", {value: cloneInto(persistentPolicy, window)});
          } catch(e) {
            error(e);
          }
        };
      } else try {
        if (top.wrappedJSObject._noScriptPolicy) {
          debug("Policy set in parent frame found!")
          try {
            ns.setup(JSON.parse(top.wrappedJSObject._noScriptPolicy));
            return;
          } catch(e) {
            error(e);
          }
        }
      } catch (e) {

      }
    }
    if (ns.domPolicy) {
      syncSetup(ns.domPolicy);
    }



    let mustFreeze = !ns.canScript && UA.isMozilla
      && (!/^(?:image|video|audio)/.test(document.contentType) || document instanceof XMLDocument)
      && document.readyState !== "complete";

    if (mustFreeze) {
      const normalizeDir = e => {

        if (document.baseURI === `${url}/`) {
          if (e) {
            document.removeEventListener(e.type, normalizeDir);
            e.stopImmediatePropagation();
          }
          window.stop();
          location.replace(document.baseURI);
        }
      }
      normalizeDir();

      try {
        DocumentFreezer.freeze();

        ns.on("capabilities", () => {

          debug("Readystate: %s, suppressedScripts = %s, canScript = %s", document.readyState, DocumentFreezer.suppressedScripts, ns.canScript);

          if (!ns.canScript) {
            if (url.endsWith("/")) {
              DocumentFreezer.unfreezeLive();
              return;
            }
            if (DocumentFreezer.firedDOMContentLoaded) {
              normalizeDir();
            } else {
              document.addEventListener("readystatechange", normalizeDir);
            }
            return;
          }

          DocumentFreezer.unfreezeAutoReload();
        });
      } catch (e) {
        error(e);
      }
    }

    ns.fetchLikeNoTomorrow(url, syncSetup);
  };

  if (ns.pendingSyncFetchPolicy) {
    ns.syncFetchPolicy();
  }
}
