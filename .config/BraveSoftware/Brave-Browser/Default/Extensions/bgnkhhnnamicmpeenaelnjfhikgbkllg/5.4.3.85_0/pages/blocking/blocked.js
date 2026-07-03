(self["webpackChunkbrowser_extension"] = self["webpackChunkbrowser_extension"] || []).push([["761"], {
20580(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Tl: () => (translate)
});
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

var NODE_TYPES;

(function (NODE_TYPES) {
  NODE_TYPES["PLACEHOLDER"] = "placeholder";
  NODE_TYPES["TEXT"] = "text";
  NODE_TYPES["TAG"] = "tag";
  NODE_TYPES["VOID_TAG"] = "void_tag";
})(NODE_TYPES || (NODE_TYPES = {}));

var isTextNode = function isTextNode(node) {
  return node.type === NODE_TYPES.TEXT;
};
var isTagNode = function isTagNode(node) {
  return node.type === NODE_TYPES.TAG;
};
var isPlaceholderNode = function isPlaceholderNode(node) {
  return node.type === NODE_TYPES.PLACEHOLDER;
};
var isVoidTagNode = function isVoidTagNode(node) {
  return node.type === NODE_TYPES.VOID_TAG;
};
var placeholderNode = function placeholderNode(value) {
  return {
    type: NODE_TYPES.PLACEHOLDER,
    value: value
  };
};
var textNode = function textNode(str) {
  return {
    type: NODE_TYPES.TEXT,
    value: str
  };
};
var tagNode = function tagNode(tagName, children) {
  var value = tagName.trim();
  return {
    type: NODE_TYPES.TAG,
    value: value,
    children: children
  };
};
var voidTagNode = function voidTagNode(tagName) {
  var value = tagName.trim();
  return {
    type: NODE_TYPES.VOID_TAG,
    value: value
  };
};
/**
 * Checks if target is node
 * @param target
 */

var isNode = function isNode(target) {
  if (typeof target === 'string') {
    return false;
  }

  return !!target.type;
};

var STATE;

(function (STATE) {
  /**
   * Parser function switches to the text state when parses simple text,
   * or content between open and close tags
   */
  STATE["TEXT"] = "text";
  /**
   * Parser function switches to the tag state when meets open tag brace ("<"), and switches back,
   * when meets closing tag brace (">")
   */

  STATE["TAG"] = "tag";
  /**
   * Parser function switches to the placeholder state when meets in the text
   * open placeholders brace ("{") and switches back to the text state,
   * when meets close placeholder brace ("}")
   */

  STATE["PLACEHOLDER"] = "placeholder";
})(STATE || (STATE = {}));

var CONTROL_CHARS = {
  TAG_OPEN_BRACE: '<',
  TAG_CLOSE_BRACE: '>',
  CLOSING_TAG_MARK: '/',
  PLACEHOLDER_MARK: '%'
};
/**
 * Checks if text length is enough to create text node
 * If text node created, then if stack is not empty it is pushed into stack,
 * otherwise into result
 * @param context
 */

var createTextNodeIfPossible = function createTextNodeIfPossible(context) {
  var text = context.text;

  if (text.length > 0) {
    var node = textNode(text);

    if (context.stack.length > 0) {
      context.stack.push(node);
    } else {
      context.result.push(node);
    }
  }

  context.text = '';
};
/**
 * Checks if lastFromStack tag has any attributes
 * @param lastFromStack
 */


var hasAttributes = function hasAttributes(lastFromStack) {
  // e.g. "a class" or "a href='#'"
  var tagStrParts = lastFromStack.split(' ');
  return tagStrParts.length > 1;
};
/**
 * Handles text state
 */


var textStateHandler = function textStateHandler(context) {
  var currChar = context.currChar,
      currIdx = context.currIdx; // switches to the tag state

  if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
    context.lastTextStateChangeIdx = currIdx;
    return STATE.TAG;
  } // switches to the placeholder state


  if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
    context.lastTextStateChangeIdx = currIdx;
    return STATE.PLACEHOLDER;
  } // remains in the text state


  context.text += currChar;
  return STATE.TEXT;
};
/**
 * Handles placeholder state
 * @param context
 */


var placeholderStateHandler = function placeholderStateHandler(context) {
  var currChar = context.currChar,
      currIdx = context.currIdx,
      lastTextStateChangeIdx = context.lastTextStateChangeIdx,
      placeholder = context.placeholder,
      stack = context.stack,
      result = context.result,
      str = context.str;

  if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
    // if distance between current index and last state change equal to 1,
    // it means that placeholder mark was escaped by itself e.g. "%%",
    // so we return to the text state
    if (currIdx - lastTextStateChangeIdx === 1) {
      context.text += str.substring(lastTextStateChangeIdx, currIdx);
      return STATE.TEXT;
    }

    createTextNodeIfPossible(context);
    var node = placeholderNode(placeholder); // push node to the appropriate stack

    if (stack.length > 0) {
      stack.push(node);
    } else {
      result.push(node);
    }

    context.placeholder = '';
    return STATE.TEXT;
  }

  context.placeholder += currChar;
  return STATE.PLACEHOLDER;
};
/**
 * Switches current state to the tag state and returns tag state handler
 */


var tagStateHandler = function tagStateHandler(context) {
  var currChar = context.currChar,
      text = context.text,
      stack = context.stack,
      result = context.result,
      lastTextStateChangeIdx = context.lastTextStateChangeIdx,
      currIdx = context.currIdx,
      str = context.str;
  var tag = context.tag; // if found tag end ">"

  if (currChar === CONTROL_CHARS.TAG_CLOSE_BRACE) {
    // if the tag is close tag e.g. </a>
    if (tag.indexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === 0) {
      // remove slash from tag
      tag = tag.substring(1);
      var children = [];

      if (text.length > 0) {
        children.push(textNode(text));
        context.text = '';
      }

      var pairTagFound = false; // looking for the pair to the close tag

      while (!pairTagFound && stack.length > 0) {
        var lastFromStack = stack.pop(); // if tag from stack equal to close tag

        if (lastFromStack === tag) {
          // create tag node
          var node = tagNode(tag, children); // and add it to the appropriate stack

          if (stack.length > 0) {
            stack.push(node);
          } else {
            result.push(node);
          }

          children = [];
          pairTagFound = true;
        } else if (isNode(lastFromStack)) {
          // add nodes between close tag and open tag to the children
          children.unshift(lastFromStack);
        } else {
          if (typeof lastFromStack === 'string' && hasAttributes(lastFromStack)) {
            throw new Error("Tags in string should not have attributes: ".concat(str));
          } else {
            throw new Error("String has unbalanced tags: ".concat(str));
          }
        }

        if (stack.length === 0 && children.length > 0) {
          throw new Error("String has unbalanced tags: ".concat(str));
        }
      }

      context.tag = '';
      return STATE.TEXT;
    } // if the tag is void tag e.g. <img/>


    if (tag.lastIndexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === tag.length - 1) {
      tag = tag.substring(0, tag.length - 1);
      createTextNodeIfPossible(context);

      var _node = voidTagNode(tag); // add node to the appropriate stack


      if (stack.length > 0) {
        stack.push(_node);
      } else {
        result.push(_node);
      }

      context.tag = '';
      return STATE.TEXT;
    }

    createTextNodeIfPossible(context);
    stack.push(tag);
    context.tag = '';
    return STATE.TEXT;
  } // If we meet open tag "<" it means that we wrongly moved into tag state


  if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
    context.text += str.substring(lastTextStateChangeIdx, currIdx);
    context.lastTextStateChangeIdx = currIdx;
    context.tag = '';
    return STATE.TAG;
  }

  context.tag += currChar;
  return STATE.TAG;
};
/**
 * Parses string into AST (abstract syntax tree) and returns it
 * e.g.
 * parse("String to <a>translate</a>") ->
 * ```
 *      [
 *           { type: 'text', value: 'String to ' },
 *           { type: 'tag', value: 'a', children: [{ type: 'text', value: 'translate' }] }
 *      ];
 * ```
 * Empty string is parsed into empty AST (abstract syntax tree): "[]"
 *
 * @param str Message in simplified ICU like syntax without plural support.
 *
 * @returns AST representation of the input string.
 *
 * @throws Error if tags have attributes or string has unbalanced tags or placeholder marker '%' is unclosed.
 */


var parser = function parser() {
  var _STATE_HANDLERS;

  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var context = {
    /**
     * Stack is used to keep and search nested tag nodes
     */
    stack: [],

    /**
     * Result is stack where function allocates nodes
     */
    result: [],

    /**
     * Current char index
     */
    currIdx: 0,

    /**
     * Saves index of the last state change from the text state,
     * used to restore parsed text if we moved into other state wrongly
     */
    lastTextStateChangeIdx: 0,

    /**
     * Accumulated tag value
     */
    tag: '',

    /**
     * Accumulated text value
     */
    text: '',

    /**
     * Accumulated placeholder value
     */
    placeholder: '',

    /**
     * Parsed string
     */
    str: str
  };
  var STATE_HANDLERS = (_STATE_HANDLERS = {}, _defineProperty(_STATE_HANDLERS, STATE.TEXT, textStateHandler), _defineProperty(_STATE_HANDLERS, STATE.PLACEHOLDER, placeholderStateHandler), _defineProperty(_STATE_HANDLERS, STATE.TAG, tagStateHandler), _STATE_HANDLERS); // Start from text state

  var currentState = STATE.TEXT;

  while (context.currIdx < str.length) {
    context.currChar = str[context.currIdx];
    var currentStateHandler = STATE_HANDLERS[currentState];
    currentState = currentStateHandler(context);
    context.currIdx += 1;
  }

  var result = context.result,
      text = context.text,
      stack = context.stack,
      lastTextStateChangeIdx = context.lastTextStateChangeIdx; // Means that placeholder nodes were not closed

  if (currentState === STATE.PLACEHOLDER) {
    throw new Error("Unclosed placeholder marker '%' in string: ".concat(str));
  } // Means that tag node were not closed, so we consider them as text


  if (currentState !== STATE.TEXT) {
    var restText = str.substring(lastTextStateChangeIdx);

    if ((restText + text).length > 0) {
      result.push(textNode(text + restText));
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (text.length > 0) {
      result.push(textNode(text));
    }
  }

  if (stack.length > 0) {
    throw new Error("String has unbalanced tags: ".concat(context.str));
  }

  return result;
};

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Helper functions used by default to assemble strings from tag nodes
 * @param tagName
 * @param children
 */

var createStringElement = function createStringElement(tagName, children) {
  if (children) {
    return "<".concat(tagName, ">").concat(children, "</").concat(tagName, ">");
  }

  return "<".concat(tagName, "/>");
};
/**
 * Creates map with default values for tag converters
 */


var createDefaultValues = function createDefaultValues() {
  return {
    p: function p(children) {
      return createStringElement('p', children);
    },
    b: function b(children) {
      return createStringElement('b', children);
    },
    strong: function strong(children) {
      return createStringElement('strong', children);
    },
    tt: function tt(children) {
      return createStringElement('tt', children);
    },
    s: function s(children) {
      return createStringElement('s', children);
    },
    i: function i(children) {
      return createStringElement('i', children);
    }
  };
};
/**
 * Returns prepared error message text.
 *
 * @param nodeType Node type.
 * @param nodeValue Node value.
 * @param key String key.
 *
 * @returns Error message.
 */


var getErrorMessage = function getErrorMessage(nodeType, nodeValue, key) {
  var errorMessage = "Value '".concat(nodeValue, "' for '").concat(nodeType, "' was not provided");

  if (key) {
    errorMessage += " in string '".concat(key, "'");
  }

  return errorMessage;
};
/**
 * This function accepts an AST (abstract syntax tree) which is a result
 * of the parser function call, and converts tree nodes into array of strings replacing node
 * values with provided values.
 * Values is a map with functions or strings, where each key is related to placeholder value
 * or tag value
 * e.g.
 * string "text <tag>tag text</tag> %placeholder%" is parsed into next AST
 *
 *      [
 *          { type: 'text', value: 'text ' },
 *          {
 *              type: 'tag',
 *              value: 'tag',
 *              children: [{ type: 'text', value: 'tag text' }],
 *          },
 *          { type: 'text', value: ' ' },
 *          { type: 'placeholder', value: 'placeholder' }
 *      ];
 *
 * this AST after format and next values
 *
 *      {
 *          // here used template strings, but it can be react components as well
 *          tag: (chunks) => `<b>${chunks}</b>`,
 *          placeholder: 'placeholder text'
 *      }
 *
 * will return next array
 *
 * [ 'text ', '<b>tag text</b>', ' ', 'placeholder text' ]
 *
 * as you can see, <tag> was replaced by <b>, and placeholder was replaced by placeholder text
 *
 * @param key
 * @param ast - AST (abstract syntax tree)
 * @param values
 */


var format = function format(key) {
  var ast = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var values = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var result = [];

  var tmplValues = _objectSpread(_objectSpread({}, createDefaultValues()), values);

  var i = 0;

  while (i < ast.length) {
    var currentNode = ast[i]; // if current node is text node, there is nothing to change, append value to the result

    if (isTextNode(currentNode)) {
      result.push(currentNode.value);
    } else if (isTagNode(currentNode)) {
      var children = _toConsumableArray(format(key, currentNode.children, tmplValues));

      var value = tmplValues[currentNode.value];

      if (value) {
        // TODO consider using strong typing
        if (typeof value === 'function') {
          result.push(value(children.join('')));
        } else {
          result.push(value);
        }
      } else {
        throw new Error(getErrorMessage(currentNode.type, currentNode.value, key));
      }
    } else if (isVoidTagNode(currentNode)) {
      var _value = tmplValues[currentNode.value]; // TODO consider using strong typing

      if (_value && typeof _value === 'string') {
        result.push(_value);
      } else {
        throw new Error(getErrorMessage(currentNode.type, currentNode.value, key));
      }
    } else if (isPlaceholderNode(currentNode)) {
      var _value2 = tmplValues[currentNode.value]; // TODO consider using strong typing

      if (_value2 && typeof _value2 === 'string') {
        result.push(_value2);
      } else {
        throw new Error(getErrorMessage(currentNode.type, currentNode.value, key));
      }
    }

    i += 1;
  }

  return result;
};
/**
 * Function gets AST (abstract syntax tree) or string and formats messages,
 * replacing values accordingly
 * e.g.
 *      const message = formatter('<a>some text</a>', {
 *          a: (chunks) => `<a href="#">${chunks}</a>`,
 *      });
 *      console.log(message); // ['<a href="#">some text</a>']
 *
 * @param key
 * @param message
 * @param values
 */


var formatter = function formatter(key, message, values) {
  var ast = parser(message);
  var preparedValues = {}; // convert values to strings if not a function

  if (values) {
    Object.keys(values).forEach(function (key) {
      var value = values[key]; // TODO consider using strong typing

      if (typeof value === 'function') {
        preparedValues[key] = value;
      } else {
        preparedValues[key] = String(value);
      }
    });
  }

  return format(key, ast, preparedValues);
};

var _pluralFormsCount;

var AvailableLocales;

(function (AvailableLocales) {
  AvailableLocales["az"] = "az";
  AvailableLocales["bo"] = "bo";
  AvailableLocales["dz"] = "dz";
  AvailableLocales["id"] = "id";
  AvailableLocales["ja"] = "ja";
  AvailableLocales["jv"] = "jv";
  AvailableLocales["ka"] = "ka";
  AvailableLocales["km"] = "km";
  AvailableLocales["kn"] = "kn";
  AvailableLocales["ko"] = "ko";
  AvailableLocales["ms"] = "ms";
  AvailableLocales["th"] = "th";
  AvailableLocales["tr"] = "tr";
  AvailableLocales["vi"] = "vi";
  AvailableLocales["zh"] = "zh";
  AvailableLocales["zh_cn"] = "zh_cn";
  AvailableLocales["zh_tw"] = "zh_tw";
  AvailableLocales["af"] = "af";
  AvailableLocales["bn"] = "bn";
  AvailableLocales["bg"] = "bg";
  AvailableLocales["ca"] = "ca";
  AvailableLocales["da"] = "da";
  AvailableLocales["de"] = "de";
  AvailableLocales["el"] = "el";
  AvailableLocales["en"] = "en";
  AvailableLocales["eo"] = "eo";
  AvailableLocales["es"] = "es";
  AvailableLocales["et"] = "et";
  AvailableLocales["eu"] = "eu";
  AvailableLocales["fa"] = "fa";
  AvailableLocales["fi"] = "fi";
  AvailableLocales["fo"] = "fo";
  AvailableLocales["fur"] = "fur";
  AvailableLocales["fy"] = "fy";
  AvailableLocales["gl"] = "gl";
  AvailableLocales["gu"] = "gu";
  AvailableLocales["ha"] = "ha";
  AvailableLocales["he"] = "he";
  AvailableLocales["hu"] = "hu";
  AvailableLocales["is"] = "is";
  AvailableLocales["it"] = "it";
  AvailableLocales["ku"] = "ku";
  AvailableLocales["lb"] = "lb";
  AvailableLocales["ml"] = "ml";
  AvailableLocales["mn"] = "mn";
  AvailableLocales["mr"] = "mr";
  AvailableLocales["nah"] = "nah";
  AvailableLocales["nb"] = "nb";
  AvailableLocales["ne"] = "ne";
  AvailableLocales["nl"] = "nl";
  AvailableLocales["nn"] = "nn";
  AvailableLocales["no"] = "no";
  AvailableLocales["oc"] = "oc";
  AvailableLocales["om"] = "om";
  AvailableLocales["or"] = "or";
  AvailableLocales["pa"] = "pa";
  AvailableLocales["pap"] = "pap";
  AvailableLocales["ps"] = "ps";
  AvailableLocales["pt"] = "pt";
  AvailableLocales["pt_pt"] = "pt_pt";
  AvailableLocales["pt_br"] = "pt_br";
  AvailableLocales["so"] = "so";
  AvailableLocales["sq"] = "sq";
  AvailableLocales["sv"] = "sv";
  AvailableLocales["sw"] = "sw";
  AvailableLocales["ta"] = "ta";
  AvailableLocales["te"] = "te";
  AvailableLocales["tk"] = "tk";
  AvailableLocales["ur"] = "ur";
  AvailableLocales["zu"] = "zu";
  AvailableLocales["am"] = "am";
  AvailableLocales["bh"] = "bh";
  AvailableLocales["fil"] = "fil";
  AvailableLocales["fr"] = "fr";
  AvailableLocales["gun"] = "gun";
  AvailableLocales["hi"] = "hi";
  AvailableLocales["hy"] = "hy";
  AvailableLocales["ln"] = "ln";
  AvailableLocales["mg"] = "mg";
  AvailableLocales["nso"] = "nso";
  AvailableLocales["xbr"] = "xbr";
  AvailableLocales["ti"] = "ti";
  AvailableLocales["wa"] = "wa";
  AvailableLocales["be"] = "be";
  AvailableLocales["bs"] = "bs";
  AvailableLocales["hr"] = "hr";
  AvailableLocales["ru"] = "ru";
  AvailableLocales["sr"] = "sr";
  AvailableLocales["uk"] = "uk";
  AvailableLocales["cs"] = "cs";
  AvailableLocales["sk"] = "sk";
  AvailableLocales["ga"] = "ga";
  AvailableLocales["lt"] = "lt";
  AvailableLocales["sl"] = "sl";
  AvailableLocales["mk"] = "mk";
  AvailableLocales["mt"] = "mt";
  AvailableLocales["lv"] = "lv";
  AvailableLocales["pl"] = "pl";
  AvailableLocales["cy"] = "cy";
  AvailableLocales["ro"] = "ro";
  AvailableLocales["ar"] = "ar";
  AvailableLocales["sr_latn"] = "sr_latn";
})(AvailableLocales || (AvailableLocales = {}));

var getPluralFormId = function getPluralFormId(locale, number) {
  var _supportedForms;

  if (number === 0) {
    return 0;
  }

  var slavNum = number % 10 === 1 && number % 100 !== 11 ? 1 : number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20) ? 2 : 3;
  var supportedForms = (_supportedForms = {}, _defineProperty(_supportedForms, AvailableLocales.az, 1), _defineProperty(_supportedForms, AvailableLocales.bo, 1), _defineProperty(_supportedForms, AvailableLocales.dz, 1), _defineProperty(_supportedForms, AvailableLocales.id, 1), _defineProperty(_supportedForms, AvailableLocales.ja, 1), _defineProperty(_supportedForms, AvailableLocales.jv, 1), _defineProperty(_supportedForms, AvailableLocales.ka, 1), _defineProperty(_supportedForms, AvailableLocales.km, 1), _defineProperty(_supportedForms, AvailableLocales.kn, 1), _defineProperty(_supportedForms, AvailableLocales.ko, 1), _defineProperty(_supportedForms, AvailableLocales.ms, 1), _defineProperty(_supportedForms, AvailableLocales.th, 1), _defineProperty(_supportedForms, AvailableLocales.tr, 1), _defineProperty(_supportedForms, AvailableLocales.vi, 1), _defineProperty(_supportedForms, AvailableLocales.zh, 1), _defineProperty(_supportedForms, AvailableLocales.zh_tw, 1), _defineProperty(_supportedForms, AvailableLocales.zh_cn, 1), _defineProperty(_supportedForms, AvailableLocales.af, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.bn, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.bg, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ca, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.da, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.de, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.el, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.en, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.eo, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.es, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.et, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.eu, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.fa, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.fi, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.fo, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.fur, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.fy, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.gl, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.gu, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ha, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.he, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.hu, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.is, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.it, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ku, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.lb, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ml, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.mn, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.mr, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.nah, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.nb, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ne, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.nl, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.nn, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.no, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.oc, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.om, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.or, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.pa, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.pap, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ps, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.pt, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.pt_pt, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.pt_br, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.so, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.sq, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.sv, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.sw, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ta, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.te, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.tk, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.ur, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.zu, number === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.am, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.bh, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.fil, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.fr, number === 0 || number >= 2 ? 2 : 1), _defineProperty(_supportedForms, AvailableLocales.gun, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.hi, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.hy, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.ln, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.mg, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.nso, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.xbr, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.ti, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.wa, number === 0 || number === 1 ? 0 : 1), _defineProperty(_supportedForms, AvailableLocales.be, slavNum), _defineProperty(_supportedForms, AvailableLocales.bs, slavNum), _defineProperty(_supportedForms, AvailableLocales.hr, slavNum), _defineProperty(_supportedForms, AvailableLocales.ru, slavNum), _defineProperty(_supportedForms, AvailableLocales.sr, slavNum), _defineProperty(_supportedForms, AvailableLocales.sr_latn, slavNum), _defineProperty(_supportedForms, AvailableLocales.uk, slavNum), _defineProperty(_supportedForms, AvailableLocales.cs, number === 1 ? 1 : number >= 2 && number <= 4 ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.sk, number === 1 ? 1 : number >= 2 && number <= 4 ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.ga, number === 1 ? 1 : number === 2 ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.lt, number % 10 === 1 && number % 100 !== 11 ? 1 : number % 10 >= 2 && (number % 100 < 10 || number % 100 >= 20) ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.sl, number % 100 === 1 ? 1 : number % 100 === 2 ? 2 : number % 100 === 3 || number % 100 === 4 ? 3 : 4), _defineProperty(_supportedForms, AvailableLocales.mk, number % 10 === 1 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.mt, number === 1 ? 1 : number === 0 || number % 100 > 1 && number % 100 < 11 ? 2 : number % 100 > 10 && number % 100 < 20 ? 3 : 4), _defineProperty(_supportedForms, AvailableLocales.lv, number === 0 ? 0 : number % 10 === 1 && number % 100 !== 11 ? 1 : 2), _defineProperty(_supportedForms, AvailableLocales.pl, number === 1 ? 1 : number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 12 || number % 100 > 14) ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.cy, number === 1 ? 0 : number === 2 ? 1 : number === 8 || number === 11 ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.ro, number === 1 ? 1 : number === 1 || number % 100 > 0 && number % 100 < 20 ? 2 : 3), _defineProperty(_supportedForms, AvailableLocales.ar, number === 0 ? 0 : number === 1 ? 1 : number === 2 ? 2 : number % 100 >= 3 && number % 100 <= 10 ? 3 : number % 100 >= 11 && number % 100 <= 99 ? 4 : 5), _supportedForms);
  return supportedForms[locale];
};

var pluralFormsCount = (_pluralFormsCount = {}, _defineProperty(_pluralFormsCount, AvailableLocales.az, 2), _defineProperty(_pluralFormsCount, AvailableLocales.bo, 2), _defineProperty(_pluralFormsCount, AvailableLocales.dz, 2), _defineProperty(_pluralFormsCount, AvailableLocales.id, 2), _defineProperty(_pluralFormsCount, AvailableLocales.ja, 2), _defineProperty(_pluralFormsCount, AvailableLocales.jv, 2), _defineProperty(_pluralFormsCount, AvailableLocales.ka, 2), _defineProperty(_pluralFormsCount, AvailableLocales.km, 2), _defineProperty(_pluralFormsCount, AvailableLocales.kn, 2), _defineProperty(_pluralFormsCount, AvailableLocales.ko, 2), _defineProperty(_pluralFormsCount, AvailableLocales.ms, 2), _defineProperty(_pluralFormsCount, AvailableLocales.th, 2), _defineProperty(_pluralFormsCount, AvailableLocales.tr, 2), _defineProperty(_pluralFormsCount, AvailableLocales.vi, 2), _defineProperty(_pluralFormsCount, AvailableLocales.zh, 2), _defineProperty(_pluralFormsCount, AvailableLocales.zh_cn, 2), _defineProperty(_pluralFormsCount, AvailableLocales.zh_tw, 2), _defineProperty(_pluralFormsCount, AvailableLocales.af, 3), _defineProperty(_pluralFormsCount, AvailableLocales.bn, 3), _defineProperty(_pluralFormsCount, AvailableLocales.bg, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ca, 3), _defineProperty(_pluralFormsCount, AvailableLocales.da, 3), _defineProperty(_pluralFormsCount, AvailableLocales.de, 3), _defineProperty(_pluralFormsCount, AvailableLocales.el, 3), _defineProperty(_pluralFormsCount, AvailableLocales.en, 3), _defineProperty(_pluralFormsCount, AvailableLocales.eo, 3), _defineProperty(_pluralFormsCount, AvailableLocales.es, 3), _defineProperty(_pluralFormsCount, AvailableLocales.et, 3), _defineProperty(_pluralFormsCount, AvailableLocales.eu, 3), _defineProperty(_pluralFormsCount, AvailableLocales.fa, 3), _defineProperty(_pluralFormsCount, AvailableLocales.fi, 3), _defineProperty(_pluralFormsCount, AvailableLocales.fo, 3), _defineProperty(_pluralFormsCount, AvailableLocales.fur, 3), _defineProperty(_pluralFormsCount, AvailableLocales.fy, 3), _defineProperty(_pluralFormsCount, AvailableLocales.gl, 3), _defineProperty(_pluralFormsCount, AvailableLocales.gu, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ha, 3), _defineProperty(_pluralFormsCount, AvailableLocales.he, 3), _defineProperty(_pluralFormsCount, AvailableLocales.hu, 3), _defineProperty(_pluralFormsCount, AvailableLocales.is, 3), _defineProperty(_pluralFormsCount, AvailableLocales.it, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ku, 3), _defineProperty(_pluralFormsCount, AvailableLocales.lb, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ml, 3), _defineProperty(_pluralFormsCount, AvailableLocales.mn, 3), _defineProperty(_pluralFormsCount, AvailableLocales.mr, 3), _defineProperty(_pluralFormsCount, AvailableLocales.nah, 3), _defineProperty(_pluralFormsCount, AvailableLocales.nb, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ne, 3), _defineProperty(_pluralFormsCount, AvailableLocales.nl, 3), _defineProperty(_pluralFormsCount, AvailableLocales.nn, 3), _defineProperty(_pluralFormsCount, AvailableLocales.no, 3), _defineProperty(_pluralFormsCount, AvailableLocales.oc, 3), _defineProperty(_pluralFormsCount, AvailableLocales.om, 3), _defineProperty(_pluralFormsCount, AvailableLocales.or, 3), _defineProperty(_pluralFormsCount, AvailableLocales.pa, 3), _defineProperty(_pluralFormsCount, AvailableLocales.pap, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ps, 3), _defineProperty(_pluralFormsCount, AvailableLocales.pt, 3), _defineProperty(_pluralFormsCount, AvailableLocales.pt_pt, 3), _defineProperty(_pluralFormsCount, AvailableLocales.pt_br, 3), _defineProperty(_pluralFormsCount, AvailableLocales.so, 3), _defineProperty(_pluralFormsCount, AvailableLocales.sq, 3), _defineProperty(_pluralFormsCount, AvailableLocales.sv, 3), _defineProperty(_pluralFormsCount, AvailableLocales.sw, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ta, 3), _defineProperty(_pluralFormsCount, AvailableLocales.te, 3), _defineProperty(_pluralFormsCount, AvailableLocales.tk, 3), _defineProperty(_pluralFormsCount, AvailableLocales.ur, 3), _defineProperty(_pluralFormsCount, AvailableLocales.zu, 3), _defineProperty(_pluralFormsCount, AvailableLocales.am, 2), _defineProperty(_pluralFormsCount, AvailableLocales.bh, 2), _defineProperty(_pluralFormsCount, AvailableLocales.fil, 2), _defineProperty(_pluralFormsCount, AvailableLocales.fr, 3), _defineProperty(_pluralFormsCount, AvailableLocales.gun, 2), _defineProperty(_pluralFormsCount, AvailableLocales.hi, 2), _defineProperty(_pluralFormsCount, AvailableLocales.hy, 2), _defineProperty(_pluralFormsCount, AvailableLocales.ln, 2), _defineProperty(_pluralFormsCount, AvailableLocales.mg, 2), _defineProperty(_pluralFormsCount, AvailableLocales.nso, 2), _defineProperty(_pluralFormsCount, AvailableLocales.xbr, 2), _defineProperty(_pluralFormsCount, AvailableLocales.ti, 2), _defineProperty(_pluralFormsCount, AvailableLocales.wa, 2), _defineProperty(_pluralFormsCount, AvailableLocales.be, 4), _defineProperty(_pluralFormsCount, AvailableLocales.bs, 4), _defineProperty(_pluralFormsCount, AvailableLocales.hr, 4), _defineProperty(_pluralFormsCount, AvailableLocales.ru, 4), _defineProperty(_pluralFormsCount, AvailableLocales.sr, 4), _defineProperty(_pluralFormsCount, AvailableLocales.sr_latn, 4), _defineProperty(_pluralFormsCount, AvailableLocales.uk, 4), _defineProperty(_pluralFormsCount, AvailableLocales.cs, 4), _defineProperty(_pluralFormsCount, AvailableLocales.sk, 4), _defineProperty(_pluralFormsCount, AvailableLocales.ga, 4), _defineProperty(_pluralFormsCount, AvailableLocales.lt, 4), _defineProperty(_pluralFormsCount, AvailableLocales.sl, 5), _defineProperty(_pluralFormsCount, AvailableLocales.mk, 3), _defineProperty(_pluralFormsCount, AvailableLocales.mt, 5), _defineProperty(_pluralFormsCount, AvailableLocales.lv, 3), _defineProperty(_pluralFormsCount, AvailableLocales.pl, 4), _defineProperty(_pluralFormsCount, AvailableLocales.cy, 4), _defineProperty(_pluralFormsCount, AvailableLocales.ro, 4), _defineProperty(_pluralFormsCount, AvailableLocales.ar, 6), _pluralFormsCount);
var PLURAL_STRING_DELIMITER = '|';
/**
 * Returns string plural forms which are separated by `|`.
 *
 * @param str Message.
 *
 * @returns Array of plural forms.
 */

var getForms = function getForms(str) {
  return str.split(PLURAL_STRING_DELIMITER);
};
/**
 * Checks whether the string has correct number of plural forms.
 *
 * @param str Translated string.
 * @param locale Locale.
 * @param key Optional, base key.
 *
 * @throws Error if the number of plural forms is incorrect.
 */

var checkForms = function checkForms(str, locale, key) {
  var givenCount = getForms(str).length;
  var requiredCount = pluralFormsCount[locale]; // e.g. 'sr-latn' may be passed and it is not supported, 'sr_latn' should be used

  if (typeof requiredCount === 'undefined') {
    throw new Error("Locale is not supported: '".concat(locale, "'"));
  }

  if (givenCount !== requiredCount) {
    var prefix = typeof key !== 'undefined' ? "Invalid plural string \"".concat(key, "\" for locale '").concat(locale, "'") : "Invalid plural string for locale '".concat(locale, "'");
    throw new Error("".concat(prefix, ": required ").concat(requiredCount, ", given ").concat(givenCount, " in string \"").concat(str, "\""));
  }
};
/**
 * Checks whether plural forms are present in base string
 * by checking the presence of the vertical bar `|`.
 *
 * @param baseStr Base string.
 *
 * @returns True if `baseStr` contains `|`, false otherwise.
 */


var hasPluralForm = function hasPluralForm(baseStr) {
  return baseStr.includes(PLURAL_STRING_DELIMITER);
};
/**
 * Checks if plural forms are valid.
 *
 * @param targetStr Translated message with plural forms.
 * @param locale Locale.
 * @param key Optional, message key, used for clearer log message.
 *
 * @returns True if plural forms are valid, false otherwise.
 */

var isPluralFormValid = function isPluralFormValid(targetStr, locale, key) {
  try {
    checkForms(targetStr, locale, key);
    return true;
  } catch (error) {
    return false;
  }
};
/**
 * Returns plural form corresponding to number
 * @param str
 * @param number
 * @param locale - current locale
 * @param key - message key
 */

var getForm = function getForm(str, number, locale, key) {
  checkForms(str, locale, key);
  var forms = getForms(str);
  var currentForm = getPluralFormId(locale, number);
  return forms[currentForm].trim();
};

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var defaultMessageConstructor = function defaultMessageConstructor(formatted) {
  return formatted.join('');
};

var Translator = /*#__PURE__*/function () {
  function Translator(i18n, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageConstructor, values) {
    _classCallCheck(this, Translator);

    this.i18n = i18n;
    this.messageConstructor = messageConstructor || defaultMessageConstructor;
    this.values = values || {};
  }
  /**
   * Retrieves message and translates it, substituting parameters where necessary
   * @param key - translation message key
   * @param params - values used to substitute placeholders and tags
   */


  _createClass(Translator, [{
    key: "getMessage",
    value: function getMessage(key) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var message = this.i18n.getMessage(key);

      if (!message) {
        message = this.i18n.getBaseMessage(key);

        if (!message) {
          throw new Error("Was unable to find message for key: \"".concat(key, "\""));
        }
      }

      var formatted = formatter(key, message, _objectSpread$1(_objectSpread$1({}, this.values), params));
      return this.messageConstructor(formatted);
    }
    /**
     * Retrieves correct plural form and translates it
     * @param key - translation message key
     * @param number - plural form number
     * @param params - values used to substitute placeholders or tags if necessary,
     * if params has "count" property it will be overridden by number (plural form number)
     */

  }, {
    key: "getPlural",
    value: function getPlural(key, number) {
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var message = this.i18n.getMessage(key);
      var language = this.i18n.getUILanguage();

      if (!message) {
        message = this.i18n.getBaseMessage(key);

        if (!message) {
          throw new Error("Was unable to find message for key: \"".concat(key, "\""));
        }

        language = this.i18n.getBaseUILanguage();
      }

      var form = getForm(message, number, language, key);
      var formatted = formatter(key, form, _objectSpread$1(_objectSpread$1(_objectSpread$1({}, this.values), params), {}, {
        count: number
      }));
      return this.messageConstructor(formatted);
    }
  }]);

  return Translator;
}();

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Creates translation function for strings used in the React components
 * We do not import React directly, because translator module can be used
 * in the modules without React too
 *
 * e.g.
 * const translateReact = createReactTranslator(getMessage, React);
 * in locales folder you should have messages.json file
 * ```
 * message:
 *     "popup_auth_agreement_consent": {
 *          "message": "You agree to our <eula>EULA</eula>",
 *      },
 * ```
 *
 * this message can be retrieved and translated into react components next way:
 *
 * const component = translateReact('popup_auth_agreement_consent', {
 *          eula: (chunks) => (
 *              <button
 *                  className="auth__privacy-link"
 *                  onClick={handleEulaClick}
 *              >
 *                  {chunks}
 *              </button>
 *          ),
 *       });
 *
 * Note how functions in the values argument can be used with handlers
 *
 * @param i18n - object with methods which get translated message by key and return current locale
 * @param React - instance of react library
 */

var createReactTranslator = function createReactTranslator(i18n, react, defaults) {
  /**
   * Helps to build nodes without values
   *
   * @param tagName
   * @param children
   */
  var createReactElement = function createReactElement(tagName, children) {
    if (children) {
      return react.createElement(tagName, null, react.Children.toArray(children));
    }

    return react.createElement(tagName, null);
  };
  /**
   * Function creates default values to be used if user didn't provide function values for tags
   */


  var createDefaultValues = function createDefaultValues() {
    // eslint-disable-next-line @typescript-eslint/ban-types
    var externalDefaults = {};

    if (defaults) {
      defaults.tags.forEach(function (t) {
        externalDefaults[t.key] = function (children) {
          return createReactElement(t.createdTag, children);
        };
      });
    }

    if (defaults !== null && defaults !== void 0 && defaults.override) {
      return externalDefaults;
    }

    return _objectSpread$2({
      p: function p(children) {
        return createReactElement('p', children);
      },
      b: function b(children) {
        return createReactElement('b', children);
      },
      strong: function strong(children) {
        return createReactElement('strong', children);
      },
      tt: function tt(children) {
        return createReactElement('tt', children);
      },
      s: function s(children) {
        return createReactElement('s', children);
      },
      i: function i(children) {
        return createReactElement('i', children);
      }
    }, externalDefaults);
  };

  var reactMessageConstructor = function reactMessageConstructor(formatted) {
    var reactChildren = react.Children.toArray(formatted); // if there is only strings in the array we join them

    if (reactChildren.every(function (child) {
      return typeof child === 'string';
    })) {
      return reactChildren.join('');
    }

    return reactChildren;
  };

  var defaultValues = createDefaultValues();
  return new Translator(i18n, reactMessageConstructor, defaultValues);
};

var r,
    f;

function A(n, l) {
  return l = l || [], null == n || "boolean" == typeof n || (Array.isArray(n) ? n.some(function (n) {
    A(n, l);
  }) : l.push(n)), l;
}

r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = 0;

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Creates translation function for strings used in the Preact components
 * We do not import Preact directly, because translator module can be used
 * in the modules without Preact too
 *
 * e.g.
 * const translatePreact = createPreactTranslator(getMessage, Preact);
 * in locales folder you should have messages.json file
 * ```
 * message:
 *     "popup_auth_agreement_consent": {
 *          "message": "You agree to our <eula>EULA</eula>",
 *      },
 * ```
 *
 * this message can be retrieved and translated into preact components next way:
 *
 * const component = translatePreact('popup_auth_agreement_consent', {
 *          eula: (chunks) => (
 *              <button
 *                  className="auth__privacy-link"
 *                  onClick={handleEulaClick}
 *              >
 *                  {chunks}
 *              </button>
 *          ),
 *       });
 *
 * Note how functions in the values argument can be used with handlers
 *
 * @param i18n - object with methods which get translated message by key and return current locale
 * @param Preact - instance of preact library
 */

