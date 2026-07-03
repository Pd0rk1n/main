



















var Policy = (() => {
  'use strict';

  function defaultOptions() {
    return {
      sites:{
        trusted: [],
        untrusted: [],
        custom: {},
      },
      DEFAULT: new Permissions(["frame", "noscript", "other"]),
      TRUSTED: new Permissions(Permissions.ALL),
      UNTRUSTED: new Permissions(),
      enforced: true,
      autoAllowTop: false,
    };
  }

  function normalizePolicyOptions(dry) {
    let options = Object.assign({}, dry);
    for (let p of ["DEFAULT", "TRUSTED", "UNTRUSTED"]) {
      options[p] = dry[p] instanceof Permissions ? dry[p] : Permissions.hydrate(dry[p]);
      options[p].temp = false; 
    }
    if (typeof dry.sites === "object" && !(dry.sites instanceof Sites)) {
      let {trusted, untrusted, temp, custom} = dry.sites;
      let sites = Sites.hydrate(custom);
      for (let key of trusted) {
        sites.set(key, options.TRUSTED);
      }
      for (let key of untrusted) {
        sites.set(Sites.toggleSecureDomainKey(key, false), options.UNTRUSTED);
      }
      if (temp) {
        let tempPreset = options.TRUSTED.tempTwin;
        for (let key of temp) sites.set(key, tempPreset);
      }
      options.sites = sites;
    }
    enforceImmutable(options);
    return options;
  }

  function enforceImmutable(policy) {
    for (let [preset, filter] of Object.entries(Permissions.IMMUTABLE)) {
      let presetCaps = policy[preset].capabilities;
      for (let [cap, value] of Object.entries(filter)) {
        if (value) presetCaps.add(cap);
        else presetCaps.delete(cap);
      }
    }
  }







  class Policy {
    constructor(options = defaultOptions()) {
      Object.assign(this, normalizePolicyOptions(options));
    }

    static hydrate(dry, policyObj) {
      return policyObj
        ? Object.assign(policyObj, normalizePolicyOptions(dry))
        : new Policy(dry);
    }

    dry(includeTemp = false) {
      let trusted = [],
        temp = [],
        untrusted = [],
        custom = Object.create(null);

      const { DEFAULT, TRUSTED, UNTRUSTED } = this;
      for (let [key, perms] of this.sites) {
        if (!includeTemp && perms.temp) {
          continue;
        }
        switch (perms) {
          case TRUSTED:
            trusted.push(key);
            break;
          case TRUSTED.tempTwin:
            temp.push(key);
            break;
          case UNTRUSTED:
            untrusted.push(key);
            break;
          case DEFAULT:
            break;
          default:
            custom[key] = perms.dry();
        }
      }

      let sites = {
        trusted,
        untrusted,
        custom,
      };
      if (includeTemp) {
        sites.temp = temp;
      }
      enforceImmutable(this);
      return {
        DEFAULT: DEFAULT.dry(),
        TRUSTED: TRUSTED.dry(),
        UNTRUSTED: UNTRUSTED.dry(),
        sites,
        enforced: this.enforced,
        autoAllowTop: this.autoAllowTop,
      };
    }

    static requestKey(url, type, documentUrl, includePath = false) {
      url = includePath ? Sites.parse(url).siteKey : Sites.origin(url);
      return `${type}@${url}<${Sites.origin(documentUrl)}`;
    }

    static explodeKey(requestKey) {
      let [, type, url, documentUrl] = /(\w+)@([^<]+)<(.*)/.exec(requestKey);
      return { url, type, documentUrl };
    }

    revokeTemp() {
      Policy.hydrate(this.dry(), this);
      return this;
    }

    autoAllow(url, perms, force) {
      if (
        !(force || this.autoAllowTop) ||
        perms != this.DEFAULT
      ) {
        return null;
      }
      const siteKey = Sites.optimalKey(url);
      perms = (perms == this.DEFAULT ? perms.tempTwin : perms).clone();
      const autoPerms = this.TRUSTED.tempTwin;
      perms.contextual.set(siteKey, autoPerms);
      this.set(siteKey, perms);
      return autoPerms;
    }

    set(site, perms, cascading = false) {
      let sites = this.sites;
      let { url, siteKey } = Sites.parse(site);

      sites.delete(siteKey);
      let wideSiteKey = Sites.toggleSecureDomainKey(siteKey, false);

      if (perms === this.UNTRUSTED) {
        cascading = true;
        siteKey = wideSiteKey;
      } else {
        if (wideSiteKey !== siteKey) {
          sites.delete(wideSiteKey);
        }
      }
      if (cascading && !url) {
        for (let subMatch; (subMatch = sites.match(siteKey)); ) {
          sites.delete(subMatch);
        }
      }

      if (!perms) {
        perms = this.DEFAULT;
      } else if (perms !== this.DEFAULT) {
        sites.set(siteKey, perms);
      }
      return { siteKey, perms };
    }

    get(site, ctx = null) {
      let perms, contextMatch;
      let siteMatch =
        !(this.onlySecure && /^\w+tp:/i.test(site)) && this.sites.match(site);
      if (siteMatch) {
        perms = this.sites.get(siteMatch);
        if (ctx) {
          contextMatch = perms.contextual.match(ctx);
          if (contextMatch) perms = perms.contextual.get(contextMatch);
        }
      } else {
        perms = this.DEFAULT;
      }

      return { perms, siteMatch, contextMatch };
    }

    can(url, capability = "script", ctx = null) {
      return !this.enforced || this.get(url, ctx).perms.allowing(capability);
    }

    get snapshot() {
      return JSON.stringify(this.dry(true));
    }

    cascade(policyMatch, topUrl,
      what = { restrictions: true, permissions: false }) {
      let { contextMatch, perms } = policyMatch;


      if (contextMatch) {
        return perms;
      }


      perms ||= policyMatch;
      const ctxPerms = perms.contextual?.get(topUrl);
      if (ctxPerms) {
        return ctxPerms;
      }

      const topPerms = this.get(topUrl, topUrl).perms;
      if (!topPerms.sameAs(perms)) {
        const topCaps = topPerms.capabilities;
        let capsArray = [...perms.capabilities];
        if (what.permissions && perms == this.DEFAULT) {
          capsArray = new Set(capsArray.concat([...topCaps]));
        }
        if (what.restrictions) {
          capsArray = capsArray.filter(c => topCaps.has(c));
        }
        perms = new Permissions(
          capsArray,
          perms.temp,
          perms.contextual
        );
      }
      return perms;
    }

    cascadeRestrictions(policyMatch, topUrl) {
      return this.cascade(policyMatch, topUrl);
    }


    equals(other) {
      this.snapshot === other.snapshot;
    }

    getPresets(presetNames = "*") {
      if (!Array.isArray(presetNames)) {
        presetNames =
          presetNames === "*"
            ? ["TRUSTED", "UNTRUSTED", "DEFAULT", "CUSTOM"]
            : [presetNames];
      }
      let policy = this;
      let customIdx = presetNames.indexOf("CUSTOM");
      let presets = presetNames.map(p => policy[p]);
      if (customIdx !== -1) {
        let { TRUSTED, UNTRUSTED } = policy;

        presets.splice(
          customIdx,
          1,
          ...[...policy.sites.values()].filter(
            p => p !== TRUSTED && p !== UNTRUSTED
          )
        );
      }
      return presets;
    }
  }

  return Policy;
})();
