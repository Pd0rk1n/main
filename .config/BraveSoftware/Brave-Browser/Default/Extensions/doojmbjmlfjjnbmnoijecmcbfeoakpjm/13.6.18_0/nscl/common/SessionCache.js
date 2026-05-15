



















var SessionCache = (() => {
  const NOP = () => {};
  return class SessionCache {
    #saving = false;

    constructor(storageKey, scope = {

      }) {
      if (!(scope &&
        (typeof scope.target == "object" ||
          (typeof scope.afterLoad == "function"
            && typeof scope.beforeSave == "function")
        ))) {
        throw new TypeError("Illegal argument 2 (`scope` object): either a `target` object property or an `afterLoad`/`beforeSave` callback pair are required!")
      }
      this.storageKey = storageKey;
      this.scope = scope;


      if (!browser.storage.session) {
        this.load =  this.save = NOP;
      }
    }

    async load() {
      let data = (await browser.storage.session.get(this.storageKey))[this.storageKey];
      if (!data) return;
      const {scope} = this;
      if (scope.afterLoad) {
        try {
          data = scope.afterLoad(data);
        } catch (e) {
          console.error(e, "Could not deserialize", this.storageKey, data);
          return;
        }
      }
      if (scope.target) {
        data = Object.assign(scope.target, data);
      }
      return data;
    }

    async save() {
      return this.#saving ||= new Promise(resolve => {
        queueMicrotask(async() => {
          this.#saving = false;
          const {scope} = this;
          let data;
          try {
            data = scope.beforeSave
              ? await scope.beforeSave(scope.target)
              : scope.target;
            resolve(await browser.storage.session.set({[this.storageKey]: data}));
          } catch (e) {
            console.error(e, "Could not serialize", data, this.storageKey);
            resolve();
          }
        })
      });
    }
  }
})();
