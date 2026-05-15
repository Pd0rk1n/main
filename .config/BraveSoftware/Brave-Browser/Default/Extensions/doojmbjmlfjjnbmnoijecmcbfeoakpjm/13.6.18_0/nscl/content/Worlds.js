



















"use strict";
{
  const isMainWorld = !(globalThis.browser?.runtime);
  const uuid = globalThis.uuid;
  if (isMainWorld) {
    delete globalThis.uuid;
  }
  let ended = false;


  let splitWorlds = true;
  let worldsPort;

  const { dispatchEvent, addEventListener, removeEventListener, CustomEvent } = self;
  const { Object, Error, Reflect } = globalThis;

  const xray = (() => {
    const xrayEnabled = globalThis.XPCNativeWrapper;
    const zombieDanger = xrayEnabled && document.readyState === "complete";
    const isZombieException = e => e.message.includes("dead object");

    const getSafeMethod = zombieDanger
    ? (obj, method, wrappedObj) => {
      let actualTarget = obj[method];
      return XPCNativeWrapper.unwrap(new window.Proxy(actualTarget, cloneInto({
        apply(targetFunc, thisArg, args) {
          try {
            return actualTarget.apply(thisArg, args);
          } catch (e) {
            if (isZombieException(e)) {
              console.debug(`Zombie hit for "${method}", falling back to native wrapper...`);
              return (actualTarget = (wrappedObj || XPCNativeWrapper(obj))[method]).apply(thisArg, args);
            }
            throw e;
          }
        },
      }, window, {cloneFunctions: true, wrapReflectors: true}
      )));
    }
    : (obj, method) => obj[method];

    const getSafeDescriptor = (proto, prop, accessor) => {
      const des = Reflect.getOwnPropertyDescriptor(proto, prop);
      if (zombieDanger) {
        const wrappedDescriptor =  Reflect.getOwnPropertyDescriptor(xray.wrap(proto), prop);
        des[accessor] = getSafeMethod(des, accessor, wrappedDescriptor);
      }
      return des;
    };

    const xrayMake = (enabled, wrap, unwrap = wrap, forPage = wrap) => ({
      enabled, wrap, unwrap, forPage,
      getSafeMethod, getSafeDescriptor
    });

    return !xrayEnabled
    ? xrayMake(false, o => o)
    : xrayMake(true, o => XPCNativeWrapper(o), o => XPCNativeWrapper.unwrap(o),
      function(obj, win = this.window || window) {
        return cloneInto(obj, win, {cloneFunctions: true, wrapReflectors: true});
      });
  })();

  const getStack = (() => {
    if ("stackTraceLimit" in Error) {

      const invariants = ["stackTraceLimit", "prepareStackTrace"];
      Error.stackTraceLimit = 10;
      delete Error.prepareStackTrace;
      const replay = [];
      const backup = Object.assign({}, Error);
      const ifSafe = (key, doIt) => {
        if (ended || !invariants.includes(key)) {
          return doIt();
        }
        replay.push(doIt);
        return doIt(backup);
      };

      const handler = {
        get(target, key, receiver) {
          if (ended) {
            for (const doIt of replay) {
              try {
                doIt();
              } catch (e) {}
            }
            replay.length = 0;
          } else if (invariants.includes(key)) {
            return backup[key];
          }
          return Reflect.get(target, key, receiver);
        }
      };
      for (const trap of ["set", "deleteProperty", "defineProperty"]) {
        handler[trap] = (target, key, ...args) =>
          ifSafe(key, (obj = target) => Reflect[trap](obj, key, ...args));
      }

      globalThis.Error = new Proxy(Error, handler);
    }
    const stackGetter = Object.getOwnPropertyDescriptor(Error.prototype, "stack")?.get
      || function() { return this.stack };
    return () => {
      const stack = Reflect.apply(stackGetter, new Error(), []).split("\n");

      stack.splice(0, stack[0].startsWith("Error") ? 2 : 1);
      return stack;
    }
  })();

  const pristine = originalObj =>
    Object.fromEntries(Object.entries(originalObj)
      .map(([n, v]) => v.bind ? [n, v.bind(originalObj)] : [n,v]));

  const console = pristine(globalThis.console);

  const WORLDS_ID = "__WorldsHelperPort__";
  const ports = new Map();

  const WORLD_NAMES = ["MAIN", "ISOLATED"];
  const url = location.href;
  const here = `${WORLD_NAMES[isMainWorld ? 0 : 1]}@${url}`;

  class Port {
    static match(scriptId) {
      return ports.get(scriptId?.endsWith(".main") ? scriptId.slice(0, -5) : scriptId);
    }

    static createMatching(scriptId, handlers) {
      const other = Port.match(scriptId);
      const matching = new Port(other?.id, scriptId);
      if (matching.mergeHandlers(handlers) && other) {
        matching.connect();
        other.connect();
      }
      return matching;
    }

    constructor(portId, scriptId = "") {
      let [here, there] = WORLD_NAMES;
      if (scriptId?.endsWith(".main")) {
        scriptId = scriptId.slice(0, -5); 
      } else if (!isMainWorld) {
        [here, there] = [there, here];
      }

      this.id = portId ??= `${WORLDS_ID}:${scriptId}:${uuid()}`;
      ports.set(scriptId, this);





      const retStack = [];

      let fire = (e, detail, target = self) => {
        detail = xray.forPage(detail);
        dispatchEvent.call(target, new CustomEvent(`${portId}:${e}`, { detail, composed: true }));
      };

      this.postMessage = function (msg, target = self) {
        retStack.push({});
        let detail = { msg };
        fire(there, detail, target);
        let ret = retStack.pop();
        if (ret.error) throw ret.error;
        return ret.value;
      };

      const listeners = {
        [`${portId}:${here}`]: event => {
          this.connect();
          if (typeof this.onMessage === "function" && event.detail) {
            let ret = {};
            try {
              ret.value = this.onMessage(event.detail.msg, {
                port: this,
                event,
              });
            } catch (error) {
              ret.error = error;
            }
            fire(`return:${there}`, ret);
          }
        },

        [`${portId}:return:${here}`]: event => {
          let { detail } = event;
          if (detail && retStack.length) {
            retStack[retStack.length - 1] = detail;
          }
        },
      };

      for (let [name, handler] of Object.entries(listeners)) {
        addEventListener.call(self, name, handler, true);
      }

      const NOP = () => { };

      this.dispose = () => {
        if (this.disposed) return;
        this.disposed = true;
        fire = NOP;
        this.onConnect = this.onMessage = null;
        for (let [name, handler] of Object.entries(listeners)) {
          removeEventListener.call(self, name, handler, true);
        }

      };

      this.onConnect = this.onMessage = null;
      this.connected = false;
      this.disposed = false;

      this.mergeHandlers = function (handlers) {
        if (!handlers) {
          return !!(this.onMessage && this.onConnect);
        }
        this.onMessage = handlers.onMessage || NOP;
        this.onConnect = handlers.onConnect || NOP;
        return true;
      };
    }

    connect(handlers) {
      if (handlers) {
        this.mergeHandlers(handlers);
      }
      if (typeof this.onConnect === "function" && !this.connected) {
        this.connected = true;
        try {
          this.onConnect(this);
        } catch (error) {
          console.error(error);
        }
        return true;
      }
      return false;
    }

    toString() {
      return `port ${this.id}@${here}}`;
    }
  }

  const connectWorlds = (scriptId, handlers, portId) => {
    let port = Port.match(scriptId);

    const isReady = !!portId;
    if (!port) {
      portId ??= worldsPort.postMessage({id: "connect", scriptId})
      port = new Port(portId, scriptId);
    }

    if (
      port.mergeHandlers(handlers) &&
      (isReady ||
        worldsPort.postMessage({
          id: "ready",
          scriptId,
          portId: port.id,
        })?.canHandle)
    ) {
      port.connect();
      queueMicrotask(endWorldsIfDone);
    }

    return port;
  };

  const endWorlds = () => {
    if (!worldsPort) return; 
    worldsPort.postMessage({id: "end"});
    worldsPort.dispose();
    ended = true;
    if (globalThis.Worlds?.end === Worlds.end) {
      delete globalThis.Worlds;

    }
  };

  const endWorldsIfDone = () => {
    if (![...ports.values()].some(p => !(p?.connected))) {
      endWorlds();
    }
  };

  const Worlds = {
    connect(scriptId, handlers) {
      if (!handlers && typeof(scriptId) == "object") {

        handlers = scriptId;
        const stack = getStack();
        const scriptMatch = stack[1]?.match(/\/([\w.]+).js\b/);
        scriptId = scriptMatch && scriptMatch[1];
      }
      if (scriptId) {
        return splitWorlds
          ? connectWorlds(scriptId, handlers)
          : Port.createMatching(scriptId, handlers)
          ;
      }
      throw new Error(`Can't identify scripts to connect on the stack ${stack.join("\n")}. Is this Gecko?`);
    },
    main: {
      console,
      pristine,
      xray,
    },
  };

  Object.freeze(Worlds);

  if (isMainWorld) {
    const url = document.URL;

    let validatingStack = false;
    const validateStack = () => {
      if (worldsPort?.disposed || validatingStack) return;
      validatingStack = true;
      try {
        const stack = getStack();





        let [myself, callee, caller = "UNKNOWN CALL SITE"] = stack;


        const parseOrigin = l => l.replace(/^\s*(?:at )?(?:.*[(@])?([\w-]+:\/\/[^/]+\/|<[^>]+>).*/, "$1");

        const myOrigin = parseOrigin(myself);
        if (!myOrigin)  {
          throw new Error(`Cannot find Worlds' origin from ${myself}`);
        }
        if (parseOrigin(callee) !== myOrigin) {
          throw(`Callee ${callee} doesn't match origin ${myOrigin}!`);
        }


        if (parseOrigin(caller) !== myOrigin) {
          throw new Error(`Unsafe call to ${myOrigin} from ${caller} (${url}, <STACK>\n${stack.join("\n")}\n</STACK>)`);
        }
      } catch (e) {
        endWorldsIfDone();
        throw e;
      } finally {
        validatingStack = false;
      }
    }

    const safeWorlds = new Proxy(Worlds, {
      get(src, key) {
        validateStack();
        return src[key];
      },
    });
    Object.defineProperty(globalThis, "Worlds", {
      configurable: true,
      get() {
        try {
          validateStack();
        } catch (e) {
          console.error(e);
          return;
        }
        return safeWorlds;
      },
      set(v) {
        delete this.Worlds;
        endWorldsIfDone();
        return this.Worlds = v;
      }
    });

  } else {
    globalThis.Worlds = Worlds;

    browser.runtime.getManifest()
      .content_scripts.filter(cs => cs.world === "MAIN")
      .map(cs => cs.js.map(js => js.match(/\/(\w+)\.main\.js\b/))
      .filter(m => m).forEach(([m, scriptId]) => {
        if (!ports.has(scriptId)) {
          ports.set(scriptId, null);
        }
      }));
    splitWorlds = ports.size > 0;
  }

  if (splitWorlds) {
    let bootstrapped = false;
    worldsPort = new Port(WORLDS_ID, "Worlds");

    worldsPort.connect({
      onMessage(msg) {
        console.debug(`${here} got message`, msg);
        switch(msg.id) {
          case "end":
            worldsPort.dispose(); 
            endWorldsIfDone();
            break;
          case "connect":
            return Port.match(msg.scriptId)?.id;
          case "ready":
            const port = connectWorlds(msg.scriptId, null, msg.portId);
            return { canHandle: !!(port.onMessage || port.onConnect) };
          case "bootstrap":
            if (bootstrapped) return;
            bootstrapped = true;

            const swapPort = new Port(null, "Worlds");
            swapPort.mergeHandlers(worldsPort);
            queueMicrotask(() => {
              worldsPort.dispose();
              worldsPort = swapPort;
            });
            return {
              ports: [...ports].map(([scriptId, port]) => [scriptId, port?.id]),
              swapPortId: swapPort.id,
            };
        }
      }
    });

    const bootstrap = worldsPort.postMessage({id: "bootstrap"});
    if (bootstrap?.ports) {
      for(const [scriptId, portId] of bootstrap.ports) {

        ports.set(scriptId, portId ? new Port(portId, scriptId) : null);
      }
    }
    if (bootstrap?.swapPortId) {

      const swapPort = new Port(bootstrap.swapPortId, "Worlds");
      swapPort.mergeHandlers(worldsPort);
      worldsPort.dispose();
      worldsPort = swapPort;
    }
  }

  setTimeout(function justInCase() {
    endWorldsIfDone();
    if(document.readyState == "loading") {
      setTimeout(justInCase, 0);
    }
  }, 0);
}