var createPreactTranslator = function createPreactTranslator(i18n, preact, defaults) {
  /**
   * Helps to build nodes without values
   *
   * @param tagName
   * @param children
   */
  var createPreactElement = function createPreactElement(tagName, children) {
    if (children) {
      return preact.createElement(tagName, null, A(children));
    }

    return preact.createElement(tagName, null);
  };
  /**
   * Function creates default values to be used if user didn't provide function values for tags
   */


  var createDefaultValues = function createDefaultValues() {
    // eslint-disable-next-line @typescript-eslint/ban-types
    var externalDefaults = {};

    if (defaults) {
      defaults.tags.forEach(function (t) {
        externalDefaults[t.key] = function (children) {
          return createPreactElement(t.createdTag, children);
        };
      });
    }

    if (defaults !== null && defaults !== void 0 && defaults.override) {
      return externalDefaults;
    }

    return _objectSpread$3({
      p: function p(children) {
        return createPreactElement('p', children);
      },
      b: function b(children) {
        return createPreactElement('b', children);
      },
      strong: function strong(children) {
        return createPreactElement('strong', children);
      },
      tt: function tt(children) {
        return createPreactElement('tt', children);
      },
      s: function s(children) {
        return createPreactElement('s', children);
      },
      i: function i(children) {
        return createPreactElement('i', children);
      }
    }, externalDefaults);
  };

  var preactMessageConstructor = function preactMessageConstructor(formatted) {
    var preactChildren = A(formatted); // if there is only strings in the array we join them

    if (preactChildren.every(function (child) {
      return typeof child === 'string';
    })) {
      return preactChildren.join('');
    }

    return preactChildren;
  };

  var defaultValues = createDefaultValues();
  return new Translator(i18n, preactMessageConstructor, defaultValues);
};

/**
 * Creates translator instance strings, by default for simple strings
 * @param i18n - function which returns translated message by key
 * @param messageConstructor - function that will collect messages
 * @param values - map with default values for tag converters
 */

var createTranslator = function createTranslator(i18n, messageConstructor, values) {
  return new Translator(i18n, messageConstructor, values);
};

var translate = {
  createTranslator: createTranslator,
  createReactTranslator: createReactTranslator,
  createPreactTranslator: createPreactTranslator
};

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

/**
 * Compares two AST (abstract syntax tree) structures,
 * view tests for examples
 * @param baseAst
 * @param targetAst
 */

var areAstStructuresSame = function areAstStructuresSame(baseAst, targetAst) {
  var textNodeFilter = function textNodeFilter(node) {
    return !isTextNode(node);
  };

  var filteredBaseAst = baseAst.filter(textNodeFilter);
  var filteredTargetAst = targetAst.filter(textNodeFilter); // if AST structures have different lengths, they are not equal

  if (filteredBaseAst.length !== filteredTargetAst.length) {
    return false;
  }

  var _loop = function _loop(i) {
    var baseNode = filteredBaseAst[i];
    var targetNode = filteredTargetAst.find(function (node) {
      return node.type === baseNode.type && node.value === baseNode.value;
    });

    if (!targetNode) {
      return {
        v: false
      };
    }

    if (targetNode.children && baseNode.children) {
      var areChildrenSame = areAstStructuresSame(baseNode.children, targetNode.children);

      if (!areChildrenSame) {
        return {
          v: false
        };
      }
    }
  };

  for (var i = 0; i < filteredBaseAst.length; i += 1) {
    var _ret = _loop(i);

    if (_typeof(_ret) === "object") return _ret.v;
  }

  return true;
};
/**
 * Validates translation against base string by AST (abstract syntax tree) structure.
 *
 * @param baseMessage Base message.
 * @param translatedMessage Translated message.
 * @param locale Locale of `translatedMessage`.
 *
 * @returns True if translated message is valid, false otherwise:
 * - if base message has no plural forms, it will return true if AST structures are same;
 * - if base message has plural forms, first of all
 *   the function checks if the number of plural forms is correct for the `locale`,
 *   and then it validates AST plural forms structures for base and translated messages.
 *
 * @throws Error for invalid tags in base or translated messages,
 * if translated message has invalid plural forms,
 * or if base or translated message has unclosed placeholder markers.
 */


var isTranslationValid = function isTranslationValid(baseMessage, translatedMessage, locale) {
  if (hasPluralForm(baseMessage)) {
    var isPluralFormsValid = isPluralFormValid(translatedMessage, locale);

    if (!isPluralFormsValid) {
      throw new Error('Invalid plural forms');
    }

    var baseForms = getForms(baseMessage);
    var translatedForms = getForms(translatedMessage); // check a zero form structures of base and translated messages

    if (!isTranslationValid(baseForms[0], translatedForms[0], locale)) {
      return false;
    } // and check other forms structures of translated messages against the first form of base message


    for (var i = 1; i < translatedForms.length; i += 1) {
      if (!isTranslationValid(baseForms[1], translatedForms[i], locale)) {
        return false;
      }
    } // if no errors, return true after all checks


    return true;
  }

  var baseMessageAst = parser(baseMessage);
  var translatedMessageAst = parser(translatedMessage);
  return areAstStructuresSame(baseMessageAst, translatedMessageAst);
};
var validator = (/* unused pure expression or super */ null && ({
  isTranslationValid: isTranslationValid,
  isPluralFormValid: isPluralFormValid
}));




},
28467(module, __unused_webpack_exports, __webpack_require__) {
/* module decorator */ module = __webpack_require__.nmd(module);
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("webextension-polyfill", ["module"], factory);
  } else if (true) {
    factory(module);
  } else { var mod }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.12.0 - Tue May 14 2024 18:01:29 */
  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
  /* vim: set sts=2 sw=2 et tw=80: */
  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
    throw new Error("This script should only be loaded in a browser extension.");
  }
  if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";

    // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.
    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "browsingData": {
          "remove": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "removeCache": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCookies": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeDownloads": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFormData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeHistory": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeLocalStorage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePasswords": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePluginData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "settings": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "commands": {
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "contextMenus": {
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "cookies": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAllCookieStores": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "devtools": {
          "inspectedWindow": {
            "eval": {
              "minArgs": 1,
              "maxArgs": 2,
              "singleCallbackArg": false
            }
          },
          "panels": {
            "create": {
              "minArgs": 3,
              "maxArgs": 3,
              "singleCallbackArg": true
            },
            "elements": {
              "createSidebarPane": {
                "minArgs": 1,
                "maxArgs": 1
              }
            }
          }
        },
        "downloads": {
          "cancel": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "download": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "erase": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFileIcon": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "open": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "pause": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFile": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "resume": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "extension": {
          "isAllowedFileSchemeAccess": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "isAllowedIncognitoAccess": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "i18n": {
          "detectLanguage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAcceptLanguages": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "identity": {
          "launchWebAuthFlow": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "idle": {
          "queryState": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "management": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getSelf": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setEnabled": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "uninstallSelf": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "notifications": {
          "clear": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPermissionLevel": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "pageAction": {
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "hide": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "permissions": {
          "contains": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "request": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "sessions": {
          "getDevices": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getRecentlyClosed": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "restore": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goBack": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goForward": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        },
        "topSites": {
          "get": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "webNavigation": {
          "getAllFrames": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFrame": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "webRequest": {
          "handlerBehaviorChanged": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "windows": {
          "create": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getLastFocused": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        }
      };
      if (Object.keys(apiMetadata).length === 0) {
        throw new Error("api-metadata.json has not been included in browser-polyfill");
      }

      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */
      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
          super(items);
          this.createItem = createItem;
        }
        get(key) {
          if (!this.has(key)) {
            this.set(key, this.createItem(key));
          }
          return super.get(key);
        }
      }

      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */
      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };

      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */
      const makeCallback = (promise, metadata) => {
        return (...callbackArgs) => {
          if (extensionAPIs.runtime.lastError) {
            promise.reject(new Error(extensionAPIs.runtime.lastError.message));
          } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
            promise.resolve(callbackArgs[0]);
          } else {
            promise.resolve(callbackArgs);
          }
        };
      };
      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";

      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */
      const wrapAsyncFunction = (name, metadata) => {
        return function asyncFunctionWrapper(target, ...args) {
          if (args.length < metadata.minArgs) {
            throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
          }
          if (args.length > metadata.maxArgs) {
            throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
          }
          return new Promise((resolve, reject) => {
            if (metadata.fallbackToNoCallback) {
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args);

                // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.
                metadata.fallbackToNoCallback = false;
                metadata.noCallback = true;
                resolve();
              }
            } else if (metadata.noCallback) {
              target[name](...args);
              resolve();
            } else {
              target[name](...args, makeCallback({
                resolve,
                reject
              }, metadata));
            }
          });
        };
      };

      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */
      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }
        });
      };
      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */
      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },
          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }
            if (!(prop in target)) {
              return undefined;
            }
            let value = target[prop];
            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.

              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,
                get() {
                  return target[prop];
                },
                set(value) {
                  target[prop] = value;
                }
              });
              return value;
            }
            cache[prop] = value;
            return value;
          },
          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }
            return true;
          },
          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },
          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }
        };

        // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.
        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };

      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */
      const wrapEvent = wrapperMap => ({
        addListener(target, listener, ...args) {
          target.addListener(wrapperMap.get(listener), ...args);
        },
        hasListener(target, listener) {
          return target.hasListener(wrapperMap.get(listener));
        },
        removeListener(target, listener) {
          target.removeListener(wrapperMap.get(listener));
        }
      });
      const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }

        /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */
        return function onRequestFinished(req) {
          const wrappedReq = wrapObject(req, {} /* wrappers */, {
            getContent: {
              minArgs: 0,
              maxArgs: 0
            }
          });
          listener(wrappedReq);
        };
      });
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }

        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */
        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
              didCallSendResponse = true;
              resolve(response);
            };
          });
          let result;
          try {
            result = listener(message, sender, wrappedSendResponse);
          } catch (err) {
            result = Promise.reject(err);
          }
          const isResultThenable = result !== true && isThenable(result);

          // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.
          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          }

          // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).
          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;
              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }
              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          };

          // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.
          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          }

          // Let Chrome know that the listener is replying.
          return true;
        };
      });
      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(new Error(extensionAPIs.runtime.lastError.message));
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
          reject(new Error(reply.message));
        } else {
          resolve(reply);
        }
      };
      const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }
        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }
        return new Promise((resolve, reject) => {
          const wrappedCb = wrappedSendMessageCallback.bind(null, {
            resolve,
            reject
          });
          args.push(wrappedCb);
          apiNamespaceObj.sendMessage(...args);
        });
      };
      const staticWrappers = {
        devtools: {
          network: {
            onRequestFinished: wrapEvent(onRequestFinishedWrappers)
          }
        },
        runtime: {
          onMessage: wrapEvent(onMessageWrappers),
          onMessageExternal: wrapEvent(onMessageWrappers),
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 1,
            maxArgs: 3
          })
        },
        tabs: {
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 2,
            maxArgs: 3
          })
        }
      };
      const settingMetadata = {
        clear: {
          minArgs: 1,
          maxArgs: 1
        },
        get: {
          minArgs: 1,
          maxArgs: 1
        },
        set: {
          minArgs: 1,
          maxArgs: 1
        }
      };
      apiMetadata.privacy = {
        network: {
          "*": settingMetadata
        },
        services: {
          "*": settingMetadata
        },
        websites: {
          "*": settingMetadata
        }
      };
      return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
    };

    // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.
    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = globalThis.browser;
  }
});


},
92742(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";

// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/es.array.includes.js
var es_array_includes = __webpack_require__(45403);
// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/es.array.push.js
var es_array_push = __webpack_require__(75126);
// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/es.error.cause.js
var es_error_cause = __webpack_require__(38796);
// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/web.url-search-params.delete.js
var web_url_search_params_delete = __webpack_require__(70279);
// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/web.url-search-params.has.js
var web_url_search_params_has = __webpack_require__(16786);
// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/web.url-search-params.size.js
var web_url_search_params_size = __webpack_require__(77269);
// EXTERNAL MODULE: ./node_modules/.pnpm/core-js@3.40.0/node_modules/core-js/modules/es.array.reduce.js
var es_array_reduce = __webpack_require__(80852);
;// CONCATENATED MODULE: ./Extension/pages/blocking/blocked/imported-script.js







(function polyfill() {
    const relList = document.createElement("link").relList;
    if (relList && relList.supports && relList.supports("modulepreload")) {
        return;
    }
    for (const link of document.querySelectorAll('link[rel="modulepreload"]')){
        processPreload(link);
    }
    new MutationObserver((mutations)=>{
        for (const mutation of mutations){
            if (mutation.type !== "childList") {
                continue;
            }
            for (const node of mutation.addedNodes){
                if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
            }
        }
    }).observe(document, {
        childList: true,
        subtree: true
    });
    function getFetchOpts(link) {
        const fetchOpts = {};
        if (link.integrity) fetchOpts.integrity = link.integrity;
        if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
        if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
        else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
        else fetchOpts.credentials = "same-origin";
        return fetchOpts;
    }
    function processPreload(link) {
        if (link.ep) return;
        link.ep = true;
        const fetchOpts = getFetchOpts(link);
        fetch(link.href, fetchOpts);
    }
})();
window.APP_NAME = "browser_extension";
window.PAGE_TYPE = "blocked";
class ThemeManager {
    _isThemeSupported(theme) {
        return Object.values(this._THEMES).includes(theme);
    }
    _storeTheme(theme) {
        if (this._isThemeSupported(theme)) {
            try {
                localStorage.setItem(this._STORAGE_KEY, theme);
            } catch  {}
        }
    }
    _setPageTheme(theme) {
        const changed = this._theme !== theme;
        if (theme === this._THEMES.dark || theme === this._THEMES.light) {
            document.documentElement.dataset.theme = theme;
            this._theme = theme;
            if (changed) {
                this._changeCallbacks.forEach((cb)=>cb(theme));
            }
        }
    }
    _detectSystemTheme() {
        const isSystemDarkMode = this._matchMedia.matches;
        const storedTheme = this.getStoredTheme();
        const isStoredDarkTheme = storedTheme === this._THEMES.dark;
        const isAutoTheme = storedTheme === this._THEMES.auto;
        if (isStoredDarkTheme || isAutoTheme && isSystemDarkMode) {
            this._setPageTheme(this._THEMES.dark);
        } else {
            this._setPageTheme(this._THEMES.light);
        }
    }
    getThemes() {
        return this._THEMES;
    }
    listenForDarkMode(event) {
        if (this.getStoredTheme() === this._THEMES.auto) {
            this._setPageTheme(event.matches ? this._THEMES.dark : this._THEMES.light);
        }
    }
    onThemeChange(cb) {
        this._changeCallbacks.push(cb);
    }
    // return the theme from storage. possible values for theme are: 'dark', 'light', and 'auto'.
    getStoredTheme() {
        try {
            const theme = localStorage.getItem(this._STORAGE_KEY);
            return this._isThemeSupported(theme) ? theme : this._THEMES.auto;
        } catch  {
            return this._THEMES.auto;
        }
    }
    // the switchTheme method switches the current theme to the given one. possible `theme` values are: 'dark', 'light' and 'auto'.
    switchTheme(theme) {
        if (this._isThemeSupported(theme)) {
            this._storeTheme(theme);
            if (theme === this._THEMES.auto) {
                this._detectSystemTheme(theme);
            } else {
                this._setPageTheme(theme);
            }
        }
    }
    // returns only dark/light - the current body color, not the selected preset
    getCurrentTheme() {
        if (typeof this._theme === "undefined") {
            throw new Error("call the init method first");
        }
        return this._theme;
    }
    // the init method adds the dark modifier to <html /> if required.
    init() {
        this._detectSystemTheme();
    }
    constructor(){
        this._matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
        this._matchMedia.addEventListener("change", this.listenForDarkMode.bind(this));
        this._STORAGE_KEY = "theme-name";
        this._THEMES = Object.freeze({
            auto: "auto",
            light: "light",
            dark: "dark"
        });
        this._changeCallbacks = [];
        this._theme = void 0;
    }
}
window.themeManager = new ThemeManager();
window.themeManager.init();
window.locales = {
    "ar": {
        "adgAccessBlockedTitle": "تم حظره بواسطة AdGuard",
        "extAccessBlockedDesc": "تم حظر الوصول إلى <strong id='adgAccessBlockedHost'></strong> بواسطة قاعدة الفلترة",
        "filter": "فلتر",
        "rule": "قاعدة",
        "proceedAnyway": "المتابعة على أية حال",
        "copy": "نسخ",
        "close": "إغلاق",
        "backBtn": "الرجوع للخلف",
        "adgAccessBlockedFaqTitle1": "كيفية إلغاء حظر هذا الموقع؟",
        "adgAccessBlockedFaqDesc1": "يمكنك <button type='button' id='adgAccessAllowToWhiteList'>إضافة هذا الموقع إلى القائمة المسموح بها</button>"
    },
    "cs": {
        "adgAccessBlockedTitle": "Přístup blokován AdGuardem",
        "extAccessBlockedDesc": "Přístup k <strong id='adgAccessBlockedHost'></strong> byl zablokován pravidlem filtrování",
        "filter": "Filtr",
        "rule": "Pravidlo",
        "proceedAnyway": "Přesto pokračovat",
        "copy": "Kopírovat",
        "close": "Zavřít",
        "backBtn": "Zpět",
        "adgAccessBlockedFaqTitle1": "Jak odblokovat tuto webovou stránku?",
        "adgAccessBlockedFaqDesc1": "Můžete <button type='button' id='adgAccessAllowToWhiteList'>přidat tuto webovou stránku na seznam povolených</button>"
    },
    "da": {
        "adgAccessBlockedTitle": "Adgang blokeret af AdGuard",
        "extAccessBlockedDesc": "Adgang til <strong id='adgAccessBlockedHost'></strong> blokeret af en filtreringsregel",
        "filter": "Filter",
        "rule": "Regel",
        "proceedAnyway": "Fortsæt alligevel",
        "copy": "Kopiér",
        "close": "Luk",
        "backBtn": "Gå tilbage",
        "adgAccessBlockedFaqTitle1": "Hvordan afblokeres dette websted?",
        "adgAccessBlockedFaqDesc1": "Man kan <button type='button' id='adgAccessAllowToWhiteList'>føje dette websted til hvidlisten</button>"
    },
    "de": {
        "adgAccessBlockedTitle": "Zugriff durch AdGuard blockiert",
        "extAccessBlockedDesc": "Der Zugriff auf <strong id='adgAccessBlockedHost'></strong> wurde durch eine Filterregel blockiert",
        "filter": "Filter",
        "rule": "Regel",
        "proceedAnyway": "Trotzdem fortfahren",
        "copy": "Kopieren",
        "close": "Schließen",
        "backBtn": "Zurück",
        "adgAccessBlockedFaqTitle1": "Wie entsperre ich diese Website?",
        "adgAccessBlockedFaqDesc1": "Sie können <button type='button' id='adgAccessAllowToWhiteList'>diese Website zur Liste der zulässigen Websites hinzufügen</button>"
    },
    "en": {
        "adgAccessBlockedTitle": "Access blocked by AdGuard",
        "extAccessBlockedDesc": "Access to <strong id='adgAccessBlockedHost'></strong> was blocked by a filtering rule",
        "filter": "Filter",
        "rule": "Rule",
        "proceedAnyway": "Proceed anyway",
        "copy": "Copy",
        "close": "Close",
        "backBtn": "Go back",
        "adgAccessBlockedFaqTitle1": "How to unblock this website?",
        "adgAccessBlockedFaqDesc1": "You can <button type='button' id='adgAccessAllowToWhiteList'>add this website to allowlist</button>"
    },
    "es": {
        "adgAccessBlockedTitle": "Acceso bloqueado por AdGuard",
        "extAccessBlockedDesc": "El acceso a <strong id='adgAccessBlockedHost'></strong> fue bloqueado por una regla de filtrado",
        "filter": "Filtro",
        "rule": "Regla",
        "proceedAnyway": "Continuar de todos modos",
        "copy": "Copiar",
        "close": "Cerrar",
        "backBtn": "Regresar",
        "adgAccessBlockedFaqTitle1": "¿Cómo desbloquear este sitio web?",
        "adgAccessBlockedFaqDesc1": "Puedes <button type='button' id='adgAccessAllowToWhiteList'>agregar este sitio web a la lista de permitidos</button>"
    },
    "fa": {
        "adgAccessBlockedTitle": "دسترسی به <strong>مسدود شده</strong> توسط AdGuard",
        "extAccessBlockedDesc": "دسترسی به <strong id='adgAccessBlockedHost'></strong> توسط یک رویه‌های پالایش مسدود شده است",
        "filter": "فیلتر",
        "rule": "رویه",
        "proceedAnyway": "در هر صورت ادامه یابد",
        "copy": "روگرفت",
        "close": "بستن",
        "backBtn": "برگرد",
        "adgAccessBlockedFaqTitle1": "چگونه می‌توان این تارنما را رفع انسداد کرد؟",
        "adgAccessBlockedFaqDesc1": "شما می‌توانید <button type='button' id='adgAccessAllowToWhiteList'>این تارنما را به فهرست سفید اضافه کنید</button>"
    },
    "fi": {
        "adgAccessBlockedTitle": "AdGuard esti pääsyn",
        "extAccessBlockedDesc": "Pääsy <strong id='adgAccessBlockedHost'></strong> estettiin suodatussäännöllä",
        "filter": "Suodatin",
        "rule": "Sääntö",
        "proceedAnyway": "Jatka silti",
        "copy": "Kopioi",
        "close": "Sulje",
        "backBtn": "Palaa takaisin",
        "adgAccessBlockedFaqTitle1": "Miten sallia tämä verkkosivusto?",
        "adgAccessBlockedFaqDesc1": "Voit <button type='button' id='adgAccessAllowToWhiteList'>lisätä tämän verkkosivuston hyväksyntäluetteloon</button>"
    },
    "fr": {
        "adgAccessBlockedTitle": "Accès bloqué par AdGuard",
        "extAccessBlockedDesc": "L'accès à <strong id='adgAccessBlockedHost'></strong> a été bloqué par une règle de filtrage",
        "filter": "Filtre",
        "rule": "Règle",
        "proceedAnyway": "Procéder malgré tout",
        "copy": "Copier",
        "close": "Fermer",
        "backBtn": "Retour",
        "adgAccessBlockedFaqTitle1": "Comment débloquer ce site web ?",
        "adgAccessBlockedFaqDesc1": "Vous pouvez <button type='button' id='adgAccessAllowToWhiteList'>ajouter ce site web à la liste d'autorisation</button>"
    },
    "id": {
        "adgAccessBlockedTitle": "Akses terblokir oleh AdGuard",
        "extAccessBlockedDesc": "Akses ke <strong id='adgAccessBlockedHost'></strong> diblokir oleh aturan pemfilteran",
        "filter": "Pemfilteran",
        "rule": "Aturan",
        "proceedAnyway": "Bagaimana pun juga lanjutkan",
        "copy": "Salin",
        "close": "Tutup",
        "backBtn": "Kembali",
        "adgAccessBlockedFaqTitle1": "Bagaimana cara membuka blokir situs ini?",
        "adgAccessBlockedFaqDesc1": "Anda dapat <button type='button' id='adgAccessAllowToWhiteList'>menambahkan situs web ini ke daftar izinkan</button>"
    },
    "it": {
        "adgAccessBlockedTitle": "Accesso bloccato da AdGuard",
        "extAccessBlockedDesc": "L'accesso a <strong id='adgAccessBlockedHost'></strong> è stato bloccato da una regola di filtraggio",
        "filter": "Filtro",
        "rule": "Regola",
        "proceedAnyway": "Procedi comunque",
        "copy": "Copia",
        "close": "Chiudi",
        "backBtn": "Torna indietro",
        "adgAccessBlockedFaqTitle1": "Come sbloccare questo sito web?",
        "adgAccessBlockedFaqDesc1": "Puoi <button type='button' id='adgAccessAllowToWhiteList'>aggiungere questo sito web alla lista consentita</button>"
    },
    "ja": {
        "adgAccessBlockedTitle": "AdGuard によってアクセスがブロックされています",
        "extAccessBlockedDesc": "フィルタリングルールによって <strong id='adgAccessBlockedHost'></strong> へのアクセスがブロックされました。",
        "filter": "フィルタ",
        "rule": "ルール",
        "proceedAnyway": "そのままリンクを開く",
        "copy": "コピー",
        "close": "閉じる",
        "backBtn": "戻る",
        "adgAccessBlockedFaqTitle1": "このウェブサイトのブロックを解除する方法は？",
        "adgAccessBlockedFaqDesc1": "<button type='button' id='adgAccessAllowToWhiteList'>このウェブサイトをホワイトリストに追加する</button>ことができます。"
    },
    "ko": {
        "adgAccessBlockedTitle": "AdGuard에 의해 차단됨",
        "extAccessBlockedDesc": "<strong id='adgAccessBlockedHost'></strong> 에 대한 액세스가 필터링 규칙에 의해 차단되었습니다.",
        "filter": "필터",
        "rule": "규칙",
        "proceedAnyway": "그래도 계속 진행",
        "copy": "복사",
        "close": "닫기",
        "backBtn": "뒤로 가기",
        "adgAccessBlockedFaqTitle1": "이 웹사이트 차단을 해제하는 방법은 무엇인가요?",
        "adgAccessBlockedFaqDesc1": "<button type='button' id='adgAccessAllowToWhiteList'>이 웹사이트를 허용 목록</button>에 추가할 수 있습니다."
    },
    "lt": {
        "adgAccessBlockedTitle": "Prieiga užblokuota AdGuard",
        "extAccessBlockedDesc": "Prieiga prie <strong id='adgAccessBlockedHost'></strong> buvo užblokuota pagal filtravimo taisyklę",
        "filter": "Filtras",
        "rule": "Taisyklė",
        "proceedAnyway": "Tęsti vis tiek",
        "copy": "Kopijuoti",
        "close": "Uždaryti",
        "backBtn": "Grįžti atgal",
        "adgAccessBlockedFaqTitle1": "Kaip atblokuoti šią svetainę?",
        "adgAccessBlockedFaqDesc1": "Galite <button type='button' id='adgAccessAllowToWhiteList'>pridėti šią svetainę į leidžiamų sąrašą</button>"
    },
    "pl": {
        "adgAccessBlockedTitle": "Dostęp zablokowany przez AdGuard",
        "extAccessBlockedDesc": "Dostęp do <strong id='adgAccessBlockedHost'></strong> został zablokowany przez regułę filtrowania",
        "filter": "Filtr",
        "rule": "Reguła",
        "proceedAnyway": "Mimo wszystko kontynuuj",
        "copy": "Kopiuj",
        "close": "Zamknij",
        "backBtn": "Wróć",
        "adgAccessBlockedFaqTitle1": "Jak odblokować tę stronę?",
        "adgAccessBlockedFaqDesc1": "Możesz <button type='button' id='adgAccessAllowToWhiteList'>dodać tę witrynę do listy dozwolonych</button>"
    },
    "pt-BR": {
        "adgAccessBlockedTitle": "Acesso bloqueado pelo AdGuard",
        "extAccessBlockedDesc": "O acesso a <strong id='adgAccessBlockedHost'></strong> foi bloqueado por uma regra de filtragem",
        "filter": "Filtro",
        "rule": "Regra",
        "proceedAnyway": "Continuar mesmo assim",
        "copy": "Copiar",
        "close": "Fechar",
        "backBtn": "Voltar",
        "adgAccessBlockedFaqTitle1": "Como desbloquear este site?",
        "adgAccessBlockedFaqDesc1": "Você pode <button type='button' id='adgAccessAllowToWhiteList'>adicionar este site à lista de permissões</button>"
    },
    "pt-PT": {
        "adgAccessBlockedTitle": "Acesso bloqueado pelo AdGuard",
        "extAccessBlockedDesc": "O acesso a <strong id='adgAccessBlockedHost'></strong> foi bloqueado por uma regra de filtragem",
        "filter": "Filtro",
        "rule": "Regra",
        "proceedAnyway": "Continuar mesmo assim",
        "copy": "Copiar",
        "close": "Fechar",
        "backBtn": "Voltar",
        "adgAccessBlockedFaqTitle1": "Como desbloquear este sítio Web?",
        "adgAccessBlockedFaqDesc1": "Pode <button type='button' id='adgAccessAllowToWhiteList'>adicionar este sítio Web à lista de permissões</button>"
    },
    "ru": {
        "adgAccessBlockedTitle": "Доступ заблокирован AdGuard",
        "extAccessBlockedDesc": "Доступ к <strong id='adgAccessBlockedHost'></strong> был заблокирован правилом фильтрации",
        "filter": "Фильтр",
        "rule": "Правило",
        "proceedAnyway": "Всё равно перейти",
        "copy": "Скопировать",
        "close": "Закрыть",
        "backBtn": "Назад",
        "adgAccessBlockedFaqTitle1": "Как разблокировать сайт?",
        "adgAccessBlockedFaqDesc1": "Вы можете <button type='button' id='adgAccessAllowToWhiteList'>добавить этот сайт в белый список</button>"
    },
    "sk": {
        "adgAccessBlockedTitle": "Prístup bol zablokovaný aplikáciou AdGuard",
        "extAccessBlockedDesc": "Prístup k <strong id='adgAccessBlockedHost'></strong> bol zablokovaný filtračným pravidlom",
        "filter": "Filter",
        "rule": "Pravidlo",
        "proceedAnyway": "Aj tak pokračovať",
        "copy": "Kopírovať",
        "close": "Zavrieť",
        "backBtn": "Naspäť",
        "adgAccessBlockedFaqTitle1": "Ako odblokovať túto webovú stránku?",
        "adgAccessBlockedFaqDesc1": "Môžete <button type='button' id='adgAccessAllowToWhiteList'>pridať túto webovú stránku do zoznamu povolených</button>"
    },
    "sl": {
        "adgAccessBlockedTitle": "Dostop blokira AdGuard",
        "extAccessBlockedDesc": "Dostop do <strong id='adgAccessBlockedHost'></strong> je bil blokiran s pravilom filtriranja",
        "filter": "Filtriraj",
        "rule": "Pravilo",
        "proceedAnyway": "Vseeno nadaljuj",
        "copy": "Kopiraj",
        "close": "Zapri",
        "backBtn": "Pojdi nazaj",
        "adgAccessBlockedFaqTitle1": "Kako znova omogočiti to spletno stran?",
        "adgAccessBlockedFaqDesc1": "Lahko <button type='button' id='adgAccessAllowToWhiteList'>dodate to spletno stran na dovoljen seznam</button>"
    },
    "sv": {
        "adgAccessBlockedTitle": "Åtkomst blockerad av AdGuard",
        "extAccessBlockedDesc": "Åtkomst till <strong id='adgAccessBlockedHost'></strong> blockerades av en filtreringsregel",
        "filter": "Filter",
        "rule": "Regel",
        "proceedAnyway": "Fortsätt ändå",
        "copy": "Kopiera",
        "close": "Stäng",
        "backBtn": "Gå tillbaka",
        "adgAccessBlockedFaqTitle1": "Hur avblockerar jag den här webbplatsen?",
        "adgAccessBlockedFaqDesc1": "Du kan <button type='button' id='adgAccessAllowToWhiteList'>lägga till den här webbplatsen i tillåtlistan</button>"
    },
    "tr": {
        "adgAccessBlockedTitle": "AdGuard tarafından erişim engellendi",
        "extAccessBlockedDesc": "<strong id='adgAccessBlockedHost'></strong> erişimi bir filtreleme kuralı tarafından engellendi",
        "filter": "Filtre",
        "rule": "Kural",
        "proceedAnyway": "Yine de devam et",
        "copy": "Kopyala",
        "close": "Kapat",
        "backBtn": "Geri dön",
        "adgAccessBlockedFaqTitle1": "Bu sitenin engeli nasıl kaldırılır?",
        "adgAccessBlockedFaqDesc1": "<button type='button' id='adgAccessAllowToWhiteList'>Bu siteyi izin listesine ekleyebilirsiniz</button>"
    },
    "uk": {
        "adgAccessBlockedTitle": "Доступ заблоковано AdGuard",
        "extAccessBlockedDesc": "Доступ до <strong id='adgAccessBlockedHost'></strong> заблоковано правилом фільтрації",
        "filter": "Фільтр",
        "rule": "Правило",
        "proceedAnyway": "Все одно продовжити",
        "copy": "Копіювати",
        "close": "Закрити",
        "backBtn": "Назад",
        "adgAccessBlockedFaqTitle1": "Як розблокувати сайт?",
        "adgAccessBlockedFaqDesc1": "Ви можете <button type='button' id='adgAccessAllowToWhiteList'>додати цей сайт до білого списку</button>"
    },
    "zh-CN": {
        "adgAccessBlockedTitle": "AdGuard 禁止访问",
        "extAccessBlockedDesc": "启用的过滤规则禁止访问 <strong id='adgAccessBlockedHost'></strong>",
        "filter": "过滤器",
        "rule": "规则",
        "proceedAnyway": "继续访问",
        "copy": "复制",
        "close": "关闭",
        "backBtn": "返回",
        "adgAccessBlockedFaqTitle1": "如何解除对此网站的拦截？",
        "adgAccessBlockedFaqDesc1": "您可以<button type='button' id='adgAccessAllowToWhiteList'>将此网站添加到白名单</button>"
    },
    "zh-TW": {
        "adgAccessBlockedTitle": "AdGuard 禁止存取",
        "extAccessBlockedDesc": "啟用的過濾規則禁止存取 <strong id='adgAccessBlockedHost'></strong>",
        "filter": "過濾器",
        "rule": "規則",
        "proceedAnyway": "仍要繼續",
        "copy": "複製",
        "close": "關閉",
        "backBtn": "返回",
        "adgAccessBlockedFaqTitle1": "如何解除對此網站的封鎖？",
        "adgAccessBlockedFaqDesc1": "您可以<button type='button' id='adgAccessAllowToWhiteList'>將此網站新增到允許清單</button>"
    }
};
let config = null;
const getConfig = ()=>{
    if (config) {
        return config;
    }
    config = {
        appName: window.APP_NAME,
        pageType: window.PAGE_TYPE,
        host: window.location.host
    };
    return config;
};
const getLocale = ()=>{
    const debugQueryParams = new URLSearchParams(window.location.search);
    const debugQueryLocale = debugQueryParams.get("_locale");
    if (debugQueryLocale) {
        return debugQueryLocale;
    }
    return navigator.language;
};
const resolveDictionary = ()=>{
    if (!window.locales || typeof window.locales !== "object") {
        console.error("Localization dictionaries not found in window.locales");
        return {};
    }
    const locale = getLocale();
    if (window.locales[locale]) {
        return window.locales[locale];
    }
    const lang = locale.split("-")[0];
    if (window.locales[lang]) {
        return window.locales[lang];
    }
    return window.locales["en"];
};
let dictionary = null;
const getDictionary = ()=>{
    if (dictionary) {
        return dictionary;
    }
    dictionary = resolveDictionary();
    return dictionary;
};
let placeholders = null;
const getPlaceholders = ()=>{
    if (placeholders) {
        return placeholders;
    }
    const config2 = getConfig();
    placeholders = {
        host: config2.host,
        reports_url: `https://link.adtidy.org/forward.html?action=site_report_page&domain=${config2.host}&from=${config2.pageType}&app=${config2.appName}`,
        dns_reports_new_issue_url: `https://link.adtidy.org/forward.html?action=report_issue&from=${config2.pageType}&app=${config2.appName}`,
        support_url: `mailto:support@adguard.com`,
        adg_website_url: `https://link.adtidy.org/forward.html?action=adguard_site&from=${config2.pageType}&app=${config2.appName}`,
        vpn_website_url: `https://link.adtidy.org/forward.html?action=vpn_site&from=${config2.pageType}&app=${config2.appName}`,
        dns_website_url: `https://link.adtidy.org/forward.html?action=dns_site&from=${config2.pageType}&app=${config2.appName}`,
        dns_domain: "adguard-dns.io",
        user_rules_url: `https://link.adtidy.org/forward.html?action=dns_site_user_rules&from=${config2.pageType}&app=${config2.appName}`,
        locations_count: 65,
        users_count: "100",
        vpn_product_name: "AdGuard VPN"
    };
    return placeholders;
};
const translate = (id)=>{
    const dict = getDictionary();
    var _dict_id;
    return (_dict_id = dict[id]) !== null && _dict_id !== void 0 ? _dict_id : id;
};
const replacePlaceholders = (text)=>{
    if (!text) {
        return "";
    }
    const placeholders2 = getPlaceholders();
    return Object.entries(placeholders2).reduce((acc, [key, value])=>{
        return acc.replace(new RegExp(`%${key}%`, "g"), value);
    }, text);
};
const translateNode = (node)=>{
    if (!node || !node.dataset) {
        return;
    }
    const id = node.dataset.id;
    if (!id) {
        return;
    }
    const translated = replacePlaceholders(translate(id));
    if (node.tagName === "INPUT") {
        node.placeholder = translated;
    } else {
        node.innerHTML = translated;
    }
};
const initTranslations = ()=>{
    document.querySelectorAll("[data-id]").forEach(translateNode);
};
initTranslations();
function openModal(modal) {
    modal.classList.add("active");
}
function closeModal(modal) {
    modal.classList.remove("active");
}
function handleModalOpen(element, callback) {
    const modalId = element.dataset.modalId;
    const modal = document.getElementById(modalId);
    element.addEventListener("click", ()=>{
        if (modal) {
            callback();
            openModal(modal);
        }
    });
}
function initModals() {
    const modals = document.querySelectorAll(".js-modal");
    modals.forEach((modal)=>{
        modal.addEventListener("click", (event)=>{
            if (event.target === modal) {
                closeModal(modal);
            }
        });
        const closeButtons = modal.querySelectorAll(".js-modal-close");
        closeButtons.forEach((button)=>{
            button.addEventListener("click", (e)=>{
                closeModal(modal);
            });
        });
    });
}
initModals();
const notify = document.querySelector(".js-notify");
const notifySuccessText = document.querySelector(".js-notify-copy-text");
const notifyFailedText = document.querySelector(".js-notify-fail-text");
let notifyTimeout;
function closeNotify() {
    if (!notify) return;
    notify.classList.remove("active");
    if (notifyTimeout) {
        clearTimeout(notifyTimeout);
    }
}
function openNotify({ copied }) {
    if (!notify) return;
    notify.classList.remove("active");
    requestAnimationFrame(()=>{
        if (notifySuccessText && notifyFailedText) {
            notifySuccessText.style.display = copied ? "block" : "none";
            notifyFailedText.style.display = copied ? "none" : "block";
        }
        notify.classList.add("active");
    });
    if (notifyTimeout) {
        clearTimeout(notifyTimeout);
    }
    notifyTimeout = setTimeout(()=>{
        closeNotify();
    }, 3e3);
}
const notifyCloseButton = document.querySelector(".js-notify-close");
if (notifyCloseButton) {
    notifyCloseButton.addEventListener("click", closeNotify);
}
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(()=>openNotify({
            copied: true
        })).catch(()=>openNotify({
            copied: false
        }));
}
function handleCopy(copyButtons2) {
    copyButtons2.forEach((el)=>{
        const copyField = document.querySelector(`.${el.dataset.copyFieldClassname}`);
        el.addEventListener("click", ()=>{
            const text = copyField ? copyField.textContent : "";
            copyToClipboard(text);
        });
    });
}
const blockedUrlFieldText = document.getElementById("adgAccessBlockedUrl");
const blockingRuleFieldText = document.getElementById("adgAccessBlockingRule");
const openUrlModalButton = document.querySelector(".js-button-url-modal");
const modalUrlField = document.querySelector(".js-modal-url-field");
const openRuleModalButton = document.querySelector(".js-button-rule-modal");
const modalBlockingRuleField = document.querySelector(".js-modal-rule-field");
function handleAccessBlockedModals() {
    if (openUrlModalButton) {
        handleModalOpen(openUrlModalButton, ()=>{
            if (blockedUrlFieldText && blockedUrlFieldText.textContent && modalUrlField) {
                modalUrlField.textContent = blockedUrlFieldText.textContent;
            }
        });
    }
    if (openRuleModalButton) {
        handleModalOpen(openRuleModalButton, ()=>{
            if (blockingRuleFieldText && blockingRuleFieldText.textContent && modalBlockingRuleField) {
                modalBlockingRuleField.textContent = blockingRuleFieldText.textContent;
            }
        });
    }
}
handleAccessBlockedModals();
const copyButtons = document.querySelectorAll(".js-copy-button");
handleCopy(copyButtons);

