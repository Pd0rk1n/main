let _lazyShouldDebug;
let _isSafeAreaInitialized = false;
let _doesSupportSafeArea = false;
let _safeAreaRect = null;
const LEGACY_SAFE_AREA_INSET = {
  desktop: {
    wide: {
      TOP: 128,
      RIGHT: 24,
      BOTTOM: 200,
      LEFT: 24
    },
    narrow: {
      TOP: 224,
      RIGHT: 24,
      BOTTOM: 200,
      LEFT: 24
    }
  },
  mobile: {
    TOP: 156,
    RIGHT: 12,
    BOTTOM: 58,
    LEFT: 12
  }
};
const _isSoftwareRenderer = (name) => /swiftshader|llvmpipe|softpipe|mesa|software/i.test(name);
async function _hasWebGPUAcceleration() {
  if (!("gpu" in navigator)) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;
    return !_isSoftwareRenderer(adapter.name);
  } catch {
    return false;
  }
}
function _hasWebGlAcceleration() {
  for (const type of ["webgl2", "webgl"]) {
    const canvas = document.createElement("canvas");
    const webgl = canvas.getContext(type);
    if (!webgl) continue;
    const debugRendererInfo = webgl.getExtension(
      "WEBGL_debug_renderer_info"
    );
    if (debugRendererInfo) {
      const renderer = webgl.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL) ?? "";
      if (!_isSoftwareRenderer(renderer)) return true;
    }
    canvas.width = 0;
    canvas.height = 0;
  }
  return false;
}
function _drawSafeAreaDebugOverlay(rect) {
  const id = "debug-safe-area";
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("div");
    element.id = id;
    element.style.position = "fixed";
    element.style.boxSizing = "border-box";
    element.style.background = "transparent";
    element.style.border = "4px solid rgba(0, 255, 0, 0.7)";
    element.style.pointerEvents = "none";
    element.style.zIndex = "2147483647";
    document.body.appendChild(element);
  }
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}
function _maybeDrawSafeAreaDebugOverlay(rect) {
  if (!document.body) {
    window.addEventListener(
      "DOMContentLoaded",
      () => _maybeDrawSafeAreaDebugOverlay(rect),
      { once: true }
    );
    return;
  }
  if (shouldDebug()) _drawSafeAreaDebugOverlay(rect);
}
function _setSafeAreaCSSVariables(rect) {
  const style = document.documentElement.style;
  const top = rect.y;
  const right = window.innerWidth - rect.right;
  const bottom = window.innerHeight - rect.bottom;
  const left = rect.x;
  style.setProperty("--safe-area-x", `${rect.x}px`);
  style.setProperty("--safe-area-y", `${rect.y}px`);
  style.setProperty("--safe-area-width", `${rect.width}px`);
  style.setProperty("--safe-area-height", `${rect.height}px`);
  style.setProperty("--safe-area-top", `${top}px`);
  style.setProperty("--safe-area-bottom", `${bottom}px`);
  style.setProperty("--safe-area-left", `${left}px`);
  style.setProperty("--safe-area-right", `${right}px`);
  style.setProperty("--safe-area", `${top}px ${right}px ${bottom}px ${left}px`);
  _maybeDrawSafeAreaDebugOverlay(rect);
}
function _getSafeAreaRect() {
  return _safeAreaRect ?? _legacySafeAreaRect();
}
function _legacySafeAreaRect() {
  let inset;
  if (isMobile()) {
    inset = LEGACY_SAFE_AREA_INSET.mobile;
  } else if (window.innerWidth <= 643) {
    inset = LEGACY_SAFE_AREA_INSET.desktop.narrow;
  } else {
    inset = LEGACY_SAFE_AREA_INSET.desktop.wide;
  }
  return new DOMRectReadOnly(
    inset.LEFT,
    inset.TOP,
    window.innerWidth - (inset.LEFT + inset.RIGHT),
    window.innerHeight - (inset.TOP + inset.BOTTOM)
  );
}
function _notifySafeAreaLayoutChange() {
  window.postMessage(
    {
      type: "layoutSafeArea"
      /* LayoutSafeArea */
    },
    "chrome-untrusted://new-tab-takeover"
    /* ChromeUntrustedNewTabTakeover */
  );
}
function _updateSafeAreaLayout() {
  const updateSafeAreaLayout = () => {
    const safeAreaRect = _getSafeAreaRect();
    utils.debugLog("Safe area: ", safeAreaRect);
    _setSafeAreaCSSVariables(safeAreaRect);
    _notifySafeAreaLayoutChange();
  };
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        requestAnimationFrame(updateSafeAreaLayout);
      },
      { once: true }
    );
  } else {
    requestAnimationFrame(updateSafeAreaLayout);
  }
}
function _subscribeToSafeAreaLayoutChanges() {
  window.addEventListener("message", (messageEvent) => {
    if (targetOrigin() !== messageEvent.origin) return;
    const { type, value } = messageEvent.data || {};
    if (type === "richMediaSafeRect" && value && typeof value.x === "number" && typeof value.y === "number" && typeof value.width === "number" && typeof value.height === "number") {
      _doesSupportSafeArea = true;
      _safeAreaRect = new DOMRectReadOnly(
        value.x,
        value.y,
        value.width,
        value.height
      );
      _updateSafeAreaLayout();
    }
  });
  window.addEventListener("resize", () => {
    _updateSafeAreaLayout();
  });
}
function _initSafeArea() {
  if (_isSafeAreaInitialized) throw new Error("Safe area already initialized");
  _isSafeAreaInitialized = true;
  _updateSafeAreaLayout();
  _subscribeToSafeAreaLayoutChanges();
}
function _parseHexColor(hex) {
  const match = hex.replace("#", "").match(/^([a-f\d]{3}|[a-f\d]{6})$/i);
  if (!match) throw new Error("Invalid hex color format");
  let hexValue = match[1];
  if (hexValue.length === 3) {
    hexValue = hexValue.split("").map((c) => c + c).join("");
  }
  const value = parseInt(hexValue, 16);
  const r = value >> 16 & 255;
  const g = value >> 8 & 255;
  const b = value & 255;
  return [r, g, b];
}
function _rgbToCss(r, g, b, alpha) {
  return typeof alpha === "number" ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}
function _parseFocalPointCoordinate(focalPoint) {
  const normalizedFocalPoint = focalPoint.trim().toLowerCase();
  if (normalizedFocalPoint.endsWith("%"))
    return parseFloat(normalizedFocalPoint) / 100;
  if (normalizedFocalPoint === "left" || normalizedFocalPoint === "top")
    return 0;
  if (normalizedFocalPoint === "center") return 0.5;
  if (normalizedFocalPoint === "right" || normalizedFocalPoint === "bottom")
    return 1;
  console.warn("Invalid focal point coordinate, defaulting to center.");
  return 0.5;
}
function _platform() {
  const userAgentData = navigator.userAgentData;
  if (userAgentData && userAgentData.platform) {
    switch (userAgentData.platform) {
      case "Android":
        return "Android";
      case "iOS":
        return "iOS";
      case "Windows":
        return "Windows";
      case "macOS":
        return "Mac";
      case "Linux":
        return "Linux";
      default:
        return "Unknown";
    }
  }
  const userAgent = navigator.userAgent || "";
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone/.test(userAgent)) return "iOS";
  if (/Win/.test(userAgent)) return "Windows";
  if (/Mac/.test(userAgent)) return "Mac";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Unknown";
}
const MILLISECONDS_IN_SECONDS = 1e3;
const DEG_TO_RAD = Math.PI / 180;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const prefersReducedTransparency = window.matchMedia(
  "(prefers-reduced-transparency: reduce)"
).matches;
function shouldDebug() {
  if (_lazyShouldDebug === void 0) {
    _lazyShouldDebug = utils.parseBoolDataAttr(
      document.body?.dataset?.debug,
      false
    );
  }
  return _lazyShouldDebug;
}
function debugLog(...args) {
  if (shouldDebug()) {
    console.debug(...args);
  }
}
function parseBoolDataAttr(value, fallback = false) {
  if (value === void 0) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "" || normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}
