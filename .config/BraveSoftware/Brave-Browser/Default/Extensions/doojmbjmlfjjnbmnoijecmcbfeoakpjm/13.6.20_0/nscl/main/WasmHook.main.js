






















"use strict";
{
  const {console, cloneInto, patchWindow} = Worlds.main;

  function modifyWindow(scope, {port, xray}) {

    Reflect.deleteProperty(xray.unwrap(scope), "WebAssembly");
    for (const event of ["error", "unhandledrejection", "rejectionhandled"]) {
      addEventListener(event, e => {
        if (e.isTrusted && /\bWebAssembly\b/.test(`${e.message} ${e.reason?.message}`)) {
          port.postMessage("notify");
        }
      }, true);
    }
  }

  Worlds.connect("WasmHook.main", {
    onMessage(msg, {port}) {

      switch(msg) {
        case "patchWindow":
          patchWindow(modifyWindow, {port});
          break;
      }
    }
  });
}