// EXTERNAL MODULE: ./Extension/src/pages/services/messenger/index.ts
var messenger = __webpack_require__(32706);
// EXTERNAL MODULE: ./Extension/src/common/logger.ts
var logger = __webpack_require__(42228);
// EXTERNAL MODULE: ./Extension/src/pages/helpers.ts
var helpers = __webpack_require__(91788);
// EXTERNAL MODULE: ./Extension/src/common/constants.ts
var constants = __webpack_require__(88819);
;// CONCATENATED MODULE: ./Extension/pages/blocking/helpers.ts
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 




/**
 * Minimal value of `window.history.length` for a blocked page in MV3 —
 * when a new tab is opened (+1) and the blocked page is shown after redirection (+1).
 * That's why it is not usual `1` but `2`.
 */ const MIN_BLOCKED_PAGE_HISTORY_LENGTH_MV3 = 2;
/**
 * Map of AppearanceTheme to BlockingPagesSupportedTheme.
 */ const themeMap = new Map([
    [
        constants/* .AppearanceTheme.System */.i0.System,
        "auto"
    ],
    [
        constants/* .AppearanceTheme.Light */.i0.Light,
        "light"
    ],
    [
        constants/* .AppearanceTheme.Dark */.i0.Dark,
        "dark"
    ]
]);
/**
 * Updates the theme on the blocking page.
 *
 * @param theme Extension theme.
 */ const updateTheme = (theme)=>{
    var _themeMap_get;
    const blockingPageTheme = (_themeMap_get = themeMap.get(theme)) !== null && _themeMap_get !== void 0 ? _themeMap_get : "auto";
    window.themeManager.switchTheme(blockingPageTheme);
};
/**
 * Parses 'window.location.search' value passed as `locationSearch`.
 *
 * @param locationSearch Value of `window.location.search` to parse.
 *
 * @returns Object with parsed search parameters.
 */ const getParams = (locationSearch)=>{
    const urlSearchParams = new URLSearchParams(locationSearch);
    return Object.fromEntries(urlSearchParams.entries());
};
/**
 * Finds element by id on the page.
 *
 * @param elementId Id of the element to find.
 *
 * @returns Found element.
 *
 * @throws Error if element with id `elementId` is not found.
 */ const getElementById = (elementId)=>{
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
    }
    return element;
};
/**
 * Updates the text content of an element with the given ID.
 *
 * @param elementId The ID of the element to update.
 * @param text The text to set in the element.
 */ const updatePlaceholder = (elementId, text)=>{
    const element = getElementById(elementId);
    element.textContent = text;
};
/**
 * Goes back for MV2.
 */ const goBackMv2 = ()=>{
    window.history.back();
};
/**
 * Goes back for MV3.
 */ const goBackMv3 = ()=>{
    if (window.history.length > MIN_BLOCKED_PAGE_HISTORY_LENGTH_MV3) {
        try {
            window.history.go(-MIN_BLOCKED_PAGE_HISTORY_LENGTH_MV3);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.debug(`Error while going back: ${e instanceof Error ? e.message : e}`);
        }
    } else {
        window.close();
    }
};
/**
 * Adds listener to handle "Go back" button click.
 *
 * @param id The ID of the "Go back" button.
 */ const addGoBackButtonListener = (id)=>{
    const backBtn = getElementById(id);
    if (true) {
        backBtn.addEventListener('click', goBackMv3);
    } else {}
};

// EXTERNAL MODULE: ./Extension/src/common/translators/translator.ts
var translator = __webpack_require__(78466);
;// CONCATENATED MODULE: ./Extension/pages/blocking/blocked/loader.ts
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 
const LOADER_ID = 'adg-loader-overlay';
/**
 * Creates a loader overlay element.
 *
 * @returns The created loader element
 */ const createLoader = ()=>{
    // Create main loader container with class 'loader'
    const loader = document.createElement('div');
    loader.id = LOADER_ID;
    loader.className = 'loader';
    loader.style.cursor = 'not-allowed';
    loader.style.zIndex = '9999';
    // The loader will automatically use CSS variables that respond to theme changes
    // Create background div with class 'loader__background'
    const background = document.createElement('div');
    background.className = 'loader__background';
    background.style.position = 'fixed';
    background.style.top = '0';
    background.style.left = '0';
    background.style.width = '100%';
    background.style.height = '100%';
    background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    background.style.display = 'flex';
    background.style.justifyContent = 'center';
    background.style.alignItems = 'center';
    // Create container div with class 'loader__container'
    const container = document.createElement('div');
    container.className = 'loader__container';
    // Use CSS variables for theme-aware colors - make sure it's not transparent
    container.style.backgroundColor = 'var(--default-page-background)';
    container.style.height = '88px';
    container.style.minWidth = '243px';
    container.style.borderRadius = '8px';
    // Ensure container is not transparent
    container.style.opacity = '1';
    // Create content div with class 'loader__content'
    const content = document.createElement('div');
    content.className = 'loader__content';
    content.style.display = 'flex';
    content.style.justifyContent = 'center';
    content.style.alignItems = 'center';
    content.style.padding = '32px';
    const spinner = document.createElement('div');
    spinner.className = 'loader__spinner';
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '1px solid var(--product-primary-50)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTopColor = 'transparent';
    spinner.style.animation = 'adg-spin 1s linear infinite';
    const text = document.createElement('div');
    text.className = 'loader__text';
    text.style.fontSize = '16px';
    text.style.lineHeight = '21px';
    text.style.color = 'var(--default-labels)';
    text.style.paddingLeft = '16px';
    text.textContent = translator/* .translator.getMessage */.N.getMessage('options_loader_applying_changes');
    if (!document.getElementById('adg-loader-keyframes')) {
        const style = document.createElement('style');
        style.id = 'adg-loader-keyframes';
        style.textContent = `
            @keyframes adg-spin {
                to { transform: rotate(360deg); }
            }`;
        document.head.appendChild(style);
    }
    // Assemble the loader structure
    content.appendChild(spinner);
    content.appendChild(text);
    container.appendChild(content);
    background.appendChild(container);
    loader.appendChild(background);
    document.body.appendChild(loader);
    return loader;
};
/**
 * Shows or hides a loader overlay while waiting for a response.
 * This implementation matches the style of the Loader component from
 * src/pages/common/components/Loader/Loader.tsx and respects the current theme.
 *
 * @param show Whether to show the loader.
 */ const toggleLoader = (show)=>{
    // Check if loader already exists
    let loader = document.getElementById(LOADER_ID);
    // If loader should be hidden and it exists, hide it and return
    if (!show && loader) {
        loader.style.display = 'none';
        return;
    }
    // If loader should be shown and it doesn't exist, create it
    if (!loader) {
        loader = createLoader();
    } else {
        // Show existing loader
        loader.style.display = 'block';
    }
};

;// CONCATENATED MODULE: ./Extension/pages/blocking/blocked/page-handler.ts
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 







/**
 * Id of the "Proceed Anyway" button.
 */ const BLOCKED_PROCEED_ANYWAY_BTN_ID = 'adgAccessBlockedProceed';
/**
 * Id of the "Go Back" button.
 */ const BLOCKED_GO_BACK_BTN_ID = 'blockedPageBackBtn';
/**
 * Id of the "Add this site to Allowlist" button.
 */ const ADD_TO_ALLOWLIST_BTN_ID = 'adgAccessAllowToWhiteList';
/**
 * Id of the current host placeholder.
 */ const PLACEHOLDER_HOST_ID = 'adgAccessBlockedHost';
/**
 * Id of the "URL" placeholder.
 */ const PLACEHOLDER_URL_ID = 'adgAccessBlockedUrl';
/**
 * Id of the "Filter" placeholder to display filter name.
 */ const PLACEHOLDER_FILTER_ID = 'adgAccessBlockingFilterName';
/**
 * Id of the "Rule" placeholder.
 */ const PLACEHOLDER_RULE_ID = 'adgAccessBlockingRule';
/**
 * Updates the theme of the page.
 *
 * @param theme The theme to set.
 */ const page_handler_updateTheme = (theme)=>{
    // @ts-ignore
    window.themeManager.switchTheme(theme);
};
/**
 * Updates the placeholders of the page.
 *
 * @param data Data to set in the placeholders.
 * @param data.url URL to set in the placeholder.
 * @param data.filterName Filter name to set in the placeholder.
 * @param data.rule Rule to set in the placeholder.
 */ const updatePlaceholders = ({ url, filterName, rule })=>{
    updatePlaceholder(PLACEHOLDER_HOST_ID, new URL(url).host);
    updatePlaceholder(PLACEHOLDER_URL_ID, url);
    updatePlaceholder(PLACEHOLDER_FILTER_ID, filterName);
    updatePlaceholder(PLACEHOLDER_RULE_ID, rule);
};
/**
 * Adds listener to handle "Proceed Anyway" button click.
 *
 * @param url URL to add to trusted.
 */ const addProceedAnywayListener = async (url)=>{
    const proceedAnywayBtn = getElementById(BLOCKED_PROCEED_ANYWAY_BTN_ID);
    proceedAnywayBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        // Show the loader while waiting for the response in MV3
        toggleLoader(true);
        try {
            await messenger/* .messenger.addUrlToTrusted */.ee.addUrlToTrusted(url);
            // Redirect to the trusted URL after successful response
            window.location.href = url;
        } catch (error) {
            logger/* .logger.info */.v.info('[ext.page-handler]: Error adding URL to trusted:', error);
        }
    });
};
/**
 * Adds listener to handle "Add this site to allowlist" button click.
 *
 * Handles adding a domain (based on `url`) to the allowlist and proceeding to the page by `url`.
 *
 * @param url URL of blocked request.
 */ const addAddToAllowlistListener = async (url)=>{
    const addToAllowlistBtn = getElementById(ADD_TO_ALLOWLIST_BTN_ID);
    addToAllowlistBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        // Show the loader while waiting for the response in MV3
        toggleLoader(true);
        try {
            await messenger/* .messenger.addAllowlistDomainForUrl */.ee.addAllowlistDomainForUrl(url);
            window.location.href = url;
        } catch (error) {
            logger/* .logger.info */.v.info('[ext.page-handler]: Error adding domain to allowlist:', error);
        }
    });
};
/**
 * Runs the initialization of the blocked page handler:
 * - updates theme on the page;
 * - updates placeholders for url, filter name and rule;
 * - adds listener to handle "Proceed Anyway" button click;
 * - adds listener to handle "Go Back" button click (if needed).
 *
 * @param data Data to run the initialization.
 * @param data.response Data to initialize the page.
 * @param data.url URL of blocked page.
 * @param data.filterId Filter id of the rule that blocked the page.
 * @param data.rule Rule that blocked the page.
 */ const runInit = ({ response, url, filterId, rule })=>{
    const { filtersMetadata, theme } = response;
    let filterName = (0,helpers/* .getFilterName */.mJ)(Number(filterId), filtersMetadata);
    if (!filterName) {
        logger/* .logger.debug */.v.debug(`[ext.page-handler]: cannot get filter name for filterId "${filterId}", filterId will be displayed instead.`);
        filterName = filterId;
    }
    page_handler_updateTheme(theme);
    updatePlaceholders({
        url,
        filterName,
        rule
    });
    addProceedAnywayListener(url);
    addAddToAllowlistListener(url);
    addGoBackButtonListener(BLOCKED_GO_BACK_BTN_ID);
};
/**
 * Initializes the blocked by rules page handler.
 */ const initBlockedPageHandler = async ()=>{
    const { url, filterId, rule } = getParams(window.location.search);
    if (!url) {
        logger/* .logger.error */.v.error(`[ext.page-handler]: cannot parse "url" param in page url: ${window.location.href}`);
        return;
    }
    if (!filterId) {
        logger/* .logger.error */.v.error(`[ext.page-handler]: cannot parse "filterId" param in page url: ${window.location.href}`);
        return;
    }
    if (!rule) {
        logger/* .logger.error */.v.error(`[ext.page-handler]: cannot parse "rule" param in page url: ${window.location.href}`);
        return;
    }
    const response = await messenger/* .messenger.initializeBlockingPageScript */.ee.initializeBlockingPageScript();
    if (document.readyState === 'loading') {
        const listener = ()=>{
            runInit({
                response,
                url,
                filterId,
                rule
            });
            document.removeEventListener('DOMContentLoaded', listener);
        };
        document.addEventListener('DOMContentLoaded', listener);
    } else {
        runInit({
            response,
            url,
            filterId,
            rule
        });
    }
};

;// CONCATENATED MODULE: ./Extension/pages/blocking/blocked/index.ts
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 

initBlockedPageHandler();


},
93926(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  s: () => (BrowserStorage)
});
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * Wrapper for StorageArea with dev-friendly interface.
 *
 * @template Data The type of the value stored in the storage.
 */ class BrowserStorage {
    /**
     * Sets data to storage.
     *
     * @param key Storage key.
     * @param value Storage value.
     */ async set(key, value) {
        await this.storage.set({
            [key]: value
        });
    }
    /**
     * Returns data from storage.
     *
     * @param key Storage key.
     *
     * @returns Storage value.
     */ async get(key) {
        return this.storage.get(key).then((data)=>data[key]);
    }
    /**
     * Removes data from storage.
     *
     * @param key Storage key.
     */ async remove(key) {
        await this.storage.remove(key);
    }
    /**
     * Sets multiple key-value pairs in the storage.
     *
     * @param data The key-value pairs to set.
     *
     * @returns True if all operations were successful, false otherwise.
     *
     * @example
     * ```ts
     * const storage = new Storage();
     * await storage.setMultiple({
     *    key1: 'value1',
     *    key2: 'value2',
     * });
     * ```
     */ // TODO: Implement some kind of transaction to ensure atomicity, if possible
    // Note: We only use this method for Firefox if "Never Remember History" is enabled
    async setMultiple(data) {
        try {
            await this.storage.set(data);
            return true;
        } catch (e) {
            return false;
        }
    }
    /**
     * Removes multiple key-value pairs from the storage.
     *
     * @param keys The keys to remove.
     *
     * @returns True if all operations were successful, false otherwise.
     */ async removeMultiple(keys) {
        await this.storage.remove(keys);
        return true;
    }
    /**
     * Get the entire contents of the storage.
     *
     * @returns Promise that resolves with the entire contents of the storage.
     */ async entries() {
        return this.storage.get(null);
    }
    /**
     * Get all keys from the storage.
     *
     * @returns Promise that resolves with all keys from the storage.
     */ async keys() {
        return Object.keys(await this.entries());
    }
    /**
     * Checks if the storage has a key.
     *
     * @param key The key to check.
     *
     * @returns True if the key exists, false otherwise.
     */ async has(key) {
        return this.storage.get(key).then((data)=>key in data);
    }
    /**
     * Clears the storage.
     */ async clear() {
        await this.storage.clear();
    }
    /**
     * Constructs an instance of the BrowserStorage class.
     *
     * @param storage The storage area to use.
     */ constructor(storage){
        _define_property(this, "storage", void 0);
        this.storage = storage;
    }
}


},
36570(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  w: () => (HybridStorage)
});
/* import */ var core_js_modules_es_array_reduce_js__rspack_import_0 = __webpack_require__(80852);
/* import */ var core_js_modules_es_array_reduce_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_reduce_js__rspack_import_0);
/* import */ var nanoid__rspack_import_5 = __webpack_require__(6500);
/* import */ var superjson__rspack_import_1 = __webpack_require__(49812);
/* import */ var idb__rspack_import_2 = __webpack_require__(93051);
/* import */ var _browser_storage__rspack_import_4 = __webpack_require__(93926);
/* import */ var _idb_storage__rspack_import_3 = __webpack_require__(58863);
/* eslint-disable @typescript-eslint/no-explicit-any */ /**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ /**
 * This file implements a hybrid storage solution that abstracts over different storage mechanisms,
 * providing a unified API for storage operations. It automatically chooses between IndexedDB storage and
 * a fallback storage mechanism based on the environment's capabilities.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}






/**
 * Implements a hybrid storage mechanism that can switch between IndexedDB and a fallback storage
 * based on browser capabilities and environment constraints. This class adheres to the StorageInterface,
 * allowing for asynchronous get and set operations.
 *
 * @template Data The type of the value stored in the storage.
 */ class HybridStorage {
    /**
     * Checks if the given storage is an instance of IDBStorage.
     *
     * @param storage The storage instance to check.
     *
     * @returns True if the storage is an instance of IDBStorage, false otherwise.
     */ static isIdbStorage(storage) {
        return storage instanceof _idb_storage__rspack_import_3/* .IDBStorage */.l;
    }
    /**
     * Determines the appropriate storage mechanism to use. If IndexedDB is supported, it uses IDBStorage;
     * otherwise, it falls back to a generic Storage mechanism. This selection is made once and cached
     * for subsequent operations.
     *
     * @returns The storage instance to be used for data operations.
     */ async getStorage() {
        if (this.storage) {
            return this.storage;
        }
        if (await HybridStorage.isIDBSupported()) {
            this.storage = new _idb_storage__rspack_import_3/* .IDBStorage */.l();
        } else {
            this.storage = new _browser_storage__rspack_import_4/* .BrowserStorage */.s(this.fallbackStorage);
        }
        return this.storage;
    }
    /**
     * Checks if the given value is a SuperJSONResult.
     *
     * @param value The value to check.
     *
     * @returns True if the value is a SuperJSONResult, false otherwise.
     */ static isSuperJSONResult(value) {
        return typeof value === 'object' && value !== null && HybridStorage.SUPERJSON_META_KEY in value;
    }
    /**
     * Checks if IndexedDB is supported in the current environment.
     * This is determined by trying to open a test database; if successful, IndexedDB is supported.
     * The result of this check is cached to prevent multiple checks.
     *
     * @returns True if IndexedDB is supported, false otherwise.
     */ static async isIDBSupported() {
        if (HybridStorage.isIDBCapabilityChecked) {
            return HybridStorage.idbSupported;
        }
        if (HybridStorage.idbCapabilityCheckerPromise) {
            return HybridStorage.idbCapabilityCheckerPromise;
        }
        HybridStorage.idbCapabilityCheckerPromise = (async ()=>{
            try {
                const testDbName = `${HybridStorage.TEST_IDB_NAME_PREFIX}${(0,nanoid__rspack_import_5/* .nanoid */.Ak)()}`;
                const testDb = await (0,idb__rspack_import_2/* .openDB */.P2)(testDbName, HybridStorage.TEST_IDB_VERSION);
                testDb.close();
                await (0,idb__rspack_import_2/* .deleteDB */.MR)(testDbName);
                HybridStorage.idbSupported = true;
            } catch (e) {
                HybridStorage.idbSupported = false;
            }
            HybridStorage.isIDBCapabilityChecked = true;
            return HybridStorage.idbSupported;
        })();
        return HybridStorage.idbCapabilityCheckerPromise;
    }
    /**
     * Asynchronously sets a value for a given key in the selected storage mechanism.
     *
     * @param key The key under which the value is stored.
     * @param value The value to be stored.
     *
     * @returns A promise that resolves when the operation is complete.
     */ async set(key, value) {
        const storage = await this.getStorage();
        // If the selected storage mechanism is IndexedDB, we store the value as is,
        // as IndexedDB can store complex objects.
        if (HybridStorage.isIdbStorage(storage)) {
            return storage.set(key, value);
        }
        const serialized = HybridStorage.serialize(value);
        // If the serialized value contains a meta key, it means that the value provided
        // contains special data that are not JSON-serializable and require SuperJSON serialization,
        // like typed arrays, dates, and other complex objects.
        // In this case, we store the SuperJSON-serialized value.
        if (HybridStorage.SUPERJSON_META_KEY in serialized) {
            return storage.set(key, serialized);
        }
        // If the serialized value does not contain a meta key, it means that the value
        // provided was a primitive value or a plain object that is JSON-serializable,
        // and it does not contain any special data that requires SuperJSON serialization.
        // In this case, we store the value as is.
        return storage.set(key, value);
    }
    /**
     * Asynchronously retrieves the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be retrieved.
     *
     * @returns A promise that resolves with the retrieved value, or undefined if the key does not exist.
     */ async get(key) {
        const storage = await this.getStorage();
        // If the selected storage mechanism is IndexedDB, we return the value as is,
        // as IndexedDB can store complex objects.
        if (HybridStorage.isIdbStorage(storage)) {
            return storage.get(key);
        }
        const value = await storage.get(key);
        // Do not attempt to deserialize undefined values.
        if (value === undefined) {
            return undefined;
        }
        // If the value is a SuperJSON-serialized object, we need to deserialize it.
        if (HybridStorage.isSuperJSONResult(value)) {
            return HybridStorage.deserialize(value);
        }
        // Otherwise, we return the value as is.
        return value;
    }
    /**
     * Asynchronously removes the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be removed.
     */ async remove(key) {
        const storage = await this.getStorage();
        await storage.remove(key);
    }
    /**
     * Atomic set operation for multiple key-value pairs.
     * This method are using transaction to ensure atomicity, if any of the operations fail,
     * the entire operation is rolled back. This helps to prevent data corruption / inconsistency.
     *
     * @param data The key-value pairs to set.
     *
     * @returns True if all operations were successful, false otherwise.
     *
     * @example
     * ```ts
     * const storage = new HybridStorage();
     * await storage.setMultiple({
     *    key1: 'value1',
     *    key2: 'value2',
     * });
     * ```
     */ async setMultiple(data) {
        const storage = await this.getStorage();
        if (HybridStorage.isIdbStorage(storage)) {
            var _ref;
            return (_ref = await storage.setMultiple(data)) !== null && _ref !== void 0 ? _ref : false;
        }
        const cloneData = Object.entries(data).reduce((acc, [key, value])=>{
            const serialized = superjson__rspack_import_1/* .SuperJSON.serialize */.mb.serialize(value);
            // If the serialized value contains a meta key, it means that the value provided
            // contains special data that are not JSON-serializable and require SuperJSON serialization,
            // like typed arrays, dates, and other complex objects.
            // In this case, we store the SuperJSON-serialized value.
            if (HybridStorage.SUPERJSON_META_KEY in serialized) {
                acc[key] = serialized;
                return acc;
            }
            // If the serialized value does not contain a meta key, it means that the value
            // provided was a primitive value or a plain object that is JSON-serializable,
            // and it does not contain any special data that requires SuperJSON serialization.
            // In this case, we store the value as is.
            acc[key] = value;
            return acc;
        }, {});
        var _ref1;
        return (_ref1 = await storage.setMultiple(cloneData)) !== null && _ref1 !== void 0 ? _ref1 : false;
    }
    /**
     * Removes multiple key-value pairs from the storage.
     *
     * @param keys The keys to remove.
     *
     * @returns True if all operations were successful, false otherwise.
     */ async removeMultiple(keys) {
        const storage = await this.getStorage();
        var _ref;
        return (_ref = await storage.removeMultiple(keys)) !== null && _ref !== void 0 ? _ref : false;
    }
    /**
     * Get the entire contents of the storage.
     *
     * @returns Promise that resolves with the entire contents of the storage.
     */ async entries() {
        const storage = await this.getStorage();
        if (HybridStorage.isIdbStorage(storage)) {
            return storage.entries();
        }
        const entries = await storage.entries();
        return Object.entries(entries).reduce((acc, [key, value])=>{
            acc[key] = HybridStorage.isSuperJSONResult(value) ? HybridStorage.deserialize(value) : value;
            return acc;
        }, {});
    }
    /**
     * Get all keys from the storage.
     *
     * @returns Promise that resolves with all keys from the storage.
     */ async keys() {
        const storage = await this.getStorage();
        return storage.keys();
    }
    /**
     * Check if a key exists in the storage.
     *
     * @param key The key to check.
     *
     * @returns True if the key exists, false otherwise.
     */ async has(key) {
        const storage = await this.getStorage();
        return storage.has(key);
    }
    /**
     * Clears the storage.
     */ async clear() {
        const storage = await this.getStorage();
        await storage.clear();
    }
    /**
     * Constructs an instance of the HybridStorage class.
     *
     * @param fallbackStorage The storage area to use when IndexedDB is not supported.
     */ constructor(fallbackStorage){
        /**
     * Holds the instance of the selected storage mechanism.
     *
     * @note We use SuperJSON to serialize and deserialize the data when using the fallback storage mechanism,
     * because it only supports storing JSON-serializable data.
     */ _define_property(this, "storage", null);
        /**
     * The storage area to use when IndexedDB is not supported.
     */ _define_property(this, "fallbackStorage", void 0);
        this.fallbackStorage = fallbackStorage;
    }
}
/**
     * A flag indicating whether IndexedDB support has already been checked.
     */ _define_property(HybridStorage, "isIDBCapabilityChecked", false);
/**
     * A promise that resolves to whether IndexedDB is supported in the environment.
     * This promise is used to cache the result of the support check to prevent multiple checks.
     */ _define_property(HybridStorage, "idbCapabilityCheckerPromise", null);
/**
     * A flag that stores the result of the IndexedDB support check.
     * If true, IndexedDB is supported in the environment.
     */ _define_property(HybridStorage, "idbSupported", false);
/**
     * Prefix for the test IndexedDB database name.
     * This test database is used to check if IndexedDB is supported in the current environment.
     */ _define_property(HybridStorage, "TEST_IDB_NAME_PREFIX", 'test_');
/**
     * Version number for the test IndexedDB database.
     */ _define_property(HybridStorage, "TEST_IDB_VERSION", 1);
/**
     * The key used to store metadata in SuperJSON-serialized data.
     */ _define_property(HybridStorage, "SUPERJSON_META_KEY", 'meta');
/**
     * Serializes the given data using SuperJSON.
     *
     * @param data The data to serialize.
     *
     * @returns The serialized data.
     */ _define_property(HybridStorage, "serialize", (data)=>superjson__rspack_import_1/* .SuperJSON.serialize */.mb.serialize(data));
/**
     * Deserializes the given data using SuperJSON.
     *
     * @param data The data to deserialize.
     *
     * @returns The deserialized data.
     */ _define_property(HybridStorage, "deserialize", (data)=>superjson__rspack_import_1/* .SuperJSON.deserialize */.mb.deserialize(data));


},
58863(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  l: () => (IDBStorage)
});
/* import */ var idb__rspack_import_0 = __webpack_require__(93051);
/* import */ var _common_logger__rspack_import_1 = __webpack_require__(42228);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}


/**
 * Provides a storage mechanism using IndexedDB. This class implements the
 * StorageInterface with asynchronous methods to interact with the database.
 *
 * @template Data The type of the value stored in the storage.
 */ class IDBStorage {
    /**
     * Ensures the database is opened before any operations. If the database
     * is not already opened, it opens the database.
     *
     * @returns The opened database instance.
     */ async getOpenedDb() {
        if (this.db) {
            return this.db;
        }
        if (this.dbGetterPromise) {
            return this.dbGetterPromise;
        }
        this.dbGetterPromise = (async ()=>{
            this.db = await (0,idb__rspack_import_0/* .openDB */.P2)(this.name, this.version, {
                upgrade: (db)=>{
                    // Make sure the store exists
                    if (!db.objectStoreNames.contains(this.store)) {
                        db.createObjectStore(this.store);
                    }
                }
            });
            this.dbGetterPromise = null;
            return this.db;
        })();
        return this.dbGetterPromise;
    }
    /**
     * Retrieves a value by key from the store.
     *
     * @param key The key of the value to retrieve.
     *
     * @returns The value associated with the key.
     */ async get(key) {
        const db = await this.getOpenedDb();
        return db.get(this.store, key);
    }
    /**
     * Sets a value in the store with the specified key.
     *
     * @param key The key under which to store the value.
     * @param value The value to store.
     */ async set(key, value) {
        const db = await this.getOpenedDb();
        await db.put(this.store, value, key);
    }
    /**
     * Removes a value from the store by key.
     *
     * @param key The key of the value to remove.
     */ async remove(key) {
        const db = await this.getOpenedDb();
        await db.delete(this.store, key);
    }
    /**
     * Atomic set operation for multiple key-value pairs.
     * This method is using transaction to ensure atomicity, if any of the operations fail,
     * the entire operation is rolled back. This helps to prevent data corruption / inconsistency.
     *
     * @param data The key-value pairs to set.
     *
     * @returns True if all operations were successful, false otherwise.
     *
     * @example
     * ```ts
     * const storage = new IDBStorage();
     * await storage.setMultiple({
     *    key1: 'value1',
     *    key2: 'value2',
     * });
     * ```
     */ async setMultiple(data) {
        const db = await this.getOpenedDb();
        const tx = db.transaction(this.store, 'readwrite');
        try {
            await Promise.all(Object.entries(data).map(([key, value])=>tx.store.put(value, key)));
            await tx.done;
        } catch (e) {
            _common_logger__rspack_import_1/* .logger.error */.v.error('[ext.IDBStorage.setMultiple]: error while setting multiple keys in the storage:', e);
            tx.abort();
            return false;
        }
        return true;
    }
    /**
     * Removes multiple key-value pairs from the storage.
     *
     * @param keys The keys to remove.
     *
     * @returns True if all operations were successful, false otherwise.
     */ async removeMultiple(keys) {
        const db = await this.getOpenedDb();
        const tx = db.transaction(this.store, 'readwrite');
        try {
            await Promise.all(keys.map((key)=>tx.store.delete(key)));
            await tx.done;
        } catch (e) {
            _common_logger__rspack_import_1/* .logger.error */.v.error('[ext.IDBStorage.removeMultiple]: error while removing multiple keys from the storage:', e);
            tx.abort();
            return false;
        }
        return true;
    }
    /**
     * Get the entire contents of the storage.
     *
     * @returns Promise that resolves with the entire contents of the storage.
     */ async entries() {
        const db = await this.getOpenedDb();
        const entries = {};
        const tx = db.transaction(this.store, 'readonly');
        // eslint-disable-next-line no-restricted-syntax
        for await (const cursor of tx.store){
            const key = String(cursor.key);
            entries[key] = cursor.value;
        }
        return entries;
    }
    /**
     * Get all keys in the storage.
     *
     * @returns Promise that resolves with all keys in the storage.
     */ async keys() {
        const db = await this.getOpenedDb();
        const idbKeys = await db.getAllKeys(this.store);
        return idbKeys.map((key)=>key.toString());
    }
    /**
     * Check if a key exists in the storage.
     *
     * @param key The key to check.
     *
     * @returns True if the key exists, false otherwise.
     */ async has(key) {
        const db = await this.getOpenedDb();
        const idbKey = await db.getKey(this.store, key);
        return idbKey !== undefined;
    }
    /**
     * Clears the storage.
     */ async clear() {
        const db = await this.getOpenedDb();
        await db.clear(this.store);
    }
    /**
     * Constructs an instance of the IDBStorage class.
     *
     * @param [name=IDBStorage.DEFAULT_IDB_NAME] The name of the database.
     * @param [version=1] The version of the database.
     * @param [store=IDBStorage.DEFAULT_STORE_NAME] The name of the store within the database.
     */ constructor(name = IDBStorage.DEFAULT_IDB_NAME, version = IDBStorage.DEFAULT_IDB_VERSION, store = IDBStorage.DEFAULT_STORE_NAME){
        /**
     * Holds the instance of the IndexedDB database.
     */ _define_property(this, "db", null);
        /**
     * Promise to get IndexedDB database.
     */ _define_property(this, "dbGetterPromise", null);
        /**
     * The name of the database.
     */ _define_property(this, "name", void 0);
        /**
     * The version of the database. Used for upgrades.
     */ _define_property(this, "version", void 0);
        /**
     * The name of the store within the database.
     */ _define_property(this, "store", void 0);
        this.name = name;
        this.version = version;
        this.store = store;
    }
}
/**
     * The default name of the store within the database.
     */ _define_property(IDBStorage, "DEFAULT_STORE_NAME", 'defaultStore');
/**
     * The default version of the database.
     */ _define_property(IDBStorage, "DEFAULT_IDB_VERSION", 1);
/**
     * The default name of the database.
     */ _define_property(IDBStorage, "DEFAULT_IDB_NAME", 'adguardIDB');


},
81764(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  g: () => (browserStorage)
});
/* import */ var core_js_modules_web_self_js__rspack_import_0 = __webpack_require__(73175);
/* import */ var core_js_modules_web_self_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_self_js__rspack_import_0);
/* import */ var webextension_polyfill__rspack_import_1 = __webpack_require__(28467);
/* import */ var webextension_polyfill__rspack_import_1_default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__rspack_import_1);
/* import */ var _browser_storage__rspack_import_4 = __webpack_require__(93926);
/* import */ var _hybrid_storage__rspack_import_2 = __webpack_require__(36570);
/* import */ var _idb_storage__rspack_import_3 = __webpack_require__(58863);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 




/**
 * Storage instance for accessing `browser.storage.local`.
 */ const browserStorage = new _browser_storage__rspack_import_4/* .BrowserStorage */.s((webextension_polyfill__rspack_import_1_default().storage.local));
/**
 * Storage instance for accessing `IndexedDB` with fallback to `browser.storage.local`.
 */ const hybridStorage = new _hybrid_storage__rspack_import_2/* .HybridStorage */.w((webextension_polyfill__rspack_import_1_default().storage.local));
// Expose storage instances to the global scope for debugging purposes,
// because it's hard to access them from the console in the background
// page or impossible from Application tab -> IndexedDB (showing empty page).
if (false) {}


},
88819(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  $1: () => (NavigationTag),
  Cb: () => (MIN_UPDATE_DISPLAY_DURATION_MS),
  DY: () => (NotifierType),
  Eg: () => (TOTAL_BLOCKED_STATS_GROUP_ID),
  FF: () => (BACKGROUND_TAB_ID),
  Fx: () => (TRUSTED_TAG_KEYWORD),
  GE: () => (FiltersUpdateTime),
  JP: () => (NEWLINE_CHAR_UNIX),
  Nb: () => (WILDCARD_SUBDOMAIN_PREFIX),
  Nq: () => (RECOMMENDED_TAG_ID),
  SG: () => (CHROME_EXTENSIONS_SETTINGS_URL),
  UA: () => (NOTIFICATION_TTL_MS),
  Vv: () => (OPERA_EXTENSIONS_SETTINGS_URL),
  WC: () => (NEWLINE_CHAR_REGEX),
  Xu: () => (CUSTOM_FILTERS_START_ID),
  gD: () => (ExtensionUpdateFSMState),
  gU: () => (SCROLLBAR_WIDTH),
  ge: () => (AntibannerGroupsId),
  i0: () => (AppearanceTheme),
  iR: () => (WASTE_CHARACTERS),
  j8: () => (AntiBannerFiltersId),
  rv: () => (USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED),
  uw: () => (WILDCARD_TLD_SUFFIX),
  xG: () => (TRUSTED_TAG_ID)
});
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ /**
 * Current version of app storage data schema.
 *
 * Schema version is used on extension version update.
 *
 * Note: Do not to be confused with the protocol version of the imported config.
 */ const APP_SCHEMA_VERSION = 14;
const CLIENT_ID_KEY = 'client-id';
const APP_VERSION_KEY = 'app-version';
const SCHEMA_VERSION_KEY = 'schema-version';
const ADGUARD_SETTINGS_KEY = 'adguard-settings';
const PAGE_STATISTIC_KEY = 'page-statistic';
const TRUSTED_DOCUMENTS_CACHE_KEY = 'trusted-documents';
const SB_LRU_CACHE_KEY = 'sb-lru-cache';
const SB_SUSPENDED_CACHE_KEY = 'safebrowsing-suspended-from';
const VIEWED_NOTIFICATIONS_KEY = 'viewed-notifications';
const LAST_NOTIFICATION_TIME_KEY = 'viewed-notification-time';
const HIT_STATISTIC_KEY = 'filters-hit-count';
const ANNOYANCES_CONSENT_KEY = 'annoyances-consent';
const RULES_LIMITS_KEY = 'rules-limits';
const MANUAL_EXTENSION_UPDATE_KEY = 'manual-extension-update';
/**
 * Storage key to prevent double injection of content scripts after extension update.
 * Set before extension reload, checked and cleared after reload.
 */ const CONTENT_SCRIPT_INJECTION_FLAG = 'content-script-injection-flag';
/**
 * Storage key for auto-update state data, used only in MV3.
 */ const AUTO_UPDATE_STATE_KEY_MV3 = 'auto-update-state-mv3';
/**
 * Storage key for auto-update configuration override, used only in MV3 for testing.
 */ const AUTO_UPDATE_CONFIG_KEY_MV3 = 'auto-update-config-mv3';
/**
 * Storage key for filtering log window state (position and size),
 * persisted in browser.storage.local.
 */ const FILTERING_LOG_WINDOW_STATE_KEY = 'filtering-log-window-state';
/**
 * Storage key for telemetry synthetic ID.
 */ const TELEMETRY_SYNTHETIC_ID_KEY = 'telemetry-synthetic-id';
/**
 * Storage key for search page access state.
 */ const SEARCH_PAGE_ACCESS_KEY = 'search-page-access-state';
/**
 * Filter ids used in the code on the background page and filtering log page.
 */ var AntiBannerFiltersId = /*#__PURE__*/ function(AntiBannerFiltersId) {
    AntiBannerFiltersId[AntiBannerFiltersId["StealthModeFilterId"] = -1] = "StealthModeFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["UserFilterId"] = 0] = "UserFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["EnglishFilterId"] = 2] = "EnglishFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["TrackingFilterId"] = 3] = "TrackingFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["SocialFilterId"] = 4] = "SocialFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["SearchAndSelfPromoFilterId"] = 10] = "SearchAndSelfPromoFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AnnoyancesCombinedFilterId"] = 14] = "AnnoyancesCombinedFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["DnsFilterId"] = 15] = "DnsFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["UrlTrackingFilterId"] = 17] = "UrlTrackingFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AnnoyancesCookieNoticesFilterId"] = 18] = "AnnoyancesCookieNoticesFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AnnoyancesPopupsFilterId"] = 19] = "AnnoyancesPopupsFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AnnoyancesMobileAppBannersFilterId"] = 20] = "AnnoyancesMobileAppBannersFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AnnoyancesOtherAnnoyancesFilterId"] = 21] = "AnnoyancesOtherAnnoyancesFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AnnoyancesWidgetsFilterId"] = 22] = "AnnoyancesWidgetsFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["AllowlistFilterId"] = 100] = "AllowlistFilterId";
    AntiBannerFiltersId[AntiBannerFiltersId["MobileAdsFilterId"] = 11] = "MobileAdsFilterId";
    /**
     * @deprecated
     */ AntiBannerFiltersId[AntiBannerFiltersId["QuickFixesFilterId"] = 24] = "QuickFixesFilterId";
    return AntiBannerFiltersId;
}({});
/**
 * AdGuard Annoyances filter has been splitted into 5 other filters:
 * Cookie Notices, Popups, Mobile App Banners, Other Annoyances
 * and Widgets - which we should enabled instead of the Annoyances filter.
 */ const SEPARATE_ANNOYANCE_FILTER_IDS = (/* unused pure expression or super */ null && ([
    18,
    19,
    20,
    21,
    22
]));
/**
 * Group ids used in the code on the multiple entry points.
 */ var AntibannerGroupsId = /*#__PURE__*/ function(AntibannerGroupsId) {
    /**
     * Custom filters group identifier.
     */ AntibannerGroupsId[AntibannerGroupsId["CustomFiltersGroupId"] = 0] = "CustomFiltersGroupId";
    AntibannerGroupsId[AntibannerGroupsId["AdBlockingFiltersGroupId"] = 1] = "AdBlockingFiltersGroupId";
    AntibannerGroupsId[AntibannerGroupsId["PrivacyFiltersGroupId"] = 2] = "PrivacyFiltersGroupId";
    AntibannerGroupsId[AntibannerGroupsId["SocialFiltersGroupId"] = 3] = "SocialFiltersGroupId";
    AntibannerGroupsId[AntibannerGroupsId["AnnoyancesFiltersGroupId"] = 4] = "AnnoyancesFiltersGroupId";
    AntibannerGroupsId[AntibannerGroupsId["SecurityFiltersGroupId"] = 5] = "SecurityFiltersGroupId";
    /**
     * Other filters group identifier.
     */ AntibannerGroupsId[AntibannerGroupsId["OtherFiltersGroupId"] = 6] = "OtherFiltersGroupId";
    /**
     * Language-specific group identifier.
     */ AntibannerGroupsId[AntibannerGroupsId["LanguageFiltersGroupId"] = 7] = "LanguageFiltersGroupId";
    return AntibannerGroupsId;
}({});
/**
 * Recommended filters tag ID.
 *
 * @see https://github.com/AdguardTeam/FiltersRegistry/blob/4528f7ae6b38aec90111a27efb0a7e0958d0cf37/tags/metadata.json#L40
 */ const RECOMMENDED_TAG_ID = 10;
