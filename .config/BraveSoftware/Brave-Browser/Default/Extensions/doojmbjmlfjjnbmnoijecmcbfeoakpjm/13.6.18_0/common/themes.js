



















{
  let contentCSS;

  const VINTAGE = "vintageTheme";
  const THEMES = ["dark", "light", "auto"];

  globalThis.Themes = {
    VINTAGE,
    update() {},
    refreshVintage() {},
    async setup(theme = null) {
      if (theme) {
        if (browser?.storage) {
          browser.storage.local.set({theme});
        }
      } else {
        if (self.localStorage) {
          theme = localStorage.getItem("theme");
          if (!THEMES.includes(theme)) theme = null;
        }
        if (!theme && browser?.storage) {
          if (self.document?.readyState === "loading") {
            document.documentElement.style.visibility = "hidden";
          }
          return browser.storage.local.get(["theme"]).then(({theme}) => {
              Themes.update(theme);
              if (self.document) {
                document.documentElement.style.visibility = "";
              }
              return theme || "auto";
          });
        }
      }
      return Themes.update(theme);
    },

    async isVintage() {
      let ret;
      if (self.localStorage) {
        ret = localStorage.getItem(VINTAGE);
        if (ret !== null) return !(ret === "false" || !ret);
      }
      ret = (await browser.storage.local.get([VINTAGE]))[VINTAGE];
      return ret;
    },

    async setVintage(b) {
      Themes.refreshVintage(b);
      await browser.storage.local.set({[VINTAGE]: b});
      return b;
    },

    async getContentCSS() {
      contentCSS ||= (async () => {
        const replaceAsync = async (string, regexp, replacerFunction) => {
          regexp.lastIndex = 0;
          const promises = [];
          for (let match; match = regexp.exec(string);) {
            promises.push(replacerFunction(...match));
          }
          const replacements = await Promise.all(promises);
          regexp.lastIndex = 0;
          let i = 0;
          return string.replace(regexp, () => replacements[i++]);
        }
        const fetchAsDataURL = async (url) => {
          const blob = await (await fetch(browser.runtime.getURL(url))).blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
              resolve(reader.result);
            };
            reader.onerror = e => {
              reject(reader.error);
            };
            reader.readAsDataURL(blob);
          });
        }
        const fetchAsText = async (url) => await (await fetch(browser.runtime.getURL(url))).text();

       const themesCSS = (await replaceAsync(await fetchAsText("/common/themes.css"),
          /(--img-logo:.*url\("?)(.*\.svg)"?/g,
          async (s, prop, url) => `${prop}"${await fetchAsDataURL(url)}"`
        )).replace(/^.*\burl\(\/.*$/mg, '')
          .replace(/\/\*[^]*?\*\//g, '')
          .replace(/\n+/g, "\n");
        return (await fetchAsText("/content/content.css"))
          .replace(/\b(THEMES_START\b.*\n)[^]*(\n.*\bTHEMES_END)\b/g,
                  `$1${themesCSS}$2`);
      })();
      return await contentCSS;
    }
  };

  (async () => {
    if (self.document) {
      await include("/common/themesDOM.js");
    }
    await Themes.setup();
    Themes.refreshVintage(await Themes.isVintage());
  })();

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const ifChanged = (key, callback) => {
      if (key in changes) {
        let {oldValue, newValue} = changes[key];
        if (oldValue !== newValue) {
          callback(newValue);
          self.dispatchEvent(new CustomEvent("NoScriptThemeChanged", {detail: {[key]: newValue}}));
        }
      }
    }
    ifChanged("theme", Themes.update);
    ifChanged(VINTAGE, Themes.refreshVintage);
  });
}
