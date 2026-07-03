



















var Permissions = (() => {
  'use strict';





  class Permissions {






    constructor(capabilities, temp = false, contextual = null) {
      this.capabilities = new Set(capabilities);
      this.temp = temp;
      this.contextual = new Sites(contextual);
    }

    dry() {
      return {capabilities: [...this.capabilities], contextual: this.contextual.dry(), temp: this.temp};
    }

    static hydrate(dry = {}, obj = null) {
      let capabilities = new Set(dry.capabilities);
      let contextual = Sites.hydrate(dry.contextual);
      let temp = dry.temp;
      return obj ? Object.assign(obj, {capabilities, temp, contextual, _tempTwin: undefined})
                 : new Permissions(capabilities, temp, contextual);
    }

    static typed(capability, type) {
      let [capName] = capability.split(":");
      return `${capName}:${type}`;
    }

    allowing(capability) {
      return this.capabilities.has(capability);
    }

    set(capability, enabled = true) {
      if (enabled) {
        this.capabilities.add(capability);
      } else {
        this.capabilities.delete(capability);
      }
      return enabled;
    }
    sameAs(otherPerms) {
      if (otherPerms == this) {
        return true;
      }
      const theseCaps = this.capabilities;
      if (this.capabilities.size != otherPerms.capabilities.size) {
        return false;
      }
      const otherCaps = new Set(otherPerms.capabilities);
      for (const c of theseCaps) {
        if (!otherCaps.delete(c)) return false;
      }
      for (const c of otherCaps) {
        if (!theseCaps.has(c)) return false;
      }
      return true;
    }
    clone(noContext = false) {
      return new Permissions(this.capabilities, this.temp, noContext ? null : this.contextual);
    }
    get tempTwin() {
      return this._tempTwin || (this._tempTwin = new Permissions(this.capabilities, true, this.contextual));
    }

  }

  Permissions.ALL = [
    "script",
    "object",
    "media",
    "frame",
    "font",
    "wasm",
    "webgl",
    "fetch",
    "ping",
    "noscript",
    "lazy_load",
    "unchecked_css",
    "lan",
    "other",
  ];
  Permissions.IMMUTABLE = {
    UNTRUSTED: {
      "script": false,
      "object": false,
      "wasm": false,
      "webgl": false,
      "fetch": false,
      "other": false,
      "ping": false,
    },
    TRUSTED: {
      "script": true,
    }
  };

  Object.freeze(Permissions.ALL);

  return Permissions;
})();