/**
 * Enum with the list of the messages which are sent from the background
 * to notify UI about some events, e.g. some field in settings was updated.
 */ var NotifierType = /*#__PURE__*/ function(NotifierType) {
    NotifierType["RequestFilterUpdated"] = "event.request.filter.updated";
    NotifierType["UserFilterUpdated"] = "event.user.filter.updated";
    NotifierType["CustomFilterAdded"] = "event.custom.filter.added";
    NotifierType["UpdateAllowlistFilterRules"] = "event.update.allowlist.filter.rules";
    NotifierType["SettingUpdated"] = "event.update.setting.value";
    NotifierType["FiltersUpdateCheckReady"] = "event.update.filters.check";
    NotifierType["ExtensionUpdateStateChange"] = "event.update.extension.state.change";
    // Filtering log events.
    NotifierType["TabAdded"] = "log.tab.added";
    NotifierType["TabClose"] = "log.tab.close";
    NotifierType["TabUpdate"] = "log.tab.update";
    NotifierType["TabReset"] = "log.tab.reset";
    // Fullscreen user rules events
    NotifierType["FullscreenUserRulesEditorUpdated"] = "event.user.rules.editor.updated";
    return NotifierType;
}({});
const KEEP_ALIVE_PORT_NAME = 'keep-alive';
var NavigationTag = /*#__PURE__*/ function(NavigationTag) {
    NavigationTag["Regular"] = "regular";
    NavigationTag["Party"] = "party";
    return NavigationTag;
}({});
/**
 * Trusted tag for custom filters
 */ const TRUSTED_TAG_KEYWORD = 'trusted';
/**
 * Trusted tag id for custom filters.
 */ const TRUSTED_TAG_ID = 999;
/**
 * Custom filters group display number
 */ const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99;
/**
 * Custom filters identifiers starts from this number
 */ const CUSTOM_FILTERS_START_ID = 1000;
// Unnecessary characters that will be replaced
const WASTE_CHARACTERS = /[.*+?^${}()|[\]\\]/g;
// Custom scrollbar width
const SCROLLBAR_WIDTH = 12;
const BACKGROUND_TAB_ID = -1;
const TOTAL_BLOCKED_STATS_GROUP_ID = 'total';
/**
 *  Time interval between filter updates.
 */ var FiltersUpdateTime = /*#__PURE__*/ function(FiltersUpdateTime) {
    FiltersUpdateTime[FiltersUpdateTime["Disabled"] = 0] = "Disabled";
    FiltersUpdateTime[FiltersUpdateTime["OneHour"] = 3600000] = "OneHour";
    FiltersUpdateTime[FiltersUpdateTime["SixHours"] = 21600000] = "SixHours";
    FiltersUpdateTime[FiltersUpdateTime["TwelveHours"] = 43200000] = "TwelveHours";
    FiltersUpdateTime[FiltersUpdateTime["TwentyFourHours"] = 86400000] = "TwentyFourHours";
    FiltersUpdateTime[FiltersUpdateTime["FortyEightHours"] = 172800000] = "FortyEightHours";
    FiltersUpdateTime[FiltersUpdateTime["Default"] = -1] = "Default";
    return FiltersUpdateTime;
}({});
const NEWLINE_CHAR_UNIX = '\n';
const NEWLINE_CHAR_REGEX = /\r?\n/;
const OPTIONS_PAGE = 'pages/options.html';
const FILTER_LIST_EXTENSION = '.txt';
/**
 * Special event name for extension initialization, needed for run automatic
 * integration tests.
 */ const EXTENSION_INITIALIZED_EVENT = 'initialized';
/**
 * Chrome's extensions settings page url.
 */ const CHROME_EXTENSIONS_SETTINGS_URL = 'chrome://extensions';
/**
 * Opera's extensions settings page url.
 */ const OPERA_EXTENSIONS_SETTINGS_URL = 'opera://extensions';
/**
 * Time-to-live for notifications in milliseconds.
 */ const NOTIFICATION_TTL_MS = 4000;
/**
 * Minimum Chrome versions required for different toggles which enables usage of User Scripts API.
 *
 * User scripts API with needed 'execute' method is supported from Chrome 135 and higher.
 * But prior to 138 it can be enabled only via Developer mode toggle.
 * And for 138 and higher it can be enabled via User Scripts API toggle in the extensions details.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts
 */ const USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED = {
    /**
     * Minimum Chrome version where Developer mode should be enabled.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_prior_to_138_developer_mode_toggle
     */ DEV_MODE_TOGGLE: 135,
    /**
     * Minimum Chrome version where User Scripts API toggle should be enabled.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_138_and_newer_allow_user_scripts_toggle
     */ ALLOW_USER_SCRIPTS_TOGGLE: 138
};
/**
 * Delay in milliseconds before rechecking the state of the User Scripts API permission.
 *
 * Needed to update the state of the warning when the user grants or revokes the permission.
 */ const USER_SCRIPTS_API_WARNING_RECHECK_DELAY_MS = 2000;
/**
 * States for the extension update finite state machine (FSM).
 */ var ExtensionUpdateFSMState = /*#__PURE__*/ function(ExtensionUpdateFSMState) {
    /**
     * Idle state.
     */ ExtensionUpdateFSMState["Idle"] = "Idle";
    /**
     * Checking for updates state.
     */ ExtensionUpdateFSMState["Checking"] = "Checking";
    /**
     * Available updates state.
     */ ExtensionUpdateFSMState["Available"] = "Available";
    /**
     * Updating state.
     */ ExtensionUpdateFSMState["Updating"] = "Updating";
    /**
     * Not available updates state.
     *
     * It means that the extension is already up-to-date.
     */ ExtensionUpdateFSMState["NotAvailable"] = "NotAvailable";
    /**
     * Update failed state.
     */ ExtensionUpdateFSMState["Failed"] = "Failed";
    /**
     * Update success state.
     */ ExtensionUpdateFSMState["Success"] = "Success";
    return ExtensionUpdateFSMState;
}({});
/**
 * Events for the extension update finite state machine (FSM).
 *
 * Note: there is no event for successful update, because it is not needed —
 * the extension is reloaded automatically after the update
 * and needed notification is shown based on the storage value (set before the update).
 * For more details, see `ExtensionUpdateService.handleExtensionReloadOnUpdate()`.
 */ var ExtensionUpdateFSMEvent = /*#__PURE__*/ (/* unused pure expression or super */ null && (function(ExtensionUpdateFSMEvent) {
    /**
     * Event to initialize the state machine.
     */ ExtensionUpdateFSMEvent["Init"] = "Init";
    /**
     * Event to check for updates.
     */ ExtensionUpdateFSMEvent["Check"] = "Check";
    /**
     * Event for no available updates after the check.
     */ ExtensionUpdateFSMEvent["NoUpdateAvailable"] = "NoUpdateAvailable";
    /**
     * Event for available updates after the check.
     */ ExtensionUpdateFSMEvent["UpdateAvailable"] = "UpdateAvailable";
    /**
     * Event to start the update.
     */ ExtensionUpdateFSMEvent["Update"] = "Update";
    /**
     * Event for failed update.
     */ ExtensionUpdateFSMEvent["UpdateFailed"] = "UpdateFailed";
    return ExtensionUpdateFSMEvent;
}({})));
/**
 * Time duration for showing update state change. Needed for smoother user experience.
 */ const MIN_UPDATE_DISPLAY_DURATION_MS = 2 * 1000;
/**
 * Available appearance themes for the extension UI.
 */ var AppearanceTheme = /*#__PURE__*/ function(AppearanceTheme) {
    AppearanceTheme["System"] = "system";
    AppearanceTheme["Dark"] = "dark";
    AppearanceTheme["Light"] = "light";
    return AppearanceTheme;
}({});
/**
 * Wildcard prefix for subdomains matching.
 */ const WILDCARD_SUBDOMAIN_PREFIX = '*.';
/**
 * Wildcard suffix for top-level domains matching.
 */ const WILDCARD_TLD_SUFFIX = '.*';


},
42228(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  v: () => (logger)
});
/* import */ var core_js_modules_es_array_includes_js__rspack_import_0 = __webpack_require__(45403);
/* import */ var core_js_modules_es_array_includes_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_includes_js__rspack_import_0);
/* import */ var core_js_modules_web_self_js__rspack_import_1 = __webpack_require__(73175);
/* import */ var core_js_modules_web_self_js__rspack_import_1_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_self_js__rspack_import_1);
/* import */ var _adguard_logger__rspack_import_2 = __webpack_require__(44469);
/* import */ var _background_storages_shared_instances__rspack_import_3 = __webpack_require__(81764);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}




/**
 * Extended logger with persistent log level setting.
 * Extends the base Logger class with browser storage integration
 * for saving and retrieving log level preferences.
 */ class ExtendedLogger extends _adguard_logger__rspack_import_2/* .Logger */.Vy {
    /**
     * Checks if the current log level is verbose (Debug or Verbose).
     *
     * This method is useful for determining if detailed logging should
     * be enabled across the application in different modules. Some kind of
     * "single point of truth".
     *
     * @returns True if current log level is Debug or Verbose, false otherwise.
     */ isVerbose() {
        return this.currentLevel === _adguard_logger__rspack_import_2/* .LogLevel.Debug */.$b.Debug || this.currentLevel === _adguard_logger__rspack_import_2/* .LogLevel.Verbose */.$b.Verbose;
    }
    /**
     * Sets log with persistent value, which will be saved, if
     * browser.storage.local is available.
     *
     * @param level Log level to set.
     */ setLogLevel(level) {
        this.currentLevel = level;
        _background_storages_shared_instances__rspack_import_3/* .browserStorage.set */.g.set(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY, level).catch((error)=>{
            // eslint-disable-next-line max-len
            this.error('[ext.ExtendedLogger.setLogLevel]: failed to save log level in browser.storage.local: ', error);
        });
    }
    /**
     * Validates if the provided value is a valid LogLevel.
     *
     * @param value Value to validate.
     *
     * @returns {boolean} True if the value is a valid LogLevel, false otherwise.
     */ static isValidLogLevel(value) {
        return typeof value === 'string' && Object.values(_adguard_logger__rspack_import_2/* .LogLevel */.$b).includes(value);
    }
    /**
     * Initializes the logger by loading the saved log level from browser storage.
     * Falls back to the default log level if retrieval fails or the stored level is invalid.
     *
     * @returns Promise that resolves when initialization is complete.
     */ async init() {
        try {
            const logLevel = await _background_storages_shared_instances__rspack_import_3/* .browserStorage.get */.g.get(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY);
            if (!ExtendedLogger.isValidLogLevel(logLevel)) {
                // Print a warning only if the log level is valuable.
                if (logLevel !== null && logLevel !== undefined) {
                    // eslint-disable-next-line max-len
                    this.warn('[ext.ExtendedLogger.init]: log level from browser.storage.local is not valid. Value: ', logLevel);
                }
                return;
            }
            try {
                this.setLogLevel(logLevel);
            } catch (e) {
                // eslint-disable-next-line max-len
                this.warn('[ext.ExtendedLogger.init]: failed to set log level from browser.storage.local, will set to default level. Error: ', e);
                this.setLogLevel(ExtendedLogger.DEFAULT_LOG_LEVEL);
            }
        } catch (error) {
            // eslint-disable-next-line max-len
            this.warn('[ext.ExtendedLogger.init]: failed to get log level from browser.storage.local: ', error);
        }
    }
    /**
     * Creates a new instance of ExtendedLogger.
     * Initializes the logger with the default log level based on build configuration.
     */ constructor(){
        super();
        this.currentLevel = ExtendedLogger.DEFAULT_LOG_LEVEL;
    }
}
/**
     * Key for storing the current log level in browser storage.
     */ _define_property(ExtendedLogger, "LOG_LEVEL_LOCAL_STORAGE_KEY", 'log-level');
/**
     * Default log level based on the build configuration.
     */ _define_property(ExtendedLogger, "DEFAULT_LOG_LEVEL",  true ? _adguard_logger__rspack_import_2/* .LogLevel.Info */.$b.Info : 0);
const logger = new ExtendedLogger();
// Expose logger to the window object,
// to have possibility to switch log level from the console.
// Example: adguard.logger.setCurrentLevel('trace');
// eslint-disable-next-line no-restricted-globals
Object.assign(self, {
    adguard: {
        ...self.adguard,
        logger
    }
});



},
29086(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Go: () => (MessageType),
  Wd: () => (FULLSCREEN_STATE),
  zk: () => (APP_MESSAGE_HANDLER_NAME)
});
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ /**
 * Important: do not use z.inferOf, because it brings a lot of side effects with
 * many dependencies to the bundle.
 *
 * Also please try, if possible, to not import here external modules
 * other that types.
 */ const APP_MESSAGE_HANDLER_NAME = 'app';
/**
 * Message types used for message passing between extension contexts
 * (popup, filtering log, content scripts, background)
 */ var MessageType = /*#__PURE__*/ function(MessageType) {
    MessageType["CreateEventListener"] = "createEventListener";
    MessageType["RemoveListener"] = "removeListener";
    MessageType["OpenExtensionStore"] = "openExtensionStore";
    MessageType["AddAndEnableFilter"] = "addAndEnableFilter";
    MessageType["ApplySettingsJson"] = "applySettingsJson";
    MessageType["OpenFilteringLog"] = "openFilteringLog";
    MessageType["OpenFullscreenUserRules"] = "openFullscreenUserRules";
    MessageType["UpdateFullscreenUserRulesTheme"] = "updateFullscreenUserRulesTheme";
    MessageType["ResetBlockedAdsCount"] = "resetBlockedAdsCount";
    MessageType["ResetSettings"] = "resetSettings";
    MessageType["GetUserRules"] = "getUserRules";
    MessageType["SaveUserRules"] = "saveUserRules";
    MessageType["GetAllowlistDomains"] = "getAllowlistDomains";
    MessageType["SaveAllowlistDomains"] = "saveAllowlistDomains";
    MessageType["CheckFiltersUpdate"] = "checkFiltersUpdate";
    MessageType["GetCategoriesFilters"] = "getCategoriesFilters";
    MessageType["CheckExtensionUpdateMv3"] = "checkExtensionUpdateMv3";
    MessageType["UpdateExtensionMv3"] = "updateExtensionMv3";
    MessageType["DisableFiltersGroup"] = "disableFiltersGroup";
    MessageType["DisableFilter"] = "disableFilter";
    MessageType["LoadCustomFilterInfo"] = "loadCustomFilterInfo";
    MessageType["SubscribeToCustomFilter"] = "subscribeToCustomFilter";
    MessageType["RemoveAntiBannerFilter"] = "removeAntiBannerFilter";
    MessageType["GetIsAppInitialized"] = "getIsAppInitialized";
    MessageType["GetTabInfoForPopup"] = "getTabInfoForPopup";
    MessageType["ChangeApplicationFilteringPaused"] = "changeApplicationFilteringPaused";
    MessageType["OpenRulesLimitsTab"] = "openRulesLimitsTab";
    MessageType["OpenSettingsTab"] = "openSettingsTab";
    MessageType["OpenAssistant"] = "openAssistant";
    MessageType["OpenAbuseTab"] = "openAbuseTab";
    MessageType["OpenSiteReportTab"] = "openSiteReportTab";
    MessageType["OpenComparePage"] = "openComparePage";
    MessageType["OpenChromeExtensionsSettingsPage"] = "openChromeExtensionsSettingsPage";
    MessageType["OpenExtensionDetailsPage"] = "openExtensionDetailsPage";
    MessageType["ResetUserRulesForPage"] = "resetUserRulesForPage";
    MessageType["RemoveAllowlistDomain"] = "removeAllowlistDomain";
    MessageType["AddAllowlistDomainForTabId"] = "addAllowlistDomainForTabId";
    MessageType["AddAllowlistDomainForUrl"] = "addAllowlistDomainForUrl";
    MessageType["OnOpenFilteringLogPage"] = "onOpenFilteringLogPage";
    MessageType["GetFilteringLogData"] = "getFilteringLogData";
    MessageType["InitializeFrameScript"] = "initializeFrameScript";
    MessageType["InitializeBlockingPageScript"] = "initializeBlockingPageScript";
    MessageType["OnCloseFilteringLogPage"] = "onCloseFilteringLogPage";
    MessageType["GetFilteringInfoByTabId"] = "getFilteringInfoByTabId";
    MessageType["SynchronizeOpenTabs"] = "synchronizeOpenTabs";
    MessageType["ClearEventsByTabId"] = "clearEventsByTabId";
    MessageType["RefreshPage"] = "refreshPage";
    MessageType["AddUserRule"] = "addUserRule";
    MessageType["RemoveUserRule"] = "removeUserRule";
    MessageType["EnableFiltersGroup"] = "enableFiltersGroup";
    MessageType["NotifyListeners"] = "notifyListeners";
    MessageType["AddLongLivedConnection"] = "addLongLivedConnection";
    MessageType["GetOptionsData"] = "getOptionsData";
    MessageType["ChangeUserSettings"] = "changeUserSetting";
    MessageType["CheckRequestFilterReady"] = "checkRequestFilterReady";
    MessageType["OpenThankYouPage"] = "openThankYouPage";
    MessageType["OpenSafebrowsingTrusted"] = "openSafebrowsingTrusted";
    MessageType["GetSelectorsAndScripts"] = "getSelectorsAndScripts";
    MessageType["CheckPageScriptWrapperRequest"] = "checkPageScriptWrapperRequest";
    MessageType["ProcessShouldCollapse"] = "processShouldCollapse";
    MessageType["ProcessShouldCollapseMany"] = "processShouldCollapseMany";
    MessageType["AddFilteringSubscription"] = "addFilterSubscription";
    MessageType["SetNotificationViewed"] = "setNotificationViewed";
    MessageType["SaveCssHitsStats"] = "saveCssHitStats";
    MessageType["GetCookieRules"] = "getCookieRules";
    MessageType["SaveCookieLogEvent"] = "saveCookieRuleEvent";
    MessageType["LoadSettingsJson"] = "loadSettingsJson";
    MessageType["AddUrlToTrusted"] = "addUrlToTrusted";
    MessageType["SetPreserveLogState"] = "setPreserveLogState";
    MessageType["GetUserRulesEditorData"] = "getUserRulesEditorData";
    MessageType["GetEditorStorageContent"] = "getEditorStorageContent";
    MessageType["SetEditorStorageContent"] = "setEditorStorageContent";
    MessageType["SetFilteringLogWindowState"] = "setFilteringLogWindowState";
    MessageType["AppInitialized"] = "appInitialized";
    MessageType["UpdateTotalBlocked"] = "updateTotalBlocked";
    MessageType["ScriptletCloseWindow"] = "scriptletCloseWindow";
    MessageType["ShowRuleLimitsAlert"] = "showRuleLimitsAlert";
    MessageType["ShowAlertPopup"] = "showAlertPopup";
    MessageType["ShowVersionUpdatedPopup"] = "showVersionUpdatedPopup";
    MessageType["UpdateListeners"] = "updateListeners";
    MessageType["SetConsentedFilters"] = "setConsentedFilters";
    MessageType["GetIsConsentedFilter"] = "getIsConsentedFilter";
    MessageType["SendTelemetryCustomEvent"] = "sendTelemetryCustomEvent";
    MessageType["SendTelemetryPageViewEvent"] = "sendTelemetryPageViewEvent";
    MessageType["AddTelemetryOpenedPage"] = "addTelemetryOpenedPage";
    MessageType["RemoveTelemetryOpenedPage"] = "removeTelemetryOpenedPage";
    MessageType["DismissSearchPageAccessNotification"] = "dismissSearchPageAccessNotification";
    MessageType["GetRulesLimitsCountersMv3"] = "getRulesLimitsCountersMv3";
    MessageType["CanEnableStaticFilterMv3"] = "canEnableStaticFilterMv3";
    MessageType["CanEnableStaticGroupMv3"] = "canEnableStaticGroupMv3";
    MessageType["ClearRulesLimitsWarningMv3"] = "clearRulesLimitsWarningMv3";
    MessageType["RestoreFiltersMv3"] = "restoreFiltersMv3";
    MessageType["CurrentLimitsMv3"] = "currentLimitsMv3";
    MessageType["GetExtensionStatusForPopupMV3"] = "getExtensionStatusForPopupMV3";
    MessageType["ImportConfiguration"] = "importConfiguration";
    MessageType["IsPendingForImport"] = "isPendingForImport";
    MessageType["GetPendingImportBlockWebrtc"] = "getPendingImportBlockWebrtc";
    MessageType["ApplyImportConfiguration"] = "applyImportConfiguration";
    MessageType["CancelImportConfiguration"] = "cancelImportConfiguration";
    MessageType["GenerateShareUrl"] = "generateShareUrl";
    return MessageType;
}({});
const FULLSCREEN_STATE = 'fullscreen';


},
8115(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Et: () => (/* reexport safe */ _message_handler__rspack_import_2.Et),
  Go: () => (/* reexport safe */ _constants__rspack_import_0.Go),
  oL: () => (/* reexport safe */ _message_handler__rspack_import_2.oL),
  zk: () => (/* reexport safe */ _constants__rspack_import_0.zk)
});
/* import */ var _constants__rspack_import_0 = __webpack_require__(29086);
/* import */ var _send_message__rspack_import_1 = __webpack_require__(36083);
/* import */ var _message_handler__rspack_import_2 = __webpack_require__(81125);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ // Since exports from './constants' are: the MessageType enum and a lot of types,
// and imports there are types only, so it should not affect bundle size
// eslint-disable-next-line no-restricted-syntax





},
81125(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Et: () => (messageHasTypeField),
  oL: () => (messageHasTypeAndDataFields)
});
/* import */ var core_js_modules_es_error_cause_js__rspack_import_0 = __webpack_require__(38796);
/* import */ var core_js_modules_es_error_cause_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_error_cause_js__rspack_import_0);
/* import */ var webextension_polyfill__rspack_import_1 = __webpack_require__(28467);
/* import */ var webextension_polyfill__rspack_import_1_default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__rspack_import_1);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}



/**
 * Type guard for messages that have a 'type' field with possible {@link MessageType}.
 *
 * @note Added to no bring here huge zod library.
 *
 * @param message Unknown message.
 *
 * @returns True if message has 'type' field with possible {@link MessageType}.
 */ const messageHasTypeField = (message)=>{
    return typeof message === 'object' && message !== null && 'type' in message;
};
/**
 * Type guard for messages that have a 'type' field and 'data' field and looks like {@link Message}.
 *
 * @note Added to no bring here huge zod library.
 *
 * @param message Unknown message.
 *
 * @returns True if message has 'type' and 'data' fields and looks like {@link Message}.
 */ const messageHasTypeAndDataFields = (message)=>{
    return messageHasTypeField(message) && 'data' in message;
};
/**
 * API for handling Messages via {@link browser.runtime.onMessage}
 */ class MessageHandler {
    init() {
        browser.runtime.onMessage.addListener(this.handleMessage);
    }
    /**
     * Add message listener.
     * Listeners limited to 1 per message type to prevent race
     * condition while response processing.
     *
     * TODO: implement listeners priority execution strategy
     *
     * @param type - {@link ValidMessageTypes}
     * @param listener - {@link MessageListener}
     *
     * @throws error, if message listener already added
     */ addListener(type, listener) {
        if (this.listeners.has(type)) {
            throw new Error(`Message handler: ${type} listener has already been registered`);
        }
        // Cast through unknown to help TS understand that the listener is of
        // the correct type. It will check types at compile time.
        this.listeners.set(type, listener);
    }
    /**
     * Removes message listener.
     *
     * @param type - {@link ValidMessageTypes}
     */ removeListener(type) {
        this.listeners.delete(type);
    }
    /**
     * Removes all listeners
     */ removeListeners() {
        this.listeners.clear();
    }
    /**
     * Check if the message is of type {@link Message}.
     *
     * @param message Message of basic type {@link Message} or {@link EngineMessage}.
     *
     * @returns True if the message is of type {@link Message}.
     */ static isValidMessageType(message) {
        return message.handlerName === APP_MESSAGE_HANDLER_NAME && 'type' in message;
    }
    constructor(){
        _define_property(this, "listeners", new Map());
        this.handleMessage = this.handleMessage.bind(this);
    }
}


},
36083(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";
/* import */ var webextension_polyfill__rspack_import_0 = __webpack_require__(28467);
/* import */ var webextension_polyfill__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__rspack_import_0);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 

/**
 * TODO: Consider moving this file to the background folder, because all messages
 * from the UI should be send via methods of Messenger class instead of using
 * directly sendMessage to proper types checking.
 *
 * {@link sendMessage} sends app message via {@link browser.runtime.sendMessage} and
 * gets response from another extension page message handler
 *
 * @param message - partial {@link Message} record without {@link Message.handlerName} field
 *
 * @returns message handler response
 */ async function sendMessage(message) {
    try {
        return await browser.runtime.sendMessage({
            handlerName: APP_MESSAGE_HANDLER_NAME,
            ...message
        });
    } catch (e) {
    // do nothing
    }
}
/**
 * {@link sendTabMessage} sends message to specified tab via {@link browser.tabs.sendMessage} and
 * gets response from it
 *
 * @param tabId - tab id
 * @param message - partial {@link Message} record without {@link Message.handlerName} field
 *
 * @returns tab message handler response
 */ async function sendTabMessage(tabId, message) {
    return browser.tabs.sendMessage(tabId, {
        handlerName: APP_MESSAGE_HANDLER_NAME,
        ...message
    });
}


},
37940(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  R: () => (i18n)
});
/* import */ var core_js_modules_es_error_cause_js__rspack_import_0 = __webpack_require__(38796);
/* import */ var core_js_modules_es_error_cause_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_error_cause_js__rspack_import_0);
/* import */ var webextension_polyfill__rspack_import_1 = __webpack_require__(28467);
/* import */ var webextension_polyfill__rspack_import_1_default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__rspack_import_1);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 

const BASE_LOCALE = 'en';
const baseMessages = __webpack_require__(21987);
const uiLanguage = webextension_polyfill__rspack_import_1_default().i18n.getUILanguage();
/**
 * Retrieves the localized message for the given key.
 *
 * @param key - The key corresponding to the message in the localization files
 *
 * @returns The localized message, or an empty string if the message is the same as the base locale (indicating no
 * translation)
 *
 * @throws {Error} If there is no such key in the messages
 */ const getMessage = (key)=>{
    const receivedMessage = webextension_polyfill__rspack_import_1_default().i18n.getMessage(key);
    if (uiLanguage !== BASE_LOCALE) {
        var _baseMessages_key;
        const baseMessage = (_baseMessages_key = baseMessages[key]) === null || _baseMessages_key === void 0 ? void 0 : _baseMessages_key.message;
        if (!baseMessage) {
            throw new Error(`There is no such key "${key}" in the messages`);
        }
        // The same strings mean that the message is not translated.
        // We return an empty string for @adguard/translator to fall back to the base message and base locale.
        // Without this, browser.i18n.getMessage returns the base locale message and the wrong UI language,
        // and @adguard/translator fails on plural forms validations.
        if (receivedMessage === baseMessage) {
            return '';
        }
    }
    return receivedMessage;
};
const i18n = {
    getMessage,
    /**
     * Retrieves the UI language, truncated to a 2-letter code.
     * This is because react translator supports only 2-letter codes.
     *
     * @returns The 2-letter UI language code
     */ getUILanguage: ()=>{
        return uiLanguage.substring(0, 2);
    },
    getBaseMessage: (key)=>{
        // thus we can test the base messages with keys without translations
        if (false) {}
        return webextension_polyfill__rspack_import_1_default().i18n.getMessage(key);
    },
    getBaseUILanguage: ()=>BASE_LOCALE
};


},
78466(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  N: () => (translator)
});
/* import */ var _adguard_translate__rspack_import_0 = __webpack_require__(20580);
/* import */ var _i18n__rspack_import_1 = __webpack_require__(37940);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 

/**
 * Retrieves localized message by key, formats it and converts into string
 */ const translator = _adguard_translate__rspack_import_0/* .translate.createTranslator */.Tl.createTranslator(_i18n__rspack_import_1/* .i18n */.R);


},
81166(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Ay: () => (TABLET_BREAKPOINT_PX),
  Sk: () => (MOBILE_BREAKPOINT_PX),
  VD: () => (FILE_WRONG_EXTENSION_CAUSE),
  it: () => (TIME_TO_REMOVE_NOTIFICATION_MS),
  kG: () => (MIN_LOADER_SHOWING_TIME_MS),
  ph: () => (MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS)
});
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ const MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS = 1500;
/**
 * Minimal delay for showing loader. Needed in mv3 for smoother user experience.
 */ const MIN_LOADER_SHOWING_TIME_MS = 500;
/**
 * Error cause identifier for when a file has an incorrect extension.
 */ const FILE_WRONG_EXTENSION_CAUSE = 'fileWrongExtension';
/**
 * Timeout for closing the notification, same as in the styles animation.
 */ const TIME_TO_REMOVE_NOTIFICATION_MS = 300;
/**
 * Mobile screen breakpoint in px.
 */ const MOBILE_BREAKPOINT_PX = 640;
/**
 * Tablet screen breakpoint in px.
 */ const TABLET_BREAKPOINT_PX = 1024;


},
39046(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  _: () => (NotificationType)
});
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ /**
 * Notification type.
 */ var NotificationType = /*#__PURE__*/ function(NotificationType) {
    /**
     * Notification type for loading state. The icon should be animated.
     */ NotificationType["Loading"] = "loading";
    /**
     * Notification type for success state.
     */ NotificationType["Success"] = "success";
    /**
     * Notification type for error state.
     */ NotificationType["Error"] = "error";
    return NotificationType;
}({});


},
91788(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Gt: () => (containsIgnoreCase),
  K2: () => (updateFilterDescription),
  UK: () => (isVerticalScroll),
  WI: () => (measureTextWidth),
  i_: () => (handleFileUpload),
  lW: () => (copyToClipboard),
  mJ: () => (getFilterName),
  w5: () => (findChunks),
  wh: () => (passiveEventSupported)
});
/* import */ var core_js_modules_es_error_cause_js__rspack_import_0 = __webpack_require__(38796);
/* import */ var core_js_modules_es_error_cause_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_error_cause_js__rspack_import_0);
/* import */ var core_js_modules_es_array_push_js__rspack_import_1 = __webpack_require__(75126);
/* import */ var core_js_modules_es_array_push_js__rspack_import_1_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_push_js__rspack_import_1);
/* import */ var _common_constants__rspack_import_5 = __webpack_require__(88819);
/* import */ var _common_translators_translator__rspack_import_2 = __webpack_require__(78466);
/* import */ var _common_constants__rspack_import_3 = __webpack_require__(81166);
/* import */ var _common_types__rspack_import_4 = __webpack_require__(39046);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 





const getFilenameExtension = (filename)=>{
    if (!filename) {
        return undefined;
    }
    const parts = filename.split('.');
    if (parts.length < 2) {
        return undefined;
    }
    return parts[parts.length - 1];
};
/**
 * Handles file upload
 *
 * @param file File to upload.
 * @param requiredExtension Required file extension.
 *
 * @returns Promise that resolves with file content as string if file is uploaded successfully,
 * and rejects with error message otherwise.
 */ const handleFileUpload = (file, requiredExtension)=>{
    return new Promise((resolve, reject)=>{
        if (getFilenameExtension(file.name) !== requiredExtension) {
            reject(new Error(_common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_popup_import_settings_wrong_file_ext', {
                extension: requiredExtension
            }), {
                cause: _common_constants__rspack_import_3/* .FILE_WRONG_EXTENSION_CAUSE */.VD
            }));
        }
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (event)=>{
            if (event.target) {
                // @ts-ignore
                resolve(event.target.result);
            }
        };
        reader.onerror = ()=>{
            reject(new Error(_common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_popup_import_error_file_description')));
        };
    });
};
const indexOfIgnoreCase = (str, searchString)=>{
    return str.toLowerCase().indexOf(searchString.toLowerCase());
};
const containsIgnoreCase = (str, searchString)=>{
    return !!(str && searchString && indexOfIgnoreCase(str, searchString) >= 0);
};
const findChunks = (str, searchString, chunks = [])=>{
    const ind = indexOfIgnoreCase(str, searchString);
    if (ind > -1) {
        chunks.push(str.slice(0, ind));
        chunks.push(str.slice(ind, ind + searchString.length));
        const restStr = str.slice(ind + searchString.length);
        if (containsIgnoreCase(restStr, searchString)) {
            findChunks(restStr, searchString, chunks);
        } else {
            chunks.push(restStr);
        }
    }
    return chunks.filter((i)=>!!i);
};
const passiveEventSupported = (()=>{
    let passiveSupported = null;
    return ()=>{
        // memoize support to avoid adding multiple test events
        if (typeof passiveSupported === 'boolean') {
            return passiveSupported;
        }
        let supported = false;
        try {
            const options = {
                get passive () {
                    supported = true;
                    return false;
                }
            };
            // @ts-ignore
            window.addEventListener('test', null, options);
            // @ts-ignore
            window.removeEventListener('test', null, options);
        } catch (err) {
            supported = false;
        }
        passiveSupported = supported;
        return passiveSupported;
    };
})();
const copyToClipboard = (text)=>{
    const textarea = document.createElement('textarea');
    textarea.innerText = text;
    // @ts-ignore
    textarea.style = `
        position: absolute;
        display: hidden;
        width: 0;
        height: 0;
    `;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
};
const measureTextWidth = (text)=>{
    const el = document.createElement('p');
    el.innerText = text;
    // @ts-ignore
    el.style = `
        position: absolute;
        display: hidden;
        height: 0;
        white-space: nowrap;
        font-family: Roboto, "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, Arial, sans-serif;
        font-size: 14px;
    `;
    document.body.appendChild(el);
    const pxLength = el.clientWidth;
    el.remove();
    return pxLength;
};
/**
 * Calculates the angle of radius vector of the scroll motion
 * and detect whether scroll is vertical
 *
 * @param deltaY Wheel event deltaY value.
 * @param  deltaX Wheel event deltaX value.
 *
 * @returns True if scroll is vertical, false otherwise.
 */ const isVerticalScroll = (()=>{
    const degToRad = (deg)=>deg * (Math.PI / 180);
    const deg60ToRad = degToRad(60);
    const deg90ToRad = degToRad(90);
    const deg120ToRad = degToRad(120);
    const deg240ToRad = degToRad(240);
    const deg270ToRad = degToRad(270);
    const deg300ToRad = degToRad(300);
    return (deltaY, deltaX)=>{
        if (deltaY === 0) {
            return false;
        }
        let angle = Math.atan(deltaX / deltaY);
        angle = deltaY > 0 ? angle + deg90ToRad : angle + deg270ToRad;
        return angle > deg60ToRad && angle < deg120ToRad || angle > deg240ToRad && angle < deg300ToRad;
    };
})();
/**
 * Checks the length of the array with filters and returns the contents for notification.
 *
 * @param updatedFilters Array with updated filters.
 *
 * @returns Object with title and description describing error if `updatedFilters` is not provided,
 * otherwise description with information about updated filters.
 */ const updateFilterDescription = (updatedFilters)=>{
    if (!updatedFilters) {
        return {
            type: _common_types__rspack_import_4/* .NotificationType.Error */._.Error,
            text: _common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_popup_update_error')
        };
    }
    const filterNames = updatedFilters.map((filter)=>filter.name).join(', ');
    // no updated filters
    let text = `${filterNames} ${_common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_popup_update_not_found')}`;
    if (updatedFilters.length === 1) {
        text = `${filterNames} ${_common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_popup_update_filter')}`;
    } else if (updatedFilters.length > 1) {
        text = `${filterNames} ${_common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_popup_update_filters')}`;
    }
    return {
        type: _common_types__rspack_import_4/* .NotificationType.Success */._.Success,
        text
    };
};
/**
 * Returns filter name for filterId.
 *
 * @param filterId Filter id.
 * @param filtersMetadata Filters metadata.
 *
 * @returns Filter name for filterId.
 */ const getFilterName = (filterId, filtersMetadata)=>{
    if (filterId === undefined || !filtersMetadata) {
        return null;
    }
    if (filterId === _common_constants__rspack_import_5/* .AntiBannerFiltersId.UserFilterId */.j8.UserFilterId) {
        return _common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_userfilter');
    }
    if (filterId === _common_constants__rspack_import_5/* .AntiBannerFiltersId.AllowlistFilterId */.j8.AllowlistFilterId) {
        return _common_translators_translator__rspack_import_2/* .translator.getMessage */.N.getMessage('options_allowlist');
    }
    const filterMetadata = filtersMetadata.find((el)=>el.filterId === filterId);
    return filterMetadata ? filterMetadata.name : null;
};


},
32706(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  YW: () => (/* reexport safe */ _messenger_common__rspack_import_1.Y),
  e0: () => (/* reexport safe */ _messenger_common__rspack_import_1.H),
  ee: () => (/* reexport safe */ messenger__rspack_import_0.N)
});
/* import */ var messenger__rspack_import_0 = __webpack_require__(2036);
/* import */ var _messenger_common__rspack_import_1 = __webpack_require__(28339);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ 



},
28339(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  H: () => (MessengerCommon),
  Y: () => (Page)
});
/* import */ var core_js_modules_es_array_includes_js__rspack_import_0 = __webpack_require__(45403);
/* import */ var core_js_modules_es_array_includes_js__rspack_import_0_default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_includes_js__rspack_import_0);
/* import */ var webextension_polyfill__rspack_import_1 = __webpack_require__(28467);
/* import */ var webextension_polyfill__rspack_import_1_default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__rspack_import_1);
/* import */ var nanoid__rspack_import_4 = __webpack_require__(6500);
/* import */ var _common_logger__rspack_import_2 = __webpack_require__(42228);
/* import */ var _common_messages__rspack_import_3 = __webpack_require__(8115);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}





