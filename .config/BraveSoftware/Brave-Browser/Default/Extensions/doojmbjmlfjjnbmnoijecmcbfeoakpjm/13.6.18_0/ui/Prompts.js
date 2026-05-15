



















var Prompts = (() => {

  var promptData;
  var backlog = [];

  Messages.addHandler({
    getPromptData() { return Prompts.promptData },
    promptDone(data) {
      let promptData = promptDataMap.get(data.id);
      if (promptData) {
        Object.assign(promptData, data).done();
      }
    }
  });

  class WindowManager {
    constructor() {
      this.currentWindow = this.currentTab = null;
      browser.windows?.onRemoved.addListener(windowId => {
        if (windowId === this.currentWindow?.id) {
          promptData?.done();
        }
      });
      browser.tabs.onRemoved.addListener(tabId => {
        if (tabId === this.currentTab?.id) {
          promptData?.done();
        }
      });
    }

    async open(data) {
      promptData = data;
      this.close();

      let url = browser.runtime.getURL("ui/prompt.html");

      if (!("windows" in browser)) {

        this.currentTab = await browser.tabs.create({url});
        return;
      }

      let {width, height, left, top, parent } = data.features;

      let options = {
        url,
        type: "popup",
      }

      if (!parent) {
        parent = await browser.windows.getCurrent();
      }

      if (UA.isMozilla) {
        options.allowScriptsToClose = true;
      }

      const centerOnParent = bounds => {
        for (const [p, s] of [["left", "width"], ["top", "height"]]) {
          if (bounds[s] && bounds[p] === undefined) {
            bounds[p] = Math.round(parent[p] + (parent[s] - bounds[s]) / 2);
          }
        }
        return bounds;
      };

      if (width && height) {
        const bounds = { width, height, left, top };
        url += `?winbounds=${JSON.stringify(bounds)}`;
        if (parent) {
          ({ left, top } = Object.assign(options, centerOnParent(bounds)));
        }
      }


      let popup = (this.currentWindow = await browser.windows.create(options));

      if (parent) {
        ({ left, top } = centerOnParent({
          width: width || popup.width,
          height: height || popup.height,
        }));
      } else {

        if (left === undefined) ({ left } = popup);
        if (top === undefined) ({ top } = popup);
      }




      if (
        width &&
        height &&
        (popup.width !== width ||
          popup.height !== height ||
          popup.left !== left ||
          popup.top !== top)
      ) {
        popup = await browser.windows.update(popup.id, {
          left,
          top,
          width,
          height,
        });
        for (let attempts = 2; attempts-- > 0; ) {
          debug("Resizing", popup, { left, top, width, height }); 
          popup = await browser.windows.update(popup.id, { width, height });
          if (popup.width == width && popup.height == height) {
            break;
          }
        }
      }
    }

    async close() {
      if (this.currentWindow) {
        try {
          await browser.windows.remove(this.currentWindow.id);
        } catch (e) {
        }
        this.currentWindow = null;
      } else if (this.currentTab) {
        await browser.tabs.remove(this.currentTab.id);
        this.currentTab = null;
      }
    }

    async focus() {
      if (this.currentWindow) {
        try {
          await browser.windows.update(this.currentWindow.id,
            {
              focused: true,
            }
          );
        } catch (e) {
          error(e, "Focusing popup window");
        }
      }
    }

    async validateCurrent() {
      try {
        if (this.currentTab) {
          await browser.tabs.get(this.currentTab.id);
        }
        if (this.currentWindow) {
          await browser.windows.get(this.currentWindow.id);
        }
        return promptData;
      } catch (e) {
        promptData?.done();
        return null;
      }
    }
  }

  var winMan = new WindowManager();
  var id = 0;
  var promptDataMap = new Map();
  var Prompts = {
    DEFAULTS: {
      title: "",
      message: "Proceed?",
      options: [],
      checks: [],
      buttons: [_("Ok"), _("Cancel")],
      multiple: "close", 
      width:  500,
      height: 400,
      alwaysOnTop: true,
    },
    async prompt(features) {
      features = Object.assign({}, this.DEFAULTS, features || {});
      return new Promise((resolve, reject) => {
        ++id;
        let data = {
          id,
          features,
          result: {
            button: -1,
            checks: [],
            option: null,
          },
          done() {
            promptDataMap.delete(this.id);
            this.done = () => {};
            winMan.close();
            resolve(this.result);
            if (promptData === this) {
              promptData = null;
              if (backlog.length) {
                winMan.open(backlog.shift());
              }
            }
          }
        };
        promptDataMap.set(id, data);
        if (promptData && winMan.validateCurrent()) {
          backlog.push(data);
          switch(promptData.features.multiple) {
            case "focus":
              winMan.focus();
            case "queue":
            break;
            default:
              promptData.done();
          }
        } else {
          winMan.open(data);
        }
      });
    },

    get promptData() {
      return promptData;
    }
  }

  return Prompts;

})();
