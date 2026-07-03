





















var TabTies = (() => {

  let map = new Map([[-1, new Set()]]);

  const session = new SessionCache(
    "TabTies",
    {
      afterLoad(data) {
        if (data) return map = new Map(data.map(([tabId, ties]) => [tabId, new Set(ties)]));
      },
      beforeSave() {
        return [...map.entries()]
          .filter(([, ties]) => ties?.[Symbol.iterator])
          .map(([tabId, ties]) => [tabId, [...ties]]);
      },
    }
  );

  function tie(tabId1, tabId2) {
    if (!(tabId1 > -1 && tabId2 > -1 && tabId1 !== tabId2)) return;


    let allTies = new Set([...getTiesWithSelf(tabId1)]
      .concat([...getTiesWithSelf(tabId2)]));

    for (let tid of allTies) map.set(tid, allTies);

    session.save();
  }

  function cut(tabId) {
    if (!(tabId > -1)) return;
    let allTies = getTiesWithSelf(tabId);
    map.delete(tabId);
    allTies.delete(tabId);

    session.save();
  }

  function getTiesWithSelf(tabId) {
    let ties = map.get(tabId);
    return ties || map.set(tabId, ties = new Set([tabId])) && ties;
  }




  browser.webNavigation.onCreatedNavigationTarget.addListener(({sourceTabId, tabId})  => {
    tie(sourceTabId, tabId);
  });

  browser.webNavigation.onCommitted.addListener(async details => {

    let {tabId, frameId, transitionType, transitionQualifiers} = details;
    if (frameId !== 0) return;
    if (/^(?:link|form_submit|reload)$/.test(transitionType) ||
        transitionQualifiers.some(tq => tq.endsWith("_redirect"))) {

      return;
    }
    cut(tabId);
    try {
      await Scripting.executeScript({
        target: {tabId, allFrames: false},
        func: () => { window.name = "" },
      });
    } catch (e) {

    }
  });


  browser.tabs.onCreated.addListener(({id, openerTabId}) => {
    tie(id, openerTabId);
  });

  browser.tabs.onRemoved.addListener(tabId => {
    cut(tabId);
  });

  return {
    wakening: (async () => {
      await session.load(); 

      const updatedMap = new Map();
      for (const {id, openerTabId} of await browser.tabs.query({})) {
        if (!map.has(id)) {
          tie(id, openerTabId);
        }
        updatedMap.set(id, map.get(id));
      }
      map = updatedMap;
      session.save();
    })(),

    get(tabId) {
      let ties = new Set(getTiesWithSelf(tabId));
      ties.delete(tabId);
      return ties;
    },
    cut,
  }

})();
