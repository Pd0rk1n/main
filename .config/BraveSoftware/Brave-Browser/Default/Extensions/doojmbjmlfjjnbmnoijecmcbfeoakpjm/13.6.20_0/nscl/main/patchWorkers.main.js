





















"use strict";
{
  const { console, patchWindow, exportFunction } = Worlds.main;

  const proxyWorkers = window?.wrappedJSObject
    ? () => { }
    : () => {

      const Originals = {
        Worker: window.Worker,
        SharedWorker: window.SharedWorker,
        getDescriptor: Object.getOwnPropertyDescriptor,
        toString: Function.prototype.toString
      };

      const createConstructorProxy = (original) => {
        return new Proxy(original, {
          construct(target, args) {
            if (/^(data|blob):/.test(args[0])) {
              return new original(...args);
            }
            let realInstance = null;
            const instQueue = [];
            const instListeners = new Map();


            let realPort = null;
            const portQueue = [];
            const portListeners = new Map();

            const portProxy = (target === Originals.SharedWorker) ? new Proxy({}, {
              get(t, prop) {
                if (realPort) return Reflect.get(realPort, prop);
                if (typeof MessagePort.prototype[prop] === 'function') {
                  return (...mArgs) => {
                    if (prop === 'addEventListener') {
                      const [type, fn, opts] = mArgs;
                      if (!portListeners.has(type)) portListeners.set(type, []);
                      portListeners.get(type).push({ fn, opts });
                    }
                    if (realPort) return realPort[prop](...mArgs);
                    portQueue.push(p => p[prop](...mArgs));
                  };
                }
                return t[prop];
              },
              set(t, prop, value) {
                if (realPort) return Reflect.set(realPort, prop, value);
                portQueue.push(p => { p[prop] = value; });
                return true;
              }
            }) : null;

            const release = () => {
              realInstance = new original(...args);


              if (target === Originals.SharedWorker && realInstance.port) {
                realPort = realInstance.port;
                portListeners.forEach((list, type) => {
                  list.forEach(item => realPort.addEventListener(type, item.fn, item.opts));
                });
                portQueue.forEach(task => task(realPort));
              }


              instListeners.forEach((list, type) => {
                list.forEach(item => realInstance.addEventListener(type, item.fn, item.opts));
              });
              instQueue.forEach(task => task(realInstance));
            };

            failSafe.add(args[0]).then(release);

            return new Proxy({}, {
              get(t, prop) {

                if (prop === 'port' && target === Originals.SharedWorker) return portProxy;
                if (realInstance) return Reflect.get(realInstance, prop);

                if (typeof original.prototype[prop] === 'function') {
                  return (...mArgs) => {
                    if (prop === 'addEventListener') {
                      const [type, fn, opts] = mArgs;
                      if (!instListeners.has(type)) instListeners.set(type, []);
                      instListeners.get(type).push({ fn, opts });
                    }
                    if (realInstance) return realInstance[prop](...mArgs);
                    instQueue.push(inst => inst[prop](...mArgs));
                  };
                }
                return t[prop];
              },
              set(t, prop, value) {
                if (realInstance) return Reflect.set(realInstance, prop, value);
                instQueue.push(inst => { inst[prop] = value; });
                return true;
              },
              getPrototypeOf() { return original.prototype; }
            });
          },
          get(target, prop) {
            if (prop === 'prototype') return original.prototype;
            return Reflect.get(target, prop);
          }
        });
      };


      window.Worker = createConstructorProxy(Originals.Worker);
      window.SharedWorker = createConstructorProxy(Originals.SharedWorker);


      Object.getOwnPropertyDescriptor = function (obj, prop) {
        if (obj === window && (prop === 'Worker' || prop === 'SharedWorker')) {
          return {
            value: window[prop],
            writable: true, enumerable: false, configurable: true
          };
        }
        return Originals.getDescriptor.apply(this, arguments);
      };


      const hide = (p, o) => {
        p.toString = function () { return Originals.toString.call(o); };
      };
      hide(window.Worker, Originals.Worker);
      hide(window.SharedWorker, Originals.SharedWorker);
    };

  const failSafe = (() => {
    const urls = new Map();
    const getResolver = url => {
      let resolver = urls.get(url);
      if (!resolver) {
        resolver = {};
        resolver.promise = new Promise((resolve, reject) => {
          resolver.resolve = resolve;
          resolver.reject = reject;
        });
        urls.set(url, resolver);
      };
      return resolver;
    };
    return {
      add(url) {
        return getResolver(url).promise;
      },
      ok(url) {
        getResolver(url).resolve(url);
      },
      cancel(url) {
        const e = new Error(`Patching cancelled for url ${url}`);
        e.url = url;
        getResolver(url).reject(e);
      },
    };
  })();

  let parentPatch;

  const modifyContext = (w, { port, xray }) => {
    if (!globalThis.Worker) {
      console.debug("Workers not supported in this context, bailing out", w, globalThis);
      return;
    }


    const {
      encodeURIComponent,
      ServiceWorkerContainer, URL, XMLHttpRequest, Blob,
      Proxy, Promise,
      TrustedTypePolicyFactory,
      TrustedScriptURL,
    } = globalThis;

    const trustedTypeSupport = TrustedTypePolicyFactory
      ? (() => {
        let policy = null;
        const authorized = new Set();

        const { prototype } = TrustedTypePolicyFactory;
        const { createPolicy } = prototype;
        const handler = {
          apply(target, thisArg, args) {
            if (xray) {
              args = xray.unwrap(args);
            }
            const [name, rules] = args;

            if (!rules || typeof rules.createScriptURL !== "function") {
              return Reflect.apply(target, thisArg, args);
            }

            const interceptedRules = {
              ...rules,
              createScriptURL(input, ...rest) {
                if (authorized.has(input)) return input;
                return rules.createScriptURL.call(this, input, ...rest);
              }
            };

            policy = Reflect.apply(target, thisArg, [name, interceptedRules]);
            return policy;
          }
        };

        if (xray) {
          xray.proxify("createPolicy", handler, prototype);
        } else {
          prototype.createPolicy = new Proxy(createPolicy, handler);
        }

        return {
          createScriptURL(s, original) {
            if (!(original instanceof TrustedScriptURL)) {
              return s;
            }
            authorized.add(s);
            try {

              if (!policy) {
                policy = createPolicy.call(globalThis.trustedTypes, "noscript", { createScriptURL(s) { return s } });
              }
              return policy ? policy.createScriptURL(s) : s;
            } finally {
              authorized.delete(s);
            }
          }
        }
      })()
      : {
        createScriptURL(s) {
          return s;
        },
      };

    const error = console.error.bind(console);

    const createObjectURL = URL.createObjectURL.bind(URL);
    const fnConstruct = Reflect.construct.bind(Reflect);
    const constructWorker = (target, args) => {
      args[0] = trustedTypeSupport.createScriptURL(args[0], args._originalURL);
      delete args._originalURL;
      return fnConstruct(target, args.wrappedJSObject || args);
    }
    const apply = Reflect.apply.bind(Reflect);

    const patchRemoteWorkerScript = (url, isServiceOrShared) =>
      port?.postMessage({
        type: "patchUrl",
        url,
        isServiceOrShared,
      });

    port?.postMessage({
        type: "propagate",
        modifyContext: modifyContext.toString(),
      });


    const baseURI = globalThis.document?.baseURI || location.href;
    const workerHandler = {
      construct(target, args) {
        return handlePatch(constructWorker, target, args);
      }
    };

    const handlePatch = (createPatched, target, args) => {
      const isWorker = createPatched == constructWorker;

      args._originalURL = args[0];
      args[0] = `${args[0]}`;
      let url;
      try {
        url = new URL(args[0], baseURI);
      } catch (e) {
        args[0] = "data:"; 
        return createPatched(target, args);
      }

      if (/^(?:data|blob):/.test(url.protocol) || !isWorker) {



        const loadWorkerSrc = () => {
          try {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText;
          } catch (e) {
            error(e);




            return "mozSystem" in XMLHttpRequest.prototype ? "" : null;
          }
        };

        let patch = parentPatch ||
          port?.postMessage({
            type: "getPatch",
          });
        if (typeof patch == "function") {
          patch = `
            const parentPatch = ${patch};
            {
              const modifyContext = ${modifyContext};
              modifyContext(null, {});
            }
            parentPatch();
            `;
        }

        const preamble = isWorker ?

          `
            const location = globalThis.location;
            const url = new URL(${JSON.stringify(url)});


            const handler = name => {
            return {
                apply(target, thisArg, args) {
                  return location === thisArg ? url[name] : Reflect.apply(target, thisArg, args);
                }
              }
            };
            const wlProto = WorkerLocation.prototype;
            for (const [name, pd] of Object.entries(Object.getOwnPropertyDescriptors(wlProto))) {
              if ("get" in pd && name in url) {
                pd.get = new Proxy(pd.get, handler(name));
                Object.defineProperty(wlProto, name, pd);
              }
            }
            wlProto.toString = new Proxy(wlProto.toString, handler("href"));

          `
          :
          `

          `;
        patch = `
          {
            ${preamble}
          }
          {
            ${patch}
          }
          `.replace(/^\s+/mg, '');
        let workerSrc = loadWorkerSrc();
        if (workerSrc !== null) {
          args[0] = url.protocol === "data:"
            ? `data:application/javascript,${encodeURIComponent(`${patch};${workerSrc}`)}`
            : createObjectURL(new Blob([patch, ";\n", workerSrc], { type: "application/javascript" }));
          return createPatched(target, args);
        }
      }

      if (!w) {

        return createPatched(target, args);
      }
      url = url.href;
      patchRemoteWorkerScript(url, (target.wrappedJSObject || target) === w.SharedWorker);
      const isWorklet = createPatched != constructWorker;

      const worker = createPatched(target, args);
      return worker;
    };


    if (!xray) {

      globalThis.Worker = new Proxy(Worker, workerHandler);
    } else {
      for (const clazz of ["Worker", "SharedWorker"]) {
        xray.proxify(clazz, workerHandler);
      }
      if (globalThis.Worklet) {
        const { prototype } = globalThis.Worklet;
        const { addModule } = prototype;
        exportFunction(function(...args) {
          return handlePatch(
           (target, args) => {

              if (/^(?:data|blob):/.test(args[0])) {
                return addModule.apply(this, args);
              }
              const p = new w.Promise((resolve, reject) => {
                failSafe.add(args[0]).then(
                  () => {
                    resolve(addModule.apply(this, args));
                  },
                  () => resolve()
                );
              });
              return p;
            },
            this,
            args
          );
        }, prototype, { defineAs: "addModule" });
      }
    }


    if (xray && ServiceWorkerContainer) {
      const { origin }  = globalThis.location;
      const { unregister, update } = ServiceWorkerRegistration.prototype;
      xray.proxify("register", {
        apply(target, thisArg, args) {

          try {

            args[0] = trustedTypeSupport.createScriptURL(`${args[0]}`, args[0]);
          } catch (e) {
            return Promise.reject(e);
          }
          if (args[1] && args[1].updateViaCache === "all") {
            args[1].updateViaCache = "imports";
          }
          let url;
          try {
            url = new URL(args[0], baseURI);
            if (url.origin !== origin) throw new Error("ServiceWorker origin mismatch (${url})");
            url = url.href;
            patchRemoteWorkerScript(url,                         true);
          } catch(e) {
            error(e);
          }
          const registration = apply(target, thisArg, args);
          failSafe?.add(url).then(
            () => {
              registration.then(r => apply(update, r, []));
            },
            () => {
              registration.then(r => apply(unregister, r, []));
            });
          return registration;
        }
      }, ServiceWorkerContainer.prototype);
    };


  }

  Worlds.connect("patchWorkers.main", {
    onConnect(port) {
      proxyWorkers();
      patchWindow(modifyContext, { port });
    },
    onMessage(msg, {port}) {
      switch (msg.type) {
        case "patchedUrl":
          failSafe.ok(msg.url);
        break;
        case "cancelUrl":
          failSafe.cancel(msg.url);
        break;
      }
    },
  });
}
