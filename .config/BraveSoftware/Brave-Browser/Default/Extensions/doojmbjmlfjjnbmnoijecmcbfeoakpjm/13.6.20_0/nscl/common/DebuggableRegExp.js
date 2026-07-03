



















"use strict";

var DebuggableRegExp = (() => {

  return class DebuggableRegExp {

    constructor(rx, partsWrapper = null) {
      this.originalRx = rx;
      this.source = rx.source;
      this.flags = rx.flags;
      const chunks = rx.source.split("|");
      this._parts = [];
      let curPart = [];
      for (const c of chunks) {
        curPart.push(c);
        try {
          this._parts.push(new RegExp(curPart.join("|"), rx.flags));
          curPart = [];
        } catch (e) {
        }
      }
      if (partsWrapper) this._parts = this._parts.map(partsWrapper);
    }

    async test(s) {
      for (let part of this._parts) {
        try {
          if (await ("asyncTest" in part ? part.asyncTest(s) : part.test(s))) return true;
        } catch (e) {
          throw new Error(`${e.message}\ntesting RegExp:\n${part}\non string:\n${s}\n${e.stack}`);
        }
      }
      return false;
    }

    async asyncTest(s) {
      return await (this.asyncTest = this.test).call(this, s);
    }
  };

})();
