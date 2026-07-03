



















{
  let mozWebExtUrl = typeof document === "object" && document.URL.startsWith("moz-");
  let isMozilla = mozWebExtUrl ||
    (typeof window === "object"
        ? typeof window.wrappedJSObject === "object"
        : "contentScripts" in browser);
  if (isMozilla) {
    if (mozWebExtUrl) {

      mobile = !("windows" in browser);
      (async () => {
        const cssClasses = ["mozwebext"];
        if (mobile) cssClasses.push("mobile");
        const {vendor} = await browser.runtime.getBrowserInfo();
        const tor = vendor.match(/^(?:Tor|Mullvad)\b/);
        const mullvad = tor && tor[0] == "Mullvad";
        if (tor) cssClasses.push("tor");
        if (mullvad) cssClasses.push("mullvad");
        document.documentElement.classList.add(...cssClasses);
      })();
    }
  } else {

    if (typeof chrome === "object" && !chrome.tabs) {

    }
  }

  var UA = {
    isMozilla,
    get mobile() {
      delete this.mobile;
      return this.mobile = mozWebExtUrl
      ? !("windows" in browser)
      : navigator.userAgent.includes("Mobile");
    },

  };

  browser.action ??= browser.browserAction;
}
