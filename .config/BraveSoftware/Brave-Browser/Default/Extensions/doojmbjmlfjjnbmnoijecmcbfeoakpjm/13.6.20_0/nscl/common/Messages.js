



















"use strict";
{
  const allHandlers = new Set();
  const namespacedHandlers = new Map();

  const dispatchImmediate = (msg, sender) => {
    let {__meta, _messageName} = msg;
    if (!__meta) {

      if (!_messageName) {

        return undefined;
      }
      __meta = {name: _messageName};
    }
    delete msg.__meta;
    delete msg._messageName;
    let {name} = __meta;
    let handlers = allHandlers;
    let namespace = "";
    const dotIdx = name.lastIndexOf(".");
    if (dotIdx > 0) {
      namespace = name.substring(0, dotIdx);
      if (namespacedHandlers.has(namespace)) {
        handlers = [namespacedHandlers.get(namespace)];
        name = name.substring(dotIdx + 1);
        namespace += ".";
      } else {
        namespace = "";
      }
    }
    let responderFound = false;
    let exception = null;
    for (let h of handlers) {
      if (typeof h !== "object") {

        continue;
      }
      let f = h[name];
      if (typeof f === "function") {
        let result;
        try {
          result = f(msg, sender);
        } catch (e) {
          error(e);
          exception = e;
          continue;
        }
        if (typeof result === "undefined") {
          responderFound = true;
          continue;
        }
        return Promise.resolve(result);
      }
    }
    if (exception) throw exception;
    if (!responderFound) {
      debug("Warning: no handler for message %s%s %s in context %s", namespace, name, JSON.stringify(msg), document.URL);
    }
  };

  const dispatch = async (...args) => {
    await Messages.wakening;
    try {
      const ret = dispatchImmediate(...args);

      return ret;
    } catch (e) {
      console.error(e, "Could not dispatch message", ...args);
    }
  }

  var Messages = {
    addHandler(handler, impl) {
      let originalSize = allHandlers.size;
      allHandlers.add(handler);
      if (typeof handler === "string") {
        namespacedHandlers.set(handler, impl || {});
      }
      if (originalSize === 0 && allHandlers.size === 1) {
        browser.runtime.onMessage.addListener(dispatch);
      }
    },
    removeHandler(handler) {
      let originalSize = allHandlers.size;
      allHandlers.delete(handler);
      if (typeof handler === "string") {
        namespacedHandlers.delete(handler);
      }
      if (originalSize === 1 && allHandlers.size === 0) {
        browser.runtime.onMessage.removeListener(dispatch);
      }
    },
    async send(...args) {
      const ret = await this._send(...args);

      return ret;
    },
    async _send(name, args = {}, contentTarget = null) {
      args.__meta = {name, recipientInfo: contentTarget};
      args._messageName = name; 
      if (contentTarget) {
        let { tabIds = [], tabId } = contentTarget;
        if (tabId) {
          const opts = "frameId" in contentTarget ? { frameId: parseInt(contentTarget.frameId) } : {};
          return await browser.tabs.sendMessage(parseInt(tabId), args, opts);
        } else if (!tabIds.length) {
          tabIds.push(...(await browser.tabs.query({})).map(tab => tab.id));
          if (!tabIds.length) {
            return;
          }
        }
        return await Promise.allSettled(tabIds.map(async (tabId) => await browser.tabs.sendMessage(parseInt(tabId), args)));
      }
      return await browser.runtime.sendMessage(args);
    },
    isMissingEndpoint(error) {
      return error?.message ===
        "Could not establish connection. Receiving end does not exist.";
    },
    wakening: false,
  }
}
