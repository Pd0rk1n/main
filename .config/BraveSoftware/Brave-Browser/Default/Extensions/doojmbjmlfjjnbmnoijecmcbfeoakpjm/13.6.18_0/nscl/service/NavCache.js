



















"use strict";

 globalThis.NavCache ||= (() => {

   const tabs = {};
   const listeners = new Set();

   const clone = structuredClone || (o => JSON.parse(JSON.stringify(o)));


  const navListener = ({ tabId, frameId, url, parentFrameId }) => {
      let tab = tabs[tabId];
      let frame = tab && tab[frameId];
      if (!tab) {
        tabs[tabId] = tab = {
          tabId,
          topUrls: new Set(),
        };
      }
      let previousUrl = frame?.url;
      frame = tab[frameId] = {
        tabId,
        frameId,
        parentFrameId,
        previousUrl,
        url,
      };
      if (parentFrameId == -1) tab.topUrls.add(url);
      if (previousUrl !== url) {
        for (const l of listeners) {
          try {
            l(clone(frame));
          } catch (e) {
            console.error(e);
          }
        }
      }
      populateFrames({ id: tabId }); 
    };

  browser.webNavigation.onBeforeNavigate.addListener(navListener);
  browser.webNavigation.onCommitted.addListener(navListener);

  browser.tabs.onRemoved.addListener(tabId => {
    delete tabs[tabId];
  });

  async function populateFrames(tab) {
    const tabId = tab.id;
    if (tabId < 0) return;
    const frames =  await browser.webNavigation.getAllFrames({tabId});
    if (!frames) return; 
    const t = tabs[tabId] ||= {
      tabId,
      topUrls: new Set(),
    };
    for (const {frameId, url, parentFrameId} of frames) {
      t[frameId] = {tabId, frameId, url, parentFrameId};
      if (parentFrameId == -1) t.topUrls.add(url);
    }
  }

  return {
    wakening: (async () => {
      await Promise.all((await browser.tabs.query({})).map(populateFrames));
      return true;
    })(),

    getTab(tabId) {
      return clone(tabs[tabId] || {});
    },
    getFrame(tabId, frameId) {
      return clone((tabs[tabId] || {})[frameId]);
    },
    onUrlChanged: {
      addListener(listener) {
        listeners.add(listener);
      },
      removeListener(listener) {
        listeners.remove(listeners);
      }
    }
  };
})();
