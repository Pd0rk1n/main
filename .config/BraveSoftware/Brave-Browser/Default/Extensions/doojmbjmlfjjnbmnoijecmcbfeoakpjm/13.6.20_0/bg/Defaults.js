



















'use strict';

var Defaults = {
  async init()  {
    let defaults = {
      local: {
        debug: false,
        showCtxMenuItem: true,
        showCountBadge: true,
        showFullAddresses: false,
        showProbePlaceholders: true,
        amnesticUpdates: false,
        autoReload: true,
        gestureEnabled: false,
      },
      sync: {
        global: false,
        xss: true,
        TabGuardMode: "incognito",
        TabGuardPrompt: "post",
        cascadePermissions: false,
        cascadeRestrictions : false,
        overrideTorBrowserPolicy: false,
      }
    };

    const defaultsClone = JSON.parse(JSON.stringify(defaults));

    for (let [k, v] of Object.entries(defaults)) {
      let store = await Storage.get(k, k);
      if (k in store) {
        Object.assign(v, store[k]);
      }
      v.storage = k;
    }

    Object.assign(ns, defaults);


    if (!ns.local.uuid) {
      ns.local.uuid = uuid();
      await ns.save(ns.local);
    }

    return ns.defaults = defaultsClone;
  }
};
