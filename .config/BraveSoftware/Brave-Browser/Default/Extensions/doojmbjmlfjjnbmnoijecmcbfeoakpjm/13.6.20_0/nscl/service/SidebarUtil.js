





















var SidebarUtil = {



  async guessSidebarWidth(tabId = -1) {
    if (!browser.windows) return 0;
    if (tabId < 0) {
      const tab = (await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
        windowType: "normal"
      }))[0];
      if (!tab) return -1;
      tabId = tab.id;
    }
    const window = await browser.windows.get((await browser.tabs.get(tabId)).windowId);
    const outerWidth = window.width;
    await include("/nscl/service/Scripting.js");
    const getExtraWidth = async tabId => { 
      const innerWidth = (
        await Scripting.executeScript({
          target: { tabId, frameId: 0 },
          func: () => window.innerWidth,
        })
      )[0].result;
      return outerWidth - innerWidth;
    };

    try {
      return await getExtraWidth(tabId);
    } catch (e) {

      debug(e);
    }

    for (const tab of (await browser.tabs.query({
        active: false,
        lastFocusedWindow: true,
        windowType: "normal"
      }))) {
      try {
        return await getExtraWidth(tab.id);
      } catch (e) {

        debug(e);
      }
    }


    return new Promise(async resolve => {
      let tab;
      const onTab = async (tabId, changeInfo, tabInfo) => {
        if (tabId != tab?.id || changeInfo.status != "complete") {
          return;
        }
        browser.tabs.onUpdated.removeListener(onTab);
        try {
          resolve(await getExtraWidth(tab.id));
        } catch(e) {
          debug(e);
          resolve(-1);
        }
        browser.tabs.remove(tab.id);
      };
      browser.tabs.onUpdated.addListener(onTab);
      try {
        tab = await browser.tabs.create({
          windowId: window.id,
          active: false,
          url: browser.runtime.getURL("nscl/service/SidebarUtil.tab.js"),
        });
      } catch (e) {
        resolve(-1);
        browser.tabs.onUpdated.removeListener(onTab);
      }
    });
  },
};
