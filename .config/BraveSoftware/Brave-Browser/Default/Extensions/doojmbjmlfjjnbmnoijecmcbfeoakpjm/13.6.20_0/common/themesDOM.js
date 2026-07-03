



















if (self.document) {
  const PARENT_CLASS = "__NoScript_Theme__";
  const patchSheet = s => {
    const PARENT_SELECTOR = `.${PARENT_CLASS}`;
    const rules = s.cssRules;
    for (let j = 0, len = rules.length; j < len; j++) {
      const rule = rules[j];
      if (rule.styleSheet && patchSheet(rule.styleSheet)) {
        return true;
      }
      if (rule.conditionText !== "(prefers-color-scheme: light)") continue;
      for (let r of rule.cssRules) {
        let {selectorText} = r;
        if (selectorText.includes("[data-theme=") || !selectorText.startsWith(PARENT_SELECTOR)) continue;
        selectorText = selectorText.replace(PARENT_SELECTOR, `${PARENT_SELECTOR}[data-theme="light"]`);
        s.insertRule(`${selectorText} {${r.style.cssText}}`, j);
      }
      return true;
    }
    return false;
  }

  const patchAll = () => {
    for (const s of document.styleSheets) {
      try {
        if (patchSheet(s)) return true;
      } catch (e) {


      }
    }
    return false;
  }

  if (!patchAll()) {

    const onload = e => {
      if (patchAll()) {
        removeEventListener(e.type, onload, true);
      }
    }
    addEventListener("load", onload, true);
  }

  const root = document.documentElement;
  root.classList.add(PARENT_CLASS);

  Themes.update = toTheme => {
    if (window.localStorage) try {
      localStorage.setItem("theme", toTheme);
    } catch (e) {}
    return root.dataset.theme = toTheme;
  }

  const updateFavIcon = isVintage => {
    let favIcon = document.querySelector("link[rel=icon]");
    if (!favIcon) return;
    let {href} = favIcon;
    const BASE = new URL("/img/", location.href);
    if (!href.startsWith(BASE)) return alert("return");
    const SUB = BASE + "vintage/";
    let vintageIcon = href.startsWith(SUB);
    if (isVintage === vintageIcon) return;
    favIcon.href = isVintage ? href.replace(BASE, SUB) : href.replace(SUB, BASE);
  }

  Themes.refreshVintage = isVintage => {
    if (localStorage) try {
      localStorage.setItem(Themes.VINTAGE, isVintage || "");
    } catch (e) {}
    document.documentElement.classList.toggle("vintage", isVintage === true);
    browser?.action?.setIcon({path: {64: `/img${isVintage ? "/vintage/" : "/"}ui-maybe64.webp` }});
    updateFavIcon(isVintage);
  }
}
