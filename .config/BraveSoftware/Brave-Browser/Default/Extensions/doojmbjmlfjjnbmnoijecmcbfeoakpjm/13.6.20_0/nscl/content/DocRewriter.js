



















"use strict";

var DocRewriter = (() => {
  const doc = document.wrappedJSObject || document;
  const pristine = {};
  for (const key of ["open", "write", "close"]) {
    const pristineMethod = doc[key];
    pristine[key] = (...args) => {
      pristineMethod.call(doc, ...args);
    }
  }

  function createSelector(el) {
    if (!(el instanceof Element)) return;
    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.parentNode && el !== document.documentElement) {

        let index = 1;
        let sibling = el.previousElementSibling;

        while (sibling) {
          if (sibling.nodeName === el.nodeName) {
            index++;
          }
          sibling = sibling.previousElementSibling;
        }
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      el = el.parentNode;
      if (el === document || !el) break;
    }
    return path.join(" > ");
  }

  return {
    rewrite(content, conservative = false) {
      const { scrollX, scrollY } = window;
      const focusSelector = conservative &&
        (createSelector(document.activeElement) || "[autofocus]");
      const { doctype }  = document;
      pristine.open();
      if (doctype?.name) {


        const parts = [doctype.name];
        const escape = s => s.replace(/"/g, "&quot;");
        if (doctype.publicId) {
          parts.push(`PUBLIC "${escape(doctype.publicId)}"`);
        }
        if (doctype.systemId) {
          if (!doctype.publicId) {
            parts.push("SYSTEM");
          }
          parts.push(`"${escape(doctype.systemId)}"`)
        }
        pristine.write(`<!DOCTYPE ${parts.join(" ")}>`);
      }
      pristine.write(content);
      pristine.close();
      if (conservative) {
        window.scrollTo(scrollX, scrollY);
        document.querySelector(focusSelector)?.focus();
      }
    }
  }
})();