var Page = /*#__PURE__*/ function(Page) {
    Page["FullscreenUserRules"] = "fullscreen-user-rules";
    Page["FilteringLog"] = "filtering-log";
    Page["Popup"] = "popup";
    return Page;
}({});
/**
 * MessengerCommon class, used to communicate with the background page from the UI.
 * Actually, it's a wrapper around the browser.runtime.sendMessage method.
 */ class MessengerCommon {
    /**
     * Sends a message to the background page.
     *
     * All messages described in the {@link MessageType} enum.
     * All answers described in the {@link MessageMap} type.
     *
     * @param type Message type.
     * @param data Message data. Optional because not all messages have data.
     *
     * @returns Promise that resolves with the response from the background page.
     * Type of the response depends on the message type. Go to {@link MessageMap}
     * to see all possible message types and their responses.
     */ // eslint-disable-next-line class-methods-use-this
    async sendMessage(type, data) {
        const response = await webextension_polyfill__rspack_import_1_default().runtime.sendMessage({
            handlerName: _common_messages__rspack_import_3/* .APP_MESSAGE_HANDLER_NAME */.zk,
            type,
            data
        });
        return response;
    }
    constructor(){
        _define_property(this, "onMessage", (webextension_polyfill__rspack_import_1_default().runtime.onMessage));
        /**
     * Method subscribes to notifier module events.
     *
     * @param events List of events to which subscribe.
     * @param callback Callback called when event fires.
     * @param onUnloadCallback Callback used to remove listener on unload.
     *
     * @returns Function to remove listener on unload.
     */ _define_property(this, "createEventListener", async (events, callback, onUnloadCallback)=>{
            let listenerId;
            const response = await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CreateEventListener */.Go.CreateEventListener, {
                events
            });
            listenerId = response.listenerId;
            const onUpdateListeners = async ()=>{
                const updatedResponse = await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CreateEventListener */.Go.CreateEventListener, {
                    events
                });
                listenerId = updatedResponse.listenerId;
            };
            const messageHandler = (message)=>{
                if (!(0,_common_messages__rspack_import_3/* .messageHasTypeField */.Et)(message)) {
                    _common_logger__rspack_import_2/* .logger.error */.v.error('[ext.MessengerCommon]: received message in MessengerCommon.createEventListener has no type field:', message);
                    return undefined;
                }
                if (message.type === _common_messages__rspack_import_3/* .MessageType.NotifyListeners */.Go.NotifyListeners) {
                    if (!(0,_common_messages__rspack_import_3/* .messageHasTypeAndDataFields */.oL)(message)) {
                        _common_logger__rspack_import_2/* .logger.error */.v.error('[ext.MessengerCommon]: received message with type MessageType.NotifyListeners has no data:', message);
                        return undefined;
                    }
                    const castedMessage = message;
                    const [type, ...data] = castedMessage.data;
                    if (events.includes(type)) {
                        callback({
                            type,
                            data
                        });
                    }
                }
                if (message.type === _common_messages__rspack_import_3/* .MessageType.UpdateListeners */.Go.UpdateListeners) {
                    onUpdateListeners();
                }
            };
            const onUnload = ()=>{
                if (!listenerId) {
                    return;
                }
                webextension_polyfill__rspack_import_1_default().runtime.onMessage.removeListener(messageHandler);
                window.removeEventListener('beforeunload', onUnload);
                window.removeEventListener('unload', onUnload);
                this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RemoveListener */.Go.RemoveListener, {
                    listenerId
                });
                listenerId = null;
                if (typeof onUnloadCallback === 'function') {
                    onUnloadCallback();
                }
            };
            webextension_polyfill__rspack_import_1_default().runtime.onMessage.addListener(messageHandler);
            window.addEventListener('beforeunload', onUnload);
            window.addEventListener('unload', onUnload);
            return onUnload;
        });
        /**
     * Sends a message from background page to update listeners on the UI.
     *
     * @returns Promise that resolves when the message is sent.
     */ _define_property(this, "updateListeners", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.UpdateListeners */.Go.UpdateListeners);
        });
        /**
     * Sends a message to the background page to get the settings data for
     * the options page with some additional info.
     *
     * @returns Promise that resolves with the settings data for
     * the options page with some additional info.
     */ _define_property(this, "getOptionsData", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetOptionsData */.Go.GetOptionsData);
        });
        /**
     * Sends a message to the background page to get all filters
     * with current version timestamps and state data.
     * Lightweight alternative to {@link getOptionsData} for refreshing
     * only filter timestamps.
     *
     * @returns Promise that resolves with the list of filters.
     */ _define_property(this, "getCategoriesFilters", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetCategoriesFilters */.Go.GetCategoriesFilters);
        });
        /**
     * Sends a message to the background page to change the user setting.
     *
     * @param settingId Setting identifier.
     * @param value Setting value.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "changeUserSetting", async (settingId, value)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ChangeUserSettings */.Go.ChangeUserSettings, {
                key: settingId,
                value
            });
        });
        /**
     * Sends a message to the background page to open the extension store.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openExtensionStore", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenExtensionStore */.Go.OpenExtensionStore);
        });
        /**
     * Sends a message to the background page to open the compare page.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openComparePage", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenComparePage */.Go.OpenComparePage);
        });
        /**
     * Sends a message to the background page to open the Chrome extensions settings page.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openChromeExtensionsPage", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenChromeExtensionsSettingsPage */.Go.OpenChromeExtensionsSettingsPage);
        });
        /**
     * Sends a message to the background page to open the extension details page.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openExtensionDetailsPage", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenExtensionDetailsPage */.Go.OpenExtensionDetailsPage);
        });
        /**
     * Sends a message to the background page to enable a filter by filter id.
     *
     * @param filterId Filter identifier.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "enableFilter", async (filterId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.AddAndEnableFilter */.Go.AddAndEnableFilter, {
                filterId
            });
        });
        /**
     * Sends a message to the background page to disable a filter by filter id.
     *
     * @param filterId Filter identifier.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "disableFilter", async (filterId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.DisableFilter */.Go.DisableFilter, {
                filterId
            });
        });
        /**
     * Sends a message to the background page to apply settings from a JSON object.
     *
     * @param json JSON object representing the settings to apply.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "applySettingsJson", async (json)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ApplySettingsJson */.Go.ApplySettingsJson, {
                json
            });
        });
        /**
     * Sends a message to the background page to open the filtering log.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openFilteringLog", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenFilteringLog */.Go.OpenFilteringLog);
        });
        /**
     * Sends a message to the background page to save filtering log window state.
     *
     * @param windowState Window state (position and size) to save.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "saveFilteringLogWindowState", async (windowState)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SetFilteringLogWindowState */.Go.SetFilteringLogWindowState, {
                windowState
            });
        });
        /**
     * Sends a message to the background page to reset the blocked ads statistics.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "resetStatistics", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ResetBlockedAdsCount */.Go.ResetBlockedAdsCount);
        });
        /**
     * Sends a message to the background page to reset the settings.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "resetSettings", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ResetSettings */.Go.ResetSettings);
        });
        /**
     * Sends a message to the background page to get the user rules.
     *
     * @returns Promise that resolves with the user rules.
     */ _define_property(this, "getUserRules", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetUserRules */.Go.GetUserRules);
        });
        /**
     * Sends a message to the background page to save user rules.
     *
     * @param value User rules value to save.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "saveUserRules", async (value)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SaveUserRules */.Go.SaveUserRules, {
                value
            });
        });
        /**
     * Sends a message to the background page to open user rules editor in fullscreen.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openFullscreenUserRules", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenFullscreenUserRules */.Go.OpenFullscreenUserRules);
        });
        /**
     * Sends a message to the background page to get the allowlist domains.
     *
     * @returns Promise that resolves with the list of allowlist domains.
     */ _define_property(this, "getAllowlist", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetAllowlistDomains */.Go.GetAllowlistDomains);
        });
        /**
     * Sends a message to the background page to save the allowlist domains.
     *
     * @param value Allowlist domains value to save.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "saveAllowlist", async (value)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SaveAllowlistDomains */.Go.SaveAllowlistDomains, {
                value
            });
        });
        /**
     * Sends a message to the background page to mark a notification as viewed.
     *
     * @param withDelay Whether the notification should be marked as viewed after a delay.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "setNotificationViewed", async (withDelay)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SetNotificationViewed */.Go.SetNotificationViewed, {
                withDelay
            });
        });
        /**
     * Sends a message to the background page to update the status of a filter group.
     *
     * @param groupId Group identifier.
     * @param enabled Whether the group should be enabled or disabled.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "updateGroupStatus", async (groupId, enabled)=>{
            const type = enabled ? _common_messages__rspack_import_3/* .MessageType.EnableFiltersGroup */.Go.EnableFiltersGroup : _common_messages__rspack_import_3/* .MessageType.DisableFiltersGroup */.Go.DisableFiltersGroup;
            return this.sendMessage(type, {
                groupId
            });
        });
        /**
     * Sends a message to the background page to set consented filters.
     *
     * @param filterIds List of filter identifiers.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "setConsentedFilters", async (filterIds)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SetConsentedFilters */.Go.SetConsentedFilters, {
                filterIds
            });
        });
        /**
     * Sends a message to the background page to check if a filter is consented.
     *
     * @param filterId Filter identifier.
     *
     * @returns Promise that resolves with the result of the check.
     */ _define_property(this, "getIsConsentedFilter", async (filterId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetIsConsentedFilter */.Go.GetIsConsentedFilter, {
                filterId
            });
        });
        /**
     * Sends a message to the background page to check a custom filter URL.
     *
     * @param url Custom filter URL.
     *
     * @returns Promise that resolves with the result of the check.
     */ _define_property(this, "checkCustomUrl", async (url)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.LoadCustomFilterInfo */.Go.LoadCustomFilterInfo, {
                url
            });
        });
        /**
     * Sends a message to the background page to add a custom filter.
     *
     * @param {CustomFilterSubscriptionData} filter Custom filter data.
     *
     * @returns {Promise<CustomFilterMetadata>} Custom filter metadata.
     */ _define_property(this, "addCustomFilter", async (filter)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SubscribeToCustomFilter */.Go.SubscribeToCustomFilter, {
                filter
            });
        });
        /**
     * Sends a message to the background page to remove a custom filter.
     *
     * @param filterId Custom filter ID.
     *
     * @returns Promise that resolves after the filter is removed.
     */ _define_property(this, "removeCustomFilter", async (filterId)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RemoveAntiBannerFilter */.Go.RemoveAntiBannerFilter, {
                filterId
            });
        });
        /**
     * Sends a message to the background page to check if the application is initialized.
     *
     * @returns Promise that resolves to a boolean value:
     * true if the application is initialized, false otherwise.
     */ _define_property(this, "getIsAppInitialized", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetIsAppInitialized */.Go.GetIsAppInitialized);
        });
        /**
     * Sends a message to the background to get the tab info for the popup.
     *
     * @param tabId Tab ID.
     *
     * @returns Promise that resolves with the tab info or undefined.
     */ _define_property(this, "getTabInfoForPopup", async (tabId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetTabInfoForPopup */.Go.GetTabInfoForPopup, {
                tabId
            });
        });
        /**
     * Sends a message to the background page to change application filtering state.
     *
     * @param state Application filtering state.
     *
     * @returns Promise that resolves after the state is changed.
     */ _define_property(this, "changeApplicationFilteringPaused", async (state)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ChangeApplicationFilteringPaused */.Go.ChangeApplicationFilteringPaused, {
                state
            });
        });
        /**
     * Sends a message to the background page to update the theme of the fullscreen user rules.
     *
     * @param theme Theme to set.
     *
     * @returns Promise that resolves after the theme is updated.
     */ _define_property(this, "updateFullscreenUserRulesTheme", async (theme)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.UpdateFullscreenUserRulesTheme */.Go.UpdateFullscreenUserRulesTheme, {
                theme
            });
        });
        /**
     * Sends a message to the background page to open the rules limits tab.
     *
     * @returns Promise that resolves after the tab is opened.
     */ _define_property(this, "openRulesLimitsTab", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenRulesLimitsTab */.Go.OpenRulesLimitsTab);
        });
        /**
     * Sends a message to the background page to open the settings tab.
     *
     * @returns Promise that resolves after the tab is opened.
     */ _define_property(this, "openSettingsTab", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenSettingsTab */.Go.OpenSettingsTab);
        });
        /**
     * Sends a message to the background page to open the assistant.
     *
     * @returns Promise that resolves after the assistant is opened.
     */ _define_property(this, "openAssistant", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenAssistant */.Go.OpenAssistant);
        });
        /**
     * Sends a message to the background page to open the abuse reporting tab for a site.
     *
     * @param url The URL of the site to report abuse for.
     * @param from The source of the request.
     *
     * @returns Promise that resolves after the tab is opened.
     */ _define_property(this, "openAbuseSite", async (url, from)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenAbuseTab */.Go.OpenAbuseTab, {
                url,
                from
            });
        });
        /**
     * Sends a message to the background page to check site security.
     *
     * @param url The URL of the site to check.
     * @param from The source of the request.
     *
     * @returns Promise that resolves with the site security info.
     */ _define_property(this, "checkSiteSecurity", async (url, from)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenSiteReportTab */.Go.OpenSiteReportTab, {
                url,
                from
            });
        });
        /**
     * Sends a message to the background page to reset user rules for a specific page.
     *
     * @param url The URL of the page.
     *
     * @returns Promise that resolves after the user rules are reset.
     */ _define_property(this, "resetUserRulesForPage", async (url)=>{
            const [currentTab] = await webextension_polyfill__rspack_import_1_default().tabs.query({
                active: true,
                currentWindow: true
            });
            if (!(currentTab === null || currentTab === void 0 ? void 0 : currentTab.id)) {
                _common_logger__rspack_import_2/* .logger.warn */.v.warn('[ext.MessengerCommon]: cannot get current tab id');
                return;
            }
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ResetUserRulesForPage */.Go.ResetUserRulesForPage, {
                url,
                tabId: currentTab === null || currentTab === void 0 ? void 0 : currentTab.id
            });
        });
        /**
     * Sends a message to the background page to remove an allowlist domain.
     *
     * @param tabId The ID of the tab.
     * @param tabRefresh Whether the tab should be refreshed.
     *
     * @returns Promise that resolves after the domain is removed.
     */ _define_property(this, "removeAllowlistDomain", async (tabId, tabRefresh)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RemoveAllowlistDomain */.Go.RemoveAllowlistDomain, {
                tabId,
                tabRefresh
            });
        });
        /**
     * Sends a message to the background page to add an allowlist domain for a specific tab.
     *
     * @param tabId The ID of the tab.
     *
     * @returns Promise that resolves after the domain is added.
     */ _define_property(this, "addAllowlistDomainForTabId", async (tabId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.AddAllowlistDomainForTabId */.Go.AddAllowlistDomainForTabId, {
                tabId
            });
        });
        /**
     * Sends a message to the background page to add an allowlist domain for a specific URL.
     *
     * Please note that after adding an allowlist domain, the tab will not be reloaded,
     * it should be done separately later if needed.
     *
     * @param url The URL of the page.
     *
     * @returns Promise that resolves after the domain is added.
     */ _define_property(this, "addAllowlistDomainForUrl", async (url)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.AddAllowlistDomainForUrl */.Go.AddAllowlistDomainForUrl, {
                url
            });
        });
        /**
     * Works only in MV2, since MV3 doesn't support filtering log yet.
     *
     * @returns Promise that resolves after the filtering log page is opened.
     */ _define_property(this, "onOpenFilteringLogPage", async ()=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OnOpenFilteringLogPage */.Go.OnOpenFilteringLogPage);
        });
        /**
     * Sends a message to the background page to get filtering log data.
     *
     * @returns Promise that resolves with filtering log data.
     */ _define_property(this, "getFilteringLogData", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetFilteringLogData */.Go.GetFilteringLogData);
        });
        /**
     * Sends a message to the background page to close the filtering log page.
     *
     * @returns Promise that resolves after the page is closed.
     */ _define_property(this, "onCloseFilteringLogPage", async ()=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OnCloseFilteringLogPage */.Go.OnCloseFilteringLogPage);
        });
        /**
     * Sends a message to the background page to get filtering info by tab ID.
     *
     * @param tabId The ID of the tab.
     *
     * @returns Promise that resolves with filtering info about the tab.
     */ _define_property(this, "getFilteringInfoByTabId", async (tabId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetFilteringInfoByTabId */.Go.GetFilteringInfoByTabId, {
                tabId
            });
        });
        /**
     * Sends a message to the background page to synchronize the list of open tabs.
     *
     * @returns Promise that resolves with an array of filtering info about open tabs.
     */ _define_property(this, "synchronizeOpenTabs", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SynchronizeOpenTabs */.Go.SynchronizeOpenTabs);
        });
        /**
     * Sends a message to the background page to clear events by tab ID.
     *
     * @param tabId The ID of the tab.
     * @param ignorePreserveLog Optional flag to ignore the preserve log state.
     *
     * @returns Promise that resolves after the events are cleared.
     */ _define_property(this, "clearEventsByTabId", async (tabId, ignorePreserveLog)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ClearEventsByTabId */.Go.ClearEventsByTabId, {
                tabId,
                ignorePreserveLog
            });
        });
        /**
     * Sends a message to the background page to refresh the current page by tab ID.
     *
     * @param tabId The ID of the tab.
     *
     * @returns Promise that resolves after the page is refreshed.
     */ _define_property(this, "refreshPage", async (tabId)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RefreshPage */.Go.RefreshPage, {
                tabId
            });
        });
        /**
     * Sends a message to the background page to add a user rule.
     *
     * @param ruleText User rule text to be added.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "addUserRule", async (ruleText)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.AddUserRule */.Go.AddUserRule, {
                ruleText
            });
        });
        /**
     * Sends a message to the background page to remove a user rule.
     *
     * @param ruleText User rule text to be removed.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "removeUserRule", async (ruleText)=>{
            await this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RemoveUserRule */.Go.RemoveUserRule, {
                ruleText
            });
        });
        /**
     * Sends a message to the background page to set the preserve log state.
     *
     * @param state State indicating whether to preserve the log.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "setPreserveLogState", async (state)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SetPreserveLogState */.Go.SetPreserveLogState, {
                state
            });
        });
        /**
     * Sends a message to the background page to get the editor storage content.
     *
     * @returns Promise that resolves with the editor storage content.
     */ _define_property(this, "getEditorStorageContent", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetEditorStorageContent */.Go.GetEditorStorageContent);
        });
        /**
     * Sends a message to the background page to set the editor storage content.
     *
     * @param content Content to be stored in the editor.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "setEditorStorageContent", async (content)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SetEditorStorageContent */.Go.SetEditorStorageContent, {
                content
            });
        });
        /**
     * Sends a message to the background page to get the rules limits counters for MV3.
     *
     * @returns Promise that resolves with the rules limits counters for MV3.
     */ _define_property(this, "getRulesLimitsCounters", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetRulesLimitsCountersMv3 */.Go.GetRulesLimitsCountersMv3);
        });
        /**
     * Sends a message to the background page to check if it is possible to enable a static filter.
     *
     * @param filterId Filter ID to check.
     *
     * @returns Promise that resolves with the result of the static filter check.
     *
     * @throws Error If the filter is not static.
     */ _define_property(this, "canEnableStaticFilter", async (filterId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CanEnableStaticFilterMv3 */.Go.CanEnableStaticFilterMv3, {
                filterId
            });
        });
        /**
     * Sends a message to the background page to check if all dynamic rules for a user rules' group can be enabled.
     *
     * @param groupId Group identifier to check.
     *
     * @returns Promise that resolves with the result of the static group check.
     */ _define_property(this, "canEnableStaticGroup", async (groupId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CanEnableStaticGroupMv3 */.Go.CanEnableStaticGroupMv3, {
                groupId
            });
        });
        /**
     * Sends a message to the background page to get the current static filters limits.
     *
     * @returns Promise that resolves with the current static filters limits.
     */ _define_property(this, "getCurrentLimits", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CurrentLimitsMv3 */.Go.CurrentLimitsMv3);
        });
        /**
     * Sends a message to the background page to check if the request filter is ready.
     *
     * @returns Promise that resolves to a boolean indicating if the request filter is ready.
     */ _define_property(this, "checkRequestFilterReady", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CheckRequestFilterReady */.Go.CheckRequestFilterReady);
        });
        /**
     * Sends a message to the background page to add a URL to the trusted list.
     *
     * @param url URL to be added to the trusted list.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "addUrlToTrusted", async (url)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.AddUrlToTrusted */.Go.AddUrlToTrusted, {
                url
            });
        });
        /**
     * Sends a message to the background page to get user rules editor data.
     *
     * @returns Promise that resolves with the user rules editor data.
     */ _define_property(this, "getUserRulesEditorData", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetUserRulesEditorData */.Go.GetUserRulesEditorData);
        });
        /**
     * Sends a message to the background page to restore filters in MV3.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "restoreFiltersMv3", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RestoreFiltersMv3 */.Go.RestoreFiltersMv3);
        });
        /**
     * Sends a message to the background page to clear the rules limits warning in MV3.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "clearRulesLimitsWarningMv3", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ClearRulesLimitsWarningMv3 */.Go.ClearRulesLimitsWarningMv3);
        });
        /**
     * Sends a message to the background page to get the allowlist domains.
     *
     * @returns Promise that resolves with the allowlist domains.
     */ _define_property(this, "getAllowlistDomains", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetAllowlistDomains */.Go.GetAllowlistDomains);
        });
        /**
     * Sends a message to the background page to load the settings JSON.
     *
     * @returns Promise that resolves with the loaded settings JSON.
     */ _define_property(this, "loadSettingsJson", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.LoadSettingsJson */.Go.LoadSettingsJson);
        });
        /**
     * Sends a message to the background to generate a share settings URL.
     *
     * @returns Promise that resolves with the share URL string.
     */ _define_property(this, "generateShareUrl", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GenerateShareUrl */.Go.GenerateShareUrl);
        });
        /**
     * Sends a message to the background page to open the thank you page.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "openThankYouPage", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenThankYouPage */.Go.OpenThankYouPage);
        });
        /**
     * Sends a message to the background page to initialize the frame script.
     *
     * @returns Promise that resolves with the initialization data for the frame script.
     */ _define_property(this, "initializeFrameScript", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.InitializeFrameScript */.Go.InitializeFrameScript);
        });
        /**
     * Sends a message to the background page to initialize the blocking page script.
     *
     * @returns Promise that resolves with the initialization data for the blocking page script.
     */ _define_property(this, "initializeBlockingPageScript", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.InitializeBlockingPageScript */.Go.InitializeBlockingPageScript);
        });
        /**
     * Sends a message to the background page to mark url as trusted and ignore
     * safebrowsing checks for it.
     *
     * @param url URL to mark as trusted.
     *
     * @returns Promise that resolves with the initialization data for the frame script.
     */ _define_property(this, "openSafebrowsingTrusted", async (url)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.OpenSafebrowsingTrusted */.Go.OpenSafebrowsingTrusted, {
                url
            });
        });
        /**
     * Sends a message to the background page to send a telemetry page view event.
     *
     * @param screenName Screen name of the page.
     * @param pageId Page ID of the page.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "sendTelemetryPageViewEvent", async (screenName, pageId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SendTelemetryPageViewEvent */.Go.SendTelemetryPageViewEvent, {
                screenName,
                pageId
            });
        });
        /**
     * Sends a message to the background page to send a telemetry custom event.
     *
     * @param screenName Screen name of the page.
     * @param eventName Name of the event.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "sendTelemetryCustomEvent", async (screenName, eventName)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.SendTelemetryCustomEvent */.Go.SendTelemetryCustomEvent, {
                screenName,
                eventName
            });
        });
        /**
     * Adds opened page to telemetry tracking.
     *
     * @returns Promise that resolves with the page ID.
     */ _define_property(this, "addTelemetryOpenedPage", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.AddTelemetryOpenedPage */.Go.AddTelemetryOpenedPage);
        });
        /**
     * Removes opened page from telemetry tracking.
     *
     * @param pageId Page ID to remove.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "removeTelemetryOpenedPage", async (pageId)=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.RemoveTelemetryOpenedPage */.Go.RemoveTelemetryOpenedPage, {
                pageId
            });
        });
        /**
     * Dismisses the search page access notification permanently.
     *
     * @returns Promise that resolves after the notification is dismissed.
     */ _define_property(this, "dismissSearchPageAccessNotification", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.DismissSearchPageAccessNotification */.Go.DismissSearchPageAccessNotification);
        });
        /**
     * Checks whether there is a pending import configuration in the background.
     *
     * @returns `true` if there is a pending import config, `false` otherwise.
     */ _define_property(this, "isPendingForImport", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.IsPendingForImport */.Go.IsPendingForImport);
        });
        /**
     * Returns whether the pending import configuration requests WebRTC blocking.
     *
     * @returns `true` if the pending config sets `blockWebrtc` to `true`.
     */ _define_property(this, "getPendingImportBlockWebrtc", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.GetPendingImportBlockWebrtc */.Go.GetPendingImportBlockWebrtc);
        });
        /**
     * Applies the pending import configuration.
     *
     * @returns `true` if the import succeeded, `false` otherwise.
     */ _define_property(this, "applyImportConfiguration", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.ApplyImportConfiguration */.Go.ApplyImportConfiguration);
        });
        /**
     * Cancels and discards the pending import configuration.
     *
     * @returns Promise that resolves after the message is sent.
     */ _define_property(this, "cancelImportConfiguration", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_3/* .MessageType.CancelImportConfiguration */.Go.CancelImportConfiguration);
        });
    }
}
/**
     * Creates long-lived connections between an extension page and the background page.
     *
     * @param page Page name.
     * @param events List of events to which subscribe.
     * @param callback Callback called when event fires.
     *
     * @returns Object with onUnload callback and portId.
     */ _define_property(MessengerCommon, "createLongLivedConnection", (page, events, callback)=>{
    let port;
    let forceDisconnected = false;
    const portId = `${page}_${(0,nanoid__rspack_import_4/* .nanoid */.Ak)()}`;
    const connect = ()=>{
        port = webextension_polyfill__rspack_import_1_default().runtime.connect({
            name: portId
        });
        port.postMessage({
            type: _common_messages__rspack_import_3/* .MessageType.AddLongLivedConnection */.Go.AddLongLivedConnection,
            data: {
                events
            }
        });
        port.onMessage.addListener((message)=>{
            if (!(0,_common_messages__rspack_import_3/* .messageHasTypeField */.Et)(message)) {
                _common_logger__rspack_import_2/* .logger.error */.v.error('[ext.MessengerCommon]: received message in MessengerCommon.createLongLivedConnection has no type field:', message);
                return;
            }
            if (message.type === _common_messages__rspack_import_3/* .MessageType.NotifyListeners */.Go.NotifyListeners) {
                if (!(0,_common_messages__rspack_import_3/* .messageHasTypeAndDataFields */.oL)(message)) {
                    _common_logger__rspack_import_2/* .logger.error */.v.error('[ext.MessengerCommon]: received message with type MessageType.NotifyListeners has no data:', message);
                    return;
                }
                const castedMessage = message;
                const [type, ...data] = castedMessage.data;
                callback({
                    type,
                    data
                });
            }
        });
        port.onDisconnect.addListener(()=>{
            if ((webextension_polyfill__rspack_import_1_default().runtime.lastError)) {
                _common_logger__rspack_import_2/* .logger.error */.v.error('[ext.MessengerCommon]: received error on disconnect:', (webextension_polyfill__rspack_import_1_default().runtime.lastError.message));
            }
            // we try to connect again if the background page was terminated
            if (!forceDisconnected) {
                connect();
            }
        });
    };
    connect();
    const onUnload = ()=>{
        if (port) {
            forceDisconnected = true;
            port.disconnect();
        }
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('unload', onUnload);
    return {
        onUnload,
        portId
    };
});


},
2036(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  N: () => (messenger)
});
/* import */ var _common_messages__rspack_import_0 = __webpack_require__(8115);
/* import */ var _messenger_common__rspack_import_1 = __webpack_require__(28339);
/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}


class Messenger extends _messenger_common__rspack_import_1/* .MessengerCommon */.H {
    constructor(...args){
        super(...args), /**
     * Sends a message to the background page to check for extension updates.
     */ _define_property(this, "checkUpdates", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_0/* .MessageType.CheckExtensionUpdateMv3 */.Go.CheckExtensionUpdateMv3);
        }), /**
     * Sends a message to the background page to update extension.
     *
     * @param UpdateExtensionMessageMv3Data Message data with from field.
     */ _define_property(this, "updateExtension", async ({ from })=>{
            return this.sendMessage(_common_messages__rspack_import_0/* .MessageType.UpdateExtensionMv3 */.Go.UpdateExtensionMv3, {
                from
            });
        }), /**
     * Sends a message to the background page to get extension status for popup.
     *
     * @returns Promise that resolves with extension status
     */ _define_property(this, "getExtensionStatusForPopup", async ()=>{
            return this.sendMessage(_common_messages__rspack_import_0/* .MessageType.GetExtensionStatusForPopupMV3 */.Go.GetExtensionStatusForPopupMV3);
        });
    }
}
const messenger = new Messenger();


},
1110(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isCallable = __webpack_require__(83513);
var tryToString = __webpack_require__(38691);

var $TypeError = TypeError;

// `Assert: IsCallable(argument) is true`
module.exports = function (argument) {
  if (isCallable(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a function');
};


},
96790(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isPossiblePrototype = __webpack_require__(6545);

var $String = String;
var $TypeError = TypeError;

module.exports = function (argument) {
  if (isPossiblePrototype(argument)) return argument;
  throw new $TypeError("Can't set " + $String(argument) + ' as a prototype');
};


},
35681(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var wellKnownSymbol = __webpack_require__(21735);
var create = __webpack_require__(88156);
var defineProperty = (__webpack_require__(3597)/* .f */.f);

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] === undefined) {
  defineProperty(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create(null)
  });
}

// add a key to Array.prototype[@@unscopables]
module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};


},
55339(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isObject = __webpack_require__(38014);

var $String = String;
var $TypeError = TypeError;

// `Assert: Type(argument) is Object`
module.exports = function (argument) {
  if (isObject(argument)) return argument;
  throw new $TypeError($String(argument) + ' is not an object');
};


},
17909(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var toIndexedObject = __webpack_require__(94993);
var toAbsoluteIndex = __webpack_require__(29670);
var lengthOfArrayLike = __webpack_require__(69290);

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = lengthOfArrayLike(O);
    if (length === 0) return !IS_INCLUDES && -1;
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el !== el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value !== value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};


},
37402(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var fails = __webpack_require__(63195);

module.exports = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call -- required for testing
    method.call(null, argument || function () { return 1; }, 1);
  });
};


},
19450(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var aCallable = __webpack_require__(1110);
var toObject = __webpack_require__(76945);
var IndexedObject = __webpack_require__(74187);
var lengthOfArrayLike = __webpack_require__(69290);

var $TypeError = TypeError;

var REDUCE_EMPTY = 'Reduce of empty array with no initial value';

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    var O = toObject(that);
    var self = IndexedObject(O);
    var length = lengthOfArrayLike(O);
    aCallable(callbackfn);
    if (length === 0 && argumentsLength < 2) throw new $TypeError(REDUCE_EMPTY);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw new $TypeError(REDUCE_EMPTY);
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

module.exports = {
  // `Array.prototype.reduce` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduce
  left: createMethod(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduceright
  right: createMethod(true)
};


},
84811(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var isArray = __webpack_require__(51076);

var $TypeError = TypeError;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Safari < 13 does not throw an error in this case
var SILENT_ON_NON_WRITABLE_LENGTH_SET = DESCRIPTORS && !function () {
  // makes no sense without proper strict mode support
  if (this !== undefined) return true;
  try {
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    Object.defineProperty([], 'length', { writable: false }).length = 1;
  } catch (error) {
    return error instanceof TypeError;
  }
}();

module.exports = SILENT_ON_NON_WRITABLE_LENGTH_SET ? function (O, length) {
  if (isArray(O) && !getOwnPropertyDescriptor(O, 'length').writable) {
    throw new $TypeError('Cannot set read only .length');
  } return O.length = length;
} : function (O, length) {
  return O.length = length;
};


},
70788(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);

var toString = uncurryThis({}.toString);
var stringSlice = uncurryThis(''.slice);

module.exports = function (it) {
  return stringSlice(toString(it), 8, -1);
};


},
76975(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var TO_STRING_TAG_SUPPORT = __webpack_require__(59328);
var isCallable = __webpack_require__(83513);
var classofRaw = __webpack_require__(70788);
var wellKnownSymbol = __webpack_require__(21735);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var $Object = Object;

// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) === 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = $Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) === 'Object' && isCallable(O.callee) ? 'Arguments' : result;
};


},
4768(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var hasOwn = __webpack_require__(63477);
var ownKeys = __webpack_require__(99379);
var getOwnPropertyDescriptorModule = __webpack_require__(61959);
var definePropertyModule = __webpack_require__(3597);

module.exports = function (target, source, exceptions) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};


},
88663(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var definePropertyModule = __webpack_require__(3597);
var createPropertyDescriptor = __webpack_require__(34184);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


},
34184(module) {
"use strict";

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


},
55390(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var makeBuiltIn = __webpack_require__(58391);
var defineProperty = __webpack_require__(3597);

module.exports = function (target, name, descriptor) {
  if (descriptor.get) makeBuiltIn(descriptor.get, name, { getter: true });
  if (descriptor.set) makeBuiltIn(descriptor.set, name, { setter: true });
  return defineProperty.f(target, name, descriptor);
};


},
59356(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isCallable = __webpack_require__(83513);
var definePropertyModule = __webpack_require__(3597);
var makeBuiltIn = __webpack_require__(58391);
var defineGlobalProperty = __webpack_require__(24157);

module.exports = function (O, key, value, options) {
  if (!options) options = {};
  var simple = options.enumerable;
  var name = options.name !== undefined ? options.name : key;
  if (isCallable(value)) makeBuiltIn(value, name, options);
  if (options.global) {
    if (simple) O[key] = value;
    else defineGlobalProperty(key, value);
  } else {
    try {
      if (!options.unsafe) delete O[key];
      else if (O[key]) simple = true;
    } catch (error) { /* empty */ }
    if (simple) O[key] = value;
    else definePropertyModule.f(O, key, {
      value: value,
      enumerable: false,
      configurable: !options.nonConfigurable,
      writable: !options.nonWritable
    });
  } return O;
};


},
24157(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);

// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

module.exports = function (key, value) {
  try {
    defineProperty(globalThis, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    globalThis[key] = value;
  } return value;
};


},
15144(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var fails = __webpack_require__(63195);

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] !== 7;
});


},
14475(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);
var isObject = __webpack_require__(38014);

var document = globalThis.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};


},
68785(module) {
"use strict";

var $TypeError = TypeError;
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF; // 2 ** 53 - 1 == 9007199254740991

module.exports = function (it) {
  if (it > MAX_SAFE_INTEGER) throw $TypeError('Maximum allowed index exceeded');
  return it;
};


},
28939(module) {
"use strict";

// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


},
41573(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var ENVIRONMENT = __webpack_require__(35803);

module.exports = ENVIRONMENT === 'NODE';


},
57427(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);

var navigator = globalThis.navigator;
var userAgent = navigator && navigator.userAgent;

module.exports = userAgent ? String(userAgent) : '';


},
55011(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);
var userAgent = __webpack_require__(57427);

var process = globalThis.process;
var Deno = globalThis.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

module.exports = version;


},
35803(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

/* global Bun, Deno -- detection */
var globalThis = __webpack_require__(95516);
var userAgent = __webpack_require__(57427);
var classof = __webpack_require__(70788);

var userAgentStartsWith = function (string) {
  return userAgent.slice(0, string.length) === string;
};

module.exports = (function () {
  if (userAgentStartsWith('Bun/')) return 'BUN';
  if (userAgentStartsWith('Cloudflare-Workers')) return 'CLOUDFLARE';
  if (userAgentStartsWith('Deno/')) return 'DENO';
  if (userAgentStartsWith('Node.js/')) return 'NODE';
  if (globalThis.Bun && typeof Bun.version == 'string') return 'BUN';
  if (globalThis.Deno && typeof Deno.version == 'object') return 'DENO';
  if (classof(globalThis.process) === 'process') return 'NODE';
  if (globalThis.window && globalThis.document) return 'BROWSER';
  return 'REST';
})();


},
25109(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);

var $Error = Error;
var replace = uncurryThis(''.replace);

var TEST = (function (arg) { return String(new $Error(arg).stack); })('zxcasd');
// eslint-disable-next-line redos/no-vulnerable, sonarjs/slow-regex -- safe
var V8_OR_CHAKRA_STACK_ENTRY = /\n\s*at [^:]*:[^\n]*/;
var IS_V8_OR_CHAKRA_STACK = V8_OR_CHAKRA_STACK_ENTRY.test(TEST);

module.exports = function (stack, dropEntries) {
  if (IS_V8_OR_CHAKRA_STACK && typeof stack == 'string' && !$Error.prepareStackTrace) {
    while (dropEntries--) stack = replace(stack, V8_OR_CHAKRA_STACK_ENTRY, '');
  } return stack;
};


},
46847(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var createNonEnumerableProperty = __webpack_require__(88663);
var clearErrorStack = __webpack_require__(25109);
var ERROR_STACK_INSTALLABLE = __webpack_require__(94279);

// non-standard V8
var captureStackTrace = Error.captureStackTrace;

module.exports = function (error, C, stack, dropEntries) {
  if (ERROR_STACK_INSTALLABLE) {
    if (captureStackTrace) captureStackTrace(error, C);
    else createNonEnumerableProperty(error, 'stack', clearErrorStack(stack, dropEntries));
  }
};


},
94279(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var fails = __webpack_require__(63195);
var createPropertyDescriptor = __webpack_require__(34184);

module.exports = !fails(function () {
  var error = new Error('a');
  if (!('stack' in error)) return true;
  // eslint-disable-next-line es/no-object-defineproperty -- safe
  Object.defineProperty(error, 'stack', createPropertyDescriptor(1, 7));
  return error.stack !== 7;
});


},
3234(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);
var getOwnPropertyDescriptor = (__webpack_require__(61959)/* .f */.f);
var createNonEnumerableProperty = __webpack_require__(88663);
var defineBuiltIn = __webpack_require__(59356);
var defineGlobalProperty = __webpack_require__(24157);
var copyConstructorProperties = __webpack_require__(4768);
var isForced = __webpack_require__(71072);

/*
  options.target         - name of the target object
  options.global         - target is the global object
  options.stat           - export as static methods of target
  options.proto          - export as prototype methods of target
  options.real           - real prototype method for the `pure` version
  options.forced         - export even if the native feature is available
  options.bind           - bind methods to the target, required for the `pure` version
  options.wrap           - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe         - use the simple assignment of property instead of delete + defineProperty
  options.sham           - add a flag to not completely full polyfills
  options.enumerable     - export as enumerable property
  options.dontCallGetSet - prevent calling a getter on target
  options.name           - the .name of the function if it does not match the key
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = globalThis;
  } else if (STATIC) {
    target = globalThis[TARGET] || defineGlobalProperty(TARGET, {});
  } else {
    target = globalThis[TARGET] && globalThis[TARGET].prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.dontCallGetSet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    defineBuiltIn(target, key, sourceProperty, options);
  }
};


},
63195(module) {
"use strict";

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};


},
86237(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var NATIVE_BIND = __webpack_require__(40076);

var FunctionPrototype = Function.prototype;
var apply = FunctionPrototype.apply;
var call = FunctionPrototype.call;

// eslint-disable-next-line es/no-function-prototype-bind, es/no-reflect -- safe
module.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
  return call.apply(apply, arguments);
});


},
40076(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var fails = __webpack_require__(63195);

module.exports = !fails(function () {
  // eslint-disable-next-line es/no-function-prototype-bind -- safe
  var test = (function () { /* empty */ }).bind();
  // eslint-disable-next-line no-prototype-builtins -- safe
  return typeof test != 'function' || test.hasOwnProperty('prototype');
});


},
26673(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var NATIVE_BIND = __webpack_require__(40076);

var call = Function.prototype.call;
// eslint-disable-next-line es/no-function-prototype-bind -- safe
module.exports = NATIVE_BIND ? call.bind(call) : function () {
  return call.apply(call, arguments);
};


},
58634(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var hasOwn = __webpack_require__(63477);

var FunctionPrototype = Function.prototype;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;

var EXISTS = hasOwn(FunctionPrototype, 'name');
// additional protection from minified / mangled / dropped function names
var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
var CONFIGURABLE = EXISTS && (!DESCRIPTORS || (DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable));

module.exports = {
  EXISTS: EXISTS,
  PROPER: PROPER,
  CONFIGURABLE: CONFIGURABLE
};


},
65726(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);
var aCallable = __webpack_require__(1110);

