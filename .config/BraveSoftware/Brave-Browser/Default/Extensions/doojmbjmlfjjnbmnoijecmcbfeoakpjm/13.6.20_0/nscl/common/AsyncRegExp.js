



















"use strict";

if (typeof SharedWorkerGlobalScope !== "undefined" && self instanceof SharedWorkerGlobalScope) {

  const cache = new Map();

  onconnect = e => {
    const port = e.ports[0];
    debugger;
    port.onmessage = e => {
      let {id, asyncRegExp, testSubject, workerId} = e.data;
      debugger;
      const {source, flags} = asyncRegExp;
      const cacheKey = `/${source}/${flags}`;
      asyncRegExp = cache.get(cacheKey);
      if (!asyncRegExp) {
        cache.set(cacheKey, asyncRegExp = new RegExp(source, flags));
      }
      try {
        debugger;
        const result = asyncRegExp.test(testSubject);
        port.postMessage({asyncRegExpId: id, result, workerId});
      } catch (error) {
        port.postMessage({asyncRegExpId: id, error, workerId}, [error]);
      }
    }
  }
}


var AsyncRegExp = (() => {

  const inWorker = typeof DedicatedWorkerGlobalScope !== "undefined" && self instanceof DedicatedWorkerGlobalScope;

  const lazy = {
    get regExpWorker() {
      delete this.regExpWorker;
      let src = "/nscl/common/AsyncRegExp.js";
      const w = new SharedWorker(src);
      w.port.onmessage = resolveResult;
      w.port.onmessageerror = e => {
        error(e, "AsyncRegExp SharedWorker error.");
      }
      return this.regExpWorker = w;
    }
  }

  function dispatchToSharedWorker(data) {
    lazy.regExpWorker.port.postMessage(data);
  }

  const workers = new Map();
  const rxResolvers = new Map();
  let rxLastId = 0;
  let workerLastId = 0;

  async function regExpAsyncTest({source,flags}, testSubject) {
    return new Promise((resolve, reject) => {
      const id = ++rxLastId;
      rxResolvers.set(id, {resolve, reject});
      const data = {id, asyncRegExp: {source, flags}, testSubject};
      if (inWorker) {
        postMessage(data);
      } else {
        dispatchToSharedWorker(data);
      }
    });
  }


  function resolveResult({data}) {
    const {asyncRegExpId, result, error, workerId} = data;
    if (!asyncRegExpId) {
      return;
    }
    debug("AsyncRegExp resolve", data);
    if (!inWorker && workerId) {
      const worker = workers.get(workerId);
      if (!worker) return;
      workers.delete(workerId);
      while (!workers.has(workerLastId--) && workerLastId > -1);
      ++workerLastId;
      worker.postMessage(data);
      return;
    }

    const resolver = rxResolvers.get(asyncRegExpId);
    if (!resolver) {
      return;
    }
    const {resolve, reject} = resolver;
    if (resolve) {
      rxResolvers.delete(asyncRegExpId);
      while(!rxResolvers.has(rxLastId--) && rxLastId > -1);
      ++rxLastId;
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  }

  if (inWorker) {
    addEventListener("message", resolveResult);
  }

  return class AsyncRegExp extends RegExp {
    static connectWorker(worker) {
      worker.addEventListener("message", e => {
        const {data} = e;
        if (!(data?.asyncRegExp)) {
          return;
        }
        debug("AsyncRegExp worker.onmessage", data);
        data.workerId = ++workerLastId;
        workers.set(data.workerId, worker);
        dispatchToSharedWorker(data);
      });
    }

    constructor(rx, ...args) {
      if (rx instanceof RegExp) {
        super(rx.source, rx.flags);
      } else {
        super(rx, ...args);
      }
    }

    async asyncTest(subject, forceRemote = this.forceRemote) {
      if (!forceRemote) {
        try {
          return this.test(subject);
        } catch (e) {
          console.error(e);
        }
      }
      return await regExpAsyncTest(this, subject);
    }
  };

})();