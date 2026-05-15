






















"use strict";
ns.on("capabilities", event => {

  if (!ns.canScript || ns.allows("wasm") ||
      !("WebAssembly" in globalThis)) {

    return;
  }

  const notify = () => {
    let request = {
      id: "noscript-wasm",
      type: "wasm",
      url: document.URL,
      documentUrl: document.URL,
      embeddingDocument: true,
      offscreen: true,
    };
    seen.record({policyType: "wasm", request, allowed: false});
    notifyPage();
    try {
      PlaceHolder.create("wasm", request).replace();
    } catch (e) {
      error(e);
    }
  }

  Worlds.connect("WasmHook", {
    onConnect(port) {

      port.postMessage("patchWindow");
    },
    onMessage: m => {
      switch(m) {
        case "notify":
          notify();
        break;
      }
    },
  });

  debug(`WasmHook installed on window ${document.URL}.`);

  try {
    const channelID = `wasmHook:${globalThis.location?.href}:${uuid()}`;
    try {
      const bc = new BroadcastChannel(channelID);
      bc.onmessage = notify;
    } catch (e) {
      console.error(e, `Cannot use BroadCastChannel ${channelID} - but we're fine.`);
    }
    const workersPatch = () => {


      Reflect.deleteProperty(globalThis, "WebAssembly");


      if (!globalThis.addEventListener) {

        return;
      }

      for (const event of ["error", "unhandledrejection", "rejectionhandled"]) {
        addEventListener(event, e => {

          console.error(e, "Error handler", e.reason, e.message, e.reason?.message, e.isTrusted);
          if (e.isTrusted && /\bWebAssembly\b/.test(`${e.message} ${e.reason?.message}`)) {
            try {
              const bc = new BroadcastChannel(channelID);
              bc.postMessage({});
              bc.close();
              console.log("Used BroadcastChannel", channelID);
            } catch (e) {
              console.error(e, `Cannot use BroadCastChannel ${channelID} - but we're fine.`);
            }
          }
        }, true);
      }
    };
    patchWorkers(`(${workersPatch})()`.replace(/\bchannelID\b/g, JSON.stringify(channelID)));

  } catch(e) {
    error(e);
  }
});
