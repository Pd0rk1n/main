



















var Test = (() => {
  'use strict';
  return {
    passed: 0,
    failed: 0,
    async include(tests) {
      for(let test of tests) {
        let src = test;
        if (!src.startsWith("/")) {
          src = `/test/${src}`;
        }
        if (!src.endsWith("_test.js")) {
          src = `${src}_test.js`;
        }
        log(`Testing ${test}`);
        this.passed = this.failed = 0;
        try {
          await include(src);
        } catch (e) {


          log("Skipping test ", test, e);
          continue;
        }
      }
    },
    async run(test, msg = "", callback = null) {
      let r = false;
      try {
        r = await test();
      } catch(e) {
        error(e);
      }
      this[r ? "passed" : "failed"]++;
      log(`[TEST] ${r ? "PASSED" : "FAILED"} ${msg || test}`);
      if (typeof callback === "function") try {
        await callback(r, test, msg);
      } catch(e) {
        error(e, "[TEST]");
      }
      return r;
    },
    report() {
      let {passed, failed} = this;
      log(`[TESTS] FAILED: ${failed}, PASSED: ${passed}, TOTAL ${passed + failed}.`);
    }
  };

})();
