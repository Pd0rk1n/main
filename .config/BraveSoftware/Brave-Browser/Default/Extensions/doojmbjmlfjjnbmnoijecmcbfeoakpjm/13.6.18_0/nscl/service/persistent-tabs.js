



















if (typeof flextabs === "function") {

  for (let tabs of document.querySelectorAll(".flextabs")) {
    flextabs(tabs).init();
    let {id} = tabs;
    if (!id) continue;
    let storageKey = `persistentTab-${id}`;
    let rx = new RegExp(`(?:^|[#;])tab-${id}=(\\d+)(?:;|$)`);
    let current = location.hash.match(rx);
    if (!current) {
      current = localStorage?.getItem(storageKey);
    } else {
      current = current[1];
    }
    let toggles = Array.from(tabs.querySelectorAll(".flextabs__toggle"));
    let currentToggle = toggles[current && parseInt(current) || 0];
    if (currentToggle) currentToggle.click();
    for (let toggle of toggles) {
      toggle.addEventListener("click", e => {
        let currentIdx = toggles.indexOf(toggle);
        if (localStorage) localStorage.setItem(storageKey, currentIdx);
        location.hash = location.hash.split(";").filter(p => !rx.test(p))
          .concat(`tab-${id}=${currentIdx}`).join(";");
      });
    }
  }
}
