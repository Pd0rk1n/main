



















class SyntaxChecker {
  constructor() {
    this.lastError = null;
    this.lastFunction = null;
    this.lastScript = "";
    const makeAsync = methodName => {
      const asyncName = `${methodName}Async`;
      this[asyncName] = async function (...args) {
        try {
          eval("''");
          this[asyncName] = this[methodName];
        } catch (e) {
          await include("/nscl/lib/acorn.js");
          const acornImpl = {
            checkAsync: function (script) {
              const func = `() => {${script}}`;
              try {
                acorn.parse(func, {
                  ecmaVersion: 2022,
                  sourceType: "script"
                });
                this.lastFunction = func;
                return true;
              } catch (e) {
                this.lastError = e;
                this.lastFunction = null;
              }
              return false;
            },
            unquoteAsync: function (s, q) {
              if (s.length > 2 && (!q || s.startsWith(q) && s.endsWith(q))) {
                try {
                  const ast = acorn.parseExpressionAt(s, 0, { ecmaVersion: 2022 });
                  switch (ast.type) {
                    case 'Literal':
                      return ast.value;
                    case 'TemplateLiteral':
                      if (ast.expressions.length === 0) {
                        return ast.quasis[0].value.cooked;
                      }
                  }
                } catch (e) { }
              }
              return null;
            }
          }
          for (const propName in acornImpl) {
            this[propName] = acornImpl[propName];
          }
        }
        return this[asyncName](...args);
      }
    }
    makeAsync("check");
    makeAsync("unquote");
  }
  check(script) {
    this.lastScript = script;
    try {
      return !!(this.lastFunction = new Function(script));
    } catch(e) {
       this.lastError = e;
       this.lastFunction = null;
     }
     return false;
  }
  unquote(s, q) {

    if (s.length > 1 && s.startsWith(q) && s.endsWith(q) &&

      s.replace(/\\./g, '').replace(/^(['"])[^\n\r]*?\1/, '') === '') {
      try {
        return eval(s);
      } catch (e) {
      }
    }
    return null;
  }
}
