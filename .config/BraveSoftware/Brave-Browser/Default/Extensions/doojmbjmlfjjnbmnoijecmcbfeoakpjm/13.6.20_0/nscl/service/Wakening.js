


















if (!self.Wakening) {
  "use strict";



  self.Wakening = {};

  const wakening = new Promise(resolve => {
    self.Wakening.done = resolve;
    Object.freeze(self.Wakening);
  });

  const apiRoot = browser;
  const handler = {
    apply(target, thisArg, [fn, ...filters]) {
      const waitingFn = async (...args) => {
        await wakening;

        return fn(...args);
      };

      return Reflect.apply(target, thisArg, [waitingFn, ...filters]);
    }
  };

  const restoreMap = new Map();
  for (const apiName in apiRoot) {
    const api = apiRoot[apiName];
    if (typeof api !== "object") continue;
    const events = [];
    for (const key in api) {
      if (!/^on[A-Z]/.test(key) ||
        key == "onMessage" 
      ) {
        continue;
      }

      const event = api[key];
      if (!event) continue;
      const {addListener} = event;
      restoreMap.set(event, addListener);
      event.addListener = new Proxy(addListener, handler);
    }
  }

  (async () => {
    await wakening;

    for (const [event, addListener] of [...restoreMap]) {
      event.addListener = addListener;
    }
    restoreMap.clear();
  })();
}