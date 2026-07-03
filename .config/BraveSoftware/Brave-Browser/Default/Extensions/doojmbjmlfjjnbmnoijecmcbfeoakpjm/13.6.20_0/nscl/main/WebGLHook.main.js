






















"use strict";
{
  const {console, cloneInto, patchWindow} = Worlds.main;

  function modifyWindow(scope, {port, xray}) {

    const dispatchEvent = EventTarget.prototype.dispatchEvent;
    const { Event } = scope;
    for (const canvas of ["HTMLCanvasElement", "OffscreenCanvas"]) {
      if (!(canvas in scope)) continue;






      const unwrappedScope = xray.unwrap(scope);
      const CanvasClass = unwrappedScope[canvas];
      const getContext = xray.getSafeMethod(scope[canvas].prototype, "getContext");

      const MAX_CONSECUTIVE = 20;
      let consecutive = 0;
      let lastTime = 0;
      let panic = false;
      const handler = cloneInto({
        apply: function(targetObj, thisArg, argumentsList) {

          if (thisArg instanceof CanvasClass && /webgl/i.test(argumentsList[0])) {
            if (panic) {
              return null;
            }
            const target = canvas == "HTMLCanvasElement" && unwrappedScope.document.contains(thisArg) ? thisArg : scope;
            const t = Date.now();
            if (t - lastTime < 5 && consecutive++ > MAX_CONSECUTIVE) {
              console.error("Too many consecutive blocked webgl contexts, trying to break the loop.");
              panic = true;
              port.postMessage("panic");
            } else {
              port.postMessage("notify", target);
              lastTime = t;
            }
            return null;
          }
          return getContext.call(thisArg, ...argumentsList);
        }
      }, scope, {cloneFunctions: true});

      const proxy = new scope.Proxy(getContext, handler);
      scope[canvas].prototype.getContext = proxy;
    }
  }

  Worlds.connect("WebGLHook.main", {
    onMessage(msg, {port}) {

      switch(msg) {
        case "patchWindow":
          patchWindow(modifyWindow, {port});
          break;
      }
    }
  });
}