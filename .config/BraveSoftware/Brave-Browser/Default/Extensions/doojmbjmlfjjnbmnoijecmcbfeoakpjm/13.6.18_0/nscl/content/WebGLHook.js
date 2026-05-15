






















"use strict";
ns.on("capabilities", event => {


  const createCanvas = () => document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
  try {
    if (!ns.canScript || ns.allows("webgl") ||
      !("HTMLCanvasElement" in window && createCanvas()?.getContext("webgl"))) {

      return;
    }
  } catch (e) {
  }
  const notifyWebGL = canvas => {
    let request = {
      id: "noscript-webgl",
      type: "webgl",
      url: document.URL,
      documentUrl: document.URL,
      embeddingDocument: true,
    };
    seen.record({policyType: "webgl", request, allowed: false});
    notifyPage();
    if (canvas && !(canvas instanceof HTMLCanvasElement)) {
      request.offscreen = true;
      canvas = null;
    }
    try {
      let ph = PlaceHolder.create("webgl", request);
      ph.replace(canvas);
    } catch (e) {
      error(e);
    }
  }

  function panicAbort() {
    const html = document.documentElement.outerHTML;
    const scriptBlocker = `<head><meta http-equiv="content-security-policy" content="script-src 'none'"></head>`;
    DocRewriter.rewrite(scriptBlocker);
    DocRewriter.rewrite(html);

    const target = document.body.appendChild(createCanvas());
    target.style = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%";
    notifyWebGL(target);
  }

  Worlds.connect("WebGLHook", {
    onConnect(port) {

      port.postMessage("patchWindow");
    },
    onMessage(msg, {port, event}) {
      const {target} = event;

      switch(msg) {
        case "notify":
          notifyWebGL(target);
          break;
        case "panic":
          panicAbort();
          break;
      }
    }
  });

  debug(`WebGLHook installed on window ${document.URL}.`);

  if (!(globalThis.OffscreenCanvas && new OffscreenCanvas(0,0).getContext("webgl"))) {

    return;
  }

  try {
    const channelID = `webglHook:${globalThis.location?.href}:${uuid()}`;
    try {
      const bc = new BroadcastChannel(channelID);
      bc.onmessage = notifyWebGL;
    } catch (e) {
      console.error(e, `Cannot use BroadCastChannel ${channelID} - but we're fine.`);
    }
    const workersPatch = () => {
      if (!globalThis.OffscreenCanvas) {
        return;
      }

      const getContext = OffscreenCanvas.prototype.getContext;
      const handler = {
        apply: function(targetObj, thisArg, argumentsList) {

          if (/webgl/i.test(argumentsList[0])) {
            try {
              const bc = new BroadcastChannel(channelID);
              bc.postMessage({});
              bc.close();
            } catch (e) {
              console.error(e, `Cannot use BroadCastChannel ${channelID} - but we're fine.`);
            }
            return null;
          }
          return getContext.call(thisArg, ...argumentsList);
        }
      };
      OffscreenCanvas.prototype.getContext = new Proxy(getContext, handler);
    };
    patchWorkers(`(${workersPatch})()`.replace(/\bchannelID\b/g, JSON.stringify(channelID)));

  } catch(e) {
    error(e);
  }
});