module.exports = function (object, key, method) {
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    return uncurryThis(aCallable(Object.getOwnPropertyDescriptor(object, key)[method]));
  } catch (error) { /* empty */ }
};


},
89852(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var NATIVE_BIND = __webpack_require__(40076);

var FunctionPrototype = Function.prototype;
var call = FunctionPrototype.call;
// eslint-disable-next-line es/no-function-prototype-bind -- safe
var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);

module.exports = NATIVE_BIND ? uncurryThisWithBind : function (fn) {
  return function () {
    return call.apply(fn, arguments);
  };
};


},
56771(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);
var isCallable = __webpack_require__(83513);

var aFunction = function (argument) {
  return isCallable(argument) ? argument : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(globalThis[namespace]) : globalThis[namespace] && globalThis[namespace][method];
};


},
9386(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var aCallable = __webpack_require__(1110);
var isNullOrUndefined = __webpack_require__(98489);

// `GetMethod` abstract operation
// https://tc39.es/ecma262/#sec-getmethod
module.exports = function (V, P) {
  var func = V[P];
  return isNullOrUndefined(func) ? undefined : aCallable(func);
};


},
95516(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var check = function (it) {
  return it && it.Math === Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof __webpack_require__.g == 'object' && __webpack_require__.g) ||
  check(typeof this == 'object' && this) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();


},
63477(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);
var toObject = __webpack_require__(76945);

var hasOwnProperty = uncurryThis({}.hasOwnProperty);

// `HasOwnProperty` abstract operation
// https://tc39.es/ecma262/#sec-hasownproperty
// eslint-disable-next-line es/no-object-hasown -- safe
module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty(toObject(it), key);
};


},
10257(module) {
"use strict";

module.exports = {};


},
78473(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var getBuiltIn = __webpack_require__(56771);

module.exports = getBuiltIn('document', 'documentElement');


},
32089(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var fails = __webpack_require__(63195);
var createElement = __webpack_require__(14475);

// Thanks to IE8 for its funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a !== 7;
});


},
74187(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);
var fails = __webpack_require__(63195);
var classof = __webpack_require__(70788);

var $Object = Object;
var split = uncurryThis(''.split);

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !$Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) === 'String' ? split(it, '') : $Object(it);
} : $Object;


},
41627(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isCallable = __webpack_require__(83513);
var isObject = __webpack_require__(38014);
var setPrototypeOf = __webpack_require__(89883);

// makes subclassing work correct for wrapped built-ins
module.exports = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    setPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    isCallable(NewTarget = dummy.constructor) &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) setPrototypeOf($this, NewTargetPrototype);
  return $this;
};


},
1974(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);
var isCallable = __webpack_require__(83513);
var store = __webpack_require__(353);

var functionToString = uncurryThis(Function.toString);

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (!isCallable(store.inspectSource)) {
  store.inspectSource = function (it) {
    return functionToString(it);
  };
}

module.exports = store.inspectSource;


},
94716(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isObject = __webpack_require__(38014);
var createNonEnumerableProperty = __webpack_require__(88663);

// `InstallErrorCause` abstract operation
// https://tc39.es/proposal-error-cause/#sec-errorobjects-install-error-cause
module.exports = function (O, options) {
  if (isObject(options) && 'cause' in options) {
    createNonEnumerableProperty(O, 'cause', options.cause);
  }
};


},
11449(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var NATIVE_WEAK_MAP = __webpack_require__(63546);
var globalThis = __webpack_require__(95516);
var isObject = __webpack_require__(38014);
var createNonEnumerableProperty = __webpack_require__(88663);
var hasOwn = __webpack_require__(63477);
var shared = __webpack_require__(353);
var sharedKey = __webpack_require__(1291);
var hiddenKeys = __webpack_require__(10257);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError = globalThis.TypeError;
var WeakMap = globalThis.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw new TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  /* eslint-disable no-self-assign -- prototype methods protection */
  store.get = store.get;
  store.has = store.has;
  store.set = store.set;
  /* eslint-enable no-self-assign -- prototype methods protection */
  set = function (it, metadata) {
    if (store.has(it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    store.set(it, metadata);
    return metadata;
  };
  get = function (it) {
    return store.get(it) || {};
  };
  has = function (it) {
    return store.has(it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};


},
51076(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var classof = __webpack_require__(70788);

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es/no-array-isarray -- safe
module.exports = Array.isArray || function isArray(argument) {
  return classof(argument) === 'Array';
};


},
83513(module) {
"use strict";

// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
var documentAll = typeof document == 'object' && document.all;

// `IsCallable` abstract operation
// https://tc39.es/ecma262/#sec-iscallable
// eslint-disable-next-line unicorn/no-typeof-undefined -- required for testing
module.exports = typeof documentAll == 'undefined' && documentAll !== undefined ? function (argument) {
  return typeof argument == 'function' || argument === documentAll;
} : function (argument) {
  return typeof argument == 'function';
};


},
71072(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var fails = __webpack_require__(63195);
var isCallable = __webpack_require__(83513);

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value === POLYFILL ? true
    : value === NATIVE ? false
    : isCallable(detection) ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;


},
98489(module) {
"use strict";

// we can't use just `it == null` since of `document.all` special case
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-aec
module.exports = function (it) {
  return it === null || it === undefined;
};


},
38014(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isCallable = __webpack_require__(83513);

module.exports = function (it) {
  return typeof it == 'object' ? it !== null : isCallable(it);
};


},
6545(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isObject = __webpack_require__(38014);

module.exports = function (argument) {
  return isObject(argument) || argument === null;
};


},
35919(module) {
"use strict";

module.exports = false;


},
97153(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var getBuiltIn = __webpack_require__(56771);
var isCallable = __webpack_require__(83513);
var isPrototypeOf = __webpack_require__(8229);
var USE_SYMBOL_AS_UID = __webpack_require__(56636);

var $Object = Object;

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, $Object(it));
};


},
69290(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var toLength = __webpack_require__(76538);

// `LengthOfArrayLike` abstract operation
// https://tc39.es/ecma262/#sec-lengthofarraylike
module.exports = function (obj) {
  return toLength(obj.length);
};


},
58391(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);
var fails = __webpack_require__(63195);
var isCallable = __webpack_require__(83513);
var hasOwn = __webpack_require__(63477);
var DESCRIPTORS = __webpack_require__(15144);
var CONFIGURABLE_FUNCTION_NAME = (__webpack_require__(58634)/* .CONFIGURABLE */.CONFIGURABLE);
var inspectSource = __webpack_require__(1974);
var InternalStateModule = __webpack_require__(11449);

var enforceInternalState = InternalStateModule.enforce;
var getInternalState = InternalStateModule.get;
var $String = String;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;
var stringSlice = uncurryThis(''.slice);
var replace = uncurryThis(''.replace);
var join = uncurryThis([].join);

var CONFIGURABLE_LENGTH = DESCRIPTORS && !fails(function () {
  return defineProperty(function () { /* empty */ }, 'length', { value: 8 }).length !== 8;
});

var TEMPLATE = String(String).split('String');

var makeBuiltIn = module.exports = function (value, name, options) {
  if (stringSlice($String(name), 0, 7) === 'Symbol(') {
    name = '[' + replace($String(name), /^Symbol\(([^)]*)\).*$/, '$1') + ']';
  }
  if (options && options.getter) name = 'get ' + name;
  if (options && options.setter) name = 'set ' + name;
  if (!hasOwn(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
    if (DESCRIPTORS) defineProperty(value, 'name', { value: name, configurable: true });
    else value.name = name;
  }
  if (CONFIGURABLE_LENGTH && options && hasOwn(options, 'arity') && value.length !== options.arity) {
    defineProperty(value, 'length', { value: options.arity });
  }
  try {
    if (options && hasOwn(options, 'constructor') && options.constructor) {
      if (DESCRIPTORS) defineProperty(value, 'prototype', { writable: false });
    // in V8 ~ Chrome 53, prototypes of some methods, like `Array.prototype.values`, are non-writable
    } else if (value.prototype) value.prototype = undefined;
  } catch (error) { /* empty */ }
  var state = enforceInternalState(value);
  if (!hasOwn(state, 'source')) {
    state.source = join(TEMPLATE, typeof name == 'string' ? name : '');
  } return value;
};

// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
// eslint-disable-next-line no-extend-native -- required
Function.prototype.toString = makeBuiltIn(function toString() {
  return isCallable(this) && getInternalState(this).source || inspectSource(this);
}, 'toString');


},
85705(module) {
"use strict";

var ceil = Math.ceil;
var floor = Math.floor;

// `Math.trunc` method
// https://tc39.es/ecma262/#sec-math.trunc
// eslint-disable-next-line es/no-math-trunc -- safe
module.exports = Math.trunc || function trunc(x) {
  var n = +x;
  return (n > 0 ? floor : ceil)(n);
};


},
57943(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var toString = __webpack_require__(19419);

module.exports = function (argument, $default) {
  return argument === undefined ? arguments.length < 2 ? '' : $default : toString(argument);
};


},
88156(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

/* global ActiveXObject -- old IE, WSH */
var anObject = __webpack_require__(55339);
var definePropertiesModule = __webpack_require__(77557);
var enumBugKeys = __webpack_require__(28939);
var hiddenKeys = __webpack_require__(10257);
var html = __webpack_require__(78473);
var documentCreateElement = __webpack_require__(14475);
var sharedKey = __webpack_require__(1291);

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  // eslint-disable-next-line no-useless-assignment -- avoid memory leak
  activeXDocument = null;
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = typeof document != 'undefined'
    ? document.domain && activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
      : NullProtoObjectViaIFrame()
    : NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
// eslint-disable-next-line es/no-object-create -- safe
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : definePropertiesModule.f(result, Properties);
};


},
77557(__unused_webpack_module, exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__(64746);
var definePropertyModule = __webpack_require__(3597);
var anObject = __webpack_require__(55339);
var toIndexedObject = __webpack_require__(94993);
var objectKeys = __webpack_require__(22740);

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe
exports.f = DESCRIPTORS && !V8_PROTOTYPE_DEFINE_BUG ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var props = toIndexedObject(Properties);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], props[key]);
  return O;
};


},
3597(__unused_webpack_module, exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var IE8_DOM_DEFINE = __webpack_require__(32089);
var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__(64746);
var anObject = __webpack_require__(55339);
var toPropertyKey = __webpack_require__(90869);

var $TypeError = TypeError;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var ENUMERABLE = 'enumerable';
var CONFIGURABLE = 'configurable';
var WRITABLE = 'writable';

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? V8_PROTOTYPE_DEFINE_BUG ? function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (typeof O === 'function' && P === 'prototype' && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
    var current = $getOwnPropertyDescriptor(O, P);
    if (current && current[WRITABLE]) {
      O[P] = Attributes.value;
      Attributes = {
        configurable: CONFIGURABLE in Attributes ? Attributes[CONFIGURABLE] : current[CONFIGURABLE],
        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
        writable: false
      };
    }
  } return $defineProperty(O, P, Attributes);
} : $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw new $TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


},
61959(__unused_webpack_module, exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var call = __webpack_require__(26673);
var propertyIsEnumerableModule = __webpack_require__(24049);
var createPropertyDescriptor = __webpack_require__(34184);
var toIndexedObject = __webpack_require__(94993);
var toPropertyKey = __webpack_require__(90869);
var hasOwn = __webpack_require__(63477);
var IE8_DOM_DEFINE = __webpack_require__(32089);

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPropertyKey(P);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (hasOwn(O, P)) return createPropertyDescriptor(!call(propertyIsEnumerableModule.f, O, P), O[P]);
};


},
32516(__unused_webpack_module, exports, __webpack_require__) {
"use strict";

var internalObjectKeys = __webpack_require__(64048);
var enumBugKeys = __webpack_require__(28939);

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};


},
33593(__unused_webpack_module, exports) {
"use strict";

// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;


},
8229(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);

module.exports = uncurryThis({}.isPrototypeOf);


},
64048(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);
var hasOwn = __webpack_require__(63477);
var toIndexedObject = __webpack_require__(94993);
var indexOf = (__webpack_require__(17909)/* .indexOf */.indexOf);
var hiddenKeys = __webpack_require__(10257);

var push = uncurryThis([].push);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !hasOwn(hiddenKeys, key) && hasOwn(O, key) && push(result, key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (hasOwn(O, key = names[i++])) {
    ~indexOf(result, key) || push(result, key);
  }
  return result;
};


},
22740(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var internalObjectKeys = __webpack_require__(64048);
var enumBugKeys = __webpack_require__(28939);

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};


},
24049(__unused_webpack_module, exports) {
"use strict";

var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;


},
89883(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

/* eslint-disable no-proto -- safe */
var uncurryThisAccessor = __webpack_require__(65726);
var isObject = __webpack_require__(38014);
var requireObjectCoercible = __webpack_require__(47930);
var aPossiblePrototype = __webpack_require__(96790);

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = uncurryThisAccessor(Object.prototype, '__proto__', 'set');
    setter(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    requireObjectCoercible(O);
    aPossiblePrototype(proto);
    if (!isObject(O)) return O;
    if (CORRECT_SETTER) setter(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);


},
45570(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var call = __webpack_require__(26673);
var isCallable = __webpack_require__(83513);
var isObject = __webpack_require__(38014);

var $TypeError = TypeError;

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
module.exports = function (input, pref) {
  var fn, val;
  if (pref === 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  if (isCallable(fn = input.valueOf) && !isObject(val = call(fn, input))) return val;
  if (pref !== 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  throw new $TypeError("Can't convert object to primitive value");
};


},
99379(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var getBuiltIn = __webpack_require__(56771);
var uncurryThis = __webpack_require__(89852);
var getOwnPropertyNamesModule = __webpack_require__(32516);
var getOwnPropertySymbolsModule = __webpack_require__(33593);
var anObject = __webpack_require__(55339);

var concat = uncurryThis([].concat);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
};


},
29268(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var defineProperty = (__webpack_require__(3597)/* .f */.f);

module.exports = function (Target, Source, key) {
  key in Target || defineProperty(Target, key, {
    configurable: true,
    get: function () { return Source[key]; },
    set: function (it) { Source[key] = it; }
  });
};


},
47930(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var isNullOrUndefined = __webpack_require__(98489);

var $TypeError = TypeError;

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (isNullOrUndefined(it)) throw new $TypeError("Can't call method on " + it);
  return it;
};


},
1291(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var shared = __webpack_require__(39877);
var uid = __webpack_require__(92172);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};


},
353(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var IS_PURE = __webpack_require__(35919);
var globalThis = __webpack_require__(95516);
var defineGlobalProperty = __webpack_require__(24157);

var SHARED = '__core-js_shared__';
var store = module.exports = globalThis[SHARED] || defineGlobalProperty(SHARED, {});

(store.versions || (store.versions = [])).push({
  version: '3.40.0',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2014-2025 Denis Pushkarev (zloirock.ru)',
  license: 'https://github.com/zloirock/core-js/blob/v3.40.0/LICENSE',
  source: 'https://github.com/zloirock/core-js'
});


},
39877(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var store = __webpack_require__(353);

module.exports = function (key, value) {
  return store[key] || (store[key] = value || {});
};


},
28515(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(55011);
var fails = __webpack_require__(63195);
var globalThis = __webpack_require__(95516);

var $String = globalThis.String;

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol('symbol detection');
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  // nb: Do not call `String` directly to avoid this being optimized out to `symbol+''` which will,
  // of course, fail.
  return !$String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});


},
29670(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var toIntegerOrInfinity = __webpack_require__(59047);

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toIntegerOrInfinity(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};


},
94993(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(74187);
var requireObjectCoercible = __webpack_require__(47930);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};


},
59047(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var trunc = __webpack_require__(85705);

// `ToIntegerOrInfinity` abstract operation
// https://tc39.es/ecma262/#sec-tointegerorinfinity
module.exports = function (argument) {
  var number = +argument;
  // eslint-disable-next-line no-self-compare -- NaN check
  return number !== number || number === 0 ? 0 : trunc(number);
};


},
76538(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var toIntegerOrInfinity = __webpack_require__(59047);

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  var len = toIntegerOrInfinity(argument);
  return len > 0 ? min(len, 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};


},
76945(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var requireObjectCoercible = __webpack_require__(47930);

var $Object = Object;

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return $Object(requireObjectCoercible(argument));
};


},
16037(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var call = __webpack_require__(26673);
var isObject = __webpack_require__(38014);
var isSymbol = __webpack_require__(97153);
var getMethod = __webpack_require__(9386);
var ordinaryToPrimitive = __webpack_require__(45570);
var wellKnownSymbol = __webpack_require__(21735);

var $TypeError = TypeError;
var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
module.exports = function (input, pref) {
  if (!isObject(input) || isSymbol(input)) return input;
  var exoticToPrim = getMethod(input, TO_PRIMITIVE);
  var result;
  if (exoticToPrim) {
    if (pref === undefined) pref = 'default';
    result = call(exoticToPrim, input, pref);
    if (!isObject(result) || isSymbol(result)) return result;
    throw new $TypeError("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};


},
90869(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var toPrimitive = __webpack_require__(16037);
var isSymbol = __webpack_require__(97153);

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
module.exports = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol(key) ? key : key + '';
};


},
59328(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var wellKnownSymbol = __webpack_require__(21735);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';


},
19419(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var classof = __webpack_require__(76975);

var $String = String;

module.exports = function (argument) {
  if (classof(argument) === 'Symbol') throw new TypeError('Cannot convert a Symbol value to a string');
  return $String(argument);
};


},
38691(module) {
"use strict";

var $String = String;

module.exports = function (argument) {
  try {
    return $String(argument);
  } catch (error) {
    return 'Object';
  }
};


},
92172(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var uncurryThis = __webpack_require__(89852);

var id = 0;
var postfix = Math.random();
var toString = uncurryThis(1.0.toString);

module.exports = function (key) {
  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString(++id + postfix, 36);
};


},
56636(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(28515);

module.exports = NATIVE_SYMBOL &&
  !Symbol.sham &&
  typeof Symbol.iterator == 'symbol';


},
64746(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var fails = __webpack_require__(63195);

// V8 ~ Chrome 36-
// https://bugs.chromium.org/p/v8/issues/detail?id=3334
module.exports = DESCRIPTORS && fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(function () { /* empty */ }, 'prototype', {
    value: 42,
    writable: false
  }).prototype !== 42;
});


},
8888(module) {
"use strict";

var $TypeError = TypeError;

module.exports = function (passed, required) {
  if (passed < required) throw new $TypeError('Not enough arguments');
  return passed;
};


},
63546(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);
var isCallable = __webpack_require__(83513);

var WeakMap = globalThis.WeakMap;

module.exports = isCallable(WeakMap) && /native code/.test(String(WeakMap));


},
21735(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var globalThis = __webpack_require__(95516);
var shared = __webpack_require__(39877);
var hasOwn = __webpack_require__(63477);
var uid = __webpack_require__(92172);
var NATIVE_SYMBOL = __webpack_require__(28515);
var USE_SYMBOL_AS_UID = __webpack_require__(56636);

var Symbol = globalThis.Symbol;
var WellKnownSymbolsStore = shared('wks');
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol['for'] || Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!hasOwn(WellKnownSymbolsStore, name)) {
    WellKnownSymbolsStore[name] = NATIVE_SYMBOL && hasOwn(Symbol, name)
      ? Symbol[name]
      : createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};


},
58733(module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var getBuiltIn = __webpack_require__(56771);
var hasOwn = __webpack_require__(63477);
var createNonEnumerableProperty = __webpack_require__(88663);
var isPrototypeOf = __webpack_require__(8229);
var setPrototypeOf = __webpack_require__(89883);
var copyConstructorProperties = __webpack_require__(4768);
var proxyAccessor = __webpack_require__(29268);
var inheritIfRequired = __webpack_require__(41627);
var normalizeStringArgument = __webpack_require__(57943);
var installErrorCause = __webpack_require__(94716);
var installErrorStack = __webpack_require__(46847);
var DESCRIPTORS = __webpack_require__(15144);
var IS_PURE = __webpack_require__(35919);

module.exports = function (FULL_NAME, wrapper, FORCED, IS_AGGREGATE_ERROR) {
  var STACK_TRACE_LIMIT = 'stackTraceLimit';
  var OPTIONS_POSITION = IS_AGGREGATE_ERROR ? 2 : 1;
  var path = FULL_NAME.split('.');
  var ERROR_NAME = path[path.length - 1];
  var OriginalError = getBuiltIn.apply(null, path);

  if (!OriginalError) return;

  var OriginalErrorPrototype = OriginalError.prototype;

  // V8 9.3- bug https://bugs.chromium.org/p/v8/issues/detail?id=12006
  if (!IS_PURE && hasOwn(OriginalErrorPrototype, 'cause')) delete OriginalErrorPrototype.cause;

  if (!FORCED) return OriginalError;

  var BaseError = getBuiltIn('Error');

  var WrappedError = wrapper(function (a, b) {
    var message = normalizeStringArgument(IS_AGGREGATE_ERROR ? b : a, undefined);
    var result = IS_AGGREGATE_ERROR ? new OriginalError(a) : new OriginalError();
    if (message !== undefined) createNonEnumerableProperty(result, 'message', message);
    installErrorStack(result, WrappedError, result.stack, 2);
    if (this && isPrototypeOf(OriginalErrorPrototype, this)) inheritIfRequired(result, this, WrappedError);
    if (arguments.length > OPTIONS_POSITION) installErrorCause(result, arguments[OPTIONS_POSITION]);
    return result;
  });

  WrappedError.prototype = OriginalErrorPrototype;

  if (ERROR_NAME !== 'Error') {
    if (setPrototypeOf) setPrototypeOf(WrappedError, BaseError);
    else copyConstructorProperties(WrappedError, BaseError, { name: true });
  } else if (DESCRIPTORS && STACK_TRACE_LIMIT in OriginalError) {
    proxyAccessor(WrappedError, OriginalError, STACK_TRACE_LIMIT);
    proxyAccessor(WrappedError, OriginalError, 'prepareStackTrace');
  }

  copyConstructorProperties(WrappedError, OriginalError);

  if (!IS_PURE) try {
    // Safari 13- bug: WebAssembly errors does not have a proper `.name`
    if (OriginalErrorPrototype.name !== ERROR_NAME) {
      createNonEnumerableProperty(OriginalErrorPrototype, 'name', ERROR_NAME);
    }
    OriginalErrorPrototype.constructor = WrappedError;
  } catch (error) { /* empty */ }

  return WrappedError;
};


},
45403(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var $ = __webpack_require__(3234);
var $includes = (__webpack_require__(17909)/* .includes */.includes);
var fails = __webpack_require__(63195);
var addToUnscopables = __webpack_require__(35681);

// FF99+ bug
var BROKEN_ON_SPARSE = fails(function () {
  // eslint-disable-next-line es/no-array-prototype-includes -- detection
  return !Array(1).includes();
});

// `Array.prototype.includes` method
// https://tc39.es/ecma262/#sec-array.prototype.includes
$({ target: 'Array', proto: true, forced: BROKEN_ON_SPARSE }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('includes');


},
75126(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var $ = __webpack_require__(3234);
var toObject = __webpack_require__(76945);
var lengthOfArrayLike = __webpack_require__(69290);
var setArrayLength = __webpack_require__(84811);
var doesNotExceedSafeInteger = __webpack_require__(68785);
var fails = __webpack_require__(63195);

var INCORRECT_TO_LENGTH = fails(function () {
  return [].push.call({ length: 0x100000000 }, 1) !== 4294967297;
});

// V8 <= 121 and Safari <= 15.4; FF < 23 throws InternalError
// https://bugs.chromium.org/p/v8/issues/detail?id=12681
var properErrorOnNonWritableLength = function () {
  try {
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    Object.defineProperty([], 'length', { writable: false }).push();
  } catch (error) {
    return error instanceof TypeError;
  }
};

var FORCED = INCORRECT_TO_LENGTH || !properErrorOnNonWritableLength();

// `Array.prototype.push` method
// https://tc39.es/ecma262/#sec-array.prototype.push
$({ target: 'Array', proto: true, arity: 1, forced: FORCED }, {
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  push: function push(item) {
    var O = toObject(this);
    var len = lengthOfArrayLike(O);
    var argCount = arguments.length;
    doesNotExceedSafeInteger(len + argCount);
    for (var i = 0; i < argCount; i++) {
      O[len] = arguments[i];
      len++;
    }
    setArrayLength(O, len);
    return len;
  }
});


},
80852(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var $ = __webpack_require__(3234);
var $reduce = (__webpack_require__(19450)/* .left */.left);
var arrayMethodIsStrict = __webpack_require__(37402);
var CHROME_VERSION = __webpack_require__(55011);
var IS_NODE = __webpack_require__(41573);

// Chrome 80-82 has a critical bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
var CHROME_BUG = !IS_NODE && CHROME_VERSION > 79 && CHROME_VERSION < 83;
var FORCED = CHROME_BUG || !arrayMethodIsStrict('reduce');

// `Array.prototype.reduce` method
// https://tc39.es/ecma262/#sec-array.prototype.reduce
$({ target: 'Array', proto: true, forced: FORCED }, {
  reduce: function reduce(callbackfn /* , initialValue */) {
    var length = arguments.length;
    return $reduce(this, callbackfn, length, length > 1 ? arguments[1] : undefined);
  }
});


},
38796(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

/* eslint-disable no-unused-vars -- required for functions `.length` */
var $ = __webpack_require__(3234);
var globalThis = __webpack_require__(95516);
var apply = __webpack_require__(86237);
var wrapErrorConstructorWithCause = __webpack_require__(58733);

var WEB_ASSEMBLY = 'WebAssembly';
var WebAssembly = globalThis[WEB_ASSEMBLY];

// eslint-disable-next-line es/no-error-cause -- feature detection
var FORCED = new Error('e', { cause: 7 }).cause !== 7;

var exportGlobalErrorCauseWrapper = function (ERROR_NAME, wrapper) {
  var O = {};
  O[ERROR_NAME] = wrapErrorConstructorWithCause(ERROR_NAME, wrapper, FORCED);
  $({ global: true, constructor: true, arity: 1, forced: FORCED }, O);
};

var exportWebAssemblyErrorCauseWrapper = function (ERROR_NAME, wrapper) {
  if (WebAssembly && WebAssembly[ERROR_NAME]) {
    var O = {};
    O[ERROR_NAME] = wrapErrorConstructorWithCause(WEB_ASSEMBLY + '.' + ERROR_NAME, wrapper, FORCED);
    $({ target: WEB_ASSEMBLY, stat: true, constructor: true, arity: 1, forced: FORCED }, O);
  }
};

// https://tc39.es/ecma262/#sec-nativeerror
exportGlobalErrorCauseWrapper('Error', function (init) {
  return function Error(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('EvalError', function (init) {
  return function EvalError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('RangeError', function (init) {
  return function RangeError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('ReferenceError', function (init) {
  return function ReferenceError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('SyntaxError', function (init) {
  return function SyntaxError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('TypeError', function (init) {
  return function TypeError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('URIError', function (init) {
  return function URIError(message) { return apply(init, this, arguments); };
});
exportWebAssemblyErrorCauseWrapper('CompileError', function (init) {
  return function CompileError(message) { return apply(init, this, arguments); };
});
exportWebAssemblyErrorCauseWrapper('LinkError', function (init) {
  return function LinkError(message) { return apply(init, this, arguments); };
});
exportWebAssemblyErrorCauseWrapper('RuntimeError', function (init) {
  return function RuntimeError(message) { return apply(init, this, arguments); };
});


},
73175(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var $ = __webpack_require__(3234);
var globalThis = __webpack_require__(95516);
var defineBuiltInAccessor = __webpack_require__(55390);
var DESCRIPTORS = __webpack_require__(15144);

var $TypeError = TypeError;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;
var INCORRECT_VALUE = globalThis.self !== globalThis;

// `self` getter
// https://html.spec.whatwg.org/multipage/window-object.html#dom-self
try {
  if (DESCRIPTORS) {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    var descriptor = Object.getOwnPropertyDescriptor(globalThis, 'self');
    // some engines have `self`, but with incorrect descriptor
    // https://github.com/denoland/deno/issues/15765
    if (INCORRECT_VALUE || !descriptor || !descriptor.get || !descriptor.enumerable) {
      defineBuiltInAccessor(globalThis, 'self', {
        get: function self() {
          return globalThis;
        },
        set: function self(value) {
          if (this !== globalThis) throw new $TypeError('Illegal invocation');
          defineProperty(globalThis, 'self', {
            value: value,
            writable: true,
            configurable: true,
            enumerable: true
          });
        },
        configurable: true,
        enumerable: true
      });
    }
  } else $({ global: true, simple: true, forced: INCORRECT_VALUE }, {
    self: globalThis
  });
} catch (error) { /* empty */ }


},
70279(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var defineBuiltIn = __webpack_require__(59356);
var uncurryThis = __webpack_require__(89852);
var toString = __webpack_require__(19419);
var validateArgumentsLength = __webpack_require__(8888);

var $URLSearchParams = URLSearchParams;
var URLSearchParamsPrototype = $URLSearchParams.prototype;
var append = uncurryThis(URLSearchParamsPrototype.append);
var $delete = uncurryThis(URLSearchParamsPrototype['delete']);
var forEach = uncurryThis(URLSearchParamsPrototype.forEach);
var push = uncurryThis([].push);
var params = new $URLSearchParams('a=1&a=2&b=3');

params['delete']('a', 1);
// `undefined` case is a Chromium 117 bug
// https://bugs.chromium.org/p/v8/issues/detail?id=14222
params['delete']('b', undefined);

if (params + '' !== 'a=2') {
  defineBuiltIn(URLSearchParamsPrototype, 'delete', function (name /* , value */) {
    var length = arguments.length;
    var $value = length < 2 ? undefined : arguments[1];
    if (length && $value === undefined) return $delete(this, name);
    var entries = [];
    forEach(this, function (v, k) { // also validates `this`
      push(entries, { key: k, value: v });
    });
    validateArgumentsLength(length, 1);
    var key = toString(name);
    var value = toString($value);
    var index = 0;
    var dindex = 0;
    var found = false;
    var entriesLength = entries.length;
    var entry;
    while (index < entriesLength) {
      entry = entries[index++];
      if (found || entry.key === key) {
        found = true;
        $delete(this, entry.key);
      } else dindex++;
    }
    while (dindex < entriesLength) {
      entry = entries[dindex++];
      if (!(entry.key === key && entry.value === value)) append(this, entry.key, entry.value);
    }
  }, { enumerable: true, unsafe: true });
}


},
16786(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var defineBuiltIn = __webpack_require__(59356);
var uncurryThis = __webpack_require__(89852);
var toString = __webpack_require__(19419);
var validateArgumentsLength = __webpack_require__(8888);

var $URLSearchParams = URLSearchParams;
var URLSearchParamsPrototype = $URLSearchParams.prototype;
var getAll = uncurryThis(URLSearchParamsPrototype.getAll);
var $has = uncurryThis(URLSearchParamsPrototype.has);
var params = new $URLSearchParams('a=1');

// `undefined` case is a Chromium 117 bug
// https://bugs.chromium.org/p/v8/issues/detail?id=14222
if (params.has('a', 2) || !params.has('a', undefined)) {
  defineBuiltIn(URLSearchParamsPrototype, 'has', function has(name /* , value */) {
    var length = arguments.length;
    var $value = length < 2 ? undefined : arguments[1];
    if (length && $value === undefined) return $has(this, name);
    var values = getAll(this, name); // also validates `this`
    validateArgumentsLength(length, 1);
    var value = toString($value);
    var index = 0;
    while (index < values.length) {
      if (values[index++] === value) return true;
    } return false;
  }, { enumerable: true, unsafe: true });
}


},
77269(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
"use strict";

var DESCRIPTORS = __webpack_require__(15144);
var uncurryThis = __webpack_require__(89852);
var defineBuiltInAccessor = __webpack_require__(55390);

var URLSearchParamsPrototype = URLSearchParams.prototype;
var forEach = uncurryThis(URLSearchParamsPrototype.forEach);

// `URLSearchParams.prototype.size` getter
// https://github.com/whatwg/url/pull/734
if (DESCRIPTORS && !('size' in URLSearchParamsPrototype)) {
  defineBuiltInAccessor(URLSearchParamsPrototype, 'size', {
    get: function size() {
      var count = 0;
      forEach(this, function () { count++; });
      return count;
    },
    configurable: true,
    enumerable: true
  });
}


},
44469(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  $b: () => (LogLevel),
  Vy: () => (Logger),
  u1: () => (getErrorMessage)
});
/**
 * Checks if error has message.
 *
 * @param error Error object.
 *
 * @returns True if error has message.
 */
function isErrorWithMessage(error) {
    return (typeof error === 'object'
        && error !== null
        && 'message' in error
        && typeof error.message === 'string');
}
/**
 * Converts error to the error with a message.
 *
 * @param maybeError Possible error.
 *
 * @returns Error with a message.
 */
function toErrorWithMessage(maybeError) {
    if (isErrorWithMessage(maybeError)) {
        return maybeError;
    }
    try {
        return new Error(JSON.stringify(maybeError));
    }
    catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references, for example.
        return new Error(String(maybeError));
    }
}
/**
 * Converts an error object to an error with a message. This method might be helpful to handle thrown errors.
 *
 * @param error Error object.
 *
 * @returns Message of the error.
 */
function getErrorMessage(error) {
    return toErrorWithMessage(error).message;
}

/**
 * Pads a number with leading zeros.
 *
 * @param num The number to pad.
 * @param size The number of digits to pad to.
 *
 * @returns The padded number.
 */
const pad = (num, size = 2) => {
    return num.toString().padStart(size, '0');
};
/**
 * Formats a date into an ISO 8601-like string with milliseconds.
 *
 * @param {Date|number} date The date object or timestamp to format.
 *
 * @returns {string} The formatted date string.
 */
const formatTime = (date) => {
    const d = (date instanceof Date) ? date : new Date(date);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1); // Months are 0-based
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    const second = pad(d.getSeconds());
    const millisecond = pad(d.getMilliseconds(), 3); // Milliseconds are 3 digits
    return `${year}-${month}-${day}T${hour}:${minute}:${second}:${millisecond}`;
};

/**
 * String presentation of log levels, for convenient users usage.
 * Ordered in the same way as LogLevelNumeric.
 *
 * First three levels will be shown to users, and the last two are for developers.
 */
var LogLevel;
(function (LogLevel) {
    /**
     * For errors.
     */
    LogLevel["Error"] = "error";
    /**
     * For not critical errors.
     */
    LogLevel["Warn"] = "warn";
    /**
     * For important information.
     * Use for general operational messages.
     */
    LogLevel["Info"] = "info";
    /**
     * For debugging purposes, e.g. Inside conditions, loops or some edge cases.
     */
    LogLevel["Debug"] = "debug";
    /**
     * For ultra-detailed, step-by-step traces (like stack traces or flow tracking).
     */
    LogLevel["Verbose"] = "verbose";
})(LogLevel || (LogLevel = {}));
/**
 * Log levels map, which maps number level to string level.
 * Ordered in the same way as LogLevelNumeric.
 */
const levelMapNumToString = {
    [1 /* LogLevelNumeric.Error */]: LogLevel.Error,
    [2 /* LogLevelNumeric.Warn */]: LogLevel.Warn,
    [3 /* LogLevelNumeric.Info */]: LogLevel.Info,
    [4 /* LogLevelNumeric.Debug */]: LogLevel.Debug,
    [5 /* LogLevelNumeric.Verbose */]: LogLevel.Verbose,
};
/**
 * Log levels map, which maps string level to number level.
 */
const levelMapStringToNum = Object.entries(levelMapNumToString)
    .reduce((acc, [key, value]) => {
    // Here, key is originally a string since Object.entries() returns [string, string][].
    // We need to cast the key to LogLevelNumeric correctly without causing type mismatches.
    const numericKey = Number(key);
    if (!Number.isNaN(numericKey)) {
        acc[value] = numericKey;
    }
    return acc;
}, {});
/**
 * Methods supported by console. Used to manage levels.
 * Ordered in the same way as LogLevelNumeric.
 */
var LogMethod;
(function (LogMethod) {
    LogMethod["Error"] = "error";
    LogMethod["Warn"] = "warn";
    LogMethod["Info"] = "info";
    LogMethod["Debug"] = "debug";
    LogMethod["Trace"] = "trace";
})(LogMethod || (LogMethod = {}));
/**
 * Simple logger with log levels.
 */
class Logger {
    currentLevelValue = 3 /* LogLevelNumeric.Info */;
    writer;
    /**
     * Constructor.
     *
     * @param writer Writer object.
     */
    constructor(writer = console) {
        this.writer = writer;
        // bind the logging methods to avoid losing context
        this.error = this.error.bind(this);
        this.warn = this.warn.bind(this);
        this.info = this.info.bind(this);
        this.debug = this.debug.bind(this);
        this.trace = this.trace.bind(this);
    }
    /**
     * Print error messages.
     * Use when something went wrong.
     *
     * @param args Printed arguments.
     */
    error(...args) {
        this.print(1 /* LogLevelNumeric.Error */, LogMethod.Error, args);
    }
    /**
     * Print warn messages.
     * Use when Something might go wrong.
     *
     * @param args Printed arguments.
     */
    warn(...args) {
        this.print(2 /* LogLevelNumeric.Warn */, LogMethod.Warn, args);
    }
    /**
     * Print messages you want to disclose to users.
     * Use for general operational messages.
     *
     * @param args Printed arguments.
     */
    info(...args) {
        this.print(3 /* LogLevelNumeric.Info */, LogMethod.Info, args);
    }
    /**
     * Print debug messages. Usually used for technical information.
     *
     * @param args Printed arguments.
     */
    debug(...args) {
        this.print(4 /* LogLevelNumeric.Debug */, LogMethod.Debug, args);
    }
    /**
     * Print trace messages.
     * Ultra-detailed, step-by-step traces (like stack traces or flow tracking).
     *
     * @param args Printed arguments.
     */
    trace(...args) {
        this.print(5 /* LogLevelNumeric.Verbose */, LogMethod.Trace, args);
    }
    /**
     * Getter for log level.
     *
     * @returns Logger level.
     */
    get currentLevel() {
        return levelMapNumToString[this.currentLevelValue];
    }
    /**
     * Setter for log level. With this method log level can be updated dynamically.
     *
     * @param logLevel Logger level.
     *
     * @throws Error if log level is not supported.
     */
    set currentLevel(logLevel) {
        const level = levelMapStringToNum[logLevel];
        if (level === undefined) {
            throw new Error(`Logger supports only the following levels: ${[Object.values(LogLevel).join(', ')]}`);
        }
        this.currentLevelValue = level;
    }
    /**
     * Converts error to string, and adds stack trace.
     *
     * @param error Error to print.
     *
     * @returns Error message.
     */
    static errorToString(error) {
        const message = getErrorMessage(error);
        return `${message}\nStack trace:\n${error.stack}`;
    }
    /**
     * Prints error message with stack trace.
     * It prints the message with the stack trace in a collapsed group.
     * This is useful for debugging purposes, as it allows to see the stack trace
     * without cluttering the console with too many messages.
     *
     * @param formattedTime Formatted time.
     * @param formattedArgs Formatted arguments.
     */
    printWithStackTrace(formattedTime, formattedArgs) {
        // If grouping is not supported, print just expanded trace, but this
        // leads to a lot of dirty logs in the console, since the stack trace
        // will be printed for every message.
        if (!this.writer.groupCollapsed || !this.writer.groupEnd) {
            // Print expanded trace
            this.writer.trace(formattedTime, ...formattedArgs);
            return;
        }
        // Print collapsed trace to make logs more readable and access to stack
        // trace by clicking on the group.
        this.writer.groupCollapsed(formattedTime, ...formattedArgs);
        this.writer.trace();
        this.writer.groupEnd();
    }
    /**
     * Wrapper over log methods.
     *
     * @param level Logger level.
     * @param method Logger method.
     * @param args Printed arguments.
     */
    print(level, method, args) {
        // Skip writing if the basic conditions are not met.
        if (this.currentLevelValue < level) {
            return;
        }
        // Do not print if no arguments are passed.
        if (!args || args.length === 0 || !args[0]) {
            return;
        }
        const formattedArgs = args.map((value) => {
            if (value instanceof Error) {
                return Logger.errorToString(value);
            }
            if (value && typeof value.message === 'string') {
                return value.message;
            }
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
            }
            return String(value);
        });
        const formattedTime = `${formatTime(new Date())}:`;
        /**
         * If current log level is Debug or Verbose, print all channels with stack
         * trace via using writer.trace method to help identify the location of the
         * log.
         *
         * Exception is Error method, because it is already contains build-in
         * stack trace.
         */
        if (this.currentLevelValue >= levelMapStringToNum[LogLevel.Debug]
            && method !== LogMethod.Error) {
            this.printWithStackTrace(formattedTime, formattedArgs);
            return;
        }
        // Otherwise just print with requested method of writer.
        this.writer[method](formattedTime, ...formattedArgs);
    }
}




},
46663(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  C: () => (copy)
});
/* import */ var is_what__rspack_import_0 = __webpack_require__(83919);


function assignProp(carry, key, newVal, originalObject, includeNonenumerable) {
  const propType = {}.propertyIsEnumerable.call(originalObject, key) ? "enumerable" : "nonenumerable";
  if (propType === "enumerable")
    carry[key] = newVal;
  if (includeNonenumerable && propType === "nonenumerable") {
    Object.defineProperty(carry, key, {
      value: newVal,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
}
function copy(target, options = {}) {
  if ((0,is_what__rspack_import_0/* .isArray */.cy)(target)) {
    return target.map((item) => copy(item, options));
  }
  if (!(0,is_what__rspack_import_0/* .isPlainObject */.Qd)(target)) {
    return target;
  }
  const props = Object.getOwnPropertyNames(target);
  const symbols = Object.getOwnPropertySymbols(target);
  return [...props, ...symbols].reduce((carry, key) => {
    if ((0,is_what__rspack_import_0/* .isArray */.cy)(options.props) && !options.props.includes(key)) {
      return carry;
    }
    const val = target[key];
    const newVal = copy(val, options);
    assignProp(carry, key, newVal, target, options.nonenumerable);
    return carry;
  }, {});
}




},
93051(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  MR: () => (deleteDB),
  P2: () => (openDB)
});
const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const transactionDoneMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    // This mapping exists in reverseTransformCache but doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(this.request);
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event));
    }
    return wrap(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
async function* iterate(...args) {
    // tslint:disable-next-line:no-this-assignment
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
        cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
        return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    // Map this double-proxy back to the original, so other cursor methods work.
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
        yield proxiedCursor;
        // If one of the advancing methods was not called, call continue().
        cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
        advanceResults.delete(proxiedCursor);
    }
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    },
}));




},
83919(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Qd: () => (isPlainObject),
  cy: () => (isArray)
});
function getType(payload) {
  return Object.prototype.toString.call(payload).slice(8, -1);
}

function isAnyObject(payload) {
  return getType(payload) === "Object";
}

function isArray(payload) {
  return getType(payload) === "Array";
}

function isBlob(payload) {
  return getType(payload) === "Blob";
}

function isBoolean(payload) {
  return getType(payload) === "Boolean";
}

function isDate(payload) {
  return getType(payload) === "Date" && !isNaN(payload);
}

function isEmptyArray(payload) {
  return isArray(payload) && payload.length === 0;
}

function isPlainObject(payload) {
  if (getType(payload) !== "Object")
    return false;
  const prototype = Object.getPrototypeOf(payload);
  return !!prototype && prototype.constructor === Object && prototype === Object.prototype;
}

function isEmptyObject(payload) {
  return isPlainObject(payload) && Object.keys(payload).length === 0;
}

function isEmptyString(payload) {
  return payload === "";
}

function isError(payload) {
  return getType(payload) === "Error" || payload instanceof Error;
}

function isFile(payload) {
  return getType(payload) === "File";
}

function isFullArray(payload) {
  return isArray(payload) && payload.length > 0;
}

function isFullObject(payload) {
  return isPlainObject(payload) && Object.keys(payload).length > 0;
}

function isString(payload) {
  return getType(payload) === "String";
}

function isFullString(payload) {
  return isString(payload) && payload !== "";
}

function isFunction(payload) {
  return typeof payload === "function";
}

function isType(payload, type) {
  if (!(type instanceof Function)) {
    throw new TypeError("Type must be a function");
  }
  if (!Object.prototype.hasOwnProperty.call(type, "prototype")) {
    throw new TypeError("Type is not a class");
  }
  const name = type.name;
  return getType(payload) === name || Boolean(payload && payload.constructor === type);
}

function isInstanceOf(value, classOrClassName) {
  if (typeof classOrClassName === "function") {
    for (let p = value; p; p = Object.getPrototypeOf(p)) {
      if (isType(p, classOrClassName)) {
        return true;
      }
    }
    return false;
  } else {
    for (let p = value; p; p = Object.getPrototypeOf(p)) {
      if (getType(p) === classOrClassName) {
        return true;
      }
    }
    return false;
  }
}

function isMap(payload) {
  return getType(payload) === "Map";
}

function isNaNValue(payload) {
  return getType(payload) === "Number" && isNaN(payload);
}

function isNumber(payload) {
  return getType(payload) === "Number" && !isNaN(payload);
}

function isNegativeNumber(payload) {
  return isNumber(payload) && payload < 0;
}

function isNull(payload) {
  return getType(payload) === "Null";
}

function isOneOf(a, b, c, d, e) {
  return (value) => a(value) || b(value) || !!c && c(value) || !!d && d(value) || !!e && e(value);
}

function isUndefined(payload) {
  return getType(payload) === "Undefined";
}

const isNullOrUndefined = isOneOf(isNull, isUndefined);

function isObject(payload) {
  return isPlainObject(payload);
}

function isObjectLike(payload) {
  return isAnyObject(payload);
}

function isPositiveNumber(payload) {
  return isNumber(payload) && payload > 0;
}

function isSymbol(payload) {
  return getType(payload) === "Symbol";
}

function isPrimitive(payload) {
  return isBoolean(payload) || isNull(payload) || isUndefined(payload) || isNumber(payload) || isString(payload) || isSymbol(payload);
}

function isPromise(payload) {
  return getType(payload) === "Promise";
}

function isRegExp(payload) {
  return getType(payload) === "RegExp";
}

function isSet(payload) {
  return getType(payload) === "Set";
}

function isWeakMap(payload) {
  return getType(payload) === "WeakMap";
}

function isWeakSet(payload) {
  return getType(payload) === "WeakSet";
}




},
6500(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Ak: () => (nanoid)
});

