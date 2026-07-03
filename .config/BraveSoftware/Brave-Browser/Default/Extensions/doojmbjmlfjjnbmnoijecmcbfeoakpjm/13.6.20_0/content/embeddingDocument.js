



















if (ns.embeddingDocument) {
  let suspended;
  let suspender = new MutationObserver(records => {
    suspended = document.body?.firstElementChild;
    if (suspended) {
      debug("Suspending ", suspended);
      suspended.autoplay = false;
      if (suspended.pause) suspended.pause();
      suspended.src = suspended.currentSrc = "data:";
      if (ns.policy) replace();
    }
  });
  suspender.observe(document, {childList: true, subtree: true});

  let replace = () => {
    if (suspended) {
      debug("Restoring suspended", suspended);
      suspended.src = suspended.currentSrc = document.URL;
    }

    for (let policyType of ["object", "media"]) {
      let request = {
        id: `noscript-${policyType}-doc`,
        type: policyType,
        url: document.URL,
        documentUrl: document.URL,
        embeddingDocument: true,
      };

      if (ns.allows(policyType)) {
        suspender.disconnect();
        if (suspended) {
          suspended.autoplay = true;
          if (suspended.play) suspended.play();
        }
        let handler = PlaceHolder.handlerFor(policyType);
        if (handler?.selectFor(request).length > 0) {
          seen.record({policyType, request, allowed: true});
        }
      } else {
        let ph = PlaceHolder.create(policyType, request);
        if (ph.replacements.size > 0) {
          debug(`Created placeholder for ${policyType} at ${document.URL}`);
          seen.record({policyType, request, allowed: false});
        }
      }
    }
  };

  ns.on("capabilities", () => {
    if (!(document.body?.firstChild)) { 
      setTimeout(replace, 0);
      let types = {


        "media": /^(?:(?:video|audio)\/|application\/(?:ogg|mp4|mpeg)$)/i,
        "object": /^application\//i,
      }
      for (let [type, rx] of Object.entries(types)) {
        if (rx.test(document.contentType)) {
          if (!ns.allows(type)) {
            window.stop();
          }
          break;
        }
      }
    } else {
      replace();
    }
  });
}