function parseNumberDataAttr(value, fallback = null) {
  if (value === void 0 || value.trim() === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
function targetOrigin() {
  return isAndroid() ? "chrome://new-tab-takeover" : "chrome://newtab";
}
function isAndroid() {
  return _platform() === "Android";
}
function isIOS() {
  return _platform() === "iOS";
}
function isMobile() {
  return isAndroid() || isIOS();
}
async function supportsEfficientVideoDecoding(video) {
  const mediaCapabilities = navigator.mediaCapabilities;
  if (typeof mediaCapabilities?.decodingInfo !== "function") return null;
  let contentType = video.querySelector("source")?.type?.trim();
  if (!contentType || !/codecs=/.test(contentType)) {
    contentType = 'video/mp4; codecs="avc1.42E01E"';
  }
  const configuration = {
    // bitrate and framerate are not exposed by HTMLVideoElement.
    type: "file",
    video: {
      contentType,
      width: video.videoWidth || 1920,
      height: video.videoHeight || 1080,
      bitrate: 1e7,
      // number of bits to encode 1 second of video.
      framerate: 30
      // number of frames making up that 1s.
    }
  };
  try {
    const { supported, smooth, powerEfficient } = await mediaCapabilities.decodingInfo(configuration);
    return supported && smooth && powerEfficient === true;
  } catch {
    return null;
  }
}
async function supportsGpuAcceleration() {
  return await _hasWebGPUAcceleration() || _hasWebGlAcceleration();
}
function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}
function registerLayoutSafeAreaHandler(callback) {
  window.addEventListener("message", (messageEvent) => {
    if (messageEvent.origin !== "chrome-untrusted://new-tab-takeover")
      return;
    if (messageEvent.data?.type === "layoutSafeArea") {
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          () => {
            requestAnimationFrame(() => callback(_getSafeAreaRect()));
          },
          { once: true }
        );
      } else {
        requestAnimationFrame(() => callback(_getSafeAreaRect()));
      }
    }
  });
}
function randomIntInRange(min, max, inclusive = true) {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    throw new Error("min/max must be finite");
  if (inclusive ? min > max : min >= max) throw new Error("Invalid range");
  const range = max - min + (inclusive ? 1 : 0);
  return Math.floor(Math.random() * range) + min;
}
function randomFloatInRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    throw new Error("min/max must be finite");
  if (min >= max) throw new Error("Invalid range");
  return Math.random() * (max - min) + min;
}
function randomArrayIndex(array) {
  if (array.length === 0) throw new Error("Array is empty");
  return randomIntInRange(
    0,
    array.length,
    /*inclusive*/
    false
  );
}
function randomArrayElement(array) {
  if (array.length === 0) throw new Error("Array is empty");
  const index = randomArrayIndex(array);
  return array[index];
}
function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length; i > 1; i--) {
    const j = Math.floor(Math.random() * i);
    [shuffledArray[i - 1], shuffledArray[j]] = [
      shuffledArray[j],
      shuffledArray[i - 1]
    ];
  }
  return shuffledArray;
}
function loadImage(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load " + imageSrc));
    image.src = imageSrc;
  });
}
function imageSizeToFit(imageWidth, imageHeight, containerWidth, containerHeight) {
  const imageAspectRatio = imageWidth / imageHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  let width, height;
  if (imageAspectRatio > containerAspectRatio) {
    width = containerWidth;
    height = width / imageAspectRatio;
  } else {
    height = containerHeight;
    width = height * imageAspectRatio;
  }
  return { imageSize: { width, height } };
}
function imageSizeToCover(imageWidth, imageHeight, containerWidth, containerHeight) {
  const imageAspectRatio = imageWidth / imageHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  let width, height;
  if (imageAspectRatio > containerAspectRatio) {
    height = containerHeight;
    width = height * imageAspectRatio;
  } else {
    width = containerWidth;
    height = width / imageAspectRatio;
  }
  return { imageSize: { width, height } };
}
function drawImageWithAlpha(context, image, rect, alpha) {
  context.save();
  try {
    context.globalAlpha = alpha;
    context.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );
  } finally {
    context.restore();
  }
}
function hexToRgba(hex, alpha) {
  const [r, g, b] = _parseHexColor(hex);
  return _rgbToCss(r, g, b, alpha);
}
function hexToRgb(hex) {
  const [r, g, b] = _parseHexColor(hex);
  return _rgbToCss(r, g, b);
}
function isValidCssColor(color) {
  return CSS.supports("color", color);
}
function createCanvasWith2DContext(alpha = true) {
  const canvas = document.createElement("canvas");
  const canvasRenderingContext2D = canvas.getContext("2d", {
    alpha
  });
  canvasRenderingContext2D.setSize = (cssWidth, cssHeight) => {
    canvas.width = Math.round(cssWidth * getDevicePixelRatio());
    canvas.height = Math.round(cssHeight * getDevicePixelRatio());
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvasRenderingContext2D.setTransform(
      getDevicePixelRatio(),
      0,
      0,
      getDevicePixelRatio(),
      0,
      0
    );
  };
  return [canvas, canvasRenderingContext2D];
}
function clearCanvasRenderingContext2D(context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
function parseFocalPoint(focalPoint) {
  const components = focalPoint.trim().split(/\s+/);
  if (components.length === 1) {
    const x = _parseFocalPointCoordinate(components[0]);
    return { x, y: 0.5 };
  }
  if (components.length === 2) {
    return {
      x: _parseFocalPointCoordinate(components[0]),
      y: _parseFocalPointCoordinate(components[1])
    };
  }
  console.warn("Invalid focal point, defaulting to center.");
  return { x: 0.5, y: 0.5 };
}
function parseDuration(duration) {
  const value = duration.trim().toLowerCase();
  let ms;
  if (value.endsWith("ms")) ms = parseFloat(value);
  else if (value.endsWith("s"))
    ms = parseFloat(value) * MILLISECONDS_IN_SECONDS;
  else ms = parseFloat(value);
  if (!Number.isFinite(ms) || ms < 0) throw new Error("Invalid duration");
  return ms;
}
_initSafeArea();
const utils = {
  MILLISECONDS_IN_SECONDS,
  DEG_TO_RAD,
  prefersReducedMotion,
  prefersReducedTransparency,
  shouldDebug,
  debugLog,
  parseBoolDataAttr,
  parseNumberDataAttr,
  targetOrigin,
  isAndroid,
  isIOS,
  isMobile,
  supportsEfficientVideoDecoding,
  supportsGpuAcceleration,
  getDevicePixelRatio,
  doesSupportSafeArea: () => _doesSupportSafeArea,
  registerLayoutSafeAreaHandler,
  randomIntInRange,
  randomFloatInRange,
  randomArrayIndex,
  randomArrayElement,
  shuffleArray,
  loadImage,
  imageSizeToFit,
  imageSizeToCover,
  drawImageWithAlpha,
  hexToRgba,
  hexToRgb,
  isValidCssColor,
  createCanvasWith2DContext,
  clearCanvasRenderingContext2D,
  parseFocalPoint,
  parseDuration
};
const dispatchedEvents = /* @__PURE__ */ new Set();
const RICH_MEDIA_EVENT = "richMediaEvent";
function _hasDispatchedEvent(eventType) {
  return dispatchedEvents.has(eventType);
}
const eventTypes = {
  CLICK: "click",
  INTERACTION: "interaction",
  MEDIA_PLAY: "mediaPlay",
  MEDIA_25: "media25",
  MEDIA_100: "media100"
};
function dispatchEvent(eventType) {
  if (_hasDispatchedEvent(eventType)) return;
  dispatchedEvents.add(eventType);
  utils.debugLog(`Dispatching event: ${eventType}`);
  window.parent.postMessage(
    { type: RICH_MEDIA_EVENT, value: eventType },
    utils.targetOrigin()
  );
}
const eventDispatcher = {
  eventTypes,
  dispatchEvent
};
function _bindClickToSelectors(object, handler) {
  const selectors = Array.isArray(object) ? object : [object];
  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return;
    }
    elements.forEach(handler);
  });
}
function bindClickHandler(object, handler) {
  _bindClickToSelectors(
    object,
    (element) => element.addEventListener("click", handler)
  );
}
function bindAndDispatchClickEvent(object) {
  _bindClickToSelectors(
    object,
    (element) => element.addEventListener(
      "click",
      () => eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK)
    )
  );
}
const eventBinder = {
  bindClickHandler,
  bindAndDispatchClickEvent
};
function initWallpaper() {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  eventBinder.bindAndDispatchClickEvent("img.wallpaper");
  function setFocalPoints() {
    const wallpaper = document.querySelector(".wallpaper");
    if (!wallpaper) {
      console.warn("Wallpaper not found, failed to initialize.");
      return;
    }
    wallpaper.style.objectPosition = wallpaper.dataset.focalPoint || "center";
  }
  setFocalPoints();
}
const SOURCE = "ntt";
const EVENTS = {
  QUERY_BRAVE_SEARCH_AUTOCOMPLETE: "richMediaQueryBraveSearchAutocomplete",
  OPEN_BRAVE_SEARCH_WITH_QUERY: "richMediaOpenBraveSearchWithQuery",
  HIDE_BRAVE_SEARCH_BOX: "richMediaHideBraveSearchBox",
  MAKE_BRAVE_SEARCH_DEFAULT: "richMediaMakeBraveSearchDefault"
};
function _dispatchEvent(type, value) {
  utils.debugLog(`Dispatching ${type} with ${value}`);
  const messageId = crypto.randomUUID();
  const payload = {
    type,
    value,
    id: messageId
  };
  window.parent.postMessage(payload, utils.targetOrigin());
}
function dispatchQueryAutocomplete(searchQuery) {
  _dispatchEvent(EVENTS.QUERY_BRAVE_SEARCH_AUTOCOMPLETE, searchQuery);
}
function dispatchSearchWithQuery(searchQuery) {
  const encodedQuery = encodeURIComponent(searchQuery.query);
  const extraParams = searchQuery.params ? `&${searchQuery.params}` : "";
  _dispatchEvent(
    EVENTS.OPEN_BRAVE_SEARCH_WITH_QUERY,
    `search?q=${encodedQuery}&source=${SOURCE}&action=makeDefault${extraParams}`
  );
}
function dispatchAnswerWithAi(searchQuery) {
  const encodedQuery = encodeURIComponent(searchQuery);
  _dispatchEvent(
    EVENTS.OPEN_BRAVE_SEARCH_WITH_QUERY,
    `search?q=${encodedQuery}&source=${SOURCE}&summary=1&action=makeDefault`
  );
}
function dispatchDestinationUrl(url) {
  const { pathname, search } = new URL(url);
  const query = `${pathname}${search}`;
  _dispatchEvent(EVENTS.OPEN_BRAVE_SEARCH_WITH_QUERY, query);
}
function dispatchHideBraveSearchBox() {
  _dispatchEvent(EVENTS.HIDE_BRAVE_SEARCH_BOX, "");
}
function dispatchMakeDefault() {
  _dispatchEvent(EVENTS.MAKE_BRAVE_SEARCH_DEFAULT, "");
}
const searchDispatcher = {
  dispatchQueryAutocomplete,
  dispatchSearchWithQuery,
  dispatchAnswerWithAi,
  dispatchDestinationUrl,
  dispatchHideBraveSearchBox,
  dispatchMakeDefault
};
var SearchMode = /* @__PURE__ */ ((SearchMode2) => {
  SearchMode2["Interactive"] = "interactive";
  SearchMode2["AutoTypeCaret"] = "autotype-caret";
  SearchMode2["AutoTypeFadeChars"] = "autotype-fade-chars";
  SearchMode2["AutoTypeFade"] = "autotype-fade";
  SearchMode2["AutoTypeScramble"] = "autotype-scramble";
  SearchMode2["AutoTypeWordBurst"] = "autotype-word-burst";
  SearchMode2["AutoTypeBounce"] = "autotype-bounce";
  SearchMode2["AutoTypeReveal"] = "autotype-reveal";
  SearchMode2["AutoTypeSlotMachine"] = "autotype-slot-machine";
  SearchMode2["AutoTypeFocus"] = "autotype-focus";
  SearchMode2["AutoTypeNeon"] = "autotype-neon";
  SearchMode2["AutoTypeGhost"] = "autotype-ghost";
  SearchMode2["AutoTypeWaterfall"] = "autotype-waterfall";
  SearchMode2["AutoTypeAssemble"] = "autotype-assemble";
  SearchMode2["AutoTypeSprinkle"] = "autotype-sprinkle";
  SearchMode2["AutoTypeReducedMotion"] = "autotype-reduced-motion";
  SearchMode2["AutoTypeRandom"] = "autotype-random";
  return SearchMode2;
})(SearchMode || {});
let _element = null;
function init$m(container) {
  const element = document.createElement("div");
  element.id = "mouse-pointer";
  element.classList.add("hidden");
  container.appendChild(element);
  _element = element;
}
function show() {
  _element?.classList.remove("hidden");
}
function hide$1() {
  _element?.classList.add("hidden");
}
function moveTo(x, y, delay = 0) {
  if (!_element) return;
  _element.style.transition = delay ? `left ${delay}ms ease-in-out, top ${delay}ms ease-in-out` : "none";
  _element.style.left = `${x}px`;
  _element.style.top = `${y}px`;
}
const mousePointer = { init: init$m, show, hide: hide$1, moveTo };
const SIMULATE_TAP_CONFIG = {
  tapDuration: 1200,
  pulseDuration: 600,
  tapIndicatorSize: 54,
  tapIndicatorMaxScale: 2.5,
  tapIndicatorMinScale: 2.1,
  tapIndicatorColor: "rgba(255, 255, 255, 0.5)"
};
let _button;
function init$l() {
  _button = document.getElementById("try-now-button");
  _button.style.setProperty(
    "--tap-duration",
    `${SIMULATE_TAP_CONFIG.tapDuration}ms`
  );
  _button.style.setProperty(
    "--pulse-duration",
    `${SIMULATE_TAP_CONFIG.pulseDuration}ms`
  );
  _button.style.setProperty(
    "--tap-indicator-size",
    `${SIMULATE_TAP_CONFIG.tapIndicatorSize}px`
  );
  _button.style.setProperty(
    "--tap-indicator-max-scale",
    `${SIMULATE_TAP_CONFIG.tapIndicatorMaxScale}`
  );
  _button.style.setProperty(
    "--tap-indicator-min-scale",
    `${SIMULATE_TAP_CONFIG.tapIndicatorMinScale}`
  );
  _button.style.setProperty(
    "--tap-indicator-color",
    SIMULATE_TAP_CONFIG.tapIndicatorColor
  );
}
function start$1() {
  _button.classList.add("animate-tap");
}
function stop() {
  _button.classList.remove("animate-tap");
}
function startPulse() {
  _button.classList.add("animate");
}
function stopPulse() {
  _button.classList.remove("animate");
}
const simulateTap = { init: init$l, start: start$1, stop, startPulse, stopPulse };
const SEARCH_QUERY = {
  searchQueryTextColor: "white",
  minTypingDelay: 30,
  maxTypingDelay: 150
};
const MOUSE_POINTER = {
  mouseMoveDuration: 1e3
};
const AUTO_TYPE_CONFIG = {
  placeholderFadeAfter: 500,
  placeholderFadeDuration: 200,
  placeholderFadeInDuration: 300,
  placeholderColor: "#a1a1aa",
  searchResultDisplayDuration: 4e3
};
let _searchQuery$g;
let _searchQueryResult$f;
let _contentElement$f;
let _tryNowButton;
let _showMousePointer = true;
const scheduledTimeoutIds$e = /* @__PURE__ */ new Set();
function scheduleAfter$e(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$e.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$e.add(id);
}
function cancelAllScheduledCallbacks$e() {
  scheduledTimeoutIds$e.forEach(clearTimeout);
  scheduledTimeoutIds$e.clear();
}
function _documentOffset(element) {
  let left = 0, top = 0;
  let node = element;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return { left, top };
}
function _calculateButtonPos() {
  const { left, top } = _documentOffset(_tryNowButton);
  return {
    x: left + _tryNowButton.offsetWidth / 2,
    y: top + _tryNowButton.offsetHeight / 2 + 10
  };
}
function _calculateSearchBoxPos() {
  const { left, top } = _documentOffset(_searchQuery$g);
  return { x: left, y: top + _searchQuery$g.offsetHeight / 2 };
}
function _moveMousePointerTo(x, y, onComplete, duration = 0) {
  mousePointer.moveTo(x, y, duration);
  scheduleAfter$e(() => {
    if (onComplete) onComplete();
  }, duration);
}
function _showCursorLeft() {
  _searchQuery$g.classList.remove(
    "search-query-cursor",
    "search-query-cursor-space"
  );
  _searchQuery$g.classList.add("search-query-cursor-left");
}
function _showCursor() {
  _searchQuery$g.classList.remove(
    "search-query-cursor-left",
    "search-query-cursor-space"
  );
  _searchQuery$g.classList.add("search-query-cursor");
}
function _hideCursor() {
  _searchQuery$g.classList.remove(
    "search-query-cursor",
    "search-query-cursor-left",
    "search-query-cursor-space"
  );
}
function _reserveCursorSpace() {
  _searchQuery$g.classList.remove(
    "search-query-cursor",
    "search-query-cursor-left"
  );
  _searchQuery$g.classList.add("search-query-cursor-space");
}
function showQueryResult$e(image) {
  if (!image) {
    _searchQueryResult$f.classList.remove("visible");
    _contentElement$f.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$f.src = image;
  _searchQueryResult$f.getBoundingClientRect();
  _searchQueryResult$f.classList.add("visible");
  _contentElement$f.classList.add("search-result-visible");
}
function _initTyping() {
  _searchQuery$g.textContent = "";
  _searchQuery$g.style.color = SEARCH_QUERY.searchQueryTextColor;
  _showCursor();
}
function _startAnimatingButton() {
  _tryNowButton.classList.add("animate");
}
function _stopAnimatingButton() {
  _tryNowButton.classList.remove("animate");
}
function _animateButton(onComplete) {
  _startAnimatingButton();
  scheduleAfter$e(() => {
    _stopAnimatingButton();
    if (onComplete) onComplete();
  }, AUTO_TYPE_CONFIG.searchResultDisplayDuration);
}
function _simulateTyping(text, onComplete) {
  scheduleAfter$e(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$g.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$g.classList.add("search-query-fade-out");
    scheduleAfter$e(startTyping, AUTO_TYPE_CONFIG.placeholderFadeDuration);
  }
  function startTyping() {
    _searchQuery$g.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _initTyping();
    if (!_showMousePointer) {
      simulateTap.start();
      simulateTap.startPulse();
    }
    let pos = 0;
    function typeChar() {
      if (pos > text.length) {
        if (onComplete) onComplete();
        return;
      }
      _searchQuery$g.textContent = text.slice(0, pos++);
      scheduleAfter$e(
        typeChar,
        utils.randomIntInRange(
          SEARCH_QUERY.minTypingDelay,
          SEARCH_QUERY.maxTypingDelay
        )
      );
    }
    typeChar();
  }
}
function _simulateTypingAndMouse(text, onComplete) {
  _simulateTyping(text, () => {
    _hideCursor();
    const caretPos = _calculateSearchBoxPos();
    mousePointer.moveTo(caretPos.x, caretPos.y);
    mousePointer.show();
    onComplete();
  });
}
function init$k(elements) {
  _searchQuery$g = elements.searchQuery;
  _searchQueryResult$f = elements.searchQueryResult;
  _contentElement$f = elements.contentElement;
  _tryNowButton = document.getElementById("try-now-button");
  _showMousePointer = elements.showMousePointer;
  if (_showMousePointer) {
    mousePointer.init(elements.contentElement.parentElement);
  } else {
    simulateTap.init();
  }
}
function prepare$1() {
  _showCursorLeft();
  const caretPos = _calculateSearchBoxPos();
  mousePointer.moveTo(caretPos.x, caretPos.y);
}
function simulate$f(text, image, onComplete) {
  _simulateTypingAndMouse(text, afterTypingAndMouse);
  function afterTypingAndMouse() {
    if (_showMousePointer) {
      const buttonPos = _calculateButtonPos();
      _moveMousePointerTo(
        buttonPos.x,
        buttonPos.y,
        afterMouseMoveToButton,
        MOUSE_POINTER.mouseMoveDuration
      );
    } else {
      showQueryResult$e(image);
      scheduleAfter$e(
        cleanupAndAdvance,
        AUTO_TYPE_CONFIG.searchResultDisplayDuration
      );
    }
  }
  function afterMouseMoveToButton() {
    showQueryResult$e(image);
    _animateButton(afterButtonAnimation);
  }
  function afterButtonAnimation() {
    const caretPos = _calculateSearchBoxPos();
    _searchQueryResult$f.classList.remove("visible");
    _contentElement$f.classList.remove("search-result-visible");
    _moveMousePointerTo(
      caretPos.x,
      caretPos.y,
      afterMouseMoveToSearchBox,
      MOUSE_POINTER.mouseMoveDuration
    );
  }
  function afterMouseMoveToSearchBox() {
    mousePointer.hide();
    if (onComplete) onComplete();
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$f.classList.remove("visible");
    _contentElement$f.classList.remove("search-result-visible");
    if (onComplete) onComplete();
  }
}
function cancel$f() {
  cancelAllScheduledCallbacks$e();
  mousePointer.hide();
  _reserveCursorSpace();
  _searchQuery$g?.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
}
const autoTypeCaret = { init: init$k, prepare: prepare$1, simulate: simulate$f, cancel: cancel$f };
const CONFIG$c = {
  minTypingDelay: 20,
  maxTypingDelay: 100
};
let _searchQuery$f;
let _searchQueryResult$e;
let _contentElement$e;
const scheduledTimeoutIds$d = /* @__PURE__ */ new Set();
function scheduleAfter$d(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$d.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$d.add(id);
}
function cancelAllScheduledCallbacks$d() {
  scheduledTimeoutIds$d.forEach(clearTimeout);
  scheduledTimeoutIds$d.clear();
}
function showQueryResult$d(image) {
  if (!image) {
    _searchQueryResult$e.classList.remove("visible");
    _contentElement$e.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$e.src = image;
  _searchQueryResult$e.getBoundingClientRect();
  _searchQueryResult$e.classList.add("visible");
  _contentElement$e.classList.add("search-result-visible");
}
function init$j(elements) {
  _searchQuery$f = elements.searchQuery;
  _searchQueryResult$e = elements.searchQueryResult;
  _contentElement$e = elements.contentElement;
  simulateTap.init();
}
function simulate$e(text, image, onComplete) {
  scheduleAfter$d(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$f.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$f.classList.add("search-query-fade-out");
    scheduleAfter$d(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$f.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$f.textContent = "";
    _searchQuery$f.style.color = "white";
    let pos = 0;
    function typeChar() {
      if (pos >= text.length) {
        scheduleAfter$d(showSearchResult, 200);
        return;
      }
      const span = document.createElement("span");
      span.textContent = text[pos++];
      if (!utils.prefersReducedMotion) {
        span.classList.add("search-query-char-fade-in");
      }
      _searchQuery$f.appendChild(span);
      scheduleAfter$d(
        typeChar,
        utils.randomIntInRange(CONFIG$c.minTypingDelay, CONFIG$c.maxTypingDelay)
      );
    }
    typeChar();
  }
  function showSearchResult() {
    showQueryResult$d(image);
    scheduleAfter$d(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$e.classList.remove("visible");
    _contentElement$e.classList.remove("search-result-visible");
    _searchQuery$f.textContent = "";
    onComplete();
  }
}
function cancel$e() {
  cancelAllScheduledCallbacks$d();
  if (_searchQuery$f) {
    _searchQuery$f.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$f.textContent = "";
  }
}
const autoTypeFadeChars = { init: init$j, simulate: simulate$e, cancel: cancel$e };
const CONFIG$b = {
  searchQueryFadeInDuration: 400,
  searchQueryFadeOutDuration: 400
};
let _searchQuery$e;
let _searchQueryResult$d;
let _contentElement$d;
const scheduledTimeoutIds$c = /* @__PURE__ */ new Set();
function scheduleAfter$c(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$c.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$c.add(id);
}
function cancelAllScheduledCallbacks$c() {
  scheduledTimeoutIds$c.forEach(clearTimeout);
  scheduledTimeoutIds$c.clear();
}
function showQueryResult$c(image) {
  if (!image) {
    _searchQueryResult$d.classList.remove("visible");
    _contentElement$d.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$d.src = image;
  _searchQueryResult$d.getBoundingClientRect();
  _searchQueryResult$d.classList.add("visible");
  _contentElement$d.classList.add("search-result-visible");
}
function init$i(elements) {
  _searchQuery$e = elements.searchQuery;
  _searchQueryResult$d = elements.searchQueryResult;
  _contentElement$d = elements.contentElement;
  simulateTap.init();
}
function simulate$d(text, image, onComplete) {
  scheduleAfter$c(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$e.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$e.classList.add("search-query-fade-out");
    scheduleAfter$c(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$e.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$e.textContent = text;
    _searchQuery$e.style.color = "white";
    void _searchQuery$e.offsetWidth;
    _searchQuery$e.style.setProperty(
      "--fade-in-duration",
      `${CONFIG$b.searchQueryFadeInDuration}ms`
    );
    _searchQuery$e.classList.add("search-query-fade-in");
    scheduleAfter$c(showSearchResult, CONFIG$b.searchQueryFadeInDuration);
  }
  function showSearchResult() {
    _searchQuery$e.classList.remove("search-query-fade-in");
    showQueryResult$c(image);
    scheduleAfter$c(fadeOutQuery, AUTO_TYPE_CONFIG.searchResultDisplayDuration);
  }
  function fadeOutQuery() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$d.classList.remove("visible");
    _contentElement$d.classList.remove("search-result-visible");
    _searchQuery$e.style.setProperty(
      "--fade-out-duration",
      `${CONFIG$b.searchQueryFadeOutDuration}ms`
    );
    _searchQuery$e.classList.add("search-query-fade-out");
    scheduleAfter$c(cleanupAndAdvance, CONFIG$b.searchQueryFadeOutDuration);
  }
  function cleanupAndAdvance() {
    _searchQuery$e.classList.remove("search-query-fade-out");
    if (onComplete) onComplete();
  }
}
function cancel$d() {
  cancelAllScheduledCallbacks$c();
  _searchQuery$e?.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
}
const autoTypeFade = { init: init$i, simulate: simulate$d, cancel: cancel$d };
const CONFIG$a = {
  characterStaggerDelay: 55,
  randomCharRefreshInterval: 45,
  randomCharDuration: 180
};
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let _searchQuery$d;
let _searchQueryResult$c;
let _contentElement$c;
let _cancelled = false;
const scheduledTimeoutIds$b = /* @__PURE__ */ new Set();
function scheduleAfter$b(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$b.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$b.add(id);
}
function cancelAllScheduledCallbacks$b() {
  scheduledTimeoutIds$b.forEach(clearTimeout);
  scheduledTimeoutIds$b.clear();
}
function _randomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}
function showQueryResult$b(image) {
  if (!image) {
    _searchQueryResult$c.classList.remove("visible");
    _contentElement$c.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$c.src = image;
  _searchQueryResult$c.getBoundingClientRect();
  _searchQueryResult$c.classList.add("visible");
  _contentElement$c.classList.add("search-result-visible");
}
function _startScramble(text, onComplete) {
  let nonSpaceCount = 0;
  let lockedCount = 0;
  for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
    if (text[characterIndex] !== " ") nonSpaceCount++;
  }
  if (nonSpaceCount === 0) {
    onComplete();
    return;
  }
  for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
    const targetChar = text[characterIndex];
    if (targetChar === " ") {
      scheduleAfter$b(() => {
        if (_cancelled) return;
        const span = document.createElement("span");
        span.textContent = " ";
        _searchQuery$d.appendChild(span);
      }, characterIndex * CONFIG$a.characterStaggerDelay);
      continue;
    }
    if (utils.prefersReducedMotion) {
      scheduleAfter$b(() => {
        if (_cancelled) return;
        const span = document.createElement("span");
        span.textContent = targetChar;
        span.classList.add("search-query-scramble-locked");
        _searchQuery$d.appendChild(span);
        lockedCount++;
        if (lockedCount === nonSpaceCount) onComplete();
      }, characterIndex * CONFIG$a.characterStaggerDelay);
    } else {
      const startTime = Date.now() + characterIndex * CONFIG$a.characterStaggerDelay;
      scheduleAfter$b(() => {
        if (_cancelled) return;
        const span = document.createElement("span");
        span.textContent = _randomChar();
        span.classList.add("search-query-scramble-char");
        _searchQuery$d.appendChild(span);
        const cycleId = setInterval(() => {
          if (_cancelled) {
            clearInterval(cycleId);
            return;
          }
          if (Date.now() >= startTime + CONFIG$a.randomCharDuration) {
            clearInterval(cycleId);
            span.textContent = targetChar;
            span.classList.add("search-query-scramble-locked");
            lockedCount++;
            if (lockedCount === nonSpaceCount) onComplete();
          } else {
            span.textContent = _randomChar();
          }
        }, CONFIG$a.randomCharRefreshInterval);
      }, characterIndex * CONFIG$a.characterStaggerDelay);
    }
  }
}
function init$h(elements) {
  _searchQuery$d = elements.searchQuery;
  _searchQueryResult$c = elements.searchQueryResult;
  _contentElement$c = elements.contentElement;
  simulateTap.init();
}
function simulate$c(text, image, onComplete) {
  _cancelled = false;
  scheduleAfter$b(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$d.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$d.classList.add("search-query-fade-out");
    scheduleAfter$b(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$d.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$d.textContent = "";
    _searchQuery$d.style.color = "white";
    _startScramble(text, showSearchResult);
  }
  function showSearchResult() {
    if (_cancelled) return;
    showQueryResult$b(image);
    scheduleAfter$b(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$c.classList.remove("visible");
    _contentElement$c.classList.remove("search-result-visible");
    _searchQuery$d.textContent = "";
    onComplete();
  }
}
function cancel$c() {
  _cancelled = true;
  cancelAllScheduledCallbacks$b();
  if (_searchQuery$d) {
    _searchQuery$d.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$d.textContent = "";
  }
}
const autoTypeScramble = { init: init$h, simulate: simulate$c, cancel: cancel$c };
const CONFIG$9 = {
  delayBetweenWords: 280,
  wordSpringScaleDuration: 200
};
let _searchQuery$c;
let _searchQueryResult$b;
let _contentElement$b;
const scheduledTimeoutIds$a = /* @__PURE__ */ new Set();
function scheduleAfter$a(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$a.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$a.add(id);
}
function cancelAllScheduledCallbacks$a() {
  scheduledTimeoutIds$a.forEach(clearTimeout);
  scheduledTimeoutIds$a.clear();
}
function showQueryResult$a(image) {
  if (!image) {
    _searchQueryResult$b.classList.remove("visible");
    _contentElement$b.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$b.src = image;
  _searchQueryResult$b.getBoundingClientRect();
  _searchQueryResult$b.classList.add("visible");
  _contentElement$b.classList.add("search-result-visible");
}
function init$g(elements) {
  _searchQuery$c = elements.searchQuery;
  _searchQueryResult$b = elements.searchQueryResult;
  _contentElement$b = elements.contentElement;
  simulateTap.init();
}
function simulate$b(text, image, onComplete) {
  scheduleAfter$a(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$c.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$c.classList.add("search-query-fade-out");
    scheduleAfter$a(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$c.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$c.textContent = "";
    _searchQuery$c.style.color = "white";
    _searchQuery$c.style.overflow = "visible";
    const words = text.split(" ");
    words.forEach((word, wordIndex) => {
      scheduleAfter$a(() => {
        const span = document.createElement("span");
        span.textContent = wordIndex < words.length - 1 ? word + " " : word;
        if (!utils.prefersReducedMotion) {
          const burstScale = (1.1 + Math.random() * 0.25).toFixed(2);
          const burstRotate = (Math.random() * 10 - 5).toFixed(1);
          span.style.setProperty("--burst-scale", burstScale);
          span.style.setProperty("--burst-rotate", `${burstRotate}deg`);
          span.classList.add("search-query-word-burst");
        }
        _searchQuery$c.appendChild(span);
      }, wordIndex * CONFIG$9.delayBetweenWords);
    });
    const animationCompleteDuration = (words.length - 1) * CONFIG$9.delayBetweenWords + CONFIG$9.wordSpringScaleDuration;
    scheduleAfter$a(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$a(image);
    scheduleAfter$a(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$b.classList.remove("visible");
    _contentElement$b.classList.remove("search-result-visible");
    _searchQuery$c.style.overflow = "";
    _searchQuery$c.textContent = "";
    onComplete();
  }
}
function cancel$b() {
  cancelAllScheduledCallbacks$a();
  if (_searchQuery$c) {
    _searchQuery$c.style.overflow = "";
    _searchQuery$c.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$c.textContent = "";
  }
}
const autoTypeWordBurst = { init: init$g, simulate: simulate$b, cancel: cancel$b };
const CONFIG$8 = {
  characterStaggerDelay: 55,
  bounceDuration: 360,
  fallHeightMin: -28,
  fallHeightMax: -6,
  springOvershootMin: 2,
  springOvershootMax: 10
};
let _searchQuery$b;
let _searchQueryResult$a;
let _contentElement$a;
const scheduledTimeoutIds$9 = /* @__PURE__ */ new Set();
function scheduleAfter$9(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$9.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$9.add(id);
}
function cancelAllScheduledCallbacks$9() {
  scheduledTimeoutIds$9.forEach(clearTimeout);
  scheduledTimeoutIds$9.clear();
}
function showQueryResult$9(image) {
  if (!image) {
    _searchQueryResult$a.classList.remove("visible");
    _contentElement$a.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$a.src = image;
  _searchQueryResult$a.getBoundingClientRect();
  _searchQueryResult$a.classList.add("visible");
  _contentElement$a.classList.add("search-result-visible");
}
function init$f(elements) {
  _searchQuery$b = elements.searchQuery;
  _searchQueryResult$a = elements.searchQueryResult;
  _contentElement$a = elements.contentElement;
  simulateTap.init();
}
function simulate$a(text, image, onComplete) {
  scheduleAfter$9(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$b.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$b.classList.add("search-query-fade-out");
    scheduleAfter$9(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$b.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$b.textContent = "";
    _searchQuery$b.style.color = "white";
    _searchQuery$b.style.overflow = "visible";
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      scheduleAfter$9(() => {
        const span = document.createElement("span");
        span.textContent = character === " " ? " " : character;
        if (!utils.prefersReducedMotion && character !== " ") {
          const fromY = utils.randomIntInRange(
            CONFIG$8.fallHeightMin,
            CONFIG$8.fallHeightMax
          );
          const springOvershoot = utils.randomIntInRange(
            CONFIG$8.springOvershootMin,
            CONFIG$8.springOvershootMax
          );
          const duration = utils.randomIntInRange(
            CONFIG$8.bounceDuration - 80,
            CONFIG$8.bounceDuration + 120
          );
          span.style.setProperty("--bounce-from-y", `${fromY}px`);
          span.style.setProperty("--bounce-overshoot", `${springOvershoot}px`);
          span.style.setProperty("--bounce-duration", `${duration}ms`);
          span.classList.add("search-query-char-bounce");
        }
        _searchQuery$b.appendChild(span);
      }, characterIndex * CONFIG$8.characterStaggerDelay);
    }
    const animationCompleteDuration = (text.length - 1) * CONFIG$8.characterStaggerDelay + CONFIG$8.bounceDuration + 120;
    scheduleAfter$9(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$9(image);
    scheduleAfter$9(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$a.classList.remove("visible");
    _contentElement$a.classList.remove("search-result-visible");
    _searchQuery$b.style.overflow = "";
    _searchQuery$b.textContent = "";
    onComplete();
  }
}
function cancel$a() {
  cancelAllScheduledCallbacks$9();
  if (_searchQuery$b) {
    _searchQuery$b.style.overflow = "";
    _searchQuery$b.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$b.textContent = "";
  }
}
const autoTypeBounce = { init: init$f, simulate: simulate$a, cancel: cancel$a };
const CONFIG$7 = {
  revealDuration: 600
};
let _searchQuery$a;
let _searchQueryResult$9;
let _contentElement$9;
const scheduledTimeoutIds$8 = /* @__PURE__ */ new Set();
function scheduleAfter$8(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$8.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$8.add(id);
}
function cancelAllScheduledCallbacks$8() {
  scheduledTimeoutIds$8.forEach(clearTimeout);
  scheduledTimeoutIds$8.clear();
}
function showQueryResult$8(image) {
  if (!image) {
    _searchQueryResult$9.classList.remove("visible");
    _contentElement$9.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$9.src = image;
  _searchQueryResult$9.getBoundingClientRect();
  _searchQueryResult$9.classList.add("visible");
  _contentElement$9.classList.add("search-result-visible");
}
function init$e(elements) {
  _searchQuery$a = elements.searchQuery;
  _searchQueryResult$9 = elements.searchQueryResult;
  _contentElement$9 = elements.contentElement;
  simulateTap.init();
}
function simulate$9(text, image, onComplete) {
  scheduleAfter$8(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$a.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$a.classList.add("search-query-fade-out");
    scheduleAfter$8(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$a.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$a.textContent = text;
    _searchQuery$a.style.color = "white";
    if (!utils.prefersReducedMotion) {
      void _searchQuery$a.offsetWidth;
      _searchQuery$a.style.setProperty(
        "--reveal-duration",
        `${CONFIG$7.revealDuration}ms`
      );
      _searchQuery$a.classList.add("search-query-reveal-ltr");
    }
    scheduleAfter$8(showSearchResult, CONFIG$7.revealDuration);
  }
  function showSearchResult() {
    _searchQuery$a.classList.remove("search-query-reveal-ltr");
    showQueryResult$8(image);
    scheduleAfter$8(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$9.classList.remove("visible");
    _contentElement$9.classList.remove("search-result-visible");
    _searchQuery$a.textContent = "";
    onComplete();
  }
}
function cancel$9() {
  cancelAllScheduledCallbacks$8();
  if (_searchQuery$a) {
    _searchQuery$a.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out",
      "search-query-reveal-ltr"
    );
    _searchQuery$a.textContent = "";
  }
}
const autoTypeReveal = { init: init$e, simulate: simulate$9, cancel: cancel$9 };
const CONFIG$6 = {
  characterStaggerDelay: 50,
  spinDurationMin: 500,
  spinDurationMax: 900,
  preRollSymbolCountMin: 6,
  preRollSymbolCountMax: 16,
  symbolsAbovePayline: 1,
  symbolsBelowPayline: 2,
  reelSnapOvershootMin: 6,
  reelSnapOvershootMax: 16
};
const SLOT_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
let _searchQuery$9;
let _searchQueryResult$8;
let _contentElement$8;
const scheduledTimeoutIds$7 = /* @__PURE__ */ new Set();
function scheduleAfter$7(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$7.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$7.add(id);
}
function cancelAllScheduledCallbacks$7() {
  scheduledTimeoutIds$7.forEach(clearTimeout);
  scheduledTimeoutIds$7.clear();
}
function _randomSlotChar() {
  return SLOT_CHARSET[Math.floor(Math.random() * SLOT_CHARSET.length)];
}
function showQueryResult$7(image) {
  if (!image) {
    _searchQueryResult$8.classList.remove("visible");
    _contentElement$8.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$8.src = image;
  _searchQueryResult$8.getBoundingClientRect();
  _searchQueryResult$8.classList.add("visible");
  _contentElement$8.classList.add("search-result-visible");
}
function init$d(elements) {
  _searchQuery$9 = elements.searchQuery;
  _searchQueryResult$8 = elements.searchQueryResult;
  _contentElement$8 = elements.contentElement;
  simulateTap.init();
}
function simulate$8(text, image, onComplete) {
  scheduleAfter$7(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$9.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$9.classList.add("search-query-fade-out");
    scheduleAfter$7(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$9.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$9.textContent = "";
    _searchQuery$9.style.color = "white";
    _searchQuery$9.style.overflow = "visible";
    let lastNonSpaceIndex = 0;
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      if (character === " ") {
        scheduleAfter$7(() => {
          const spaceSpan = document.createElement("span");
          spaceSpan.textContent = " ";
          spaceSpan.style.display = "inline-block";
          _searchQuery$9.appendChild(spaceSpan);
        }, characterIndex * CONFIG$6.characterStaggerDelay);
        continue;
      }
      lastNonSpaceIndex = characterIndex;
      scheduleAfter$7(() => {
        if (utils.prefersReducedMotion) {
          const span = document.createElement("span");
          span.textContent = character;
          _searchQuery$9.appendChild(span);
          return;
        }
        const measure = document.createElement("span");
        measure.textContent = character;
        measure.style.cssText = "visibility:hidden;position:absolute;";
        _searchQuery$9.appendChild(measure);
        const charWidth = measure.offsetWidth;
        const charHeight = measure.offsetHeight;
        _searchQuery$9.removeChild(measure);
        const searchBoxEl = _searchQuery$9.closest(".search-box");
        const barHeight = searchBoxEl ? searchBoxEl.offsetHeight : charHeight * 3;
        const charPaddingV = Math.round((barHeight - charHeight) / 2);
        const outer = document.createElement("span");
        outer.classList.add("search-query-slot-machine-outer");
        outer.style.width = `${charWidth}px`;
        outer.style.height = `${charHeight}px`;
        const clip = document.createElement("span");
        clip.classList.add("search-query-slot-machine-clip");
        clip.style.top = `-${charPaddingV}px`;
        clip.style.height = `${barHeight}px`;
        clip.style.setProperty("--slot-opaque-start", `${charPaddingV}px`);
        clip.style.setProperty(
          "--slot-opaque-end",
          `${barHeight - charPaddingV}px`
        );
        const inner = document.createElement("span");
        inner.classList.add("search-query-slot-machine-inner");
        const makeRow = (rowText) => {
          const row = document.createElement("span");
          row.textContent = rowText;
          row.style.height = `${charHeight}px`;
          row.style.lineHeight = `${charHeight}px`;
          return row;
        };
        for (let reelIndex = 0; reelIndex < CONFIG$6.symbolsAbovePayline; reelIndex++)
          inner.appendChild(makeRow(_randomSlotChar()));
        inner.appendChild(makeRow(character));
        for (let reelIndex = 0; reelIndex < CONFIG$6.symbolsBelowPayline; reelIndex++)
          inner.appendChild(makeRow(_randomSlotChar()));
        const preRollCount = utils.randomIntInRange(
          CONFIG$6.preRollSymbolCountMin,
          CONFIG$6.preRollSymbolCountMax
        );
        for (let reelIndex = 0; reelIndex < preRollCount; reelIndex++)
          inner.appendChild(makeRow(_randomSlotChar()));
        const start2 = -(CONFIG$6.symbolsAbovePayline + CONFIG$6.symbolsBelowPayline + preRollCount) * charHeight;
        const travel = charPaddingV - CONFIG$6.symbolsAbovePayline * charHeight;
        const spinDuration = utils.randomIntInRange(
          CONFIG$6.spinDurationMin,
          CONFIG$6.spinDurationMax
        );
        const reelSnapOvershoot = utils.randomIntInRange(
          CONFIG$6.reelSnapOvershootMin,
          CONFIG$6.reelSnapOvershootMax
        );
        inner.style.setProperty("--slot-start", `${start2}px`);
        inner.style.setProperty("--slot-travel", `${travel}px`);
        inner.style.setProperty("--slot-duration", `${spinDuration}ms`);
        inner.style.setProperty("--slot-bounce", `${reelSnapOvershoot}px`);
        clip.appendChild(inner);
        outer.appendChild(clip);
        _searchQuery$9.appendChild(outer);
      }, characterIndex * CONFIG$6.characterStaggerDelay);
    }
    const animationCompleteDuration = lastNonSpaceIndex * CONFIG$6.characterStaggerDelay + CONFIG$6.spinDurationMax;
    scheduleAfter$7(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$7(image);
    scheduleAfter$7(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$8.classList.remove("visible");
    _contentElement$8.classList.remove("search-result-visible");
    _searchQuery$9.style.overflow = "";
    _searchQuery$9.textContent = "";
    onComplete();
  }
}
function cancel$8() {
  cancelAllScheduledCallbacks$7();
  if (_searchQuery$9) {
    _searchQuery$9.style.overflow = "";
    _searchQuery$9.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$9.textContent = "";
  }
}
const autoTypeSlotMachine = { init: init$d, simulate: simulate$8, cancel: cancel$8 };
const CONFIG$5 = {
  characterStaggerDelay: 60,
  focusPullDurationMin: 1200,
  focusPullDurationMax: 2600,
  defocusAmountMin: 12,
  defocusAmountMax: 32
};
let _searchQuery$8;
let _searchQueryResult$7;
let _contentElement$7;
const scheduledTimeoutIds$6 = /* @__PURE__ */ new Set();
function scheduleAfter$6(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$6.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$6.add(id);
}
function cancelAllScheduledCallbacks$6() {
  scheduledTimeoutIds$6.forEach(clearTimeout);
  scheduledTimeoutIds$6.clear();
}
function showQueryResult$6(image) {
  if (!image) {
    _searchQueryResult$7.classList.remove("visible");
    _contentElement$7.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$7.src = image;
  _searchQueryResult$7.getBoundingClientRect();
  _searchQueryResult$7.classList.add("visible");
  _contentElement$7.classList.add("search-result-visible");
}
function init$c(elements) {
  _searchQuery$8 = elements.searchQuery;
  _searchQueryResult$7 = elements.searchQueryResult;
  _contentElement$7 = elements.contentElement;
  simulateTap.init();
}
function simulate$7(text, image, onComplete) {
  scheduleAfter$6(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$8.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$8.classList.add("search-query-fade-out");
    scheduleAfter$6(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$8.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$8.textContent = "";
    _searchQuery$8.style.color = "white";
    _searchQuery$8.style.overflow = "visible";
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      scheduleAfter$6(() => {
        const span = document.createElement("span");
        span.textContent = character === " " ? " " : character;
        if (!utils.prefersReducedMotion && character !== " ") {
          const blur = utils.randomIntInRange(
            CONFIG$5.defocusAmountMin,
            CONFIG$5.defocusAmountMax
          );
          const duration = utils.randomIntInRange(
            CONFIG$5.focusPullDurationMin,
            CONFIG$5.focusPullDurationMax
          );
          span.style.setProperty("--focus-blur", `${blur}px`);
          span.style.setProperty("--focus-duration", `${duration}ms`);
          span.classList.add("search-query-char-focus");
        }
        _searchQuery$8.appendChild(span);
      }, characterIndex * CONFIG$5.characterStaggerDelay);
    }
    const animationCompleteDuration = (text.length - 1) * CONFIG$5.characterStaggerDelay + CONFIG$5.focusPullDurationMax;
    scheduleAfter$6(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$6(image);
    scheduleAfter$6(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$7.classList.remove("visible");
    _contentElement$7.classList.remove("search-result-visible");
    _searchQuery$8.style.overflow = "";
    _searchQuery$8.textContent = "";
    onComplete();
  }
}
function cancel$7() {
  cancelAllScheduledCallbacks$6();
  if (_searchQuery$8) {
    _searchQuery$8.style.overflow = "";
    _searchQuery$8.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$8.textContent = "";
  }
}
const autoTypeFocus = { init: init$c, simulate: simulate$7, cancel: cancel$7 };
const CONFIG$4 = {
  characterStaggerDelay: 70,
  neonDuration: 400,
  animationDelayJitterMax: 30,
  neonColor: "#FF6000",
  neonColorDim: "#cc4d00"
};
let _searchQuery$7;
let _searchQueryResult$6;
let _contentElement$6;
const scheduledTimeoutIds$5 = /* @__PURE__ */ new Set();
function scheduleAfter$5(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$5.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$5.add(id);
}
function cancelAllScheduledCallbacks$5() {
  scheduledTimeoutIds$5.forEach(clearTimeout);
  scheduledTimeoutIds$5.clear();
}
function showQueryResult$5(image) {
  if (!image) {
    _searchQueryResult$6.classList.remove("visible");
    _contentElement$6.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$6.src = image;
  _searchQueryResult$6.getBoundingClientRect();
  _searchQueryResult$6.classList.add("visible");
  _contentElement$6.classList.add("search-result-visible");
}
function init$b(elements) {
  _searchQuery$7 = elements.searchQuery;
  _searchQueryResult$6 = elements.searchQueryResult;
  _contentElement$6 = elements.contentElement;
  simulateTap.init();
}
function simulate$6(text, image, onComplete) {
  scheduleAfter$5(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$7.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$7.classList.add("search-query-fade-out");
    scheduleAfter$5(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$7.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$7.textContent = "";
    _searchQuery$7.style.color = "white";
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      scheduleAfter$5(() => {
        const span = document.createElement("span");
        span.textContent = character === " " ? " " : character;
        if (!utils.prefersReducedMotion && character !== " ") {
          const jitter = Math.floor(
            Math.random() * CONFIG$4.animationDelayJitterMax
          );
          span.style.setProperty("--neon-duration", `${CONFIG$4.neonDuration}ms`);
          span.style.setProperty("--neon-jitter", `${jitter}ms`);
          span.style.setProperty("--neon-color", CONFIG$4.neonColor);
          span.style.setProperty("--neon-color-dim", CONFIG$4.neonColorDim);
          span.classList.add("search-query-char-neon");
        }
        _searchQuery$7.appendChild(span);
      }, characterIndex * CONFIG$4.characterStaggerDelay);
    }
    const animationCompleteDuration = (text.length - 1) * CONFIG$4.characterStaggerDelay + CONFIG$4.neonDuration + CONFIG$4.animationDelayJitterMax;
    scheduleAfter$5(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$5(image);
    scheduleAfter$5(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$6.classList.remove("visible");
    _contentElement$6.classList.remove("search-result-visible");
    _searchQuery$7.textContent = "";
    onComplete();
  }
}
function cancel$6() {
  cancelAllScheduledCallbacks$5();
  if (_searchQuery$7) {
    _searchQuery$7.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$7.textContent = "";
  }
}
const autoTypeNeon = { init: init$b, simulate: simulate$6, cancel: cancel$6 };
const CONFIG$3 = {
  characterStaggerDelay: 80,
  characterFadeInDuration: 600
};
let _searchQuery$6;
let _searchQueryResult$5;
let _contentElement$5;
const scheduledTimeoutIds$4 = /* @__PURE__ */ new Set();
function scheduleAfter$4(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$4.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$4.add(id);
}
function cancelAllScheduledCallbacks$4() {
  scheduledTimeoutIds$4.forEach(clearTimeout);
  scheduledTimeoutIds$4.clear();
}
function showQueryResult$4(image) {
  if (!image) {
    _searchQueryResult$5.classList.remove("visible");
    _contentElement$5.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$5.src = image;
  _searchQueryResult$5.getBoundingClientRect();
  _searchQueryResult$5.classList.add("visible");
  _contentElement$5.classList.add("search-result-visible");
}
function init$a(elements) {
  _searchQuery$6 = elements.searchQuery;
  _searchQueryResult$5 = elements.searchQueryResult;
  _contentElement$5 = elements.contentElement;
  simulateTap.init();
}
function simulate$5(text, image, onComplete) {
  scheduleAfter$4(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$6.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$6.classList.add("search-query-fade-out");
    scheduleAfter$4(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$6.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$6.textContent = "";
    _searchQuery$6.style.color = "white";
    _searchQuery$6.style.overflow = "visible";
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      scheduleAfter$4(() => {
        const span = document.createElement("span");
        span.textContent = character === " " ? " " : character;
        if (!utils.prefersReducedMotion && character !== " ") {
          span.style.setProperty(
            "--ghost-duration",
            `${CONFIG$3.characterFadeInDuration}ms`
          );
          span.classList.add("search-query-char-ghost");
        }
        _searchQuery$6.appendChild(span);
      }, characterIndex * CONFIG$3.characterStaggerDelay);
    }
    const animationCompleteDuration = (text.length - 1) * CONFIG$3.characterStaggerDelay + CONFIG$3.characterFadeInDuration;
    scheduleAfter$4(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$4(image);
    scheduleAfter$4(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$5.classList.remove("visible");
    _contentElement$5.classList.remove("search-result-visible");
    _searchQuery$6.style.overflow = "";
    _searchQuery$6.textContent = "";
    onComplete();
  }
}
function cancel$5() {
  cancelAllScheduledCallbacks$4();
  if (_searchQuery$6) {
    _searchQuery$6.style.overflow = "";
    _searchQuery$6.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$6.textContent = "";
  }
}
const autoTypeGhost = { init: init$a, simulate: simulate$5, cancel: cancel$5 };
const CONFIG$2 = {
  characterStaggerDelay: 25,
  fallDurationMin: 200,
  fallDurationMax: 400,
  fallHeightMin: -50,
  fallHeightMax: -15,
  trailDurationMin: 180,
  trailDurationMax: 320,
  trailDelayMin: 60,
  trailDelayMax: 140
};
let _searchQuery$5;
let _searchQueryResult$4;
let _contentElement$4;
const scheduledTimeoutIds$3 = /* @__PURE__ */ new Set();
function scheduleAfter$3(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$3.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$3.add(id);
}
function cancelAllScheduledCallbacks$3() {
  scheduledTimeoutIds$3.forEach(clearTimeout);
  scheduledTimeoutIds$3.clear();
}
function showQueryResult$3(image) {
  if (!image) {
    _searchQueryResult$4.classList.remove("visible");
    _contentElement$4.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$4.src = image;
  _searchQueryResult$4.getBoundingClientRect();
  _searchQueryResult$4.classList.add("visible");
  _contentElement$4.classList.add("search-result-visible");
}
function init$9(elements) {
  _searchQuery$5 = elements.searchQuery;
  _searchQueryResult$4 = elements.searchQueryResult;
  _contentElement$4 = elements.contentElement;
  simulateTap.init();
}
function simulate$4(text, image, onComplete) {
  scheduleAfter$3(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$5.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$5.classList.add("search-query-fade-out");
    scheduleAfter$3(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$5.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$5.textContent = "";
    _searchQuery$5.style.color = "white";
    _searchQuery$5.style.overflow = "visible";
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      scheduleAfter$3(() => {
        if (utils.prefersReducedMotion || character === " ") {
          const span = document.createElement("span");
          span.textContent = character === " " ? " " : character;
          _searchQuery$5.appendChild(span);
          return;
        }
        const wrapper = document.createElement("span");
        wrapper.classList.add("search-query-wf-char");
        const fromY = utils.randomIntInRange(
          CONFIG$2.fallHeightMin,
          CONFIG$2.fallHeightMax
        );
        const fallDuration = utils.randomIntInRange(
          CONFIG$2.fallDurationMin,
          CONFIG$2.fallDurationMax
        );
        const trailDuration = utils.randomIntInRange(
          CONFIG$2.trailDurationMin,
          CONFIG$2.trailDurationMax
        );
        const trailDelay = utils.randomIntInRange(
          CONFIG$2.trailDelayMin,
          CONFIG$2.trailDelayMax
        );
        const primary = document.createElement("span");
        primary.classList.add("search-query-wf-primary");
        primary.textContent = character;
        primary.style.setProperty("--wf-from-y", `${fromY}px`);
        primary.style.setProperty("--wf-fall-duration", `${fallDuration}ms`);
        const trail = document.createElement("span");
        trail.classList.add("search-query-wf-trail");
        trail.textContent = character;
        trail.style.setProperty("--wf-from-y", `${fromY}px`);
        trail.style.setProperty("--wf-trail-duration", `${trailDuration}ms`);
        trail.style.setProperty("--wf-trail-delay", `${trailDelay}ms`);
        wrapper.appendChild(primary);
        wrapper.appendChild(trail);
        _searchQuery$5.appendChild(wrapper);
      }, characterIndex * CONFIG$2.characterStaggerDelay);
    }
    const animationCompleteDuration = (text.length - 1) * CONFIG$2.characterStaggerDelay + CONFIG$2.fallDurationMax;
    scheduleAfter$3(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$3(image);
    scheduleAfter$3(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$4.classList.remove("visible");
    _contentElement$4.classList.remove("search-result-visible");
    _searchQuery$5.style.overflow = "";
    _searchQuery$5.textContent = "";
    onComplete();
  }
}
function cancel$4() {
  cancelAllScheduledCallbacks$3();
  if (_searchQuery$5) {
    _searchQuery$5.style.overflow = "";
    _searchQuery$5.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$5.textContent = "";
  }
}
const autoTypeWaterfall = { init: init$9, simulate: simulate$4, cancel: cancel$4 };
const CONFIG$1 = {
  flyDistanceMin: 40,
  flyDistanceMax: 1500,
  flyDuration: 500,
  characterStaggerDelay: 45,
  characterStartScaleMin: 8,
  characterStartScaleMax: 32,
  characterEndScaleMin: 1.05,
  characterEndScaleMax: 1.15,
  characterStartRotationMax: 180
};
let _searchQuery$4;
let _searchQueryResult$3;
let _contentElement$3;
const scheduledTimeoutIds$2 = /* @__PURE__ */ new Set();
function scheduleAfter$2(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$2.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$2.add(id);
}
function cancelAllScheduledCallbacks$2() {
  scheduledTimeoutIds$2.forEach(clearTimeout);
  scheduledTimeoutIds$2.clear();
}
function showQueryResult$2(image) {
  if (!image) {
    _searchQueryResult$3.classList.remove("visible");
    _contentElement$3.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$3.src = image;
  _searchQueryResult$3.getBoundingClientRect();
  _searchQueryResult$3.classList.add("visible");
  _contentElement$3.classList.add("search-result-visible");
}
function init$8(elements) {
  _searchQuery$4 = elements.searchQuery;
  _searchQueryResult$3 = elements.searchQueryResult;
  _contentElement$3 = elements.contentElement;
  simulateTap.init();
}
function simulate$3(text, image, onComplete) {
  scheduleAfter$2(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$4.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$4.classList.add("search-query-fade-out");
    scheduleAfter$2(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$4.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$4.textContent = "";
    _searchQuery$4.style.color = "white";
    _searchQuery$4.style.overflow = "visible";
    const searchContainer = _searchQuery$4.closest(".search-container");
    if (searchContainer) {
      searchContainer.style.position = "relative";
      searchContainer.style.zIndex = "10";
    }
    for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
      const character = text[characterIndex];
      scheduleAfter$2(() => {
        const span = document.createElement("span");
        span.textContent = character === " " ? " " : character;
        if (!utils.prefersReducedMotion && character !== " ") {
          const angle = Math.random() * 2 * Math.PI;
          const distance = utils.randomIntInRange(
            CONFIG$1.flyDistanceMin,
            CONFIG$1.flyDistanceMax
          );
          const fromX = Math.round(Math.cos(angle) * distance);
          const fromY = Math.round(Math.sin(angle) * distance);
          const duration = utils.randomIntInRange(
            CONFIG$1.flyDuration - 60,
            CONFIG$1.flyDuration + 80
          );
          span.style.setProperty("--fly-from-x", `${fromX}px`);
          span.style.setProperty("--fly-from-y", `${fromY}px`);
          span.style.setProperty("--fly-duration", `${duration}ms`);
          const startScale = (CONFIG$1.characterStartScaleMin + Math.random() * (CONFIG$1.characterStartScaleMax - CONFIG$1.characterStartScaleMin)).toFixed(3);
          span.style.setProperty("--character-start-scale", startScale);
          const endScale = (CONFIG$1.characterEndScaleMin + Math.random() * (CONFIG$1.characterEndScaleMax - CONFIG$1.characterEndScaleMin)).toFixed(3);
          span.style.setProperty("--character-end-scale", endScale);
          const rotation = Math.round(
            (Math.random() * 2 - 1) * CONFIG$1.characterStartRotationMax
          );
          span.style.setProperty(
            "--character-start-rotation",
            `${rotation}deg`
          );
          span.classList.add("search-query-char-assemble");
        }
        _searchQuery$4.appendChild(span);
      }, characterIndex * CONFIG$1.characterStaggerDelay);
    }
    const animationCompleteDuration = (text.length - 1) * CONFIG$1.characterStaggerDelay + CONFIG$1.flyDuration + 80;
    scheduleAfter$2(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$2(image);
    scheduleAfter$2(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$3.classList.remove("visible");
    _contentElement$3.classList.remove("search-result-visible");
    _searchQuery$4.style.overflow = "";
    const searchContainer = _searchQuery$4.closest(".search-container");
    if (searchContainer) {
      searchContainer.style.position = "";
      searchContainer.style.zIndex = "";
    }
    _searchQuery$4.textContent = "";
    onComplete();
  }
}
function cancel$3() {
  cancelAllScheduledCallbacks$2();
  if (_searchQuery$4) {
    _searchQuery$4.style.overflow = "";
    const searchContainerOnCancel = _searchQuery$4.closest(".search-container");
    if (searchContainerOnCancel) {
      searchContainerOnCancel.style.position = "";
      searchContainerOnCancel.style.zIndex = "";
    }
    _searchQuery$4.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$4.textContent = "";
  }
}
const autoTypeAssemble = { init: init$8, simulate: simulate$3, cancel: cancel$3 };
const CONFIG = {
  revealDelay: 80,
  fadeDuration: 250
};
let _searchQuery$3;
let _searchQueryResult$2;
let _contentElement$2;
const scheduledTimeoutIds$1 = /* @__PURE__ */ new Set();
function scheduleAfter$1(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds$1.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds$1.add(id);
}
function cancelAllScheduledCallbacks$1() {
  scheduledTimeoutIds$1.forEach(clearTimeout);
  scheduledTimeoutIds$1.clear();
}
function showQueryResult$1(image) {
  if (!image) {
    _searchQueryResult$2.classList.remove("visible");
    _contentElement$2.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$2.src = image;
  _searchQueryResult$2.getBoundingClientRect();
  _searchQueryResult$2.classList.add("visible");
  _contentElement$2.classList.add("search-result-visible");
}
function shuffledIndices(length) {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}
function init$7(elements) {
  _searchQuery$3 = elements.searchQuery;
  _searchQueryResult$2 = elements.searchQueryResult;
  _contentElement$2 = elements.contentElement;
  simulateTap.init();
}
function simulate$2(text, image, onComplete) {
  scheduleAfter$1(fadeOutPlaceholder, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function fadeOutPlaceholder() {
    _searchQuery$3.style.setProperty(
      "--fade-out-duration",
      `${AUTO_TYPE_CONFIG.placeholderFadeDuration}ms`
    );
    _searchQuery$3.classList.add("search-query-fade-out");
    scheduleAfter$1(
      buildAndAnimateQuery,
      AUTO_TYPE_CONFIG.placeholderFadeDuration
    );
  }
  function buildAndAnimateQuery() {
    simulateTap.start();
    simulateTap.startPulse();
    _searchQuery$3.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$3.textContent = "";
    _searchQuery$3.style.color = "white";
    const spans = [];
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");
      const character = text[i];
      if (character === " ") {
        span.textContent = " ";
      } else {
        span.textContent = character;
        if (!utils.prefersReducedMotion) {
          span.style.setProperty(
            "--sprinkle-fade-duration",
            `${CONFIG.fadeDuration}ms`
          );
          span.style.opacity = "0";
        }
      }
      spans.push(span);
      _searchQuery$3.appendChild(span);
    }
    const nonSpaceIndices = shuffledIndices(
      spans.filter((_, i) => text[i] !== " ").length
    );
    const nonSpaceSpans = spans.filter((_, i) => text[i] !== " ");
    nonSpaceIndices.forEach((spanIndex, revealStep) => {
      scheduleAfter$1(() => {
        if (!utils.prefersReducedMotion) {
          nonSpaceSpans[spanIndex].classList.add("search-query-char-sprinkle");
        } else {
          nonSpaceSpans[spanIndex].style.opacity = "1";
        }
      }, revealStep * CONFIG.revealDelay);
    });
    const animationCompleteDuration = (nonSpaceIndices.length - 1) * CONFIG.revealDelay + CONFIG.fadeDuration;
    scheduleAfter$1(showSearchResult, animationCompleteDuration);
  }
  function showSearchResult() {
    showQueryResult$1(image);
    scheduleAfter$1(
      cleanupAndAdvance,
      AUTO_TYPE_CONFIG.searchResultDisplayDuration
    );
  }
  function cleanupAndAdvance() {
    simulateTap.stop();
    simulateTap.stopPulse();
    _searchQueryResult$2.classList.remove("visible");
    _contentElement$2.classList.remove("search-result-visible");
    _searchQuery$3.textContent = "";
    onComplete();
  }
}
function cancel$2() {
  cancelAllScheduledCallbacks$1();
  if (_searchQuery$3) {
    _searchQuery$3.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$3.textContent = "";
  }
}
const autoTypeSprinkle = { init: init$7, simulate: simulate$2, cancel: cancel$2 };
let _searchQuery$2;
let _searchQueryResult$1;
let _contentElement$1;
const scheduledTimeoutIds = /* @__PURE__ */ new Set();
function scheduleAfter(onComplete, delay) {
  const id = setTimeout(() => {
    scheduledTimeoutIds.delete(id);
    onComplete();
  }, delay);
  scheduledTimeoutIds.add(id);
}
function cancelAllScheduledCallbacks() {
  scheduledTimeoutIds.forEach(clearTimeout);
  scheduledTimeoutIds.clear();
}
function showQueryResult(image) {
  if (!image) {
    _searchQueryResult$1.classList.remove("visible");
    _contentElement$1.classList.remove("search-result-visible");
    return;
  }
  _searchQueryResult$1.src = image;
  _searchQueryResult$1.getBoundingClientRect();
  _searchQueryResult$1.classList.add("visible");
  _contentElement$1.classList.add("search-result-visible");
}
function init$6(elements) {
  _searchQuery$2 = elements.searchQuery;
  _searchQueryResult$1 = elements.searchQueryResult;
  _contentElement$1 = elements.contentElement;
  simulateTap.init();
}
function simulate$1(text, image, onComplete) {
  scheduleAfter(showQuery, AUTO_TYPE_CONFIG.placeholderFadeAfter);
  function showQuery() {
    _searchQuery$2.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    _searchQuery$2.textContent = text;
    _searchQuery$2.style.color = "white";
    showQueryResult(image);
    scheduleAfter(hideAndAdvance, AUTO_TYPE_CONFIG.searchResultDisplayDuration);
  }
  function hideAndAdvance() {
    _searchQueryResult$1.classList.remove("visible");
    _contentElement$1.classList.remove("search-result-visible");
    onComplete();
  }
}
function cancel$1() {
  cancelAllScheduledCallbacks();
  _searchQuery$2?.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
}
const autoTypeReducedMotion = { init: init$6, simulate: simulate$1, cancel: cancel$1 };
const _modes = [];
let _queue = [];
let _activeMode = null;
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function init$5(elements) {
  for (const mode of [
    autoTypeAssemble,
    autoTypeBounce,
    autoTypeFade,
    autoTypeFadeChars,
    autoTypeFocus,
    autoTypeGhost,
    autoTypeNeon,
    autoTypeReveal,
    autoTypeScramble,
    autoTypeSlotMachine,
    autoTypeSprinkle,
    autoTypeWaterfall,
    autoTypeWordBurst
  ]) {
    mode.init(elements);
    _modes.push(mode);
  }
}
function prepare() {
  if (_queue.length === 0) {
    _shuffle(_modes.slice()).forEach((mode) => _queue.push(mode));
    if (_queue[0] === _activeMode && _queue.length > 1) {
      _queue.push(_queue.shift());
    }
  }
  _activeMode = _queue.shift();
  _activeMode.prepare?.();
}
function simulate(text, image, callback) {
  _activeMode.simulate(text, image, callback);
}
function cancel() {
  _activeMode?.cancel();
}
const autoTypeRandom = { init: init$5, prepare, simulate, cancel };
let _searchQuery$1;
let _searchInput$2;
let _searchQueryResult;
let _contentElement;
let _searchQueries;
let _placeholder;
let _activeAnimation;
let currentQuery = { query: "" };
let currentQueryIndex = 0;
let startupFrameId = null;
let isFirstRun = true;
function resetToPlaceholder(animate = true) {
  _searchQuery$1.style.opacity = "0";
  _searchQuery$1.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  _searchQuery$1.textContent = _placeholder;
  _searchQuery$1.style.color = AUTO_TYPE_CONFIG.placeholderColor;
  _searchQueryResult.classList.remove("visible");
  _contentElement.classList.remove("search-result-visible");
  if (isFirstRun || !animate) {
    isFirstRun = false;
    _searchQuery$1.style.opacity = "";
    return;
  }
  void _searchQuery$1.offsetWidth;
  _searchQuery$1.style.setProperty(
    "--fade-in-duration",
    `${AUTO_TYPE_CONFIG.placeholderFadeInDuration}ms`
  );
  _searchQuery$1.classList.add("search-query-fade-in");
  _searchQuery$1.style.opacity = "";
}
function runNextQuery() {
  resetToPlaceholder();
  _activeAnimation.prepare?.();
  const entry = _searchQueries[currentQueryIndex % _searchQueries.length];
  currentQuery = entry;
  _activeAnimation.simulate(entry.query, entry.image, () => {
    currentQueryIndex++;
    runNextQuery();
  });
}
function cancelActiveAnimation() {
  if (startupFrameId !== null) {
    cancelAnimationFrame(startupFrameId);
    startupFrameId = null;
  }
  _activeAnimation?.cancel();
}
function init$4(elements, queries, config) {
  _searchQuery$1 = elements.searchQuery;
  _searchInput$2 = elements.searchInput;
  _contentElement = elements.contentElement;
  const searchQueryResult = document.createElement("img");
  searchQueryResult.className = "search-query-result hidden";
  searchQueryResult.style.cursor = "pointer";
  searchQueryResult.addEventListener("click", () => {
    if (currentQuery.query && searchQueryResult.classList.contains("visible")) {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
      searchDispatcher.dispatchSearchWithQuery(currentQuery);
    }
  });
  elements.contentElement.appendChild(searchQueryResult);
  _searchQueryResult = searchQueryResult;
  _searchQueries = queries;
  _placeholder = config.placeholder;
  if (config.randomizeQueries && queries.length > 1) {
    currentQueryIndex = Math.floor(Math.random() * queries.length);
  }
  const animationElements = {
    searchQuery: elements.searchQuery,
    searchQueryResult: _searchQueryResult,
    contentElement: elements.contentElement
  };
  switch (config.searchMode) {
    case SearchMode.AutoTypeFadeChars:
      autoTypeFadeChars.init(animationElements);
      _activeAnimation = autoTypeFadeChars;
      break;
    case SearchMode.AutoTypeFade:
      autoTypeFade.init(animationElements);
      _activeAnimation = autoTypeFade;
      break;
    case SearchMode.AutoTypeScramble:
      autoTypeScramble.init(animationElements);
      _activeAnimation = autoTypeScramble;
      break;
    case SearchMode.AutoTypeWordBurst:
      autoTypeWordBurst.init(animationElements);
      _activeAnimation = autoTypeWordBurst;
      break;
    case SearchMode.AutoTypeBounce:
      autoTypeBounce.init(animationElements);
      _activeAnimation = autoTypeBounce;
      break;
    case SearchMode.AutoTypeReveal:
      autoTypeReveal.init(animationElements);
      _activeAnimation = autoTypeReveal;
      break;
    case SearchMode.AutoTypeSlotMachine:
      autoTypeSlotMachine.init(animationElements);
      _activeAnimation = autoTypeSlotMachine;
      break;
    case SearchMode.AutoTypeFocus:
      autoTypeFocus.init(animationElements);
      _activeAnimation = autoTypeFocus;
      break;
    case SearchMode.AutoTypeNeon:
      autoTypeNeon.init(animationElements);
      _activeAnimation = autoTypeNeon;
      break;
    case SearchMode.AutoTypeGhost:
      autoTypeGhost.init(animationElements);
      _activeAnimation = autoTypeGhost;
      break;
    case SearchMode.AutoTypeWaterfall:
      autoTypeWaterfall.init(animationElements);
      _activeAnimation = autoTypeWaterfall;
      break;
    case SearchMode.AutoTypeAssemble:
      autoTypeAssemble.init(animationElements);
      _activeAnimation = autoTypeAssemble;
      break;
    case SearchMode.AutoTypeSprinkle:
      autoTypeSprinkle.init(animationElements);
      _activeAnimation = autoTypeSprinkle;
      break;
    case SearchMode.AutoTypeReducedMotion:
      autoTypeReducedMotion.init(animationElements);
      _activeAnimation = autoTypeReducedMotion;
      break;
    case SearchMode.AutoTypeRandom:
      autoTypeRandom.init(animationElements);
      _activeAnimation = autoTypeRandom;
      break;
    default:
      autoTypeCaret.init({
        ...animationElements,
        showMousePointer: config.showMousePointer ?? true
      });
      _activeAnimation = autoTypeCaret;
  }
}
function start() {
  if (startupFrameId !== null) return;
  _searchQueryResult.classList.remove("hidden");
  startupFrameId = requestAnimationFrame(() => {
    runNextQuery();
  });
}
function pause() {
  cancelActiveAnimation();
  resetToPlaceholder(false);
  isFirstRun = true;
}
function resume() {
  if (!_searchInput$2.classList.contains("hidden")) return;
  start();
}
function getCurrentQuery$1() {
  return currentQuery;
}
function hideResult() {
  _searchQueryResult.classList.remove("visible");
  _searchQueryResult.classList.add("hidden");
  _contentElement.classList.remove("search-result-visible");
}
const autoType = { init: init$4, start, pause, resume, getCurrentQuery: getCurrentQuery$1, hideResult };
const AUTOCOMPLETE_CONFIG = {
  maxSuggestions: 5
};
let _searchContainer;
let _searchInput$1;
let _onSuggestionClick;
let _isSubscribed = false;
let _activeIndex = -1;
function _handleMessage(event) {
  if (utils.targetOrigin() !== event.origin) return;
  const { type, value } = event.data || {};
  if (type === "richMediaSearchMatches" && Array.isArray(value)) {
    _update(value);
  }
}
function _createSuggestion(title, descriptionText, onClickHandler) {
  const image = document.createElement("span");
  image.className = "suggestion-image";
  const description = document.createElement("div");
  description.className = "suggestion-description";
  description.textContent = descriptionText;
  const textContainer = document.createElement("div");
  textContainer.className = "suggestion-text-container";
  textContainer.appendChild(title);
  textContainer.appendChild(description);
  const item = document.createElement("div");
  item.className = "suggestion";
  item.appendChild(image);
  item.appendChild(textContainer);
  item.addEventListener("click", onClickHandler);
  return item;
}
function _update(suggestions) {
  _activeIndex = -1;
  hide();
  if (suggestions.length === 0) return;
  if (!_searchInput$1?.value.trim()) return;
  const container = document.createElement("div");
  container.id = "suggestions";
  container.className = "suggestions";
  for (const { contents, description } of suggestions.slice(
    0,
    AUTOCOMPLETE_CONFIG.maxSuggestions
  )) {
    if (description.includes("Ask Leo")) continue;
    const titleElement = document.createElement("div");
    titleElement.className = "suggestion-title";
    titleElement.textContent = contents;
    const item = _createSuggestion(
      titleElement,
      description,
      () => _onSuggestionClick(contents)
    );
    container.appendChild(item);
  }
  _searchContainer.appendChild(container);
}
function init$3(searchContainer, searchInput, onSuggestionClick) {
  _searchContainer = searchContainer;
  _searchInput$1 = searchInput;
  _onSuggestionClick = onSuggestionClick;
}
function subscribe() {
  if (!_isSubscribed) {
    window.addEventListener("message", _handleMessage);
    _isSubscribed = true;
  }
}
function hide() {
  _activeIndex = -1;
  document.getElementById("suggestions")?.remove();
}
function navigate(direction) {
  const container = document.getElementById("suggestions");
  if (!container) return null;
  const items = container.querySelectorAll(".suggestion");
  if (items.length === 0) return null;
  items[_activeIndex]?.classList.remove("suggestion--active");
  _activeIndex += direction;
  if (_activeIndex >= items.length) _activeIndex = -1;
  if (_activeIndex < -1) _activeIndex = items.length - 1;
  if (_activeIndex === -1) return null;
  items[_activeIndex].classList.add("suggestion--active");
  return items[_activeIndex].querySelector(".suggestion-title")?.textContent ?? null;
}
function getActive() {
  if (_activeIndex === -1) return null;
  const container = document.getElementById("suggestions");
  if (!container) return null;
  const items = container.querySelectorAll(".suggestion");
  return items[_activeIndex]?.querySelector(".suggestion-title")?.textContent ?? null;
}
function reset() {
  const container = document.getElementById("suggestions");
  if (container) {
    container.querySelectorAll(".suggestion--active").forEach((el) => el.classList.remove("suggestion--active"));
  }
  _activeIndex = -1;
}
const autocomplete = { init: init$3, subscribe, hide, navigate, getActive, reset };
let _searchInput;
let _searchQuery;
function _getCurrentQuery() {
  return (_searchInput.classList.contains("hidden") ? autoType.getCurrentQuery().query : _searchInput.value).trim();
}
function _switchToTypingMode(placeholder) {
  autoType.pause();
  autoType.hideResult();
  _searchQuery.classList.add("hidden");
  _searchInput.classList.remove("hidden");
  _searchInput.placeholder = placeholder;
  _searchInput.focus();
  autocomplete.subscribe();
  eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
}
function _setupInput() {
  let _originalQuery = "";
  _searchInput.addEventListener("click", (event) => {
    event.stopPropagation();
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
  });
  _searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const selected = autocomplete.navigate(
        event.key === "ArrowDown" ? 1 : -1
      );
      _searchInput.value = selected ?? _originalQuery;
    } else if (event.key === "Enter") {
      const active = autocomplete.getActive();
      const query = (active ?? _searchInput.value).trim();
      if (query) {
        eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
        searchDispatcher.dispatchSearchWithQuery({ query });
      }
    } else if (event.key === "Escape") {
      if (autocomplete.getActive() !== null) {
        _searchInput.value = _originalQuery;
        autocomplete.reset();
      } else {
        _searchInput.value = "";
        _searchInput.blur();
        autocomplete.hide();
      }
    }
  });
  _searchInput.addEventListener("input", () => {
    _originalQuery = _searchInput.value;
    if (_searchInput.value.trim()) {
      searchDispatcher.dispatchQueryAutocomplete(_searchInput.value);
    } else {
      autocomplete.hide();
    }
  });
}
function init$2(element, searchContainer, config) {
  const searchInput = document.createElement("input");
  searchInput.id = "search-input";
  searchInput.type = "text";
  searchInput.autocomplete = "off";
  searchInput.spellcheck = false;
  searchInput.setAttribute("autocorrect", "off");
  searchInput.setAttribute("autocapitalize", "off");
  element.append(searchInput);
  _searchInput = searchInput;
  element.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  if (config.shouldShowSearchLogo) {
    const searchLogo = document.createElement("img");
    searchLogo.className = "search-logo";
    searchLogo.src = "search-logo.webp";
    element.prepend(searchLogo);
  }
  if (config.shouldShowSearchIcon) {
    const searchIconButton = document.createElement("button");
    searchIconButton.className = "search-icon-button";
    element.append(searchIconButton);
    searchIconButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const query = _getCurrentQuery();
      if (query) {
        eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
        searchDispatcher.dispatchSearchWithQuery({
          query,
          params: getCurrentQueryParams()
        });
      }
    });
  }
  if (config.searchMode === SearchMode.Interactive) {
    searchInput.placeholder = config.placeholder;
    _setupInput();
    autocomplete.init(searchContainer, searchInput, (query) => {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
      searchDispatcher.dispatchSearchWithQuery({ query });
    });
    autocomplete.subscribe();
    return;
  }
  const searchQuery = document.createElement("div");
  searchQuery.id = "search-query";
  element.insertBefore(searchQuery, searchInput);
  searchInput.classList.add("hidden");
  _searchQuery = searchQuery;
  autocomplete.init(searchContainer, searchInput, (query) => {
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
    searchDispatcher.dispatchSearchWithQuery({ query });
  });
  element.addEventListener("click", () => {
    if (!searchInput.classList.contains("hidden")) return;
    _switchToTypingMode(config.placeholder);
  });
  element.addEventListener("mouseenter", () => {
    if (!searchInput.classList.contains("hidden")) return;
    autoType.pause();
  });
  element.addEventListener("mouseleave", () => {
    if (!searchInput.classList.contains("hidden")) return;
    autoType.resume();
  });
  _setupInput();
}
function getSearchInput() {
  return _searchInput;
}
function getSearchQuery() {
  return _searchQuery;
}
function getCurrentQuery() {
  return _getCurrentQuery();
}
function getCurrentQueryParams() {
  return _searchInput.classList.contains("hidden") ? autoType.getCurrentQuery().params : void 0;
}
const searchBox = {
  init: init$2,
  getSearchInput,
  getSearchQuery,
  getCurrentQuery,
  getCurrentQueryParams
};
const TRY_NOW_BUTTON_CONFIG = {
  backgroundColor: "#ff4000",
  textColor: "white",
  pulseCycles: 3
};
function localizeText(raw, fallback) {
  if (!raw) return fallback;
  try {
    const map = JSON.parse(raw);
    const langCode = navigator.language.split("-")[0];
    return map[langCode] ?? map.en ?? fallback;
  } catch {
    return raw;
  }
}
function init$1(getCurrentQuery2, getCurrentQueryParams2) {
  const button = document.getElementById("try-now-button");
  if (button)
    button.textContent = localizeText(
      button.dataset.label,
      "Try Brave Search Now"
    );
  button?.style.setProperty(
    "--try-now-button-background-color",
    button?.dataset.backgroundColor ?? TRY_NOW_BUTTON_CONFIG.backgroundColor
  );
  button?.style.setProperty(
    "--try-now-button-color",
    button?.dataset.textColor ?? TRY_NOW_BUTTON_CONFIG.textColor
  );
  button?.style.setProperty(
    "--pulse-cycles",
    `${TRY_NOW_BUTTON_CONFIG.pulseCycles}`
  );
  if (button?.dataset.hoverBackgroundColor) {
    button.style.setProperty(
      "--try-now-button-hover-background-color",
      button.dataset.hoverBackgroundColor
    );
    button.style.setProperty("--try-now-button-hover-filter", "none");
  }
  button?.addEventListener("click", (event) => {
    event.stopPropagation();
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
    const query = getCurrentQuery2();
    searchDispatcher.dispatchSearchWithQuery({
      query,
      params: getCurrentQueryParams2()
    });
  });
}
const tryNowButton = { init: init$1 };
const MAKE_DEFAULT_BUTTON_CONFIG = {
  backgroundColor: "#303033",
  textColor: "white"
};
function init() {
  const button = document.getElementById("make-default-button");
  if (button)
    button.textContent = localizeText(
      button.dataset.label,
      "Make Brave Search Default"
    );
  button?.style.setProperty(
    "--make-default-button-background-color",
    button?.dataset.backgroundColor ?? MAKE_DEFAULT_BUTTON_CONFIG.backgroundColor
  );
  button?.style.setProperty(
    "--make-default-button-color",
    button?.dataset.textColor ?? MAKE_DEFAULT_BUTTON_CONFIG.textColor
  );
  if (button?.dataset.hoverBackgroundColor) {
    button.style.setProperty(
      "--make-default-button-hover-background-color",
      button.dataset.hoverBackgroundColor
    );
    button.style.setProperty("--make-default-button-hover-filter", "none");
  }
  button?.addEventListener("click", (event) => {
    event.stopPropagation();
    searchDispatcher.dispatchMakeDefault();
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
  });
}
const makeDefaultButton = { init };
function parseSearchQueries(raw) {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    const langCode = navigator.language.split("-")[0];
    return data[langCode] ?? data.en ?? [];
  } catch {
    console.warn("data-search-queries contains invalid JSON.");
    return [];
  }
}
function initBraveSearch() {
  document.addEventListener("DOMContentLoaded", () => {
    initWallpaper();
    const searchContainer = document.querySelector(".search-container");
    if (!searchContainer) {
      console.warn("Search container not found, failed to initialize.");
      return;
    }
    const searchBoxElement = document.querySelector(".search-box");
    if (!searchBoxElement) {
      console.warn("Search box not found, failed to initialize.");
      return;
    }
    if (searchBoxElement.dataset.hideNtpSearchBox !== void 0) {
      searchDispatcher.dispatchHideBraveSearchBox();
    }
    const placeholder = localizeText(
      searchBoxElement.dataset.placeholder,
      "Ask anything, find anything..."
    );
    const searchQueries = parseSearchQueries(
      searchBoxElement.dataset.searchQueries
    );
    const prefersReducedMotion2 = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const requestedMode = searchBoxElement.dataset.searchMode ?? SearchMode.AutoTypeFadeChars;
    const isAutotypeMode = requestedMode !== SearchMode.Interactive;
    const searchMode = prefersReducedMotion2 && isAutotypeMode ? SearchMode.AutoTypeReducedMotion : requestedMode;
    const shouldShowMousePointer = searchBoxElement.dataset.hideMousePointer === void 0;
    searchBox.init(searchBoxElement, searchContainer, {
      placeholder,
      searchMode,
      shouldShowSearchLogo: searchBoxElement.dataset.hideSearchLogo === void 0,
      shouldShowSearchIcon: searchBoxElement.dataset.hideSearchIcon === void 0
    });
    const taglineElement = document.getElementById("tagline");
    if (taglineElement) {
      if (searchBoxElement.dataset.hideTagline !== void 0) {
        taglineElement.style.display = "none";
      } else {
        taglineElement.textContent = localizeText(
          taglineElement.dataset.label,
          "More private. Better answers. No bias."
        );
      }
    }
    if (searchBoxElement.dataset.hideTryNowButton !== void 0) {
      const tryNowButtonElement = document.getElementById("try-now-button");
      if (tryNowButtonElement) tryNowButtonElement.style.display = "none";
    } else {
      tryNowButton.init(
        () => searchBox.getCurrentQuery(),
        () => searchBox.getCurrentQueryParams()
      );
    }
    if (searchBoxElement.dataset.hideMakeDefaultButton !== void 0) {
      const makeDefaultButtonElement = document.getElementById(
        "make-default-button"
      );
      if (makeDefaultButtonElement)
        makeDefaultButtonElement.style.display = "none";
    } else {
      makeDefaultButton.init();
    }
    if (searchMode === SearchMode.Interactive) return;
    if (searchQueries.length === 0 && searchMode !== SearchMode.AutoTypeReducedMotion)
      return;
    const contentElement = document.querySelector(".content");
    if (!contentElement) {
      console.warn("Content element not found, failed to initialize.");
      return;
    }
    autoType.init(
      {
        searchQuery: searchBox.getSearchQuery(),
        searchInput: searchBox.getSearchInput(),
        contentElement
      },
      searchQueries,
      {
        placeholder,
        searchMode,
        showMousePointer: shouldShowMousePointer,
        randomizeQueries: searchBoxElement.dataset.randomizeQueries !== void 0
      }
    );
    autoType.start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        autoType.pause();
      } else {
        autoType.resume();
      }
    });
  });
}
initBraveSearch();
