





















"use strict";
globalThis.patchWorkers = (() => {
  const patches = new Set();
  let propagator = "";

  let stringify = f => typeof f === "function" ? `(${f})();\n` : `{${f}}\n`;

  const debugMonitor = `
    if (globalThis.addEventListener) for (const et of ['message', 'error', 'messageerror']) {
      addEventListener(et, ev => {
        console.debug("Event in patched worker/worklet", globalThis, ev.type, ev.data);
      }, true);
    }`;
  const wrap = code => `{
    let parentPatch = () => {
      if (!(globalThis.WorkerGlobalScope || globalThis.WorkletGlobalScope)) {

        return false;
      }
      // preserve console from rewriting / erasure
      const console = Object.fromEntries(Object.entries(globalThis.console).map(([n, v]) => v.bind ? [n, v.bind(globalThis.console)] : [n,v]));

      try {
        ${code}
      } catch(e) {
        console.error("Error executing worker/worklet patch", e);
      }
    };
    ${propagator}
    parentPatch();
  };`
  ;
  const joinPatches = () => wrap([...patches].join("\n"));

  browser.runtime.onMessage.addListener(({ __getWorkerPatch__ }) =>
    __getWorkerPatch__ ? joinPatches() : undefined
  );

  return patch => {

    if (patches.size === 0) {
      Worlds.connect("patchWorkers", {
        onMessage(msg, {port}) {
          switch (msg.type) {
            case "propagate":

              propagator = `
                const modifyContext = ${msg.modifyContext};
                modifyContext(null, {});
              `;
              break;
            case "getPatch":
              return joinPatches();
            case "patchUrl":
            {
              let {url, isServiceOrShared} = msg;
              url = `${url}`;
              const workerCreatedMsg = {
                __patchWorkers__: { url, patch: joinPatches(), isServiceOrShared }
              };
              browser.runtime.sendMessage(workerCreatedMsg).then(r => {
                port.postMessage({ type: "patchedUrl", url });
              }, e => {


                port.postMessage({type: "cancelUrl", url});
              });
            }
          }
        }
      });
    }

    patches.add(stringify(patch));
  }
})();
