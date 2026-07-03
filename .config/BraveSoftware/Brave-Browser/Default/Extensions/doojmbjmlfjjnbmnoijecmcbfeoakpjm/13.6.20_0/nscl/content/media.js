



















if ("MediaSource" in window) {
  let mediaBlocker;
  const notify = (allowed, request = {}) => {
    request = Object.assign({
      id: "noscript-media",
      type: "media",
      url: document.URL,
      documentUrl: document.URL,
      embeddingDocument: true,
    }, request);
    seen.record({ policyType: "media", request, allowed });
    if (!request.redundant) {

      notifyPage();
    }
    return request;
  };
  const createPlaceholder = (mediaElement, request) => {
    try {
      let ph = PlaceHolder.create("media", request);
      ph.replace(mediaElement);

    } catch (e) {
      error(e);
    }
  };
  let mozPatch;
  if ("SecurityPolicyViolationEvent" in window) {

    let createPlaceholders = () => {
      let request = notify(false);
      for (let me of document.querySelectorAll("video,audio")) {
        if (!(me.src || me.currentSrc) || me.src.startsWith("blob")) {
          createPlaceholder(me, request);
        }
      }
    }
    let processedURIs = new Set();
    addEventListener("securitypolicyviolation", e => {
      let {blockedURI, violatedDirective, originalPolicy, disposition} = e;
      if (disposition !== "enforce" ||
          !(e.isTrusted && violatedDirective === "media-src"
            && CSP.isMediaBlocker(originalPolicy))) {
        return;
      }
      if (mediaBlocker === undefined && /^data\b/.test(blockedURI)) { 

        mediaBlocker = true;
        e.stopImmediatePropagation();
        mozPatch(CSP.blocks(originalPolicy, "script"));
        return;
      }
      if (blockedURI.startsWith("blob") &&
          !processedURIs.has(blockedURI)) {
        processedURIs.add(blockedURI);
        setTimeout(createPlaceholders, 0);
      }
    }, true);
  }
  if (window.wrappedJSObject) {
    const { patchWindow } = Worlds.main;

    window.wrappedJSObject.document
      .createElementNS("http://www.w3.org/1999/xhtml", "video")
      .src = "data:"; 

    ns.on("capabilities", e => {
      mediaBlocker = !ns.allows("media");
      if (mediaBlocker) {
        debug("mediaBlocker set via fetched policy.");
        mozPatch(!ns.canScript);
      }
    });
    let mozMsePatch = () => patchWindow((win, {xray})=> {

      const unpatched = new Map();
      function patch(obj, methodName, replacement) {
        let methods = unpatched.get(obj) || {};
        let method = xray.getSafeMethod(obj, methodName);
        methods[methodName] = method;
        obj[methodName] = exportFunction(replacement, obj, {original: obj[methodName]});
        unpatched.set(obj, methods);
      }
      const urlMap = new WeakMap();
      const { URL } = win;
      patch(URL, "createObjectURL",  function(o, ...args) {
        const url = unpatched.get(URL).createObjectURL.call(this, o, ...args);
        if (o instanceof MediaSource) {
          let urls = urlMap.get(o);
          if (!urls) urlMap.set(o, urls = new Set());
          urls.add(url);
        }
        return url;
      });
      const blockedCodecs = new Set();
      const { MediaSource } = win;
      patch(MediaSource, "isTypeSupported", codec => {
        return !blockedCodecs.has(codec) && unpatched.get(MediaSource).isTypeSupported(codec);
      });

      const MediaSourceProto = MediaSource.prototype;
      patch(MediaSourceProto, "addSourceBuffer", function(mime, ...args) {
        let ms = this;
        let urls = urlMap.get(ms);
        let request = notify(!mediaBlocker);
        if (mediaBlocker) {
          const msg = `${mime} MediaSource blocked by NoScript`;
          if (!ms._ns_replaced) {
            setTimeout(() => {
              try {
                const allMedia = [...document.querySelectorAll("video,audio")];
                let toBeReplaced = allMedia.filter(e => e.srcObject === ms ||
                  urls && (urls.has(e.currentSrc) || urls.has(e.src)));
                if (!toBeReplaced.length) {
                  toBeReplaced =

                    allMedia.filter(e => !(e.src || e.currentSrc || e.srcObject));
                  if (!toBeReplaced.length) {


                    toBeReplaced = document.querySelectorAll('div[data-testid="videoComponent"]');
                  }
                  if (!toBeReplaced.length && !request.redundant) {
                    request.offscreen = true;
                    createPlaceholder(null, request);
                  }
                }
                for (const me of toBeReplaced) {
                  createPlaceholder(me, request);
                  ms._ns_replaced = true;
                }
              } catch (e) {
                error(e);
              }
            }, 0);
            log(msg);
          }
          blockedCodecs.add(mime);
          throw new Error(msg);
        }
        return unpatched.get(MediaSourceProto).addSourceBuffer.call(ms, mime, ...args);
      });
    });

    mozPatch = (scriptDisabled = false) => {
      mozPatch = () => {}; 

      if (!patchWindow) {

      } else if(!scriptDisabled) {
        mozMsePatch();
      }
      if (location.protocol !== "file:") return;



      const allowedSrc = new Set();
      const checkSrc = async (node) => {
        if (!('src' in node && node.parentNode && node instanceof HTMLMediaElement)) return;
        const url = node.src;
        if (allowedSrc.has(url) || !url.startsWith("file:")) return;

        node.src = "data:";
        const {permissions} = await Messages.send("fetchChildPolicy", {url});
        const allowed = permissions.capabilities.includes("media");
        const request = notify(allowed, {url, embeddingDocument: false});
        if (allowed) {
          allowedSrc.add(url);
        } else {
          createPlaceholder(node, request);
        }

        node.src = url;
      };
      const mutationsCallback = records => {
        for (var r of records) {
          switch (r.type) {
            case "attributes":
              checkSrc(r.target);
              break;
            case "childList":
              [...r.addedNodes].forEach(checkSrc);
              break;
          }
        }
      };
      const observer = new MutationObserver(mutationsCallback);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributeFilter: ["src"],
      });
    };
  } else {
    mozPatch = () => {};
  }
}
