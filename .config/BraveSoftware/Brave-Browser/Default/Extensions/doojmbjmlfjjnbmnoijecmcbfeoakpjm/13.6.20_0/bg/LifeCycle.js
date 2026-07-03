























"use strict";

var LifeCycle = (() => {

  const AES = "AES-GCM",
    keyUsages = ["encrypt", "decrypt"];

  function toBase64(bytes) {
    return btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(''));
  }
  function fromBase64(string) {
    return Uint8Array.from((Array.from(atob(string)).map(c => c.charCodeAt(0))));
  }
  async function encrypt(clearText) {
    let key = await crypto.subtle.generateKey({
        name: AES,
        length: 256,
      },
      true,
      keyUsages,
    );
    let iv = crypto.getRandomValues(new Uint8Array(12));
    let encoded = new TextEncoder().encode(clearText);
    let cypherText = await crypto.subtle.encrypt({
      name: AES,
      iv
    }, key, encoded);
    return {cypherText, key: await crypto.subtle.exportKey("jwk", key), iv};
  }

  var LifeBoat = {
    url: "about:blank",
    async createAndStore() {
      let allSeen = {};
      let tab;
      await Promise.allSettled((await browser.tabs.query({})).map(
        async t => {
          let seen = await ns.collectSeen(t.id);
          if (seen) {
            allSeen[t.id] = seen;
            if (!tab || !tab.incognito && t.incognito) {
              tab = t;
            }
          }
        }
      ));

      const policy = ns.policy.dry(true);
      const contextStore = ns.contextStore.dry(true);
      const unrestrictedTabs = [...ns.unrestrictedTabs];

      if (policy.sites.temp.length == 0 &&
        !Object.values(policy.sites.custom).some(({temp}) => temp) &&
        unrestrictedTabs.length == 0 &&
        Object.keys(allSeen).length == 0) {
        debug("No temporary settings to save, bailing out.");
        return;
      }

      if (!tab) { 
        if (!UA.isMozilla) {

          return;
        }
        let {url} = LifeBoat;
        let tabInfo = {
          url,
          active: false,
        };
        if (browser.windows) { 

          for (let w of await browser.windows.getAll()) {
            if (w.incognito) {
              tabInfo.windowId = w.id;
              break;
            }
          }
        }
        for (;!tab;) {
          try {
            tab = await browser.tabs.create(tabInfo);
          } catch (e) {
            error(e);
            if (tabInfo.windowId) {

              delete tabInfo.windowId;
            } else {
              return; 
            }
          }
        }
      }

      let tabId = tab.id;
      let {url} = tab;
      let {cypherText, key, iv} = await encrypt(JSON.stringify({
        policy,
        contextStore,
        allSeen,
        unrestrictedTabs,
      }));

      try {
        const data = toBase64(new Uint8Array(cypherText));

        const attr = await sha256(data.concat(uuid()));

        await new Promise((resolve, reject) => {

          let stored = false;
          const storeInTab = async (tabId, tabInfo) => {
            if (stored) {
              browser.tabs.onUpdated.removeListener(storeInTab);
              return;
            }
            if (tabId !== tab.id) {
              return;
            }
            debug("Survival tab updating", tabInfo);
            if (tabInfo.status !== "complete") {
              return;
            }
            try {
              stored = await Messages.send("store", {
                url,
                data,
                attr,
              },
              {tabId, frameId: 0}
              );
              resolve();
              debug(`Survival tab updated, stored: ${stored}`);
            } catch (e) {
              if (!Messages.isMissingEndpoint(e)) {
                error(e, "Survival tab failed");
                reject(e);
              } 

              setTimeout(() => {
                if (!stored) {
                  debug("Fallback delayed storeInTab...");
                  storeInTab(tabId, tabInfo);
                }
              }, 100)
            };
          };

          storeInTab(tabId, tab).then(() => {
            if (!stored) browser.tabs.onUpdated.addListener(storeInTab);
          });
        });

        await Storage.set("local", { "updateInfo": {key, iv: toBase64(iv), tabId, url, attr}});
        tabId = -1;
        debug("Ready to reload...", await Storage.get("local", "updateInfo"));
      } finally {
        if (tabId !== -1 && url === LifeBoat.url && !ns.local.debug) {
          browser.tabs.remove(tabId); 
        }
      }
    },

    async retrieveAndDestroy() {
      let {updateInfo} = await Storage.get("local", "updateInfo");
      if (!updateInfo) return;
      await Storage.remove("local", "updateInfo");
      let {key, iv, tabId, attr, url} = updateInfo;

      let destroyIfNeeded = url === LifeBoat.url ? (keepIfDebug = false) => {
        if (tabId === -1 || url !== LifeBoat.url) return;
        if (keepIfDebug && ns.local.debug) {
          debug("Failed survival tab %s left open for debugging.", tabId);
        } else {
          browser.tabs.remove(tabId);
        }
        tabId = -1;
      } : () => {};

      try {
        key = await crypto.subtle.importKey("jwk", key, AES, true, keyUsages);
        iv = fromBase64(iv);
        let cypherText;
        for (let attempts = 3; attempts-- > 0;) {
          try {
            cypherText = await Messages.send("retrieve", {url, attr}, {tabId, frameId: 0});
            break;
          } catch (e) {
            if (Messages.isMissingEndpoint(e)) {
              debug("Cannot retrieve survival tab data, maybe content script not loaded yet. Retrying...");
              await ns.initializing;
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              throw e;
            }
          }
        }
        if (!cypherText) {
          throw new Error("Could not retrieve survival tab data!");
        }
        cypherText = fromBase64(cypherText);
        let encoded = await crypto.subtle.decrypt({
            name: AES,
            iv
          }, key, cypherText
        );
        let {policy, contextStore, allSeen, unrestrictedTabs} = JSON.parse(new TextDecoder().decode(encoded));
        if (!policy) {
          throw new error("Ephemeral policy not found in survival tab %s!", tabId);
        }
        ns.unrestrictedTabs = new Set(unrestrictedTabs);
        destroyIfNeeded();
        if (ns.initializing) await ns.initializing;
        ns.policy = new Policy(policy);
        ns.contextStore = new ContextStore(contextStore);
        await Promise.allSettled(
          Object.entries(allSeen).map(
            async ([tabId, seen]) => {
              try {
                debug("Restoring seen %o to tab %s", seen, tabId);
                await Messages.send("allSeen", {seen}, {tabId, frameId: 0});
              } catch (e) {
                error(e, "Cannot send previously seen data to tab", tabId);
              }
            }
          )
        );
      } catch (e) {
        error(e);
      } finally {
        destroyIfNeeded(true);
      }
    }
  }


  const versioning = include("/nscl/common/Ver.js");

  return {
    async onInstalled(details) {
      if (!UA.isMozilla) {


        const contentScripts = browser.runtime
          .getManifest()
          .content_scripts.find(
            (s) =>
              s.js &&
              s.matches.includes("<all_urls>") &&
              s.all_frames &&
              s.match_about_blank &&

              s.world !== "MAIN"
          ).js;

        await Promise.allSettled((await browser.tabs.query({})).map(async tab => {
          try {
            await Scripting.executeScript({
                target: {tabId: tab.id, allFrames: true},
                files: contentScripts,
              });
          } catch (e) {
            await include("/nscl/common/restricted.js");
            if (!isRestrictedURL(tab.url)) {
              error(e, `Can't run content script on tab ${tab.id} ${tab.url} ${tab.favIconUrl}`);
            }
          }
        }));
      }

      const { reason, previousVersion } = details;
      switch (reason) {
        case "install":
          await ns.initializing;
          if (!ns.local.isTorBrowser) {
            browser.tabs.create({
              url: browser.runtime.getManifest()
                    .options_ui.page + "?onboarding",
            });
          }
          return;
        case "update":
          try {
            await LifeBoat.retrieveAndDestroy();
          } catch (e) {
            error(e);
          }
          break;
      }

      if (!previousVersion) return;

      this.migrateSettings(previousVersion);
    },

    async migrateSettings(previousVersion) {
      await versioning;
      previousVersion = new Ver(previousVersion);
      const currentVersion = new Ver(browser.runtime.getManifest().version);
      const upgrading = Ver.is(previousVersion, "<=", currentVersion);
      if (!upgrading) return;



      const forEachPreset = async (callback, presetNames = "*") => {
        await ns.initializing;
        let changed = false;
        for (let p of ns.policy.getPresets(presetNames)) {
          if (callback(p)) changed = true;
          if (p.contextual) {
            for (let ctxP of p.contextual.values()) {
              if (callback(ctxP)) changed = true;
            }
          }
        }
        if (changed) {
          await ns.savePolicy();
        }
        if (ns.contextStore) {
          changed = false;
          for (let k of Object.keys(ns.contextStore.policies)){
            for (let p of ns.contextStore.policies[k].getPresets(presetNames)) {
              if (callback(p)) changed = true;
            }
          }
          if (changed) {
            await ns.saveContextStore();
          }
        }
      };

      const configureNewCap = async (cap, presetNames, capsFilter) => {
        log(`Upgrading from ${previousVersion}: configure the "${cap}" capability.`);
        await forEachPreset(({capabilities}) => {
          if (capsFilter(capabilities) && !capabilities.has(cap)) {
            capabilities.add(cap);
            return true;
          }
        }, presetNames);
      };

      const renameCap = async (oldName, newName) => {
        log(`Upgrading from ${previousVersion}: rename capability "${oldName}" to "${newName}`);
        await forEachPreset(({capabilities}) => {
          if (capabilities.has(oldName)) {
            capabilities.delete(oldName);
            capabilities.add(newName);
            return true;
          }
        });
      };

      if (Ver.is(previousVersion, "<=", "11.0.10")) {
        await configureNewCap("ping", ["TRUSTED"]);
      }
      if (Ver.is(previousVersion, "<=", "11.2.1")) {
        await configureNewCap("noscript", ["DEFAULT", "TRUSTED", "CUSTOM"])
      }
      if (Ver.is(previousVersion, "<=", "11.2.4")) {

        await configureNewCap("unchecked_css", ["DEFAULT", "TRUSTED", "CUSTOM"], caps => caps.has("script"));
      }
      if (Ver.is(previousVersion, "<=", "11.2.5rc1")) {
        await renameCap("csspp0", "unchecked_css");
      }
      if (Ver.is(previousVersion, "<=", "11.3rc2")) {

        await configureNewCap("lan", ["DEFAULT", "TRUSTED", "CUSTOM"], caps => caps.has("script"));
      }

      if (Ver.is(previousVersion, "<=", "11.4.1rc3")) {

        (async () => {
          await ns.initializing;
          let isVintage = await Themes.isVintage();
          if (typeof isVintage === "boolean") return;
          ns.openOptionsPage({tab: 2, focus: "#opt-vintageTheme", hilite: "#sect-themes"});
        })();
      }

      if (Ver.is(previousVersion, "<=", "11.4.35rc2")) {

        await configureNewCap("lazy_load", ["DEFAULT", "TRUSTED", "CUSTOM"], caps => caps.has("script"));
      }

      if (Ver.is(previousVersion, "<=", "13.0.902")) {

        await configureNewCap("wasm", ["DEFAULT", "TRUSTED", "CUSTOM"], caps => caps.has("script"));
      }

      if (Ver.is(previousVersion, "<=", "13.6.15")) {

        await forEachPreset(({ capabilities }) => {
          if (capabilities.has("fetch") && !capabilities.has("script")) {
            capabilities.delete("fetch");
            return true;
          }
          return false;
        }, ["DEFAULT"]);
      }
    },

    async onUpdateAvailable(details) {
      if (UA.mobile &&
        (ns.local.isTorBrowser || browser.extension.inIncognitoContext)) {


        return;
      }
      try {
        if (ns.local.amnesticUpdates) {

          return;
        }
        await versioning;
        if (Ver.is(details.version, "<", browser.runtime.getManifest().version)) {

          return;
        }
        await LifeBoat.createAndStore();
      } catch (e) {
        console.error(e);
      } finally {
       browser.runtime.reload(); 
      }
    },
  };
})();
