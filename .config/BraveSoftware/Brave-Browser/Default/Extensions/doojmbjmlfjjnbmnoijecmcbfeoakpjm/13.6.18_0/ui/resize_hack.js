



















if ("windows" in browser) document.addEventListener("DOMContentLoaded", async e => {



  let win = await browser.windows.getCurrent({populate: true});
  if (win.tabs[0].url === document.URL) {
    let bounds = decodeURIComponent(location.href).match(/\bwinbounds=(\{[^}]*"width":[^}]+\})/);
    try {
      bounds = bounds && JSON.parse(bounds[1]);
    } catch (e) {
      bounds = null;
    }
    let {width} = bounds || win;

    await browser.windows.update(win.id, {
      width: width + 1
    });
    await browser.windows.update(win.id, {
      width
    });
  }
});
