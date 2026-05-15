



















var TabCache = (() => {

  const cache = new Map();

  browser.tabs.onUpdated.addListener((tabId, changes, tab) => {
    cache.set(tabId, tab);
  });

  browser.tabs.onRemoved.addListener(tabId => {
    cache.delete(tabId);
  });

  return {
    wakening: (async () => {
      for (let tab of await browser.tabs.query({})) {
        cache.set(tab.id, tab);
      }
    })(),
    get(tabId) {
      return cache.get(tabId);
    },
    getAll() {
      return Array.from(cache.values());
    },
    async async(tabId) {
      return cache.get(tabId) || await browser.tabs.get(tabId);
    }
  };
})();
