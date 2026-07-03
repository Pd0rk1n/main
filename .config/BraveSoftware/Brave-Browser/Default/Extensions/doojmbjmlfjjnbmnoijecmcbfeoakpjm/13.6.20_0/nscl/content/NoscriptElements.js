





















"use strict";

var NoscriptElements = {
  refresh: false,
  emulate(emulateMetaRefresh = true) {
    this.emulate = () => {}; 

    let replace = (noscript) => {

      const replacement = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
      replacement.innerHTML = noscript.innerHTML;

      if (emulateMetaRefresh) {
        for (const meta of replacement.querySelectorAll('meta[http-equiv="refresh"]')) {
          this.refresh = document.readyState;
          document.head.appendChild(meta);
          debug(`State %s, emulating`, document.readyState, meta);
        }
      }
      if (noscript.closest("head") && document.body) {
        document.body.insertBefore(noscript, document.body.firstChild);
      }

      for (const {name, value, namespaceURI} of noscript.attributes) {
        replacement.setAttributeNS(namespaceURI, name, value);
      }
      noscript.replaceWith(replacement);
    }

    const noscriptElements = document.getElementsByTagName("noscript"); 
    function replaceAll() {
      for (var noscript of noscriptElements) {
        replace(noscript);
      }
    }


    replaceAll();

    if (document.readyState === "loading") {

      let observer = new MutationObserver(replaceAll);
      observer.observe(document.documentElement, {childList: true, subtree: true});
      let completed = e => {
        removeEventListener(e.type, completed);
        observer.disconnect();
        replaceAll();
        switch(this.refresh) {
          case "interactive":
            let v = navigator.userAgent.match(/Firefox\/(\d+)/);
            let noInteractiveRewrite = v && parseInt(v[1]) >= 88;
            if (noInteractiveRewrite) break;
          case "complete":
            rewrite();
        }
      };
      addEventListener("pageshow", completed);
      return;
    }



    if (this.refresh) {
      rewrite();
    }

    function rewrite() {
      const html = document.documentElement.outerHTML;
      debug("Rewriting page to emulate meta-refresh", html);
      try {
        DocRewriter.rewrite(html, true);
      } catch (e) {
        error(e);
      }
    }
  }
};
