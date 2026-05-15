
























var TabGuard = (() => {

  let anonymizedTabs = new Map();
  browser.tabs.onRemoved.addListener(({id}) => {
    if (anonymizedTabs.has(id)) {
      anonymizedTabs.delete(id);
      session.save();
    }
  });

  const anonymizedRequests = new Set(); 





  let Groups = {
    allowed: {},
    filtered: {},
  };
  const forget = () => {
    Groups.allowed = {};
    Groups.filtered = {};
  };

  const groupsSerDe = (source, callback) => {
    const target = {};
    for (const [which, group] of Object.entries(source)) {
      const targetGroup = {};
      for (const [domain, otherDomains] of Object.entries(group)) {
         targetGroup[domain] = callback(otherDomains);
       }
       target[which] = targetGroup;
     }
     return target;
  };
  const session = new SessionCache(
    "TabGuard", 
    {
      afterLoad(data) { 
        if (!data) return;
        anonymizedTabs = new Map(data.anonymizedTabs);
        Groups = groupsSerDe(data.Groups, domainsArray => new Set(domainsArray));
      },
      beforeSave() {
        return {
          anonymizedTabs: [...anonymizedTabs],
          Groups: groupsSerDe(Groups, domainsSet => [...domainsSet]),
        }
      },
    }
  );

  function mergeGroups(groups,
    {tabDomain, otherDomains}, 
    bidirectional = false) {
    const currentGroup = groups[tabDomain] || (groups[tabDomain] = new Set());
    for (let d of otherDomains) {
      currentGroup.add(d);
    }
    if (bidirectional) {
      for (let d of otherDomains)  {
        (groups[d] || (groups[d] = new Set())).add(tabDomain);
      }
    }
    session.save();
  }

  const AUTH_HEADERS_RX = /^(?:authorization|cookie)/i;

  function getDomain(u) {
    let {url, siteKey} = Sites.parse(u);
    return url?.protocol.startsWith("http") && tld.getDomain(url.hostname) || Sites.origin(siteKey);
  }

  function flattenHeaders(headers) {
    let flat = {};
    for (let h of headers) {
      flat[h.name.toLowerCase()] = h.value;
    }
    return flat;
  }

  const scheduledCuts = new Set();

  return {
    wakening: Promise.all([TabCache.wakening, TabTies.wakening, session.load()]),
    forget,


    onSend(request) {
      const mode = ns.sync.TabGuardMode;
      if (mode === "off" || !request.incognito && mode!== "global") return;

      anonymizedRequests.delete(request.id);

      const {tabId, type, url, originUrl} = request;

      if (tabId < 0) return; 

      if (!ns.isEnforced(tabId)) return; 

      let {requestHeaders} = request;

      let tab = TabCache.get(tabId);

      const mainFrame = type === "main_frame";
      if (mainFrame) {
        anonymizedTabs.delete(tabId);
        let headers = flattenHeaders(requestHeaders);
        let shouldCut = false;
        let safeAuth = false;
        if (headers["sec-fetch-user"] === "?1") {

          switch(headers["sec-fetch-site"]) {
            case "same-site":
            case "same-origin":


              shouldCut = tab && originUrl === tab.url && ![...TabTies.get(tabId)]
                .filter(tid => tid !== tabId).map(TabCache.get)
                .some(t => t?.url === originUrl);

              safeAuth = true;
              break;
            case "none":

              safeAuth = shouldCut = true;
              break;
            default:

              safeAuth = shouldCut = tab?.url === request.url && tab.active;
          }
        }
        if (shouldCut) {
          debug("[TabGuard] User-typed, bookmark or user-activated same-site-same-tab navigation: scheduling tab ties cut and loading with auth.", tabId, request);
          scheduledCuts.add(request.requestId);
        } else {
          debug("[TabGuard] Automatic or cross-site navigation, keeping tab ties.", tabId, request);
          scheduledCuts.delete(request.requestId);
        }
        if (safeAuth) {
          debug("[TabGuard] User-activated same-site navigation, loading with auth.", tabId, request);
          return;
        }
      } else if (!anonymizedTabs.has(tabId)) {

        return;
      }

      let targetDomain = getDomain(url);
      if (!targetDomain) return; 

      let tabDomain = getDomain(mainFrame ? url : tab?.url);
      if (!tabDomain) return; 

      let ties = TabTies.get(tabId);
      if (ties.size === 0) return; 


      let suspiciousTabs = [...ties].map(TabCache.get).filter(
        tab => tab && !tab.discarded && ns.isEnforced(tab.id) && (
          !(tab._isExplicitOrigin = tab._isExplicitOrigin || /^(?:https?|ftps?|file):/.test(tab.url)) ||
          ns.getPolicy(tab.cookieStoreId).can(tab.url, "script")
        )
      );

      return suspiciousTabs.length > 0 && (async () => {

        let suspiciousDomains = [];
        await Promise.allSettled(suspiciousTabs.map(async (tab) => {
          if (!tab._isExplicitOrigin) { 

            tab._externalUrl = tab.url;
            tab._isExplicitOrigin = true;
            try {
              tab.url = (await Scripting.executeScript({
                target: {tabId: tab.id, allFrames: false},
                func: () => {
                  return window.origin === 'null' ? window.location.href : window.origin;
                },
              }))[0].result;
            } catch (e) {

              debug(e);
            }


            while (tab.url === "about:blank")  {
              if (!tab.openerTabId) {
                break;
              }
              const openerTab = TabCache.get(tab.openerTabId);
              if (openerTab) {
                tab.url = openerTab.url;
              } else {
                break;
              }
            }
            if (tab.url !== "about:blank") {
              debug(`Real origin for ${tab._externalUrl} (tab ${tab.id}) is ${tab.url}.`);
              if (!ns.getPolicy(tab.cookieStoreId).can(tab.url, "script")) return;
            }
          }
          if (!tab._contentType) {
            try {
              tab._contentType = (await Scripting.executeScript({
                target: {tabId: tab.id},
                func() { return document.contentType }
              }))[0].result;
            } catch (e) {

              debug(e);
              return;
            }
          }
          if (!/(?:(?:x|ht)ml|svg)\b/i.test(tab._contentType)) {

            return;
          }
          suspiciousDomains.push(getDomain(tab.url));
        }));

        const legitDomains = Groups.allowed[tabDomain] || new Set();
        legitDomains.add(tabDomain);

        let otherDomains = new Set(suspiciousDomains.filter(d => d && !legitDomains.has(d)));
        if (otherDomains.size === 0) return; 

        if (!requestHeaders.some(h => AUTH_HEADERS_RX.test(h.name))) return; 



        let filterAuth = () => {
          requestHeaders = requestHeaders.filter(h => !AUTH_HEADERS_RX.test(h.name));
          debug("[TabGuard] Removing auth headers from %o (%o)", request, requestHeaders);
          anonymizedTabs.set(tabId, {tabDomain, otherDomains: [...otherDomains]});
          session.save();

          anonymizedRequests.add(request.id);
          return {requestHeaders};
        };

        let quietDomains = Groups.filtered[tabDomain];
        if (mainFrame) {
          const promptOption = ns.sync.TabGuardPrompt;

          const mustPrompt = promptOption !== "never" &&
            (promptOption !== "post" || request.method === "POST") &&
            (!quietDomains || [...otherDomains].some(d => !quietDomains.has(d)));

          if (mustPrompt) {
            return (async () => {
              let options = [
                {label: _("TabGuard_optAnonymize"), checked: true},
                {label: _("TabGuard_optAllow")},
              ];
              let ret = await Prompts.prompt({
                title: _("TabGuard_title"),
                message: _("TabGuard_message", [tabDomain, [...otherDomains].join(", ")]),
                options});
              if (ret.button !== 0) {
                return {cancel: true};
              }
              const groups = ret.option === 0 ? Groups.filtered : Groups.allowed;
              mergeGroups(groups, {tabDomain, otherDomains});
              return groups === Groups.filtered ? filterAuth() : null;
            })();
          }
        }
        let mustFilter = mainFrame || quietDomains && [...otherDomains].some(d => quietDomains.has(d))
        return mustFilter ? filterAuth() : null;
      })();
    },


    onReceive(request) {
      if (!anonymizedRequests.has(request.id)) return false;
      let headersModified = false;
      let {responseHeaders} = request;
      for (let j = responseHeaders.length; j-- > 0;) {
        let h = responseHeaders[j];
        if (h.name.toLowerCase() === "set-cookie") {
          responseHeaders.splice(j, 1);
          headersModified = true;
        }
      }
      return headersModified;
    },

    onCleanup(request) {
      let {requestId, tabId} = request;
      if (scheduledCuts.has(requestId)) {
        scheduledCuts.delete(requestId);
        TabTies.cut(tabId);
      }
      anonymizedRequests.delete(request.id);
    },
    isAnonymizedRequest(requestId) {
      return anonymizedRequests.has(requestId);
    },
    isAnonymizedTab(tabId) {
      return anonymizedTabs.has(tabId);
    },
    getAnonymizedTabInfo(tabId) {

      return JSON.parse(JSON.stringify(anonymizedTabs.get(tabId)));
    },
    async reloadNormally(tabId) {
      TabTies.cut(tabId);
      await browser.tabs.reload(tabId);
    },
    allow(tabId) {
      if (!TabGuard.isAnonymizedTab(tabId)) return;
      const info = this.getAnonymizedTabInfo(tabId);
      mergeGroups(Groups.allowed, info);
    }
  }
})();
