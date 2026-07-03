



















"use strict";
{
  const VERSION_LABEL =  `NoScript ${browser.runtime.getManifest().version}`;
  browser.action.setTitle({title: VERSION_LABEL});
  const CSP_MARKER = "report-to noscript-reports";
  const csp = new ReportingCSP(CSP_MARKER);

  const policyTypesMap = {
      main_frame:  "",
      sub_frame: "frame",
      script: "script",
      xslt: "script",
      xbl: "script",
      font: "font",
      object: "object",
      object_subrequest: "fetch",
      xmlhttprequest: "fetch",
      websocket: "fetch",
      ping: "ping",
      beacon: "ping",
      media: "media",
      other: "",
  };

  for (const cap of Permissions.ALL) {
    if (!(cap in policyTypesMap)) {
      policyTypesMap[cap] = cap;
    }
  }

  const TabStatus = {
    _session: new SessionCache(
      "RequestGuard.TabStatus",
      {
        afterLoad(data) {
          if (data) {
            TabStatus.map = new Map(data.map);
            TabStatus._originsCache = new Map(data._originsCache);
          }
        },
        beforeSave() { 
          return {
            map: [...TabStatus.map],
            _originsCache: [...TabStatus._originsCache],
          };
        },
      }
    ),
    init() {
      for (const event of ["Activated", "Updated", "Removed"]) {
        browser.tabs[`on${event}`].addListener(TabStatus[`on${event}Tab`]);
      }
      (async () => {
        await TabStatus._session.load();
        TabStatus.updateTab();
      });
    },
    map: new Map(),
    _originsCache: new Map(),
    newRecords() {
      return {
        allowed: {},
        blocked: {},
        noscriptFrames: {},
        origins: new Set(),
      }
    },
    hasOrigin(tabId, url) {
      let records = this.map.get(tabId);
      return records?.origins.has(Sites.origin(url));
    },
    addOrigin(tabId, url) {
      if (tabId < 0) return;
      let origin = Sites.origin(url);
      if (!origin) return;
      let {origins} = this.map.get(tabId) || this.initTab(tabId);
      if (!origins.has(origin)) {
        origins.add(origin);
        this._originsCache.clear();
      }
    },

    findTabsByOrigin(origin) {
      let tabIds = this._originsCache.get(origin);
      if (!tabIds) {
        tabIds = [];
        for(let [tabId, {origins}] of [...this.map]) {
          if (origins.has(origin)) tabIds.push(tabId);
        }
        this._originsCache.set(origin, tabIds);
      }
      return tabIds;
    },
    initTab(tabId, records = this.newRecords()) {
      if (tabId < 0) return;
      this.map.set(tabId, records);
      this._session.save();
      return records;
    },
    _record(request, what, optValue) {
      let {tabId, frameId, type, url, documentUrl} = request;
      let policyType = policyTypesMap[type] || type;
      let requestKey = Policy.requestKey(url, policyType, documentUrl);
      let {map} = this;
      let records = map.has(tabId) ?  map.get(tabId) : this.initTab(tabId);
      if (what === "noscriptFrame" && type !== "object") {
        let nsf = records.noscriptFrames;
        nsf[frameId] = optValue;
        what = optValue ? "blocked" : "allowed";
        if (frameId === 0) {
          request.type = type = "main_frame";
          Content.reportTo(request, optValue, type);
        }
      }
      if (type.endsWith("frame")) {
        this.addOrigin(tabId, url);
      } else if (documentUrl) {
        this.addOrigin(tabId, documentUrl);
      }
      let collection = records[what];
      if (collection) {
        if (type in collection) {
          if (!collection[type].includes(requestKey)) {
            collection[type].push(requestKey);
          }
        } else {
          collection[type] = [requestKey];
        }
      }
      this._session.save();
      return records;
    },
    record(request, what, optValue) {
      let {tabId} = request;
      if (tabId < 0) return;
      let records = this._record(request, what, optValue);
      if (records) {
        this.updateTab(request.tabId);
      }
    },
    _pendingTabs: new Set(),
    async updateTab(tabId) {
      tabId ??= (await browser.tabs.getCurrent())?.tabId;
      if (!(tabId >= 0)) return;
      if (this._pendingTabs.size === 0) {
        setTimeout(() => { 
          for (let tabId of this._pendingTabs) {
            this._updateTabNow(tabId);
          }
          this._pendingTabs.clear();
        }, 200);
      }
      this._pendingTabs.add(tabId);
    },
    _updateTabNow(tabId) {
      this._pendingTabs.delete(tabId);
      let records = this.map.get(tabId) || this.initTab(tabId);

      let {allowed, blocked, noscriptFrames} = records;
      let topAllowed = !(noscriptFrames && noscriptFrames[0]);
      let numAllowed = 0, numBlocked = 0, sum = 0;
      let report = Permissions.ALL.map(t => {
        const a = allowed[t] && allowed[t].length || 0,
              b = blocked[t] && blocked[t].length || 0,
              s = a + b,
              label = _(`cap_${t}`) || t;
        numAllowed += a;
        numBlocked += b;
        sum += s;
        return s && `<${label}>: ${b}/${s}`;
      }).filter(s => s).join("\n");
      let enforced = ns.isEnforced(tabId);
      let icon = enforced ?
        (topAllowed ? (numBlocked ? "part" : "yes")
        : (numAllowed ? "sub" : "no")) 
        : "global"; 
      let showBadge = ns.local.showCountBadge && numBlocked > 0;
      let {action} = browser;
      if (!action.setIcon) { 
        action.setTitle({tabId, title: `NoScript (${numBlocked})`});
        return;
      }
      (async () => {
        let iconPath = (await Themes.isVintage()) ? '/img/vintage' : '/img';
        action.setIcon({tabId, path: {64: `${iconPath}/ui-${icon}64.webp`}});
      })();

      action.setBadgeText({
        tabId,
        text: TabGuard.isAnonymizedTab(tabId) ? "TG" : showBadge ? numBlocked.toString() : ""
      });
      action.setBadgeBackgroundColor({tabId, color: [128, 0, 0, 160]});
      action.setTitle({tabId,
        title: UA.mobile ? "NoScript" : `${VERSION_LABEL} \n${enforced ?
            _("BlockedItems", [numBlocked, numAllowed + numBlocked]) + ` \n${report}`
            : _("NotEnforced")}`
      });
    },
    async probe(tabId) {
      if (tabId === undefined) {
        (await browser.tabs.query({})).forEach(tab => TabStatus.probe(tab.id));
      } else {
        try {
          TabStatus.recordAll(tabId, await ns?.collectSeen(tabId));
        } catch (e) {
          error(e);
        }
      }
    },
    recordAll(tabId, seen) {
      if (seen) {
        let records = TabStatus.map.get(tabId);
        if (records) {
          records.allowed = {};
          records.blocked = {};
        }
        for (let thing of seen) {
          let {request, allowed} = thing;
          request.tabId = tabId;

          TabStatus._record(request, allowed ? "allowed" : "blocked");
          if (request.key === "noscript-probe" && request.type === "main_frame" ) {
            request.frameId = 0;
            TabStatus._record(request, "noscriptFrame", !allowed);
          }
        }
        this._updateTabNow(tabId);
      }
    },
    async onActivatedTab(info) {
      let {tabId} = info;
      let seen = await ns.collectSeen(tabId);
      TabStatus.recordAll(tabId, seen);
    },
    onUpdatedTab(tabId, changeInfo) {
      if (changeInfo.url) {
        TabStatus.initTab(tabId);
      }
    },
    onRemovedTab(tabId) {
      TabStatus.map.delete(tabId);
      TabStatus._originsCache.clear();
      TabStatus._pendingTabs.delete(tabId);
    },
  };
  TabStatus.init();

  const messageHandler = {

    async pageshow(message, sender) {
      if (sender.frameId === 0) {
        TabStatus.recordAll(sender.tab.id, message.seen);
      } else if (sender.tab) {

        const tabId = sender.tab.id;
        for (const {request, allowed, policyType} of message.seen) {
          request.tabId = tabId;
          request.frameId = sender.frameId;
          Content.reportTo(request, allowed, policyType);
        }
      }
      return true;
    },


    violation({url, type, isReport}, sender) {
      const {tab, frameId} = sender;
      const documentUrl = sender.url;

      let request = {
        url,
        type,
        tabId: tab.id,
        tabUrl: tab.url,
        frameId,
        documentUrl,
        originUrl: documentUrl,
      };



      if (isReport && !checkRequest(request)?.cancel) {

        return false;
      }

      Content.reportTo(request, false, policyTypesMap[type]);

      if (type === "script" && url === sender.url) {
        TabStatus.record(request, "noscriptFrame", true);
      } else {
        TabStatus.record(request, "blocked");
      }

      return true;
    },

    async blockedObjects(message, sender) {
      let {url, documentUrl, policyType} = message;
      let TAG = `<${policyType.toUpperCase()}>`;

      const useDirs = policyType === "x-load";
      const normalize = useDirs ? Sites.trimToDir : u => u;
      url = normalize(url);
      const contextUrl = normalize(sender.tab.url || documentUrl);
      const ctxKey = Sites.optimalKey(contextUrl);

      let origin = Sites.origin(url);
      const {siteKey} = Sites.parse(url);

      const forcedTemp = sender.tab.incognito;

      const allowLabel = forcedTemp ? "allowTemp" : "allowLocal";

      const options = [
        {
          label: _(allowLabel, siteKey),
          checked: true,
          _key: siteKey,
        },
      ];
      if (!(url.startsWith("blob:") || useDirs)) {
        if (siteKey === origin) {
          origin = new URL(url).protocol;
        }
        options.push({ label: _(allowLabel, origin), _key: origin });
      }

      options.push({ label: _("CollapseBlockedObjects"), _collapse: true });

      const checks = [
        { label: `${_("capsContext")} ${Sites.toLabel(ctxKey)}`, checked: true, _val: "ctx" },
      ];

      if (!forcedTemp) {
        checks.unshift(
          { label: _("allowTemp", TAG), checked: true, _val: "temp" },
        );
      }

      let ret = await Prompts.prompt({
        title: _("BlockedObjects"),
        message: _(allowLabel, TAG),
        options,
        checks,
      });



      if (ret.button !== 0) return;

      const choice = options[ret.option];
      if (choice._collapse) {
        return { collapse: "all" };
      }

      const key = choice._key;
      if (!key) return;

      const checked = ret.checks.map((i) => checks[i]._val);

      const wantsContext = checked.includes("ctx");

      let cookieStoreId = sender.tab && sender.tab.cookieStoreId;
      let policy = ns.getPolicy(cookieStoreId);
      let { contextMatch, perms } = policy.get(key, contextUrl);

      if (!perms.capabilities.has(policyType) ||
          !contextMatch && wantsContext && ctxKey) {

        const wantsTemp = forcedTemp || checked.includes("temp");
        if (!contextMatch) {
          const isDefault = perms === policy.DEFAULT;
          perms = perms.clone();
          if (isDefault) perms.temp = wantsTemp;
          policy.set(key, perms);
          if (ctxKey && wantsContext) {
            perms.contextual.set(ctxKey, perms = perms.clone(                  true));
          }
        }
        perms.temp = wantsTemp;
        perms.capabilities.add(policyType);
        await ns.savePolicy();
        await ns.saveContextStore();
        await RequestGuard.DNRPolicy?.update();
      }
      return {enable: key};
    },
  };

  const Content = {
    _session: new SessionCache("RequestGuard.Content", {
      afterLoad(data) {
        if (data.tabLess?.requests) {
          Content._tabLess = Object.assign({}, data.tabLess);
          Content._tabLess.requests = new Map(data.tabLess.requests);
        }
      },
      beforeSave() {

        if (!Content._tabLess) {
          return;
        }
        const tabLess = Object.assign({}, Content._tabLess);
        tabLess.requests = [...tabLess.requests];
        return {
          tabLess,
        };
      },
    }),
    _tabLess: null,
    async getTabLess() {
      if (!this._tabLess) await this._session.load();
      return (this._tabLess ||= { requests: new Map() });
    },

    async checkTabLessRequest(request, candidate) {
      if (request.tabId !== -1) {

        return;
      }

      const tabLess = await this.getTabLess();
      if (request.frameId == 0 && request.type == "main_frame") {
        if (request.documentUrl) {

          return;
        }
        const { url } = request;
        if (tabLess.mainUrl == url) {

          return;
        }

        for (let h of request.requestHeaders) {
          switch(h.name) {
            case 'Sec-Fetch-Dest':
              if (h.value !== "document") {
                return;
              }
              break;
            case 'Sec-Fetch-Mode':
              if (h.value !== "navigate") {
                return;
              }
              break;
            case 'Sec-Fetch-Site':
              if (h.value !== "cross-site") {
                return;
              }
              break;
            case 'Sec-Purpose':

              return;
          }
        }
        await include("/nscl/service/SidebarUtil.js");
        const sidebarWidth = await SidebarUtil.guessSidebarWidth();
        if (sidebarWidth < 400) {

          return;
        }
        tabLess.sidebarWidth = sidebarWidth;
        tabLess.requests.clear();
        tabLess.mainUrl = url;
      } else if (
        !tabLess?.requests?.size ||
        tabLess.mainUrl !==
          (request?.frameAncestors?.length
            ? request.frameAncestors[
                request.frameAncestors?.length - 1]?.url
            : request.documentUrl)
      ) {

        return;
      }
      tabLess.requests.set(candidate.request.key, candidate);
      this._session.save();
    },

    async reportTo(originalRequest, allowed, policyType) {
      const { requestId, tabId, type, url, documentUrl, originUrl } =
        originalRequest;

      const pending = pendingRequests.get(requestId); 

      const request = {
        key: Policy.requestKey(
          url,
          type,
          documentUrl || "",
          /^(media|object|frame)$/.test(type)
        ),
        type,
        url,
        documentUrl,
        originUrl,
      };

      if (tabId < 0) {
        if (Sites.isInternal(url)) {
          return;
        }
        if (
          (policyType === "script" || policyType === "fetch") &&
          url.startsWith("https://") &&
          documentUrl?.startsWith("https://")
        ) {

          const payload = {
            request,
            allowed,
            policyType,
            serviceWorker: Sites.origin(documentUrl),
          };
          const recipient = { frameId: 0 };
          for (const tabId of TabStatus.findTabsByOrigin(payload.serviceWorker)) {
            recipient.tabId = tabId;
            try {
              Messages.send("seen", payload, recipient);
            } catch (e) {

            }
          }
          if (recipient.tabId) {

            return;
          }
        }
        if ((pending && UA.isMozilla)) {

          pending.tabLessCandidate = {
            request,
            allowed,
            policyType,
            tabLess: true,
          };
        }
        return;
      }
      if (pending) request.initialUrl = pending.initialUrl;
      let { frameId, parentFrameId } = originalRequest;
      if (type == "sub_frame") {

        frameId = parentFrameId;
      }
      try {
        await Messages.send(
          "seen",
          { request, allowed, policyType, ownFrame: true },
          { tabId, frameId }
        );
      } catch (e) {
        debug(
          `Couldn't deliver "seen" message for ${type}@${url} ${
            allowed ? "A" : "F"
          } to document ${documentUrl} (${frameId}/${tabId})`,
          e
        );
      }

      if (frameId === 0) {
        return;
      }

      try {
        await Messages.send(
          "seen",
          { request, allowed, policyType },
          { tabId, frameId: 0 }
        );
      } catch (e) {
        debug(
          `Couldn't deliver "seen" message to top frame containing ${documentUrl} (${frameId}/${tabId}`,
          e
        );
      }
    },
  };

  const pendingRequests = new Map();
  function initPendingRequest(request) {
    let { requestId, url } = request;
    let redirected = pendingRequests.get(requestId);
    let initialUrl = redirected ? redirected.initialUrl : url;
    pendingRequests.set(requestId, {
      initialUrl,
      url,
      redirected,
      onCompleted: new Set(),
    });
    return redirected;
  }

  const normalizeRequest = request => {

    if ("initiator" in request && !("originUrl" in request)) {
      request.originUrl = request.initiator;
      if (request.type !== "main_frame" && !("documentUrl" in request)) {
        request.documentUrl = request.initiator;
      }
    }
    if (request.frameAncestors && !request.originUrl && request.type != "main_frame") {

      if (request.documentUrl || request.type != "sub_frame") {

        request.originUrl = NavCache.getFrame(request.tabId, request.frameId)?.url || "null";
        request.documentUrl ||= request.originUrl;
        return;
      }


      for (let f of request.frameAncestors) {
        if (f.url !== "null" && !f.url.startsWith("moz-nullprincipal:")) {
          let { url } = f;
          if (url === "") {

            url = NavCache.getFrame(request.tabId, f.frameId)?.url;
          }
          request.originUrl = request.documentUrl = url;
          break;
        }
      }
      request.originUrl ||= "null";
    }
  };

  function intersectCapabilities(policyMatch, request) {
    const {cascadePermissions, cascadeRestrictions} = ns.sync;
    if (request.frameId !== 0 && cascadeRestrictions || request.type != "main_frame" && cascadePermissions) {
      const {tabUrl, frameAncestors, cookieStoreId} = request;
      const topUrl = tabUrl ||
        cascadePermissions && request.frameId == 0 && request.documentUrl ||
        frameAncestors && frameAncestors[frameAncestors?.length - 1]?.url ||
        TabCache.get(request.tabId)?.url;
      if (topUrl) {
        const policy = ns.getPolicy(cookieStoreId);
        return policy.cascade(policyMatch, topUrl, {
          permissions: cascadePermissions,
          restrictions: cascadeRestrictions,
        }).capabilities;
      }
    }
    return policyMatch.perms.capabilities;
  }

  const ABORT = {cancel: true},
        ALLOW = {};

  const recent = {
    MAX_AGE: 500,
    _pendingGC: 0,
    _byUrl: new Map(),
    find(request, last = this._byUrl.get(request.url)) {
      if (!last) return null;
      for (let j = last.length; j-- > 0;) {
        let other = last[j];
        if (request.timeStamp - other.timeStamp > this.MAX_AGE) {
          last.splice(0, ++j);
          if (last.length === 0) this._byUrl.delete(other.url);
          break;
        }
        if (request.url && other.type === request.type && other.documentUrl === request.documentUrl
          && other.tabId === request.tabId && other.frameId === request.frameId) {
          return other;
        }
      }
      return null;
    },
    add(request) {
      request.timeStamp ??= Date.now();
      let last = this._byUrl.get(request.url);
      if (!last) {
        last = [request];
        this._byUrl.set(request.url, last);
      } else {
        last.push(request);
      }
      this._gc();
      return;
    },
    _gc(now) {
      if (!now && this._pendingGC) return;

      let request = {timeStamp: Date.now()};
      for (let last of this._byUrl.values()) {
        this.find(request, last);
      }
      this._pendingGC = this._byUrl.size ?
         setTimeout(() => this._gc(true), 1000)
         : 0;
    }
  };


  function blockLANRequest(request) {
    debug("WAN->LAN request blocked", request);
    let r = Object.assign({}, request);
    r.url = request.originUrl; 
    Content.reportTo(r, false, "lan")
    return ABORT;
  }

  function checkLANRequest(request) {
    if (!ns.isEnforced(request.tabId)) return ALLOW;
    let {originUrl, url, cookieStoreId} = request;
    let policy = ns.getPolicy(cookieStoreId);
    if (originUrl && !Sites.isInternal(originUrl) && url.startsWith("http") &&
      !policy.can(originUrl, "lan", ns.policyContext(request))) {


      const {proxyInfo} = request; 
      const neverDNS = (proxyInfo?.type?.startsWith("http") || proxyInfo?.proxyDNS)
                     || !(UA.isMozilla && DNS.supported);
      if (neverDNS) {


        return iputil.isLocalURI(url, false, neverDNS) && !iputil.isLocalURI(originUrl, true, neverDNS)
          ? blockLANRequest(request)
          : ALLOW;
      }

      return new Promise(async (resolve, reject) => {
        try {
          resolve(await iputil.isLocalURI(url, false) && !(await iputil.isLocalURI(originUrl, true))
            ? blockLANRequest(request)
            : ALLOW
          );
        } catch (e) {
          reject(e);
        }
      });
    }
  }


  function checkRequest(request) {
    if (!(request.type in policyTypesMap)) {
      return null;
    }

    normalizeRequest(request);

    let {tabId, type, cookieStoreId, url, originUrl} = request;

    const policy = ns.getPolicy(cookieStoreId);

    let previous = recent.find(request);
    if (previous) {

      return previous.return;
    }
    (previous = request).return = ALLOW;
    recent.add(previous);

    let policyType = policyTypesMap[type];
    let {documentUrl} = request;
    if (!ns.isEnforced(tabId)) {
      if (ns.unrestrictedTabs.has(tabId) && type.endsWith("frame") && url.startsWith("https:")) {
        TabStatus.addOrigin(tabId, url);
      }
      if (type !== "main_frame") {
        Content.reportTo(request, true, policyType);
      }
      return ALLOW;
    }

    const isFetch = "fetch" === policyType;
    if ((isFetch || "frame" === policyType) &&
        (((isFetch && !originUrl
          || url === originUrl) && originUrl === documentUrl


        ) ||
        Sites.isInternal(originUrl)) ||
        Sites.isInternal(url)
    ) {

      return ALLOW;
    }

    let allowed = false;

    if (/^(?:data|blob):/.test(url)) {
      request._dataUrl = url;
      request.url = url = documentUrl || originUrl;
      allowed = Sites.isInternal(url);
    }

    if (tabId < 0 && documentUrl?.startsWith("https:")) {
      allowed = [...ns.unrestrictedTabs]
        .some(tabId => TabStatus.hasOrigin(tabId, documentUrl));
    }
    if (!allowed) {
      const capabilities = intersectCapabilities(
        policy.get(url, ns.policyContext(request)),
        request);
      allowed = !policyType || capabilities.has(policyType);
      if (allowed && request._dataUrl && type.endsWith("frame")) {
        const blocker = csp.buildFromCapabilities(capabilities);
        if (blocker) {
          const redirectUrl = CSP.patchDataURI(request._dataUrl, blocker);
          if (redirectUrl !== request._dataUrl) {
            return previous.return = { redirectUrl };
          }
        }
      }
    }

    if (type !== "main_frame" || tabId < 0) {
      Content.reportTo(request, allowed, policyType);
    }

    if (!allowed) {
      debug(`${policyType} must be blocked`, request);
      TabStatus.record(request, "blocked");
      return previous.return = ABORT;
    }

    return ALLOW;
  }


  const listeners = {
    onBeforeRequest(request) {
      try {
        if (browser.runtime.onSyncMessage?.isMessageRequest(request)) {
          return ALLOW;
        }
        initPendingRequest(request);

        let result = checkRequest(request);
        if (result) return result;

      } catch (e) {
        error(e);
      }
      return ALLOW;
    },

    onBeforeSendHeaders(request) {
      normalizeRequest(request);
      let lanRes = checkLANRequest(request);
      if (!UA.isMozilla) {


        return lanRes;
      }
      if (lanRes === ABORT) return ABORT;

      const pending = pendingRequests.get(request.requestId);

      if (pending?.redirected?.url === request.url) {
        return lanRes; 
      }
      const chainNext = r =>
          r === ABORT
            ? r
            : pending.tabLessCandidate
              ? Content.checkTabLessRequest(request, pending.tabLessCandidate)
              : TabGuard.onSend(request);
      return lanRes instanceof Promise ? lanRes.then(chainNext) : chainNext(lanRes);
    },

    onHeadersReceived(request) {



      let pending = pendingRequests.get(request.requestId);
      if (pending) {
        if (pending.headersProcessed) {
          if (!request.fromCache) {

            return ALLOW;
          }

        } else {

        }
      } else {

        initPendingRequest(request);
        pending = pendingRequests.get(request.requestId);
      }
      if (request.fromCache && listeners.onHeadersReceived.resetCSP && !pending.resetCachedCSP) {

        pending.resetCachedCSP = true;
        let {responseHeaders} = request;
        let headersCount = responseHeaders.length;
        let purged = false;
        responseHeaders.forEach((h, index) => {
          if (csp.isMine(h)) {
            responseHeaders.splice(index, 1);
          }
        });
        if (headersCount > responseHeaders.length) {

          return {responseHeaders};
        }
      }

      normalizeRequest(request);
      let result = ALLOW;

      pending.headersProcessed = true;
      let {url, tabId, cookieStoreId, responseHeaders, type} = request;
      let isMainFrame = type === "main_frame";
      try {
        let capabilities;
        if (ns.isEnforced(tabId)) {
          const policy = ns.getPolicy(cookieStoreId);
          const policyMatch = policy.get(url, ns.policyContext(request));
          let { perms } = policyMatch;
          if (isMainFrame) {
            const autoPerms = policy.autoAllow(url, perms);
            if (autoPerms) {
              perms = autoPerms;
            }
            capabilities = perms.capabilities;
          } else {
            capabilities = intersectCapabilities(policyMatch, request);
          }
        } 
        if (isMainFrame && !TabStatus.map.has(tabId)) {

          TabStatus.record(request, "noscriptFrame",
            capabilities && !capabilities.has("script"));
        }
        let header = csp.patchHeaders(responseHeaders, capabilities);
        let headersModified = TabGuard.onReceive(request);




        if (header) {
          pending.cspHeader = header;

          headersModified = true;
        }
        if (headersModified) {
          result = {responseHeaders};

        }
      } catch (e) {
        error(e, "Error in onHeadersReceived", request);
      }

      return result;
    },
    onResponseStarted(request) {
      normalizeRequest(request);

      let {requestId, url, tabId, frameId, type} = request;
      if (type === "main_frame") {
        TabStatus.initTab(tabId);
        TabGuard.onCleanup(request);
      }
      if (!RequestGuard.canBlock) {
        return;
      }
      let scriptBlocked = request.responseHeaders.some(
        h => csp.isMine(h) && CSP.blocks(h.value, "script")
      );

      TabStatus.record(request, "noscriptFrame", scriptBlocked);
      let pending = pendingRequests.get(requestId);
      if (pending) {
        pending.scriptBlocked = scriptBlocked;
        if (!(pending.headersProcessed &&
            (scriptBlocked || ns.requestCan(request, "script"))
          )) {
          debug("[WARNING] onHeadersReceived %s %o", frameId, tabId,
            pending.headersProcessed ? "has been overridden on": "could not process",
            request);
        }
      }
    },
    onCompleted(request) {
      let {requestId} = request;
      if (pendingRequests.has(requestId)) {
        let r = pendingRequests.get(requestId);
        pendingRequests.delete(requestId);
        for (let callback of r.onCompleted) {
          try {
            callback(request, r);
          } catch (e) {
            error(e);
          }
        }
      }
      TabGuard.onCleanup(request);
    },
    onErrorOccurred(request) {
      pendingRequests.delete(request.requestId);
      TabGuard.onCleanup(request);
    }
  };

  async function injectPolicyScript(details) {
    await ns.initializing;

    const {url, tabId, frameId, cookieStoreId, type} = details;
    const isTop = type == "main_frame";
    const domPolicy = await ns.computeChildPolicy(
      { url },
      {
        tab: { id: tabId, url: isTop ? url : null },
        frameId: isTop ? 0 : frameId,
        cookieStoreId,
      }
    );
    domPolicy.navigationURL = url;
    return {
      data: { domPolicy },
      callback: "ns_setupCallback",
      assign: "ns",
    };
  }


  globalThis.RequestGuard = {
    canBlock: UA.isMozilla,
    DNRPolicy: null,
    policyTypesMap,
    async getTabLess() {
      const tabLess = Object.assign({}, await Content.getTabLess());
      tabLess.requests = [... tabLess.requests.values()]
      return tabLess;
    }
  };


  {
    Messages.addHandler(messageHandler);
    const wr = browser.webRequest;
    const listen = (what, ...args) => wr[what].addListener(listeners[what], ...args);
    const allUrls = ["<all_urls>"];
    const docTypes = ["main_frame", "sub_frame", "object"];
    const filterDocs = {urls: allUrls, types: docTypes};
    const filterAll = {urls: allUrls};

    listen("onBeforeRequest", filterAll,
        RequestGuard.canBlock ? ["blocking"] : []);
    listen("onResponseStarted", filterDocs, ["responseHeaders"]);
    listen("onCompleted", filterAll);
    listen("onErrorOccurred", filterAll);
    DocStartInjection.register(injectPolicyScript);
    TabStatus.probe();

    if (!RequestGuard.canBlock) {
      include("/bg/DNRPolicy.js");
    } else {

      listen("onBeforeSendHeaders", filterAll, ["blocking", "requestHeaders"]);

      const mergingCSP = true; 
      if (mergingCSP) {



        wr.onHeadersReceived.addListener(
          listeners.onHeadersReceived.resetCSP = request => {
            return listeners.onHeadersReceived(request);
          }, filterDocs, ["blocking", "responseHeaders"]);
      }
      listen("onHeadersReceived", filterDocs, ["blocking", "responseHeaders"]);


      (listeners.onHeadersReceivedLast =
        new LastListener(wr.onHeadersReceived, request => {
        const pending = pendingRequests.get(request.requestId);
        if (pending?.headersProcessed) {
          const {cspHeader} = pending;
          if (cspHeader) {
            const {responseHeaders} = request;
            responseHeaders.push(cspHeader);
            return {responseHeaders};
          }
        } else {
          debug("[WARNING] onHeadersReceived not called (yet?)", request);
        }
        return ALLOW;
      }, filterDocs, ["blocking", "responseHeaders"])).install();
    }
  }
}
