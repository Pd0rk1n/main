



















"use strict";
{
  const PREFIX = typeof browser === "object" && typeof importScripts === "undefined"
    ? `[${browser.runtime.getManifest().name}]` : '';

  const startupTime = Date.now();
  let lastDebugTime = startupTime;
  let ordinal = 1;

  const getStack = () => new Error().stack.replace(/^(?:Error.*\n)?(?:.*\n){2}/, "");

  Object.assign(globalThis, {
    log(msg, ...rest) {
      console.log(`${PREFIX} ${msg}`, ...rest);
    },
    debug(msg, ...rest) {
      const ts = Date.now();
      const sinceStartup = ts - startupTime;
      const elapsed = ts - lastDebugTime;
      lastDebugTime = ts;
      console.debug(`${PREFIX}(#${ordinal++},${elapsed},${sinceStartup}): ${msg}`, ...rest, getStack());
    },
    error(e, msg, ...rest) {
      console.error(e, `${PREFIX} ${msg}`, ...rest, getStack());
    },
  });
}