let random = bytes => crypto.getRandomValues(new Uint8Array(bytes))
let customRandom = (alphabet, defaultSize, getRandom) => {
  let mask = (2 << (Math.log(alphabet.length - 1) / Math.LN2)) - 1
  let step = -~((1.6 * mask * defaultSize) / alphabet.length)
  return (size = defaultSize) => {
    let id = ''
    while (true) {
      let bytes = getRandom(step)
      let j = step
      while (j--) {
        id += alphabet[bytes[j] & mask] || ''
        if (id.length === size) return id
      }
    }
  }
}
let customAlphabet = (alphabet, size = 21) =>
  customRandom(alphabet, size, random)
let nanoid = (size = 21) =>
  crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
    byte &= 63
    if (byte < 36) {
      id += byte.toString(36)
    } else if (byte < 62) {
      id += (byte - 26).toString(36).toUpperCase()
    } else if (byte > 62) {
      id += '-'
    } else {
      id += '_'
    }
    return id
  }, '')



},
33978(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  b: () => (getDeep),
  v: () => (setDeep)
});
/* import */ var _is_js__rspack_import_1 = __webpack_require__(23962);
/* import */ var _util_js__rspack_import_0 = __webpack_require__(73430);


const getNthKey = (value, n) => {
    const keys = value.keys();
    while (n > 0) {
        keys.next();
        n--;
    }
    return keys.next().value;
};
function validatePath(path) {
    if ((0,_util_js__rspack_import_0/* .includes */.mK)(path, '__proto__')) {
        throw new Error('__proto__ is not allowed as a property');
    }
    if ((0,_util_js__rspack_import_0/* .includes */.mK)(path, 'prototype')) {
        throw new Error('prototype is not allowed as a property');
    }
    if ((0,_util_js__rspack_import_0/* .includes */.mK)(path, 'constructor')) {
        throw new Error('constructor is not allowed as a property');
    }
}
const getDeep = (object, path) => {
    validatePath(path);
    for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if ((0,_is_js__rspack_import_1/* .isSet */.vM)(object)) {
            object = getNthKey(object, +key);
        }
        else if ((0,_is_js__rspack_import_1/* .isMap */.jh)(object)) {
            const row = +key;
            const type = +path[++i] === 0 ? 'key' : 'value';
            const keyOfRow = getNthKey(object, row);
            switch (type) {
                case 'key':
                    object = keyOfRow;
                    break;
                case 'value':
                    object = object.get(keyOfRow);
                    break;
            }
        }
        else {
            object = object[key];
        }
    }
    return object;
};
const setDeep = (object, path, mapper) => {
    validatePath(path);
    if (path.length === 0) {
        return mapper(object);
    }
    let parent = object;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if ((0,_is_js__rspack_import_1/* .isArray */.cy)(parent)) {
            const index = +key;
            parent = parent[index];
        }
        else if ((0,_is_js__rspack_import_1/* .isPlainObject */.Qd)(parent)) {
            parent = parent[key];
        }
        else if ((0,_is_js__rspack_import_1/* .isSet */.vM)(parent)) {
            const row = +key;
            parent = getNthKey(parent, row);
        }
        else if ((0,_is_js__rspack_import_1/* .isMap */.jh)(parent)) {
            const isEnd = i === path.length - 2;
            if (isEnd) {
                break;
            }
            const row = +key;
            const type = +path[++i] === 0 ? 'key' : 'value';
            const keyOfRow = getNthKey(parent, row);
            switch (type) {
                case 'key':
                    parent = keyOfRow;
                    break;
                case 'value':
                    parent = parent.get(keyOfRow);
                    break;
            }
        }
    }
    const lastKey = path[path.length - 1];
    if ((0,_is_js__rspack_import_1/* .isArray */.cy)(parent)) {
        parent[+lastKey] = mapper(parent[+lastKey]);
    }
    else if ((0,_is_js__rspack_import_1/* .isPlainObject */.Qd)(parent)) {
        parent[lastKey] = mapper(parent[lastKey]);
    }
    if ((0,_is_js__rspack_import_1/* .isSet */.vM)(parent)) {
        const oldValue = getNthKey(parent, +lastKey);
        const newValue = mapper(oldValue);
        if (oldValue !== newValue) {
            parent.delete(oldValue);
            parent.add(newValue);
        }
    }
    if ((0,_is_js__rspack_import_1/* .isMap */.jh)(parent)) {
        const row = +path[path.length - 2];
        const keyToRow = getNthKey(parent, row);
        const type = +lastKey === 0 ? 'key' : 'value';
        switch (type) {
            case 'key': {
                const newKey = mapper(keyToRow);
                parent.set(newKey, parent.get(keyToRow));
                if (newKey !== keyToRow) {
                    parent.delete(keyToRow);
                }
                break;
            }
            case 'value': {
                parent.set(keyToRow, mapper(parent.get(keyToRow)));
                break;
            }
        }
    }
    return object;
};


},
43402(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  _: () => (ClassRegistry)
});
/* import */ var _registry_js__rspack_import_0 = __webpack_require__(62477);

class ClassRegistry extends _registry_js__rspack_import_0/* .Registry */.O {
    constructor() {
        super(c => c.name);
        this.classToAllowedProps = new Map();
    }
    register(value, options) {
        if (typeof options === 'object') {
            if (options.allowProps) {
                this.classToAllowedProps.set(value, options.allowProps);
            }
            super.register(value, options.identifier);
        }
        else {
            super.register(value, options);
        }
    }
    getAllowedProps(value) {
        return this.classToAllowedProps.get(value);
    }
}


},
97847(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  u: () => (CustomTransformerRegistry)
});
/* import */ var _util_js__rspack_import_0 = __webpack_require__(73430);

class CustomTransformerRegistry {
    constructor() {
        this.transfomers = {};
    }
    register(transformer) {
        this.transfomers[transformer.name] = transformer;
    }
    findApplicable(v) {
        return (0,_util_js__rspack_import_0/* .find */.I6)(this.transfomers, transformer => transformer.isApplicable(v));
    }
    findByName(name) {
        return this.transfomers[name];
    }
}


},
75041(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Q: () => (DoubleIndexedKV)
});
class DoubleIndexedKV {
    constructor() {
        this.keyToValue = new Map();
        this.valueToKey = new Map();
    }
    set(key, value) {
        this.keyToValue.set(key, value);
        this.valueToKey.set(value, key);
    }
    getByKey(key) {
        return this.keyToValue.get(key);
    }
    getByValue(value) {
        return this.valueToKey.get(value);
    }
    clear() {
        this.keyToValue.clear();
        this.valueToKey.clear();
    }
}


},
49812(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  mb: () => (SuperJSON)
});
/* import */ var _class_registry_js__rspack_import_0 = __webpack_require__(43402);
/* import */ var _registry_js__rspack_import_2 = __webpack_require__(62477);
/* import */ var _custom_transformer_registry_js__rspack_import_3 = __webpack_require__(97847);
/* import */ var _plainer_js__rspack_import_1 = __webpack_require__(13911);
/* import */ var copy_anything__rspack_import_4 = __webpack_require__(46663);





class SuperJSON {
    /**
     * @param dedupeReferentialEqualities  If true, SuperJSON will make sure only one instance of referentially equal objects are serialized and the rest are replaced with `null`.
     */
    constructor({ dedupe = false, } = {}) {
        this.classRegistry = new _class_registry_js__rspack_import_0/* .ClassRegistry */._();
        this.symbolRegistry = new _registry_js__rspack_import_2/* .Registry */.O(s => s.description ?? '');
        this.customTransformerRegistry = new _custom_transformer_registry_js__rspack_import_3/* .CustomTransformerRegistry */.u();
        this.allowedErrorProps = [];
        this.dedupe = dedupe;
    }
    serialize(object) {
        const identities = new Map();
        const output = (0,_plainer_js__rspack_import_1/* .walker */.jc)(object, identities, this, this.dedupe);
        const res = {
            json: output.transformedValue,
        };
        if (output.annotations) {
            res.meta = {
                ...res.meta,
                values: output.annotations,
            };
        }
        const equalityAnnotations = (0,_plainer_js__rspack_import_1/* .generateReferentialEqualityAnnotations */.b$)(identities, this.dedupe);
        if (equalityAnnotations) {
            res.meta = {
                ...res.meta,
                referentialEqualities: equalityAnnotations,
            };
        }
        return res;
    }
    deserialize(payload) {
        const { json, meta } = payload;
        let result = (0,copy_anything__rspack_import_4/* .copy */.C)(json);
        if (meta?.values) {
            result = (0,_plainer_js__rspack_import_1/* .applyValueAnnotations */.m7)(result, meta.values, this);
        }
        if (meta?.referentialEqualities) {
            result = (0,_plainer_js__rspack_import_1/* .applyReferentialEqualityAnnotations */.Kc)(result, meta.referentialEqualities);
        }
        return result;
    }
    stringify(object) {
        return JSON.stringify(this.serialize(object));
    }
    parse(string) {
        return this.deserialize(JSON.parse(string));
    }
    registerClass(v, options) {
        this.classRegistry.register(v, options);
    }
    registerSymbol(v, identifier) {
        this.symbolRegistry.register(v, identifier);
    }
    registerCustom(transformer, name) {
        this.customTransformerRegistry.register({
            name,
            ...transformer,
        });
    }
    allowErrorProps(...props) {
        this.allowedErrorProps.push(...props);
    }
}
SuperJSON.defaultInstance = new SuperJSON();
SuperJSON.serialize = SuperJSON.defaultInstance.serialize.bind(SuperJSON.defaultInstance);
SuperJSON.deserialize = SuperJSON.defaultInstance.deserialize.bind(SuperJSON.defaultInstance);
SuperJSON.stringify = SuperJSON.defaultInstance.stringify.bind(SuperJSON.defaultInstance);
SuperJSON.parse = SuperJSON.defaultInstance.parse.bind(SuperJSON.defaultInstance);
SuperJSON.registerClass = SuperJSON.defaultInstance.registerClass.bind(SuperJSON.defaultInstance);
SuperJSON.registerSymbol = SuperJSON.defaultInstance.registerSymbol.bind(SuperJSON.defaultInstance);
SuperJSON.registerCustom = SuperJSON.defaultInstance.registerCustom.bind(SuperJSON.defaultInstance);
SuperJSON.allowErrorProps = SuperJSON.defaultInstance.allowErrorProps.bind(SuperJSON.defaultInstance);

const serialize = SuperJSON.serialize;
const deserialize = SuperJSON.deserialize;
const stringify = SuperJSON.stringify;
const parse = SuperJSON.parse;
const registerClass = SuperJSON.registerClass;
const registerCustom = SuperJSON.registerCustom;
const registerSymbol = SuperJSON.registerSymbol;
const allowErrorProps = SuperJSON.allowErrorProps;


},
23962(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  $P: () => (isDate),
  Bm: () => (isSymbol),
  Dh: () => (isInfinite),
  OH: () => (isBigint),
  Qd: () => (isPlainObject),
  RI: () => (isEmptyObject),
  XS: () => (isNaNValue),
  b0: () => (isUndefined),
  bJ: () => (isError),
  cy: () => (isArray),
  gd: () => (isRegExp),
  iu: () => (isTypedArray),
  jh: () => (isMap),
  mv: () => (isURL),
  sO: () => (isPrimitive),
  vM: () => (isSet)
});
const getType = (payload) => Object.prototype.toString.call(payload).slice(8, -1);
const isUndefined = (payload) => typeof payload === 'undefined';
const isNull = (payload) => payload === null;
const isPlainObject = (payload) => {
    if (typeof payload !== 'object' || payload === null)
        return false;
    if (payload === Object.prototype)
        return false;
    if (Object.getPrototypeOf(payload) === null)
        return true;
    return Object.getPrototypeOf(payload) === Object.prototype;
};
const isEmptyObject = (payload) => isPlainObject(payload) && Object.keys(payload).length === 0;
const isArray = (payload) => Array.isArray(payload);
const isString = (payload) => typeof payload === 'string';
const isNumber = (payload) => typeof payload === 'number' && !isNaN(payload);
const isBoolean = (payload) => typeof payload === 'boolean';
const isRegExp = (payload) => payload instanceof RegExp;
const isMap = (payload) => payload instanceof Map;
const isSet = (payload) => payload instanceof Set;
const isSymbol = (payload) => getType(payload) === 'Symbol';
const isDate = (payload) => payload instanceof Date && !isNaN(payload.valueOf());
const isError = (payload) => payload instanceof Error;
const isNaNValue = (payload) => typeof payload === 'number' && isNaN(payload);
const isPrimitive = (payload) => isBoolean(payload) ||
    isNull(payload) ||
    isUndefined(payload) ||
    isNumber(payload) ||
    isString(payload) ||
    isSymbol(payload);
const isBigint = (payload) => typeof payload === 'bigint';
const isInfinite = (payload) => payload === Infinity || payload === -Infinity;
const isTypedArray = (payload) => ArrayBuffer.isView(payload) && !(payload instanceof DataView);
const isURL = (payload) => payload instanceof URL;


},
81223(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  FU: () => (stringifyPath),
  Rr: () => (parsePath),
  jv: () => (escapeKey)
});
const escapeKey = (key) => key.replace(/\./g, '\\.');
const stringifyPath = (path) => path
    .map(String)
    .map(escapeKey)
    .join('.');
const parsePath = (string) => {
    const result = [];
    let segment = '';
    for (let i = 0; i < string.length; i++) {
        let char = string.charAt(i);
        const isEscapedDot = char === '\\' && string.charAt(i + 1) === '.';
        if (isEscapedDot) {
            segment += '.';
            i++;
            continue;
        }
        const isEndOfSegment = char === '.';
        if (isEndOfSegment) {
            result.push(segment);
            segment = '';
            continue;
        }
        segment += char;
    }
    const lastSegment = segment;
    result.push(lastSegment);
    return result;
};


},
13911(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Kc: () => (applyReferentialEqualityAnnotations),
  b$: () => (generateReferentialEqualityAnnotations),
  jc: () => (walker),
  m7: () => (applyValueAnnotations)
});
/* import */ var _is_js__rspack_import_1 = __webpack_require__(23962);
/* import */ var _pathstringifier_js__rspack_import_3 = __webpack_require__(81223);
/* import */ var _transformer_js__rspack_import_0 = __webpack_require__(94363);
/* import */ var _util_js__rspack_import_2 = __webpack_require__(73430);
/* import */ var _accessDeep_js__rspack_import_4 = __webpack_require__(33978);






function traverse(tree, walker, origin = []) {
    if (!tree) {
        return;
    }
    if (!(0,_is_js__rspack_import_1/* .isArray */.cy)(tree)) {
        (0,_util_js__rspack_import_2/* .forEach */.jJ)(tree, (subtree, key) => traverse(subtree, walker, [...origin, ...(0,_pathstringifier_js__rspack_import_3/* .parsePath */.Rr)(key)]));
        return;
    }
    const [nodeValue, children] = tree;
    if (children) {
        (0,_util_js__rspack_import_2/* .forEach */.jJ)(children, (child, key) => {
            traverse(child, walker, [...origin, ...(0,_pathstringifier_js__rspack_import_3/* .parsePath */.Rr)(key)]);
        });
    }
    walker(nodeValue, origin);
}
function applyValueAnnotations(plain, annotations, superJson) {
    traverse(annotations, (type, path) => {
        plain = (0,_accessDeep_js__rspack_import_4/* .setDeep */.v)(plain, path, v => (0,_transformer_js__rspack_import_0/* .untransformValue */.xp)(v, type, superJson));
    });
    return plain;
}
function applyReferentialEqualityAnnotations(plain, annotations) {
    function apply(identicalPaths, path) {
        const object = (0,_accessDeep_js__rspack_import_4/* .getDeep */.b)(plain, (0,_pathstringifier_js__rspack_import_3/* .parsePath */.Rr)(path));
        identicalPaths.map(_pathstringifier_js__rspack_import_3/* .parsePath */.Rr).forEach(identicalObjectPath => {
            plain = (0,_accessDeep_js__rspack_import_4/* .setDeep */.v)(plain, identicalObjectPath, () => object);
        });
    }
    if ((0,_is_js__rspack_import_1/* .isArray */.cy)(annotations)) {
        const [root, other] = annotations;
        root.forEach(identicalPath => {
            plain = (0,_accessDeep_js__rspack_import_4/* .setDeep */.v)(plain, (0,_pathstringifier_js__rspack_import_3/* .parsePath */.Rr)(identicalPath), () => plain);
        });
        if (other) {
            (0,_util_js__rspack_import_2/* .forEach */.jJ)(other, apply);
        }
    }
    else {
        (0,_util_js__rspack_import_2/* .forEach */.jJ)(annotations, apply);
    }
    return plain;
}
const isDeep = (object, superJson) => (0,_is_js__rspack_import_1/* .isPlainObject */.Qd)(object) ||
    (0,_is_js__rspack_import_1/* .isArray */.cy)(object) ||
    (0,_is_js__rspack_import_1/* .isMap */.jh)(object) ||
    (0,_is_js__rspack_import_1/* .isSet */.vM)(object) ||
    (0,_transformer_js__rspack_import_0/* .isInstanceOfRegisteredClass */.TT)(object, superJson);
function addIdentity(object, path, identities) {
    const existingSet = identities.get(object);
    if (existingSet) {
        existingSet.push(path);
    }
    else {
        identities.set(object, [path]);
    }
}
function generateReferentialEqualityAnnotations(identitites, dedupe) {
    const result = {};
    let rootEqualityPaths = undefined;
    identitites.forEach(paths => {
        if (paths.length <= 1) {
            return;
        }
        // if we're not deduping, all of these objects continue existing.
        // putting the shortest path first makes it easier to parse for humans
        // if we're deduping though, only the first entry will still exist, so we can't do this optimisation.
        if (!dedupe) {
            paths = paths
                .map(path => path.map(String))
                .sort((a, b) => a.length - b.length);
        }
        const [representativePath, ...identicalPaths] = paths;
        if (representativePath.length === 0) {
            rootEqualityPaths = identicalPaths.map(_pathstringifier_js__rspack_import_3/* .stringifyPath */.FU);
        }
        else {
            result[(0,_pathstringifier_js__rspack_import_3/* .stringifyPath */.FU)(representativePath)] = identicalPaths.map(_pathstringifier_js__rspack_import_3/* .stringifyPath */.FU);
        }
    });
    if (rootEqualityPaths) {
        if ((0,_is_js__rspack_import_1/* .isEmptyObject */.RI)(result)) {
            return [rootEqualityPaths];
        }
        else {
            return [rootEqualityPaths, result];
        }
    }
    else {
        return (0,_is_js__rspack_import_1/* .isEmptyObject */.RI)(result) ? undefined : result;
    }
}
const walker = (object, identities, superJson, dedupe, path = [], objectsInThisPath = [], seenObjects = new Map()) => {
    const primitive = (0,_is_js__rspack_import_1/* .isPrimitive */.sO)(object);
    if (!primitive) {
        addIdentity(object, path, identities);
        const seen = seenObjects.get(object);
        if (seen) {
            // short-circuit result if we've seen this object before
            return dedupe
                ? {
                    transformedValue: null,
                }
                : seen;
        }
    }
    if (!isDeep(object, superJson)) {
        const transformed = (0,_transformer_js__rspack_import_0/* .transformValue */.oV)(object, superJson);
        const result = transformed
            ? {
                transformedValue: transformed.value,
                annotations: [transformed.type],
            }
            : {
                transformedValue: object,
            };
        if (!primitive) {
            seenObjects.set(object, result);
        }
        return result;
    }
    if ((0,_util_js__rspack_import_2/* .includes */.mK)(objectsInThisPath, object)) {
        // prevent circular references
        return {
            transformedValue: null,
        };
    }
    const transformationResult = (0,_transformer_js__rspack_import_0/* .transformValue */.oV)(object, superJson);
    const transformed = transformationResult?.value ?? object;
    const transformedValue = (0,_is_js__rspack_import_1/* .isArray */.cy)(transformed) ? [] : {};
    const innerAnnotations = {};
    (0,_util_js__rspack_import_2/* .forEach */.jJ)(transformed, (value, index) => {
        if (index === '__proto__' ||
            index === 'constructor' ||
            index === 'prototype') {
            throw new Error(`Detected property ${index}. This is a prototype pollution risk, please remove it from your object.`);
        }
        const recursiveResult = walker(value, identities, superJson, dedupe, [...path, index], [...objectsInThisPath, object], seenObjects);
        transformedValue[index] = recursiveResult.transformedValue;
        if ((0,_is_js__rspack_import_1/* .isArray */.cy)(recursiveResult.annotations)) {
            innerAnnotations[index] = recursiveResult.annotations;
        }
        else if ((0,_is_js__rspack_import_1/* .isPlainObject */.Qd)(recursiveResult.annotations)) {
            (0,_util_js__rspack_import_2/* .forEach */.jJ)(recursiveResult.annotations, (tree, key) => {
                innerAnnotations[(0,_pathstringifier_js__rspack_import_3/* .escapeKey */.jv)(index) + '.' + key] = tree;
            });
        }
    });
    const result = (0,_is_js__rspack_import_1/* .isEmptyObject */.RI)(innerAnnotations)
        ? {
            transformedValue,
            annotations: !!transformationResult
                ? [transformationResult.type]
                : undefined,
        }
        : {
            transformedValue,
            annotations: !!transformationResult
                ? [transformationResult.type, innerAnnotations]
                : innerAnnotations,
        };
    if (!primitive) {
        seenObjects.set(object, result);
    }
    return result;
};


},
62477(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  O: () => (Registry)
});
/* import */ var _double_indexed_kv_js__rspack_import_0 = __webpack_require__(75041);

class Registry {
    constructor(generateIdentifier) {
        this.generateIdentifier = generateIdentifier;
        this.kv = new _double_indexed_kv_js__rspack_import_0/* .DoubleIndexedKV */.Q();
    }
    register(value, identifier) {
        if (this.kv.getByValue(value)) {
            return;
        }
        if (!identifier) {
            identifier = this.generateIdentifier(value);
        }
        this.kv.set(identifier, value);
    }
    clear() {
        this.kv.clear();
    }
    getIdentifier(value) {
        return this.kv.getByValue(value);
    }
    getValue(identifier) {
        return this.kv.getByKey(identifier);
    }
}


},
94363(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  TT: () => (isInstanceOfRegisteredClass),
  oV: () => (transformValue),
  xp: () => (untransformValue)
});
/* import */ var _is_js__rspack_import_0 = __webpack_require__(23962);
/* import */ var _util_js__rspack_import_1 = __webpack_require__(73430);


