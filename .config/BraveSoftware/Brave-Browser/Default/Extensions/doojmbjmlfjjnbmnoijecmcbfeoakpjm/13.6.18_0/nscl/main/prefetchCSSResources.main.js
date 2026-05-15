






















"use strict";
{
  const {console, exportFunction, patchWindow} = Worlds.main;

  const modifyWindow = (win, {port, xray}) => {


    const { window } = xray;
    const { StyleSheet } = win;
    const ssProto = StyleSheet.prototype;
    const cssProto = win.CSSStyleSheet.prototype;

    const getOwnerNode = Object.getOwnPropertyDescriptor(ssProto, "ownerNode").get;

    const postMessage = (msg, target) => {
      if (target instanceof StyleSheet) target = getOwnerNode.apply(target);
      return target && port.postMessage(msg, target);
    };

    if (!xray.enabled) {


      for (const prop of ["rules", "cssRules"]) {
        const originalGetter = Object.getOwnPropertyDescriptor(cssProto, prop).get;
        exportFunction(function() {
          if (!postMessage("accessRules", this)) {
            throw new DOMException("Security Error",
              `Failed to read the '${prop}' property from 'CSSStyleSheet': Cannot access rules`);
          }
          return originalGetter.apply(this);
        }, cssProto, {defineAs: `get ${prop}`});
      }
    }

    const mmProto = win.MediaList.prototype;
    const { appendMedium, deleteMedium, item } = mmProto;

    for (const proto of [ssProto, win.HTMLStyleElement.prototype, win.HTMLLinkElement.prototype]) {
      const prop = "media";
      const des = xray.getSafeDescriptor(proto, prop, "get");
      exportFunction(function(value) {
        if (postMessage("isDisabled", this)) {
          if (this instanceof StyleSheet) {
            return new Proxy(this.media, {
              get(target, prop, receiver) {
                if (typeof target[prop] === "function") {
                  return new Proxy(target[prop], {
                    apply(target, that, args) {
                      if (target === appendMedium || target === deleteMedium) {
                        return;
                      }
                      if (target === item) {
                        return null;
                      }
                      return Reflect.apply(...arguments);
                    }
                  });
                }
                switch(prop) {
                  case "length":
                    return 0;
                  case "mediaText":
                    return ""
                }
                return Reflect.get(...arguments);
              },
              set(target, prop, newVal) {
                switch(prop) {
                  case "mediaText": return true;
                }
                return Reflect.set(...arguments);
            }
            });
          }
          return "";
        }
        return des.get.call(this, value);
      }, proto, {defineAs: `get ${prop}`});
      exportFunction(function(value) {
        if (postMessage("isDisabled", this)) {
          return value;
        }
        return des.set.call(this, value);
      }, proto, {defineAs: `set ${prop}`});
    }
  };

  Worlds.connect("prefetchCSSResources.main", {
    onMessage(msg, {port}) {
      switch(msg) {
        case "patchWindow":
          patchWindow(modifyWindow, {port});
          break;
      }
    }
  });
}