function simpleTransformation(isApplicable, annotation, transform, untransform) {
    return {
        isApplicable,
        annotation,
        transform,
        untransform,
    };
}
const simpleRules = [
    simpleTransformation(_is_js__rspack_import_0/* .isUndefined */.b0, 'undefined', () => null, () => undefined),
    simpleTransformation(_is_js__rspack_import_0/* .isBigint */.OH, 'bigint', v => v.toString(), v => {
        if (typeof BigInt !== 'undefined') {
            return BigInt(v);
        }
        console.error('Please add a BigInt polyfill.');
        return v;
    }),
    simpleTransformation(_is_js__rspack_import_0/* .isDate */.$P, 'Date', v => v.toISOString(), v => new Date(v)),
    simpleTransformation(_is_js__rspack_import_0/* .isError */.bJ, 'Error', (v, superJson) => {
        const baseError = {
            name: v.name,
            message: v.message,
        };
        superJson.allowedErrorProps.forEach(prop => {
            baseError[prop] = v[prop];
        });
        return baseError;
    }, (v, superJson) => {
        const e = new Error(v.message);
        e.name = v.name;
        e.stack = v.stack;
        superJson.allowedErrorProps.forEach(prop => {
            e[prop] = v[prop];
        });
        return e;
    }),
    simpleTransformation(_is_js__rspack_import_0/* .isRegExp */.gd, 'regexp', v => '' + v, regex => {
        const body = regex.slice(1, regex.lastIndexOf('/'));
        const flags = regex.slice(regex.lastIndexOf('/') + 1);
        return new RegExp(body, flags);
    }),
    simpleTransformation(_is_js__rspack_import_0/* .isSet */.vM, 'set', 
    // (sets only exist in es6+)
    // eslint-disable-next-line es5/no-es6-methods
    v => [...v.values()], v => new Set(v)),
    simpleTransformation(_is_js__rspack_import_0/* .isMap */.jh, 'map', v => [...v.entries()], v => new Map(v)),
    simpleTransformation((v) => (0,_is_js__rspack_import_0/* .isNaNValue */.XS)(v) || (0,_is_js__rspack_import_0/* .isInfinite */.Dh)(v), 'number', v => {
        if ((0,_is_js__rspack_import_0/* .isNaNValue */.XS)(v)) {
            return 'NaN';
        }
        if (v > 0) {
            return 'Infinity';
        }
        else {
            return '-Infinity';
        }
    }, Number),
    simpleTransformation((v) => v === 0 && 1 / v === -Infinity, 'number', () => {
        return '-0';
    }, Number),
    simpleTransformation(_is_js__rspack_import_0/* .isURL */.mv, 'URL', v => v.toString(), v => new URL(v)),
];
function compositeTransformation(isApplicable, annotation, transform, untransform) {
    return {
        isApplicable,
        annotation,
        transform,
        untransform,
    };
}
const symbolRule = compositeTransformation((s, superJson) => {
    if ((0,_is_js__rspack_import_0/* .isSymbol */.Bm)(s)) {
        const isRegistered = !!superJson.symbolRegistry.getIdentifier(s);
        return isRegistered;
    }
    return false;
}, (s, superJson) => {
    const identifier = superJson.symbolRegistry.getIdentifier(s);
    return ['symbol', identifier];
}, v => v.description, (_, a, superJson) => {
    const value = superJson.symbolRegistry.getValue(a[1]);
    if (!value) {
        throw new Error('Trying to deserialize unknown symbol');
    }
    return value;
});
const constructorToName = [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    Uint8ClampedArray,
].reduce((obj, ctor) => {
    obj[ctor.name] = ctor;
    return obj;
}, {});
const typedArrayRule = compositeTransformation(_is_js__rspack_import_0/* .isTypedArray */.iu, v => ['typed-array', v.constructor.name], v => [...v], (v, a) => {
    const ctor = constructorToName[a[1]];
    if (!ctor) {
        throw new Error('Trying to deserialize unknown typed array');
    }
    return new ctor(v);
});
function isInstanceOfRegisteredClass(potentialClass, superJson) {
    if (potentialClass?.constructor) {
        const isRegistered = !!superJson.classRegistry.getIdentifier(potentialClass.constructor);
        return isRegistered;
    }
    return false;
}
const classRule = compositeTransformation(isInstanceOfRegisteredClass, (clazz, superJson) => {
    const identifier = superJson.classRegistry.getIdentifier(clazz.constructor);
    return ['class', identifier];
}, (clazz, superJson) => {
    const allowedProps = superJson.classRegistry.getAllowedProps(clazz.constructor);
    if (!allowedProps) {
        return { ...clazz };
    }
    const result = {};
    allowedProps.forEach(prop => {
        result[prop] = clazz[prop];
    });
    return result;
}, (v, a, superJson) => {
    const clazz = superJson.classRegistry.getValue(a[1]);
    if (!clazz) {
        throw new Error('Trying to deserialize unknown class - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564');
    }
    return Object.assign(Object.create(clazz.prototype), v);
});
const customRule = compositeTransformation((value, superJson) => {
    return !!superJson.customTransformerRegistry.findApplicable(value);
}, (value, superJson) => {
    const transformer = superJson.customTransformerRegistry.findApplicable(value);
    return ['custom', transformer.name];
}, (value, superJson) => {
    const transformer = superJson.customTransformerRegistry.findApplicable(value);
    return transformer.serialize(value);
}, (v, a, superJson) => {
    const transformer = superJson.customTransformerRegistry.findByName(a[1]);
    if (!transformer) {
        throw new Error('Trying to deserialize unknown custom value');
    }
    return transformer.deserialize(v);
});
const compositeRules = [classRule, symbolRule, customRule, typedArrayRule];
const transformValue = (value, superJson) => {
    const applicableCompositeRule = (0,_util_js__rspack_import_1/* .findArr */.Zy)(compositeRules, rule => rule.isApplicable(value, superJson));
    if (applicableCompositeRule) {
        return {
            value: applicableCompositeRule.transform(value, superJson),
            type: applicableCompositeRule.annotation(value, superJson),
        };
    }
    const applicableSimpleRule = (0,_util_js__rspack_import_1/* .findArr */.Zy)(simpleRules, rule => rule.isApplicable(value, superJson));
    if (applicableSimpleRule) {
        return {
            value: applicableSimpleRule.transform(value, superJson),
            type: applicableSimpleRule.annotation,
        };
    }
    return undefined;
};
const simpleRulesByAnnotation = {};
simpleRules.forEach(rule => {
    simpleRulesByAnnotation[rule.annotation] = rule;
});
const untransformValue = (json, type, superJson) => {
    if ((0,_is_js__rspack_import_0/* .isArray */.cy)(type)) {
        switch (type[0]) {
            case 'symbol':
                return symbolRule.untransform(json, type, superJson);
            case 'class':
                return classRule.untransform(json, type, superJson);
            case 'custom':
                return customRule.untransform(json, type, superJson);
            case 'typed-array':
                return typedArrayRule.untransform(json, type, superJson);
            default:
                throw new Error('Unknown transformation: ' + type);
        }
    }
    else {
        const transformation = simpleRulesByAnnotation[type];
        if (!transformation) {
            throw new Error('Unknown transformation: ' + type);
        }
        return transformation.untransform(json, superJson);
    }
};


},
73430(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  I6: () => (find),
  Zy: () => (findArr),
  jJ: () => (forEach),
  mK: () => (includes)
});
function valuesOfObj(record) {
    if ('values' in Object) {
        // eslint-disable-next-line es5/no-es6-methods
        return Object.values(record);
    }
    const values = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const key in record) {
        if (record.hasOwnProperty(key)) {
            values.push(record[key]);
        }
    }
    return values;
}
function find(record, predicate) {
    const values = valuesOfObj(record);
    if ('find' in values) {
        // eslint-disable-next-line es5/no-es6-methods
        return values.find(predicate);
    }
    const valuesNotNever = values;
    for (let i = 0; i < valuesNotNever.length; i++) {
        const value = valuesNotNever[i];
        if (predicate(value)) {
            return value;
        }
    }
    return undefined;
}
function forEach(record, run) {
    Object.entries(record).forEach(([key, value]) => run(value, key));
}
function includes(arr, value) {
    return arr.indexOf(value) !== -1;
}
function findArr(record, predicate) {
    for (let i = 0; i < record.length; i++) {
        const value = record[i];
        if (predicate(value)) {
            return value;
        }
    }
    return undefined;
}


},
21987(module) {
"use strict";
module.exports = JSON.parse('{"options_clipboard_permission_warning":{"message":"To copy and paste rules, allow AdGuard to access the clipboard. <a>Allow</a>"},"options_popup_title_placeholder":{"message":"Enter a filter name"},"options_filters_list_search_display_option_all_filters":{"message":"All filters"},"options_filters_list_search_display_option_enabled":{"message":"Enabled"},"options_filters_list_search_display_option_disabled":{"message":"Disabled"},"options_filters_empty_title":{"message":"Nothing found"},"options_filters_of_group":{"message":"Filters of \\"%groupName%\\" group"},"options_antibanner_custom_filter_already_exists":{"message":"This custom filter has already been added"},"options_filters_annoyances_consent_title":{"message":"Please read carefully before enabling annoyance filters"},"options_filters_annoyances_consent_description":{"message":"You are about to enable one or more annoyance filters. They block elements that are either unrelated to website content or related but annoying to your user experience. Website owners may consider these elements mandatory: if you block them, you may be violating their terms; some functionality of websites may not be available or may not work properly. You understand and agree that you are solely responsible to comply with the terms of use of websites you visit and that AdGuard is not responsible for your compliance with the terms of use of websites you visit using our products."},"options_filters_annoyances_consent_question":{"message":"Enable these filters?"},"options_filters_annoyances_consent_filter_policy":{"message":"For details on what AdGuard’s annoyance filters block, see <a>Filter policy</a>"},"options_filters_annoyances_consent_enable_button":{"message":"Enable"},"options_filters_annoyances_consent_filter_homepage_tooltip":{"message":"Homepage"},"popup_header_cta_link":{"message":"How to enhance protection"},"popup_get_system_wide_protection":{"message":"Get system-wide protection"},"popup_header_update_filters":{"message":"Check for filter updates"},"options_popup_import_settings_wrong_file_ext":{"message":"The file extension must be %extension%"},"popup_resume_protection_button":{"message":"Resume"},"popup_adguard_for_ios":{"message":"AdGuard for iOS"},"popup_adguard_for_android":{"message":"AdGuard for Android"},"options_filters_filter_version":{"message":"version:"},"options_filters_filter_link":{"message":"Go to homepage"},"options_filters_filter_updated":{"message":"updated:"},"options_filters_filter_tags":{"message":"Filter tags"},"options_filters_back_button":{"message":"Go back"},"options_popup_version_update_disable_notification":{"message":"Disable notifications"},"popup_adguard_footer_title":{"message":"Protect your mobile device"},"options_popup_call_to_action":{"message":"Enter the valid URL or file path of the filter into the field above."},"options_popup_description":{"message":"You will be subscribed to that filter."},"options_popup_url_title":{"message":"New filter subscription"},"options_popup_url_placeholder":{"message":"Enter URL or file path"},"options_popup_next_button":{"message":"Next"},"options_popup_checking_filter":{"message":"Checking your filter"},"options_popup_check_false_title":{"message":"Error"},"options_popup_check_false_description":{"message":"Error while adding your custom filter."},"options_add_custom_filter_modal_title":{"message":"Add custom filter"},"options_add_custom_filter_modal_checking_filter":{"message":"Checking your filter..."},"options_add_custom_filter_modal_error_title":{"message":"Failed to add custom filter"},"options_add_custom_filter_modal_error_subtitle":{"message":"Please try again or contact support"},"options_add_custom_filter_modal_error_html_content":{"message":"The URL returned a web page instead of a filter list. Please provide a direct link to the filter file."},"options_add_custom_filter_modal_add_button":{"message":"Add"},"options_add_custom_filter_modal_filter_name":{"message":"Filter name:"},"options_add_custom_filter_modal_filter_trusted":{"message":"Trusted"},"options_add_custom_filter_modal_filter_trusted_description":{"message":"Some filter rules can significantly alter your browsing experience and compromise your privacy. Make sure to only use filters from developers you trust"},"options_popup_try_again_button":{"message":"Try again"},"options_popup_filter_title":{"message":"Title:"},"options_popup_filter_description":{"message":"Description:"},"options_popup_filter_version":{"message":"Version:"},"options_popup_filter_rules_count":{"message":"Rules count:"},"options_popup_filter_homepage":{"message":"Homepage:"},"options_popup_filter_url":{"message":"URL"},"options_popup_subscribe_button":{"message":"Subscribe"},"name":{"message":"AdGuard AdBlocker"},"description":{"message":"Unmatched adblock extension against advertising and pop-ups. Blocks ads on Facebook, YouTube and all other websites.","description":"TEXT MAX LENGTH: 132"},"popup_tooltip_protection_enabled":{"message":"Protection enabled"},"popup_tooltip_protection_disabled":{"message":"Protection disabled"},"popup_tooltip_some_rules_not_applied":{"message":"Some rules not applied"},"popup_tooltip_update_available":{"message":"Update available"},"popup_tooltip_loading":{"message":"Loading..."},"background_tab_title":{"message":"Background tab"},"options_allowlist":{"message":"Allowlist"},"options_allowlist_desc":{"message":"AdGuard doesn’t block ads and trackers on websites from the list"},"options_allowlist_invert":{"message":"Invert allowlist"},"options_allowlist_invert_desc":{"message":"Blocks ads and trackers on allowlisted websites only"},"options_allowlist_alert_invert":{"message":"Allowlist is inverted. Ads are blocked only on websites added to it. <a>Disable</a>"},"options_allowlist_leave_subtitle":{"message":"Your changes to Allowlist will be lost"},"options_allowlist_invalid_entries":{"message":"To save, keep only domains or URLs. These need fixing: %entries%"},"options_userfilter":{"message":"User rules"},"filtering_log_modified_rules":{"message":"Modified rules: %rules_count%"},"filtering_log_stealth_rules":{"message":"Tracking protection rules: %rules_count%"},"filtering_log_privacy_applied_rules":{"message":"Tracking protection applied"},"filtering_log_in_allowlist":{"message":"The site is allowed"},"filtering_log_hide_referrer":{"message":"Referer hidden from third-parties"},"filtering_log_hide_search_queries":{"message":"Your search queries hidden"},"filtering_log_remove_client_data":{"message":"X-Client-Data header removed"},"filtering_log_send_not_track":{"message":"Do-Not-Track header sent"},"options_select_update_period_default":{"message":"Default"},"options_select_update_period_48h":{"message":"48 hours"},"options_select_update_period_24h":{"message":"24 hours"},"options_select_update_period_12h":{"message":"12 hours"},"options_select_update_period_6h":{"message":"6 hours"},"options_select_update_period_1h":{"message":"1 hour"},"options_select_update_period_disabled":{"message":"Disabled"},"options_filters":{"message":"Filters"},"options_antibanner_rules_count":{"message":"Rules: %rules_count%"},"options_antibanner_updated":{"message":"Updated: %date%"},"options_antibanner_custom_group":{"message":"Custom"},"options_antibanner_custom_group_description":{"message":"Allows you to add filters from a file or URL"},"options_filters_enabled_per_group":{"message":"Enabled: %current% of %total%"},"options_filters_enabled":{"message":"Enabled:"},"options_filters_enabled_and_more":{"message":"%enabled% and %more% more"},"options_filters_enabled_and_last":{"message":"%enabled% and %last%"},"options_filters_no_enabled":{"message":"No filters enabled"},"options_filters_filter_trusted_tag_desc":{"message":"You chose to trust this filter."},"options_filters_info_mv3_total_rules":{"message":"Total rules: %num%"},"options_add_custom_filter":{"message":"Add custom filter"},"options_empty_custom_filter":{"message":"You don\'t have any custom filters yet"},"options_loader_applying_changes":{"message":"Applying changes..."},"options_editor_indicator_saving":{"message":"Saving..."},"options_editor_indicator_saved":{"message":"Saved"},"options_editor_save_error":{"message":"Failed to save the changes. Try again or contact support"},"options_popup_import_error_required_privacy_permission":{"message":"To import this settings file, allow AdGuard to change your privacy-related settings."},"options_popup_import_success_title":{"message":"Settings imported"},"options_popup_import_error_title":{"message":"Failed to import settings"},"options_popup_import_error_file_description":{"message":"Something went wrong."},"options_popup_trusted_filter_title":{"message":"Trusted"},"options_popup_trusted_filter_description":{"message":"Trusted filters can use powerful filtering rules modifiers which can be dangerous in the wrong hands. Do not check this box unless you fully trust it."},"popup_site_filtering_state_secure_page":{"message":"Secure page"},"popup_site_filtering_state_loading":{"message":"Loading..."},"popup_site_filtering_state_enabling":{"message":"Enabling protection..."},"popup_site_filtering_state_enabled":{"message":"Protection is enabled"},"popup_site_filtering_state_disabling":{"message":"Disabling protection..."},"popup_site_filtering_state_disabled":{"message":"Protection is disabled"},"popup_site_filtering_state_pausing":{"message":"Pausing protection..."},"popup_site_filtering_state_paused":{"message":"Protection is paused"},"popup_site_filtering_state_resuming":{"message":"Resuming protection..."},"popup_site_filtering_state_subtitle_all_websites":{"message":"for all websites"},"popup_site_exception_information":{"message":"Filtering is disabled because it can interfere with this website\'s operation."},"popup_tab_current_website":{"message":"Current website"},"popup_tab_blocked_count":{"message":"Blocked: %num%"},"popup_tab_blocked_all_count":{"message":"Total blocked: %num%"},"popup_statistics_total":{"message":"Total"},"popup_statistics_category_label":{"message":"Statistics category"},"popup_statistics_all_categories":{"message":"All"},"popup_statistics_category_advertising":{"message":"Ads"},"popup_statistics_category_trackers":{"message":"Trackers"},"popup_statistics_category_social_media":{"message":"Social media"},"popup_statistics_category_cdn":{"message":"CDN"},"popup_statistics_category_other":{"message":"Other"},"popup_statistics_week_days_mon":{"message":"Mon"},"popup_statistics_week_days_tue":{"message":"Tue"},"popup_statistics_week_days_wed":{"message":"Wed"},"popup_statistics_week_days_thu":{"message":"Thu"},"popup_statistics_week_days_fri":{"message":"Fri"},"popup_statistics_week_days_sat":{"message":"Sat"},"popup_statistics_week_days_sun":{"message":"Sun"},"popup_statistics_months_jan":{"message":"Jan"},"popup_statistics_months_feb":{"message":"Feb"},"popup_statistics_months_mar":{"message":"Mar"},"popup_statistics_months_apr":{"message":"Apr"},"popup_statistics_months_may":{"message":"May"},"popup_statistics_months_jun":{"message":"Jun"},"popup_statistics_months_jul":{"message":"Jul"},"popup_statistics_months_aug":{"message":"Aug"},"popup_statistics_months_sep":{"message":"Sep"},"popup_statistics_months_oct":{"message":"Oct"},"popup_statistics_months_nov":{"message":"Nov"},"popup_statistics_months_dec":{"message":"Dec"},"options_popup_updating_filters":{"message":"Updating filters..."},"options_popup_update_title_error":{"message":"Error updating filters"},"options_popup_update_not_found":{"message":"Your filters are up to date"},"options_popup_update_error":{"message":"Failed to get updates. Please try again later."},"options_popup_update_filter":{"message":"was updated."},"options_popup_update_filters":{"message":"were updated."},"options_popup_version_update_title_text":{"message":"AdGuard extension has been updated to version %current_version%"},"options_popup_version_update_description_minor":{"message":"This version contains mostly bugfixes and minor improvements."},"options_popup_version_update_description_major":{"message":"This is a major extension upgrade that brings a lot of new features and improvements."},"options_popup_version_update_changelog_text":{"message":"What\'s new in this version?"},"options_popup_version_update_offer":{"message":"Did you know that AdGuard capabilities are not limited to this browser?"},"options_popup_version_update_offer_button_text":{"message":"LEARN MORE"},"popup_block_site_ads_option":{"message":"Block ads manually"},"popup_security_report":{"message":"Check website security"},"popup_reset_page_user_rules":{"message":"Delete user rules for this website"},"popup_open_settings":{"message":"Open AdGuard settings"},"popup_protection_button":{"message":"AdGuard protection"},"context_block_site_ads":{"message":"Block ads manually"},"context_security_report":{"message":"Check website security"},"context_complaint_website":{"message":"Report an issue"},"context_site_filtering_disabled":{"message":"AdGuard can\'t filter this page"},"context_disable_protection":{"message":"Pause AdGuard protection"},"context_enable_protection":{"message":"Resume AdGuard protection"},"context_site_protection_disabled":{"message":"AdGuard protection is paused"},"context_open_settings":{"message":"AdGuard settings"},"context_open_log":{"message":"Filtering log"},"context_site_exception":{"message":"This website is in the exceptions"},"context_site_filtering_on":{"message":"Enable filtering on this website"},"context_site_filtering_off":{"message":"Disable filtering on this website"},"context_update_antibanner_filters":{"message":"Check for filter updates"},"alert_popup_filter_enabled_title":{"message":"Auto-activation of the filters"},"alert_popup_filter_enabled_desc":{"message":"%filter_name% has been activated automatically."},"filters_download_title":{"message":"Filters database is loading..."},"filters_download_loading":{"message":"Please wait while filters database is loading..."},"post_install_loading":{"message":"Loading extension..."},"filtering_modal_element":{"message":"Element:"},"filtering_modal_cookie":{"message":"Cookie:"},"filtering_modal_important":{"message":"Give a higher priority to the rule"},"filtering_log_title":{"message":"Filtering log"},"filtering_log_search_string":{"message":"Search"},"filtering_log_search_tabs_placeholder":{"message":"Search in tabs"},"filtering_log_preserve_log_off":{"message":"Do not preserve log"},"filtering_log_preserve_log_on":{"message":"Preserve log"},"filtering_refresh_tab_short":{"message":"Refresh"},"filtering_refresh_tab_short_mobile":{"message":"Refresh page"},"filtering_menu_open_filters":{"message":"Customize"},"filtering_clear_log_events":{"message":"Clear log"},"filtering_type_all":{"message":"All"},"filtering_type_other":{"message":"Other"},"filtering_table_status":{"message":"Status"},"filtering_table_type":{"message":"Type"},"filtering_table_rule":{"message":"Filtering rule"},"filtering_table_source":{"message":"Source"},"filtering_table_filter":{"message":"Filter"},"filtering_table_action":{"message":"Action"},"filtering_table_open_details":{"message":"Open details"},"filtering_table_empty_reload_page_desc":{"message":"Nothing found. <reset>Disable filters</reset> or <refresh>reload the page</refresh> to view log records"},"filtering_modal_info_title":{"message":"Request details"},"filtering_modal_preview_title":{"message":"Preview"},"filtering_modal_type":{"message":"Type"},"filtering_modal_source":{"message":"Source"},"filtering_modal_rule":{"message":"Rule:"},"filtering_modal_rules":{"message":"Rules:"},"filtering_modal_privacy":{"message":"Tracking protection"},"filtering_modal_filter":{"message":"Filter"},"filtering_modal_block":{"message":"Block"},"filtering_modal_block_again":{"message":"Block again"},"filtering_modal_unblock":{"message":"Unblock"},"filtering_modal_remove_user":{"message":"Delete rule"},"filtering_modal_preview_request_button":{"message":"Preview"},"filtering_modal_remove_allowlist":{"message":"Remove from the Allowlist"},"filtering_modal_block_title":{"message":"Add blocking rule"},"filtering_modal_allow_title":{"message":"Add allowing rule"},"filtering_modal_status_text_desc":{"message":"Status"},"filtering_modal_status_text_error":{"message":"Failed to load preview. Please try again"},"filtering_modal_status_text_loading":{"message":"Loading..."},"filtering_modal_filtering_status_text_desc":{"message":"Filtering status"},"filtering_modal_rule_text_desc":{"message":"Rule"},"filtering_modal_patterns_desc_block":{"message":"What should be blocked"},"filtering_modal_patterns_desc_allow":{"message":"What should be allowed"},"filtering_modal_options_desc":{"message":"Options"},"filtering_modal_apply_domains":{"message":"Apply to all websites"},"filtering_modal_third_party":{"message":"Apply to third-party requests only"},"filtering_modal_remove_param":{"message":"Remove query parameters"},"filtering_modal_add_rule":{"message":"Add"},"filtering_modal_exception_title":{"message":"Add an exception"},"filtering_modal_open_in_new_tab":{"message":"Open in new tab"},"filtering_modal_show_full_url":{"message":"Show full URL"},"filtering_modal_hide_full_url":{"message":"Hide full URL"},"filtering_modal_show_full_rule":{"message":"Show full rule"},"filtering_modal_hide_full_rule":{"message":"Hide full rule"},"filtering_modal_show_full_element":{"message":"Show full element"},"filtering_modal_hide_full_element":{"message":"Hide full element"},"filtering_modal_copy_to_clipboard":{"message":"Copy to clipboard"},"filtering_modal_copied":{"message":"Copied"},"filtering_modal_converted_to":{"message":"Converted to:"},"filtering_log_filter_regular":{"message":"Regular"},"filtering_log_filter_allowed":{"message":"Allowed"},"filtering_log_filter_blocked":{"message":"Blocked"},"filtering_log_filter_modified":{"message":"Modified"},"filtering_log_filter_user_rules":{"message":"User rules"},"filtering_log_status_processed":{"message":"Processed"},"filtering_log_status_allowed":{"message":"Allowed"},"filtering_log_status_blocked":{"message":"Blocked"},"filtering_log_status_modified":{"message":"Modified"},"options_skip_to_main_content":{"message":"Skip to main content"},"options_navigation":{"message":"Navigation"},"options_settings":{"message":"AdGuard Settings"},"options_general_settings":{"message":"General"},"options_block_acceptable_ads":{"message":"Block search ads and website self-promotion"},"options_block_acceptable_ads_desc":{"message":"Blocks ads in search results and self-promotion of websites. <a>Learn more</a>"},"options_show_blocked_ads_count_title":{"message":"Indicate the number of blocked ads on the AdGuard extension icon"},"options_enable_autodetect_filter":{"message":"Activate the most appropriate filters automatically"},"options_enable_autodetect_filter_desc":{"message":"Detects the language of the website and activates appropriate filters"},"options_select_theme":{"message":"Theme"},"options_theme_selector_system":{"message":"System default"},"options_theme_selector_light":{"message":"Light"},"options_theme_selector_dark":{"message":"Dark"},"options_export_settings":{"message":"Export settings"},"options_share_settings":{"message":"Share settings"},"options_import_settings":{"message":"Import settings"},"options_report_bug":{"message":"Report a bug"},"options_leave_feedback":{"message":"Leave feedback"},"options_privacy":{"message":"Tracking protection"},"options_update_antibanner_filters":{"message":"Check for filter updates"},"options_check_update_progress":{"message":"Checking..."},"options_set_update_interval":{"message":"Auto-update filters"},"options_set_update_interval_desc":{"message":"Keeps the filters up to date for more effective ad blocking"},"options_userfilter_export":{"message":"Export"},"options_editor_save":{"message":"Save"},"options_editor_leave_title":{"message":"Leave without saving?"},"options_editor_leave_confirm":{"message":"Yes, leave"},"options_editor_leave_cancel":{"message":"Back to editing"},"options_userfilter_import":{"message":"Import"},"options_userfilter_description_key":{"message":"You can add your own rules here. This option is recommended for advanced users familiar with HTML/CSS. Read the <a>filter rules tutorial</a> to learn how to write your own filter rules."},"options_userfilter_subtitle_key":{"message":"Allows you to add your own filtering rules"},"options_userfilter_line_break":{"message":"Line break"},"options_userfilter_line_break_off":{"message":"Line break: Disabled"},"options_userfilter_line_break_on":{"message":"Line break: Enabled"},"options_userfilter_leave_subtitle":{"message":"Your changes to the rules will be lost"},"options_open_changelog":{"message":"Changelog"},"options_safebrowsing_enabled":{"message":"Phishing and malware protection"},"options_safebrowsing_enabled_desc":{"message":"Warns about malicious and phishing websites using the AdGuard Browsing Security module. <a>Read more</a>"},"options_site":{"message":"Official website"},"options_discuss":{"message":"Discuss AdGuard"},"options_do_you_like_question":{"message":"Do you like AdGuard?"},"options_footer_like_us_cta":{"message":"Rate it!"},"options_miscellaneous_settings":{"message":"Additional settings"},"options_rule_syntax":{"message":"Rule syntax"},"options_rule_limits":{"message":"Rule limits"},"options_rule_limits_description":{"message":"Chrome limits the number of rules that can be applied"},"options_rule_limits_dynamic":{"message":"Dynamic rules"},"options_rule_limits_dynamic_user_rules":{"message":"User-added rules, such as <user_rules>user rules</user_rules>, <allowlist>allowlisted websites</allowlist>, and <custom_filters>custom filters</custom_filters>"},"options_rule_limits_dynamic_user_rules_no_custom_filters":{"message":"User-added rules, such as <user_rules>user rules</user_rules> and <allowlist>allowlisted websites</allowlist>"},"options_rule_limits_dynamic_unsafe":{"description":"Note: First dollar sign is used to escape the second one, so eventually only one dollar sign will be displayed","message":"Unsafe dynamic rules (used for some advanced modifiers, such as $$redirect or $$cookie) — included in user-added rules"},"options_rule_limits_dynamic_regex":{"message":"Regex rules — included in user-added rules"},"options_rule_limits_static_rulesets":{"message":"Static rulesets"},"options_rule_limits_static_rulesets_builtin":{"message":"<a>Built-in filters</a>, such as Block annoyances or Language-specific filters"},"options_rule_limits_static_rules":{"message":"Static rules"},"options_rule_limits_static_rules_all":{"message":"Rules from <a>built-in filters</a>"},"options_rule_limits_static_rules_regex":{"message":"Regex rules — included in the above"},"options_rule_limits_numbers":{"message":"%current% of %maximum%"},"options_rule_limits_warning_title":{"message":"The browser has modified the list of active filters"},"options_rule_limits_warning_explanation_title":{"message":"What happened?"},"options_rule_limits_warning_explanation_description":{"message":"The limit of active built-in rules was exceeded after an update or adding a new extension. As per Manifest V3, your Chrome browser reacted by disabling all the extension\'s built-in filters except the default ones."},"options_rule_limits_warning_list_enabled_before_title":{"message":"Filters enabled before the update"},"options_rule_limits_warning_list_enabled_now_title":{"message":"Filters enabled now"},"options_rule_limits_warning_actions_title":{"message":"Your possible actions"},"options_rule_limits_warning_actions_delete_filters":{"message":"Option 1. Delete unnecessary ad-blocking extensions from your browser. To reactivate the filters mentioned in the \\"Filters enabled before the update\\" section, click <a>reactivate filters.</a>"},"options_rule_limits_warning_actions_install_app":{"message":"Option 2. Install the AdGuard Ad Blocker app: it has no restrictions on filtering rules. <a>Get the AdGuard app</a>"},"options_rule_limits_warning_actions_close_warning_one_filter":{"message":"Option 3. If you\'re satisfied with the currently enabled default filter, <a>close this warning.</a>"},"options_rule_limits_warning_actions_close_warning_multiple_filters":{"message":"Option 3. If you\'re satisfied with the currently enabled default filters, <a>close this warning.</a>"},"options_all_limits_exceeded_warning":{"message":"You\'ve reached the limit of active built-in rules. Your browser has modified the list of active built-in filters. The number of filters enabled has changed from %expected% to %current%."},"options_all_limits_exceeded_warning_browser":{"message":"You\'ve reached your browser\'s limit for active built-in rules. Your browser has reduced the list of active built-in filters from %expected% to %current%"},"options_limits_warning_static_filters":{"message":"You\'ve reached the limit of active built-in filters. %maximum% of %current% filters are enabled. To activate new rules, disable some built-in filters."},"options_limits_warning_static_filters_browser":{"message":"You\'ve reached your browser\'s limit for active built-in filters. %maximum% of %current% filters are enabled. To activate new filters, disable some built-in ones"},"options_limits_warning_static_rules":{"message":"You\'ve reached the limit of active built-in rules. %maximum% of %current% rules are enabled. To activate new rules, disable some built-in filters."},"options_limits_warning_static_rules_browser":{"message":"You\'ve reached your browser\'s limit for active built-in rules. To activate new rules, disable some built-in filters"},"options_limits_warning_static_regex_rules":{"message":"You\'ve reached the limit of active built-in regex rules. %maximum% of %current% regex rules are enabled. To activate new rules, disable some built-in filters."},"options_limits_warning_static_regex_rules_no_counter":{"message":"You\'ve reached the limit of active built-in regex rules. To activate new rules, disable some built-in filters"},"options_limits_warning_dynamic_rules":{"message":"You\'ve reached the limit of user-added rules. %maximum% of %current% rules are enabled."},"options_limits_warning_dynamic_rules_hint":{"message":"You\'ve reached the limit of user-added rules. %maximum% of %current% rules are enabled. To add new rules, remove some existing ones"},"options_limits_warning_dynamic_unsafe_rules":{"message":"You\'ve reached the limit of user-added unsafe rules. %maximum% of %current% unsafe rules are enabled."},"options_limits_warning_dynamic_regex_rules":{"message":"You\'ve reached the limit of user-added regex rules. %maximum% of %current% regex rules are enabled."},"options_limits_warning_dynamic_regex_rules_hint":{"message":"You\'ve reached the limit of user-added regex rules. %maximum% of %current% rules are enabled. To add new regex rules, remove some existing ones"},"options_developer_mode_required":{"message":"Your browser restricts <external-link>some types of rules</external-link>. To apply all rules, enable <b>Developer mode</b> in your browser’s <settings-link>extension settings</settings-link>","description":"Note: <settings-link> and <external-link> are just <a> tags, so it would be rendered as a link."},"options_allow_user_scripts_required":{"message":"Your browser restricts <external-link>some types of rules</external-link>. To apply all rules, enable <b>Allow user scripts</b> in your browser’s <settings-link>extension settings</settings-link>","description":"Note: <settings-link> and <external-link> are just <a> tags, so it would be rendered as a link."},"options_custom_group_developer_mode_required":{"message":"To use custom filters, enable <b>Developer mode</b> in your browser’s <settings-link>extension settings</settings-link>","description":"Note: <settings-link> and <external-link> are just <a> tags, so it would be rendered as a link."},"options_custom_group_allow_user_scripts_required":{"message":"To use custom filters, enable <b>Allow user scripts</b> in your browser’s <settings-link>extension settings</settings-link>","description":"Note: <settings-link> and <external-link> are just <a> tags, so it would be rendered as a link."},"options_show_adguard_full_version_title":{"message":"Show information on the AdGuard full version"},"options_clear_stats_confirm_modal_subtitle":{"message":"All stats on data usage will be permanently deleted"},"options_show_app_updated_notification":{"message":"Notify about extension updates"},"options_open_log":{"message":"Open filtering log"},"options_reset_stats":{"message":"Clear statistics"},"options_reset_stats_done":{"message":"Statistics have been reset"},"options_reset_settings":{"message":"Reset settings"},"options_reset_settings_done":{"message":"Settings have been reset"},"options_reset_settings_error":{"message":"Error while resetting settings"},"options_collect_hit_stats_title":{"message":"Help develop AdGuard filters"},"options_collect_hit_stats_desc":{"message":"Sends anonymous stats on ad filter usage to AdGuard. <a>Learn more</a>"},"options_show_context_menu_title":{"message":"Add AdGuard item to the browser\'s context menu"},"options_use_optimized_filters":{"message":"Use optimized filters"},"options_use_optimized_filters_desc":{"message":"Uses shorter versions of filters with only the most popular rules to save traffic. Better suited to mobile browsers"},"options_privacy_title":{"message":"Tracking protection"},"options_privacy_desc":{"message":"Protects your online activity and personal data from web trackers"},"options_hide_referrer_title":{"message":"Hide Referer from third parties"},"options_hide_referrer_desc":{"message":"Prevent third parties from knowing what website you are visiting"},"options_hide_search_queries_title":{"message":"Hide search queries"},"options_hide_search_queries_desc":{"message":"Hides your searches from websites visited through search engine results"},"options_send_not_track_title":{"message":"Ask websites not to track me"},"options_send_not_track_desc":{"message":"Send the <gpc>Global Privacy Control</gpc> and <dnt>Do Not Track</dnt> signals to the websites you visit"},"options_stripped_tracking_parameters":{"message":"Tracking parameters removed"},"options_modified_first_party_cookie":{"message":"First-party cookie modified"},"options_modified_third_party_cookie":{"message":"Third-party cookie modified"},"options_remove_client_data_title":{"message":"Remove X-Client-Data header"},"options_remove_client_data_desc":{"message":"Block Google Chrome from sending its version and modifications information to Google domains"},"options_disable_webrtc_title":{"message":"Block WebRTC"},"options_disable_webrtc_desc":{"message":"Blocks WebRTC that can leak your real IP address even if you use a proxy or VPN. Some messengers, streaming platforms, or games may stop working properly"},"options_strip_tracking_params_title":{"message":"Remove tracking parameters from URLs"},"options_strip_tracking_params_description":{"message":"Removes tracking parameters from page URLs using AdGuard URL Tracking filter"},"options_block_known_trackers_title":{"message":"Block trackers"},"options_block_known_trackers_description":{"message":"Blocks trackers and web analytics using AdGuard Tracking Protection filter"},"options_third_party_title":{"message":"Delete third-party cookies"},"options_third_party_desc":{"message":"Prevents advertisers from tracking your behavior across multiple pages by limiting the lifetime of third-party cookies"},"options_block_cookies_lifetime":{"message":"To block the cookies, set the lifetime to 0"},"options_third_party_block_cookies_warning":{"message":"If you block these cookies, you may have to re-log in to some websites or face other cookie-related issues"},"options_lifetime_minutes":{"message":"Lifetime, minutes"},"options_first_party_title":{"message":"Delete first-party cookies (not recommended)"},"options_first_party_desc":{"message":"Prevents websites from remembering your details, such as your login credentials and language preferences, by limiting the lifetime of first-party cookies"},"options_first_party_block_cookies_warning":{"message":"If you block these cookies, some websites may break or stop working"},"options_anonymized_usage_data_title":{"message":"Send anonymized extension usage data"},"options_anonymized_usage_data_description":{"message":"Sends anonymous stats on extension usage to AdGuard. <button>Learn more</button>"},"options_anonymized_usage_data_modal_title":{"message":"Extension usage data"},"options_anonymized_usage_data_modal_intro":{"message":"This data includes:"},"options_anonymized_usage_data_modal_list_item_screens":{"message":"Names of screens you interact with"},"options_anonymized_usage_data_modal_list_item_buttons":{"message":"Names of buttons you click"},"options_anonymized_usage_data_modal_list_item_session_ids":{"message":"Session identifiers"},"options_anonymized_usage_data_modal_reason":{"message":"We need this information to analyze and improve the functionality of AdGuard"},"options_anonymized_usage_data_modal_privacy_note":{"message":"This data is anonymous and only used internally. We never share it with third parties"},"options_anonymized_usage_data_modal_got_it_button":{"message":"Got it"},"popup_abuse_site":{"message":"Report an issue"},"popup_open_filtering_log":{"message":"Open filtering log"},"popup_tabs":{"message":"Tabs"},"popup_tab_actions":{"message":"Actions"},"popup_tab_statistics":{"message":"Statistics"},"popup_statistics_time_label":{"message":"Statistics time period"},"popup_statistics_time_day":{"message":"24 hours"},"popup_statistics_time_week":{"message":"7 days"},"popup_statistics_time_month":{"message":"30 days"},"popup_statistics_time_year":{"message":"1 year"},"popup_switch_button":{"message":"Protection for current website"},"popup_limits_exceeded_warning":{"message":"Your browser has modified the list of active built-in filters"},"snack_on_websites_limits_exceeded_warning":{"message":"Rule limit exceeded in AdGuard Browser Extension. Please check your filters and disable the ones you don\'t need"},"short_name":{"message":"AdGuard"},"options_about":{"message":"About"},"options_privacy_policy":{"message":"Privacy policy"},"options_acknowledgment":{"message":"Acknowledgments"},"options_github":{"message":"GitHub"},"options_about_version":{"message":"Version"},"options_about_libs":{"message":"Used libraries"},"options_copyright":{"message":"All rights reserved."},"options_remove_filter_confirm_modal_title":{"message":"Remove this filter?"},"options_remove_filter_confirm_modal_ok_button":{"message":"Remove"},"options_nav_better_than_extension":{"message":"Why is the AdGuard app better than the extension?"},"options_nav_compare":{"message":"Compare"},"options_desktop_app_promo_title":{"message":"Extension protects the browser only"},"options_desktop_app_promo_description":{"message":"Apps like Spotify, Discord, or Zoom can still show ads and track your activity"},"options_desktop_app_promo_subdescription":{"message":"Our desktop app can protect you from them"},"options_desktop_app_promo_button_windows":{"message":"Get AdGuard for Windows"},"options_desktop_app_promo_button_mac":{"message":"Get AdGuard for Mac"},"options_desktop_app_promo_button_linux":{"message":"Get AdGuard for Linux"},"options_filters_search":{"message":"Search"},"options_filters_search_filter":{"message":"Search filter"},"options_about_title":{"message":"AdGuard Browser extension"},"group_description_adblocking":{"message":"Configure ad blocking here to deal with annoying banners, pop-ups, video ads and such, once and for all"},"group_description_stealth":{"message":"Protect your identity and sensitive personal info from thousands of online trackers by blocking all known popular tracking methods"},"group_description_social":{"message":"Hide unwanted \\"Like\\"/\\"Share\\" buttons and other social media widgets"},"group_description_annoyances":{"message":"Remove pop-up windows and other annoying notifications like cookie notices"},"group_description_security":{"message":"Protect yourself from malware, phishing and other online threats"},"group_description_miscellaneous":{"message":"More settings to configure your web surfing with AdGuard even further"},"group_description_custom":{"message":"Create your own filters to fine-tune web filtering to your preference."},"group_description_lang":{"message":"Don\'t limit yourself — block ads on websites in any languages"},"fullscreen_user_rules_title":{"message":"User rules"},"options_user_rules_editor_stub_title":{"message":"Editor opened in another window"},"options_user_rules_editor_stub_subtitle":{"message":"Your rules will appear here after you close it"},"options_user_rules_editor_stub_go_to_editor_button":{"message":"Go to editor"},"options_editor_open_fullscreen_button_tooltip":{"message":"Open Editor in a new window"},"options_editor_close_fullscreen_button_tooltip":{"message":"Exit the window mode"},"options_clear_stats_confirm_modal_title":{"message":"Clear statistics?"},"options_clear_stats_confirm_modal_clear_button":{"message":"Clear"},"options_reset_settings_confirm_modal_title":{"message":"Reset settings?"},"options_reset_settings_confirm_modal_subtitle":{"message":"All settings will be reset to their default values"},"options_reset_settings_confirm_modal_clear_button":{"message":"Reset"},"options_invert_allowlist_confirm_modal_title":{"message":"Invert allowlist?"},"options_invert_allowlist_confirm_modal_subtitle":{"message":"Ads and trackers will only be blocked on websites from the allowlist"},"options_invert_allowlist_confirm_modal_confirm_button":{"message":"Invert"},"options_confirm_modal_cancel_button":{"message":"Cancel"},"options_import_configuration_confirm_title":{"message":"Import settings"},"options_import_configuration_confirm_subtitle":{"message":"The imported settings will replace your current ones. Other settings won’t be affected"},"options_import_configuration_confirm_button":{"message":"Import"},"options_import_configuration_applying_title":{"message":"Importing..."},"options_import_configuration_applying_subtitle":{"message":"Replacing your current settings with the imported ones. Filtering is disabled during the import"},"options_import_configuration_success_title":{"message":"All done"},"options_import_configuration_success_subtitle":{"message":"Settings were successfully imported"},"options_import_configuration_success_button":{"message":"Close"},"options_import_configuration_error_title":{"message":"Failed to import settings"},"options_import_configuration_error_subtitle":{"message":"Please check the import link and try again. If it doesn’t help, contact support"},"options_import_configuration_error_button":{"message":"Close"},"filtering_log_details_modal_beautify_button":{"message":"Beautify"},"filtering_log_details_modal_back_button":{"message":"Back to request"},"filtering_log_details_modal_try_again":{"message":"Try again"},"filtering_log_tag_request_source":{"message":"Request origin"},"filtering_log_tag_tooltip_first_party":{"message":"First-party requests"},"filtering_log_tag_tooltip_third_party":{"message":"Third-party requests"},"filtering_log_tag_request_status":{"message":"Filtering status"},"filtering_log_tag_tooltip_regular":{"message":"Requests processed without filtering"},"filtering_log_tag_tooltip_allowed":{"message":"Allowed and unblocked requests"},"filtering_log_tag_tooltip_blocked":{"message":"Blocked requests"},"filtering_log_tag_tooltip_modified":{"message":"Modified requests"},"filtering_log_tag_tooltip_user_rules":{"message":"Requests affected by user rules"},"filtering_log_tag_request_type":{"message":"Request type"},"filtering_log_tag_tooltip_html":{"message":"Documents and subdocuments"},"filtering_log_tag_tooltip_css":{"message":"Stylesheets"},"filtering_log_tag_tooltip_js":{"message":"Scripts"},"filtering_log_tag_tooltip_xhr":{"message":"XMLHttpRequests and fetch requests"},"filtering_log_tag_tooltip_img":{"message":"Images"},"filtering_log_tag_tooltip_media":{"message":"Media"},"filtering_log_tag_tooltip_other":{"message":"Fonts, pings, WebRTC, WebSocket..."},"filtering_log_badge_tooltip_third_party":{"message":"Third-party request"},"filtering_log_badge_tooltip_http_req_method":{"message":"HTTP request method"},"filtering_log_badge_tooltip_http_status_code":{"message":"HTTP status code"},"filtering_log_assumed_rule_description":{"message":"This is an assumed rule. For details, see our <a>Knowledge base</a>"},"filtering_log_preserve_log_modal_title":{"message":"Preserve log?"},"filtering_log_preserve_log_modal_description":{"message":"This option may significantly increase memory usage"},"filtering_log_preserve_log_skip_modal_in_future":{"message":"Don’t show again"},"filtering_log_preserve_log_modal_confirm":{"message":"Yes, preserve"},"options_stealth_general_title":{"message":"General"},"options_stealth_tracking_methods_title":{"message":"Tracking methods"},"options_stealth_miscellaneous_title":{"message":"Miscellaneous"},"options_coming_soon":{"message":"Coming soon"},"blocking_pages_malware":{"message":"This web page at <strong>%host%</strong> has been reported as a malware page and has been blocked based on your security preferences."},"blocking_pages_phishing":{"message":"This web page at <strong>%host%</strong> has been reported as a phishing page and has been blocked based on your security preferences."},"blocking_pages_advanced_button":{"message":"Advanced"},"blocking_pages_more_info_button":{"message":"More information"},"blocking_pages_page_title":{"message":"Access denied"},"blocking_pages_safe_header_title":{"message":"AdGuard has blocked access to this page"},"blocking_pages_rule_header_title":{"message":"Blocked by AdGuard"},"blocking_pages_rule_content_title":{"message":"AdGuard has prevented this page from loading due to the following filter rule"},"blocking_pages_btn_go_back":{"message":"Go back"},"blocking_pages_btn_proceed":{"message":"Proceed anyway"},"text_collapser_show_default":{"message":"Show full text"},"text_collapser_hide_default":{"message":"Hide full text"},"close_button_title":{"message":"Close"},"clear_button_title":{"message":"Clear"},"update_check":{"message":"Check for updates"},"update_checking_in_progress":{"message":"Checking for updates..."},"update_available_title":{"message":"Updates available"},"update_available_desc":{"message":"To effectively block ads, keep your extension and filters up to date"},"update_available_update_btn":{"message":"Update"},"update_installing_in_progress_title":{"message":"Updating extension and filters..."},"update_installing_in_progress_desc":{"message":"The extension will restart after the update"},"update_not_needed":{"message":"Your extension and filters are up to date"},"update_failed_text":{"message":"Failed to complete the update"},"update_success_text":{"message":"Extension and filters updated"},"update_failed_try_again_btn":{"message":"Try again"},"filtering_modal_applied_rules":{"message":"| Applied rule | Applied rules","description":"WARNING: correct number of plural forms is required"},"filtering_modal_assumed_rules":{"message":"| Assumed rule: | Assumed rules:","description":"WARNING: correct number of plural forms is required"},"filtering_modal_original_rules":{"message":"| Original rule: | Original rules:","description":"WARNING: correct number of plural forms is required"},"filtering_modal_declarative_rule":{"message":"DNR rule:"},"opera_search_permission_warning":{"message":"To block search ads, allow access to search page results in browser\'s settings"},"opera_search_permission_go_to_settings":{"message":"Go to Settings"},"opera_search_permission_dont_show":{"message":"Don\'t show again"}}')

},

},function(__webpack_require__) {
var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId) }
var __webpack_exports__ = (__webpack_exec__(92742));

}
]);