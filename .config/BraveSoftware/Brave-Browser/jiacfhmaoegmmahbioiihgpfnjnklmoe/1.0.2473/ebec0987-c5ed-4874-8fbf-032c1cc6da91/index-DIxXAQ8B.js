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
function parseBcp47LanguageTag_(tag) {
  try {
    const [canonicalLocale] = Intl.getCanonicalLocales(tag.trim());
    if (!canonicalLocale) return null;
    const { language: language2, region: region2 } = new Intl.Locale(canonicalLocale);
    return { language: language2, region: region2 || void 0 };
  } catch {
    return null;
  }
}
function formatLocale_(language2, region2) {
  return `${language2.toLowerCase()}-${region2.toUpperCase()}`;
}
function findFirstLocaleWithRegion_() {
  for (const languageTag of navigator.languages) {
    const bcp47 = parseBcp47LanguageTag_(languageTag);
    if (bcp47?.region) {
      return { language: bcp47.language, region: bcp47.region };
    }
  }
  return null;
}
function primaryLanguage_() {
  const language2 = navigator.languages[0] ?? navigator.language;
  return parseBcp47LanguageTag_(language2)?.language ?? language2;
}
const MILLISECONDS_IN_SECONDS = 1e3;
const DEG_TO_RAD = Math.PI / 180;
const { locale, language, region } = (() => {
  const locale2 = findFirstLocaleWithRegion_();
  if (locale2) {
    const { language: language2, region: region2 } = locale2;
    return { locale: formatLocale_(language2, region2), language: language2, region: region2 };
  }
  const primaryLanguage = primaryLanguage_();
  return {
    locale: primaryLanguage,
    language: primaryLanguage,
    region: void 0
  };
})();
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
function parseCssColor(cssColor) {
  const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    return [0, 0, 0];
  }
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
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
const _chromiumVersion = (() => {
  const match = navigator.userAgent.match(/Chrome\/(\d+)/);
  return match ? parseInt(match[1]) : null;
})();
function isChromiumMajorVersionAtLeast(minVersion) {
  return _chromiumVersion !== null && _chromiumVersion >= minVersion;
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
  locale,
  language,
  region,
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
  parseCssColor,
  createCanvasWith2DContext,
  clearCanvasRenderingContext2D,
  parseFocalPoint,
  parseDuration,
  isChromiumMajorVersionAtLeast
};
let localeForDebugging_ = null;
function locale_() {
  return localeForDebugging_ ?? utils.locale;
}
function languageCode_(locale2) {
  try {
    return new Intl.Locale(locale2).language;
  } catch {
    utils.debugLog(`Invalid locale: "${locale2}"`);
    return null;
  }
}
function regionCode_(locale2) {
  try {
    return new Intl.Locale(locale2).region ?? null;
  } catch {
    utils.debugLog(`Invalid locale: "${locale2}"`);
    return null;
  }
}
function parseLocaleJson_(json) {
  try {
    const object = JSON.parse(json);
    if (typeof object !== "object" || object === null || Array.isArray(object)) {
      return null;
    }
    if (Object.values(object).some((value) => typeof value !== "string")) {
      return null;
    }
    return object;
  } catch {
    utils.debugLog(`Invalid JSON: "${json}"`);
    return null;
  }
}
function findMatchingKey_(localeKeys, locale2) {
  if (localeKeys.includes(locale2)) {
    return locale2;
  }
  const languageCode = languageCode_(locale2);
  if (!languageCode) {
    return null;
  }
  if (localeKeys.includes(languageCode)) {
    return languageCode;
  }
  return localeKeys.find((key) => key.startsWith(`${languageCode}-`)) ?? null;
}
function matchLocale_(localeKeys, locale2) {
  if (!regionCode_(locale2)) {
    return null;
  }
  if (localeKeys.includes(locale2)) {
    return locale2;
  }
  return null;
}
function matchByRegion_(localeKeys, locale2) {
  const regionCode = regionCode_(locale2);
  if (!regionCode) {
    return null;
  }
  const languageCode = languageCode_(locale2);
  if (languageCode && localeKeys.includes(languageCode)) {
    utils.debugLog(
      `Region match skipped: language-only key "${languageCode}" covers the region`
    );
    return null;
  }
  const enLanguageKey = `en-${regionCode}`;
  if (localeKeys.includes(enLanguageKey)) {
    utils.debugLog(
      `Region match: ${enLanguageKey} (region ${regionCode}, English preferred)`
    );
    return enLanguageKey;
  }
  const regionMatch = localeKeys.find((key) => key.endsWith(`-${regionCode}`)) ?? null;
  if (regionMatch) {
    utils.debugLog(`Region match: ${regionMatch} (region ${regionCode})`);
  }
  return regionMatch;
}
function matchByLanguage_(localeKeys, locale2) {
  const languageCode = languageCode_(locale2);
  if (!languageCode) {
    return null;
  }
  if (localeKeys.includes(languageCode)) {
    utils.debugLog(`Language-only match: ${languageCode}`);
    return languageCode;
  }
  for (const language2 of navigator.languages) {
    const match = findMatchingKey_(localeKeys, language2);
    if (match?.startsWith(`${languageCode}-`)) {
      utils.debugLog(
        `Navigator language ${language2} matched content key ${match}`
      );
      return match;
    }
  }
  const contentMatch = localeKeys.find((key) => key.startsWith(`${languageCode}-`)) ?? null;
  if (contentMatch) {
    utils.debugLog(`Language content match: ${contentMatch}`);
  }
  return contentMatch;
}
function matchFallback_(localeKeys) {
  for (const language2 of [...navigator.languages, "en"]) {
    const match = findMatchingKey_(localeKeys, language2);
    if (match) {
      utils.debugLog(
        `Fallback: ${language2 === "en" ? "English" : `navigator language ${language2}`} matched content key ${match} (${locale_()})`
      );
      return match;
    }
  }
  utils.debugLog(
    `Fallback: no match found, using first content key "${localeKeys[0]}"`
  );
  return localeKeys[0];
}
function resolveMatches_(localeKeys) {
  const locale2 = locale_();
  const languageCode = languageCode_(locale2);
  const regionCode = regionCode_(locale2);
  utils.debugLog(`Resolving matches for locale ${locale2}`);
  let localeMatch = matchLocale_(localeKeys, locale2);
  if (localeMatch === null) {
    utils.debugLog(`Step 1 no match: ${locale2}`);
  } else {
    utils.debugLog(`Step 1 matched: ${localeMatch}`);
  }
  if (localeMatch === null) {
    localeMatch = matchByRegion_(localeKeys, locale2);
    if (localeMatch === null) {
      utils.debugLog(
        `Step 2 no match: ${regionCode ? `xx-${regionCode}` : "no region"} (${locale2})`
      );
    } else {
      utils.debugLog(`Step 2 matched: ${localeMatch}`);
    }
  } else {
    utils.debugLog(`Step 2 skipped: step 1 matched ${localeMatch}`);
  }
  let broadMatch = matchByLanguage_(localeKeys, locale2);
  if (broadMatch === null) {
    utils.debugLog(
      `Step 3 no match: language ${languageCode ?? "xx"} (${locale2})`
    );
  } else {
    utils.debugLog(`Step 3 matched: ${broadMatch}`);
  }
  if (broadMatch === null) {
    utils.debugLog(`Step 4 fallback: no language match for ${locale2}`);
    broadMatch = matchFallback_(localeKeys);
  }
  return { localeMatch, broadMatch };
}
function setLocaleForDebugging(locale2) {
  if (locale2 === null) {
    localeForDebugging_ = null;
    return;
  }
  try {
    localeForDebugging_ = new Intl.Locale(locale2).baseName;
    utils.debugLog(`Overridden locale: ${localeForDebugging_}`);
  } catch {
    utils.debugLog(
      `Invalid overridden locale: ${locale2}, falling back to browser locale`
    );
    localeForDebugging_ = null;
  }
}
function localizeContent(localeMap) {
  if (!localeMap) {
    utils.debugLog("No locale content provided");
    return [];
  }
  const localeKeys = Object.keys(localeMap);
  if (localeKeys.length === 0) {
    utils.debugLog("Locale content has no entries");
    return [];
  }
  const { localeMatch, broadMatch } = resolveMatches_(localeKeys);
  if (!localeMatch) {
    const localizedContent = localeMap[broadMatch];
    if (localizedContent !== void 0) {
      utils.debugLog(`Localizing content for ${broadMatch}`, localizedContent);
    } else {
      utils.debugLog(`No localized content for ${broadMatch}`);
    }
    return localizedContent ?? [];
  }
  if (regionCode_(broadMatch)) {
    const localizedContent = localeMap[localeMatch];
    if (localizedContent !== void 0) {
      utils.debugLog(`Localizing content for ${localeMatch}`, localizedContent);
    } else {
      utils.debugLog(`No localized content for ${localeMatch}`);
    }
    return localizedContent ?? [];
  }
  const languageContent = localeMap[broadMatch];
  const regionContent = localeMap[localeMatch];
  const mergedContent = [...languageContent ?? [], ...regionContent ?? []];
  if (mergedContent.length > 0) {
    utils.debugLog(
      `Localizing content for ${localeMatch} and ${broadMatch}`,
      mergedContent
    );
  } else {
    utils.debugLog(`No localized content for ${localeMatch} and ${broadMatch}`);
  }
  return mergedContent;
}
function localizeText(json, fallbackText) {
  if (!json) {
    utils.debugLog(`No locale text provided, using: "${fallbackText}"`);
    return fallbackText;
  }
  const localeMap = parseLocaleJson_(json);
  if (!localeMap) {
    utils.debugLog(`Locale text is invalid JSON, using: "${fallbackText}"`);
    return fallbackText;
  }
  const localeKeys = Object.keys(localeMap);
  if (localeKeys.length === 0) {
    utils.debugLog(`Locale text has no entries, using: "${fallbackText}"`);
    return fallbackText;
  }
  const { localeMatch, broadMatch } = resolveMatches_(localeKeys);
  if (localeMatch) {
    const localizedText = localeMap[localeMatch];
    if (localizedText !== void 0) {
      utils.debugLog(`Localizing text for ${localeMatch}: "${localizedText}"`);
      return localizedText;
    }
  }
  const localizedFallbackText = localeMap[broadMatch];
  const text = localizedFallbackText ?? fallbackText;
  utils.debugLog(
    localizedFallbackText !== void 0 ? `Localizing text for ${broadMatch}: "${text}"` : `No locale match for text, using: "${text}"`
  );
  return text;
}
function getState() {
  try {
    return JSON.parse(window.name);
  } catch {
    return {};
  }
}
function setState(update) {
  window.name = JSON.stringify({ ...getState(), ...update });
}
function createButtonElement_(id, label) {
  const buttonElement = document.createElement("button");
  buttonElement.id = `${id}-label`;
  buttonElement.type = "button";
  if (label) {
    buttonElement.appendChild(document.createTextNode(`${label} (`));
  }
  const nameSpanElement = document.createElement("span");
  nameSpanElement.id = `${id}-label-name`;
  buttonElement.appendChild(nameSpanElement);
  const iconSpanElement = document.createElement("span");
  iconSpanElement.id = `${id}-label-icon`;
  iconSpanElement.className = "debug-picker-label-icon";
  iconSpanElement.style.display = "none";
  buttonElement.appendChild(iconSpanElement);
  if (label) {
    buttonElement.appendChild(document.createTextNode(")"));
  }
  return {
    buttonElement,
    setLabelName(text) {
      nameSpanElement.textContent = text;
    },
    setLabelIcon(iconClass) {
      if (iconClass) {
        iconSpanElement.className = `debug-picker-label-icon ${iconClass}`;
        iconSpanElement.style.display = "";
      } else {
        iconSpanElement.style.display = "none";
      }
    }
  };
}
function createOptionsDivElement_(id) {
  const divElement = document.createElement("div");
  divElement.id = `${id}-options`;
  divElement.className = "debug-picker-options";
  divElement.hidden = true;
  return divElement;
}
function createDropdownSpanElement_(id, optionsDivElement) {
  const dropdownSpanElement = document.createElement("span");
  dropdownSpanElement.id = `${id}-dropdown`;
  const chevronSpanElement = document.createElement("span");
  chevronSpanElement.id = `${id}-chevron`;
  dropdownSpanElement.append(chevronSpanElement, optionsDivElement);
  return dropdownSpanElement;
}
function populateOptions_(optionsDivElement, groups) {
  groups.forEach((group) => {
    if ("divider" in group) {
      const dividerDivElement = document.createElement("div");
      dividerDivElement.className = "debug-picker-divider";
      optionsDivElement.appendChild(dividerDivElement);
      return;
    }
    if (group.groupLabel) {
      const groupLabelSpanElement = document.createElement("span");
      groupLabelSpanElement.className = "debug-picker-group-label";
      groupLabelSpanElement.textContent = group.groupLabel;
      optionsDivElement.appendChild(groupLabelSpanElement);
    }
    group.items.forEach(({ label, value, icon, description }) => {
      const displayLabel = label ?? value;
      const optionButtonElement = document.createElement("button");
      optionButtonElement.type = "button";
      optionButtonElement.dataset.value = value;
      if (description) {
        optionButtonElement.textContent = displayLabel;
        const descriptionSpanElement = document.createElement("span");
        descriptionSpanElement.className = "debug-picker-item-description";
        descriptionSpanElement.textContent = ` (${description})`;
        optionButtonElement.appendChild(descriptionSpanElement);
      } else {
        optionButtonElement.textContent = displayLabel;
      }
      if (icon) {
        const iconSpanElement = document.createElement("span");
        iconSpanElement.className = `debug-picker-item-icon ${icon}`;
        optionButtonElement.appendChild(iconSpanElement);
      }
      optionsDivElement.appendChild(optionButtonElement);
    });
  });
}
function createPickerDivElement_(id, buttonElement, dropdownSpanElement) {
  const divElement = document.createElement("div");
  divElement.id = `${id}-picker`;
  divElement.append(buttonElement, dropdownSpanElement);
  return divElement;
}
function setupDropdown_(pickerDivElement, optionsDivElement) {
  const toggle = () => {
    optionsDivElement.hidden = !optionsDivElement.hidden;
    pickerDivElement.classList.toggle("open", !optionsDivElement.hidden);
  };
  pickerDivElement.addEventListener("click", toggle);
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !optionsDivElement.hidden && !pickerDivElement.contains(event.target)) {
      optionsDivElement.hidden = true;
      pickerDivElement.classList.remove("open");
    }
  });
}
function createPicker(id, groups, label) {
  const { buttonElement, setLabelName, setLabelIcon } = createButtonElement_(
    id,
    label
  );
  const optionsDivElement = createOptionsDivElement_(id);
  populateOptions_(optionsDivElement, groups);
  const dropdownSpanElement = createDropdownSpanElement_(id, optionsDivElement);
  const pickerDivElement = createPickerDivElement_(
    id,
    buttonElement,
    dropdownSpanElement
  );
  setupDropdown_(pickerDivElement, optionsDivElement);
  return {
    divElement: pickerDivElement,
    setLabelName,
    setLabelIcon,
    setSelected(value) {
      optionsDivElement.querySelectorAll("button[data-value]").forEach((optionButtonElement) => {
        if (optionButtonElement.dataset.value === value) {
          optionButtonElement.dataset.active = "";
        } else {
          delete optionButtonElement.dataset.active;
        }
      });
    },
    onSelect(callback) {
      optionsDivElement.querySelectorAll("button[data-value]").forEach((optionButtonElement) => {
        optionButtonElement.addEventListener("click", () => {
          callback(optionButtonElement.dataset.value ?? "");
        });
      });
    }
  };
}
const localePickerGroups = [
  { items: [{ value: "auto", description: "browser locale" }] },
  {
    groupLabel: "Locales",
    items: ["en-US", "es-US", "en-GB", "en-CA", "fr-CA", "fr-FR", "de-DE"].map(
      (value) => ({ value })
    )
  },
  {
    groupLabel: "Region",
    items: ["xx-US", "xx-GB", "xx-CA", "xx-FR", "xx-DE"].map((value) => ({
      value
    }))
  },
  {
    groupLabel: "Language",
    items: ["en", "en-XX", "fr", "fr-XX", "de", "de-XX", "es", "es-XX"].map(
      (value) => ({ value })
    )
  },
  {
    groupLabel: "Fallback",
    items: ["xx", "xx-XX"].map((value) => ({ value }))
  },
  {
    groupLabel: "BCP 47 formats",
    items: [
      { value: "es-021", description: "UN M.49 Northern America" },
      { value: "en-Latn", description: "Latin script, no region" },
      { value: "en-Latn-US", description: "Latin script, with region" },
      { value: "de-1901", description: "variant, 1901 orthography" }
    ]
  },
  {
    groupLabel: "Normalization",
    items: [
      { value: "EN-US", description: "uppercase" },
      { value: "en-us", description: "lowercase" }
    ]
  }
];
function createLocalePicker() {
  const picker = createPicker("debug-locale", localePickerGroups, "locale");
  return {
    divElement: picker.divElement,
    init() {
      const savedLocale = getState().locale;
      const selectedLocale = savedLocale ?? "auto";
      picker.setLabelName(savedLocale ?? utils.locale);
      picker.setSelected(selectedLocale);
      picker.onSelect((value) => {
        if (value === selectedLocale) {
          return;
        }
        setState({
          locale: value === "auto" ? void 0 : value,
          shouldRestoreSafeAreaOnNextLoad: true
        });
        location.reload();
      });
    }
  };
}
const autotypePickerGroups = [
  { items: [{ label: "interactive", value: "interactive" }] },
  {
    groupLabel: "Modes",
    items: [{ label: "random", value: "autotype-random" }]
  },
  { divider: true },
  {
    items: [
      { label: "assemble", value: "autotype-assemble" },
      { label: "bounce", value: "autotype-bounce" },
      {
        label: "caret",
        value: "autotype-caret-with-pointer",
        icon: "debug-autotype-icon-mouse-pointer"
      },
      { label: "caret", value: "autotype-caret" },
      { label: "fade", value: "autotype-fade" },
      { label: "fade chars", value: "autotype-fade-chars" },
      { label: "focus", value: "autotype-focus" },
      { label: "ghost", value: "autotype-ghost" },
      { label: "magnify", value: "autotype-magnify" },
      { label: "neon", value: "autotype-neon" },
      { label: "redact", value: "autotype-redact" },
      { label: "reveal", value: "autotype-reveal" },
      { label: "scramble", value: "autotype-scramble" },
      { label: "slot machine", value: "autotype-slot-machine" },
      { label: "sprinkle", value: "autotype-sprinkle" },
      { label: "waterfall", value: "autotype-waterfall" },
      { label: "word burst", value: "autotype-word-burst" }
    ]
  },
  {
    groupLabel: "Accessibility",
    items: [{ label: "reduced motion", value: "autotype-reduced-motion" }]
  }
];
function findMode_(modeValue) {
  for (const group of autotypePickerGroups) {
    if ("divider" in group) {
      continue;
    }
    const match = group.items.find((item) => item.value === modeValue);
    if (match) {
      return match;
    }
  }
  return void 0;
}
function setModeName_(value, picker) {
  const mode = findMode_(value);
  picker.setLabelName(mode?.label ?? value);
}
function setModeIcon_(value, picker) {
  const mode = findMode_(value);
  picker.setLabelIcon(mode?.icon);
}
function setSearchBoxMode(searchBoxElement, mode) {
  if (mode === "autotype-caret") {
    searchBoxElement.dataset.searchMode = "autotype-caret";
    searchBoxElement.dataset.hideMousePointer = "";
  } else if (mode === "autotype-caret-with-pointer") {
    searchBoxElement.dataset.searchMode = "autotype-caret";
    delete searchBoxElement.dataset.hideMousePointer;
  } else {
    searchBoxElement.dataset.searchMode = mode;
  }
}
function getSearchBoxMode_(searchBoxElement) {
  const searchMode = searchBoxElement.dataset.searchMode ?? "";
  const hasHidePointer = searchBoxElement.hasAttribute(
    "data-hide-mouse-pointer"
  );
  if (searchMode === "autotype-caret") {
    return hasHidePointer ? "autotype-caret" : "autotype-caret-with-pointer";
  }
  return searchMode;
}
function createAutotypePicker() {
  const picker = createPicker(
    "debug-autotype",
    autotypePickerGroups,
    "autotype"
  );
  return {
    divElement: picker.divElement,
    // Reads initial state and wires picker selection and mode-change events.
    init() {
      const activeMode = getState().autotypeMode;
      const searchBoxElement = document.querySelector(".search-box");
      const effectiveMode = searchBoxElement ? getSearchBoxMode_(searchBoxElement) : "";
      const initialMode = activeMode ?? effectiveMode ?? "auto";
      setModeName_(initialMode, picker);
      setModeIcon_(initialMode, picker);
      const selectedMode = activeMode ?? effectiveMode;
      picker.setSelected(selectedMode);
      picker.onSelect((value) => {
        if (value === selectedMode) {
          return;
        }
        setState({
          autotypeMode: value || void 0,
          shouldRestoreSafeAreaOnNextLoad: true
        });
        location.reload();
      });
      document.addEventListener("autotype-mode-change", (event) => {
        let mode = event.detail;
        if (mode === "autotype-caret" && !document.querySelector(".search-box")?.hasAttribute("data-hide-mouse-pointer")) {
          mode = "autotype-caret-with-pointer";
        }
        const storedMode = getState().autotypeMode;
        if (!storedMode || storedMode === "autotype-random") {
          setModeName_(mode, picker);
          setModeIcon_(mode, picker);
        }
      });
    }
  };
}
const queryOrderPickerGroups = [
  {
    items: ["random", "sequential"].map((order) => ({
      label: order,
      value: order
    }))
  }
];
function createQueryOrderPicker() {
  const picker = createPicker(
    "debug-query-order",
    queryOrderPickerGroups,
    "query order"
  );
  return {
    divElement: picker.divElement,
    init() {
      const searchBoxElement = document.querySelector(".search-box");
      const defaultQueryOrder = searchBoxElement?.dataset.randomizeQueries !== void 0 ? "random" : "sequential";
      const savedOrder = getState().queryOrder;
      const selectedOrder = savedOrder ?? defaultQueryOrder;
      picker.setLabelName(selectedOrder);
      picker.setSelected(selectedOrder);
      picker.onSelect((value) => {
        const order = value;
        if (order === selectedOrder) {
          return;
        }
        setState({
          queryOrder: order,
          shouldRestoreSafeAreaOnNextLoad: true
        });
        location.reload();
      });
    }
  };
}
function shouldCaptureIncomingSafeAreaRectangle_() {
  return !getState().rect;
}
function clearCachedSafeAreaState_() {
  setState({
    rect: void 0,
    shouldRestoreSafeAreaOnNextLoad: void 0
  });
}
function isReloadNavigation_() {
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  return navigationEntry?.type === "reload";
}
function applySafeAreaRectangle_(rect) {
  const { x, y, width, height } = rect;
  const style = document.documentElement.style;
  const top = y;
  const right = window.innerWidth - (x + width);
  const bottom = window.innerHeight - (y + height);
  const left = x;
  style.setProperty("--safe-area-x", `${x}px`);
  style.setProperty("--safe-area-y", `${y}px`);
  style.setProperty("--safe-area-width", `${width}px`);
  style.setProperty("--safe-area-height", `${height}px`);
  style.setProperty("--safe-area-top", `${top}px`);
  style.setProperty("--safe-area-bottom", `${bottom}px`);
  style.setProperty("--safe-area-left", `${left}px`);
  style.setProperty("--safe-area-right", `${right}px`);
  style.setProperty("--safe-area", `${top}px ${right}px ${bottom}px ${left}px`);
  const safeAreaElement = document.getElementById("debug-safe-area");
  if (safeAreaElement) {
    safeAreaElement.style.left = `${x}px`;
    safeAreaElement.style.top = `${y}px`;
    safeAreaElement.style.width = `${width}px`;
    safeAreaElement.style.height = `${height}px`;
  }
}
function initSafeAreaRestore(savedRect, shouldRestore, shouldRestoreSafeAreaOnNextLoad) {
  if (!savedRect || !shouldRestore) {
    return;
  }
  if (shouldRestoreSafeAreaOnNextLoad) {
    setState({ shouldRestoreSafeAreaOnNextLoad: void 0 });
  }
  const applyRect = () => {
    applySafeAreaRectangle_(savedRect);
  };
  requestAnimationFrame(applyRect);
  let isRestoreActive = true;
  let debounceId = null;
  utils.registerLayoutSafeAreaHandler(() => {
    if (!isRestoreActive) {
      return;
    }
    if (debounceId !== null) {
      clearTimeout(debounceId);
    }
    debounceId = setTimeout(() => {
      debounceId = null;
      applyRect();
      isRestoreActive = false;
    });
  });
}
function handleIncomingSafeAreaRectangleMessage(event) {
  const { type, value } = event.data ?? {};
  if (type !== "richMediaSafeRect" || !value) {
    return;
  }
  if (!shouldCaptureIncomingSafeAreaRectangle_()) {
    return;
  }
  setState({ rect: value });
}
function handleViewportResize() {
  clearCachedSafeAreaState_();
}
function getSafeAreaRestoreConfig() {
  const { rect, shouldRestoreSafeAreaOnNextLoad } = getState();
  const shouldRestore = Boolean(rect) && (shouldRestoreSafeAreaOnNextLoad === true || isReloadNavigation_());
  return { rect, shouldRestore, shouldRestoreSafeAreaOnNextLoad };
}
let isInitialized_$1 = false;
let barElement_ = null;
function createSeparatorSpanElement_() {
  const spanElement = document.createElement("span");
  spanElement.className = "debug-bar-separator";
  spanElement.textContent = "·";
  return spanElement;
}
function initBraveSearchDebugBar() {
  if (isInitialized_$1) {
    return;
  }
  const searchBoxElement = document.querySelector(".search-box");
  const shouldShowDebugBar = searchBoxElement?.hasAttribute("data-show-debug-bar") ?? false;
  if (!shouldShowDebugBar) {
    return;
  }
  isInitialized_$1 = true;
  barElement_ = document.createElement("div");
  barElement_.id = "debug-bar";
  document.body.appendChild(barElement_);
  const localePicker = createLocalePicker();
  const autotypePicker = createAutotypePicker();
  const queryOrderPicker = createQueryOrderPicker();
  barElement_.append(
    localePicker.divElement,
    createSeparatorSpanElement_(),
    autotypePicker.divElement,
    createSeparatorSpanElement_(),
    queryOrderPicker.divElement
  );
  const {
    locale: lastLocale,
    autotypeMode: lastAutotypeMode,
    queryOrder: lastQueryOrder
  } = getState();
  if (lastLocale) {
    setLocaleForDebugging(lastLocale);
  }
  if (lastAutotypeMode || lastQueryOrder) {
    const searchBoxElement2 = document.querySelector(".search-box");
    if (searchBoxElement2) {
      if (lastAutotypeMode) {
        setSearchBoxMode(searchBoxElement2, lastAutotypeMode);
      }
      if (lastQueryOrder === "random") {
        searchBoxElement2.dataset.randomizeQueries = "";
      } else if (lastQueryOrder === "sequential") {
        delete searchBoxElement2.dataset.randomizeQueries;
      }
    }
  }
  const {
    rect,
    shouldRestore,
    shouldRestoreSafeAreaOnNextLoad: restoreFlag
  } = getSafeAreaRestoreConfig();
  initSafeAreaRestore(rect, shouldRestore, restoreFlag);
  window.addEventListener("message", handleIncomingSafeAreaRectangleMessage);
  window.addEventListener("resize", handleViewportResize);
  localePicker.init();
  autotypePicker.init();
  queryOrderPicker.init();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBraveSearchDebugBar);
} else {
  initBraveSearchDebugBar();
}
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
function bindClickToSelectors_(object, handler) {
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
  bindClickToSelectors_(
    object,
    (element) => element.addEventListener("click", handler)
  );
}
function bindAndDispatchClickEvent(object) {
  bindClickToSelectors_(
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
function dispatchEvent_(type, value) {
  utils.debugLog(`Dispatching ${type}${value ? ` with ${value}` : ""}`);
  const messageId = crypto.randomUUID();
  const payload = {
    type,
    value,
    id: messageId
  };
  window.parent.postMessage(payload, utils.targetOrigin());
}
function dispatchQueryAutocomplete(searchQuery2) {
  dispatchEvent_(EVENTS.QUERY_BRAVE_SEARCH_AUTOCOMPLETE, searchQuery2);
}
function dispatchSearchWithQuery(searchQuery2) {
  const encodedQuery = encodeURIComponent(searchQuery2.query);
  const extraParams = searchQuery2.params ? `&${searchQuery2.params}` : "";
  dispatchEvent_(
    EVENTS.OPEN_BRAVE_SEARCH_WITH_QUERY,
    `search?q=${encodedQuery}&source=${SOURCE}&action=makeDefault${extraParams}`
  );
}
function dispatchAskBrave(searchQuery2) {
  const encodedQuery = encodeURIComponent(searchQuery2);
  dispatchEvent_(
    EVENTS.OPEN_BRAVE_SEARCH_WITH_QUERY,
    `ask?q=${encodedQuery}&source=${SOURCE}`
  );
}
function dispatchDestinationUrl(url) {
  const { pathname, search } = new URL(url);
  const query = `${pathname}${search}`;
  dispatchEvent_(EVENTS.OPEN_BRAVE_SEARCH_WITH_QUERY, query);
}
function dispatchHideBraveSearchBox() {
  dispatchEvent_(EVENTS.HIDE_BRAVE_SEARCH_BOX, "");
}
function dispatchMakeDefault() {
  dispatchEvent_(EVENTS.MAKE_BRAVE_SEARCH_DEFAULT, "");
}
const searchDispatcher = {
  dispatchQueryAutocomplete,
  dispatchSearchWithQuery,
  dispatchAskBrave,
  dispatchDestinationUrl,
  dispatchHideBraveSearchBox,
  dispatchMakeDefault
};
var SearchMode = /* @__PURE__ */ ((SearchMode2) => {
  SearchMode2["Interactive"] = "interactive";
  SearchMode2["AutoTypeAssemble"] = "autotype-assemble";
  SearchMode2["AutoTypeBounce"] = "autotype-bounce";
  SearchMode2["AutoTypeCaret"] = "autotype-caret";
  SearchMode2["AutoTypeFade"] = "autotype-fade";
  SearchMode2["AutoTypeFadeChars"] = "autotype-fade-chars";
  SearchMode2["AutoTypeFocus"] = "autotype-focus";
  SearchMode2["AutoTypeGhost"] = "autotype-ghost";
  SearchMode2["AutoTypeMagnify"] = "autotype-magnify";
  SearchMode2["AutoTypeNeon"] = "autotype-neon";
  SearchMode2["AutoTypeRandom"] = "autotype-random";
  SearchMode2["AutoTypeRedact"] = "autotype-redact";
  SearchMode2["AutoTypeReducedMotion"] = "autotype-reduced-motion";
  SearchMode2["AutoTypeReveal"] = "autotype-reveal";
  SearchMode2["AutoTypeScramble"] = "autotype-scramble";
  SearchMode2["AutoTypeSlotMachine"] = "autotype-slot-machine";
  SearchMode2["AutoTypeSprinkle"] = "autotype-sprinkle";
  SearchMode2["AutoTypeWaterfall"] = "autotype-waterfall";
  SearchMode2["AutoTypeWordBurst"] = "autotype-word-burst";
  return SearchMode2;
})(SearchMode || {});
let mousePointerElement_ = null;
function init$o(containerElement) {
  const mousePointerElement = document.createElement("div");
  mousePointerElement.id = "mouse-pointer";
  mousePointerElement.classList.add("hidden");
  containerElement.appendChild(mousePointerElement);
  mousePointerElement_ = mousePointerElement;
}
function show() {
  mousePointerElement_?.classList.remove("hidden");
}
function hide$1() {
  mousePointerElement_?.classList.add("hidden");
}
function moveTo(x, y, delay = 0) {
  if (!mousePointerElement_) {
    return;
  }
  mousePointerElement_.style.transition = delay ? `left ${delay}ms ease-in-out, top ${delay}ms ease-in-out` : "none";
  mousePointerElement_.style.left = `${x}px`;
  mousePointerElement_.style.top = `${y}px`;
}
function getElement() {
  return mousePointerElement_;
}
const mousePointer = { init: init$o, show, hide: hide$1, moveTo, getElement };
const simulateTapConfig = {
  // Total duration in milliseconds of the simulated tap animation. This must
  // match the animation duration in simulate-tap.css so the caller knows when
  // the animation has finished.
  tapDuration: 1200,
  // Duration in milliseconds of the button animation on the Try Now button.
  tapButtonAnimationDuration: 833,
  // Diameter in pixels of the tap indicator circle.
  tapIndicatorSize: 54,
  // Maximum scale the tap indicator reaches at the end of the first wave.
  // A larger value makes the indicator expand further before fading out.
  tapIndicatorMaxScale: 2.5,
  // Minimum scale the tap indicator reaches at the end of the second wave.
  tapIndicatorMinScale: 2.1,
  // Color of the tap indicator as a CSS color string.
  tapIndicatorColor: "rgba(255, 255, 255, 0.5)"
};
let buttonElement_ = null;
function init$n() {
  buttonElement_ = document.getElementById("try-now-button");
  if (!buttonElement_) {
    return;
  }
  buttonElement_.addEventListener("mouseenter", stop);
  buttonElement_.style.setProperty(
    "--tap-duration",
    `${simulateTapConfig.tapDuration}ms`
  );
  buttonElement_.style.setProperty(
    "--tap-indicator-size",
    `${simulateTapConfig.tapIndicatorSize}px`
  );
  buttonElement_.style.setProperty(
    "--tap-indicator-max-scale",
    `${simulateTapConfig.tapIndicatorMaxScale}`
  );
  buttonElement_.style.setProperty(
    "--tap-indicator-min-scale",
    `${simulateTapConfig.tapIndicatorMinScale}`
  );
  buttonElement_.style.setProperty(
    "--tap-indicator-color",
    simulateTapConfig.tapIndicatorColor
  );
}
function start$1() {
  buttonElement_?.classList.add("animate-tap");
}
function stop() {
  buttonElement_?.classList.remove("animate-tap", "animate");
}
function startAnim() {
  buttonElement_?.classList.add("animate");
}
const simulateTap = { init: init$n, start: start$1, stop, startAnim };
const searchQuery = {
  // Color of the search query text once typing begins.
  searchQueryTextColor: "white",
  // Minimum delay between simulated keystrokes in milliseconds. Random
  // variance between min and max makes each character feel hand typed.
  minTypingDelayMs: 30,
  // Maximum delay between simulated keystrokes in milliseconds. Random
  // variance between min and max makes each character feel hand typed.
  maxTypingDelayMs: 90
};
const mousePointerConfig = {
  // Duration in milliseconds of the simulated mouse pointer movement
  // between the search box and the button.
  mouseMoveDurationMs: 1e3
};
const autoTypeConfig = {
  // Duration the placeholder stays visible before fading. Gives the user time
  // to notice the search box before animation begins.
  placeholderFadeAfterMs: 500,
  // Duration of the placeholder fade-out animation. Kept short so the
  // transition feels responsive rather than sluggish.
  placeholderFadeDurationMs: 200,
  // Duration of the placeholder fade-in animation when re-entering after a
  // query cycle completes.
  placeholderFadeInDurationMs: 300,
  // Color of the placeholder text between queries.
  placeholderColor: "#a1a1aa",
  // Color of the search query text while an animation is running.
  searchQueryTextColor: "white",
  // Milliseconds after the query animation starts at which the button
  // animation begins.
  simulateTryNowButtonTapAfterMs: 300,
  // Fraction (0.0 to 1.0) of the button animation duration after the tap at
  // which the result image appears. 0.0 means immediately on tap; 1.0 means
  // one full button cycle later.
  searchResultAppearsFactor: 0.25,
  // Total time in milliseconds from when the query animation finishes until
  // the next query starts.
  nextSearchResultQueryAfterMs: 2500,
  // Pixels the content slides up when a search result appears. Negative
  // moves up.
  contentSlideUpOnResultVisible: -40,
  // Duration in milliseconds of the content slide-up transition.
  contentSlideUpDurationMs: 900,
  // Easing curve for the content slide-up transition.
  contentSlideUpEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
  // Maximum width in pixels of the result image.
  searchResultImageMaxWidth: 900,
  // Corner radius in pixels of the result image.
  searchResultImageBorderRadius: 8,
  // Negative top offset in pixels applied to the result image so it slides
  // up behind the content above it.
  searchResultImageTopOffset: -15,
  // Duration in milliseconds of the result image fade-in transition.
  searchResultImageFadeInDurationMs: 400
};
function createScheduler() {
  const timeoutIds = /* @__PURE__ */ new Set();
  const intervalIds = /* @__PURE__ */ new Set();
  function scheduleAfter2(onComplete, delay) {
    const id = setTimeout(() => {
      timeoutIds.delete(id);
      onComplete();
    }, delay);
    timeoutIds.add(id);
  }
  function scheduleEvery2(onTick, delay) {
    const id = setInterval(onTick, delay);
    intervalIds.add(id);
  }
  function cancelAll2() {
    timeoutIds.forEach(clearTimeout);
    timeoutIds.clear();
    intervalIds.forEach(clearInterval);
    intervalIds.clear();
  }
  return { scheduleAfter: scheduleAfter2, scheduleEvery: scheduleEvery2, cancelAll: cancelAll2 };
}
function splitWords(searchQueryText) {
  return searchQueryText.split(" ");
}
function createWordSpanElements(element, searchQueryWords) {
  return searchQueryWords.map((_, wordIndex) => {
    const spanElement = document.createElement("span");
    spanElement.style.cssText = "display:inline-block;white-space:nowrap";
    element.appendChild(spanElement);
    if (wordIndex < searchQueryWords.length - 1) {
      element.appendChild(document.createTextNode(" "));
    }
    return spanElement;
  });
}
function splitSearchModes(raw) {
  return raw.split(",").map((searchMode) => searchMode.trim()).filter(Boolean);
}
function avoidRepeatAtStart(array, lastItem) {
  if (array[0] === lastItem && array.length > 1) {
    array.shift();
    array.push(lastItem);
  }
}
function shuffledIndices(length) {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}
function scheduleCharacterAnimations(searchQueryWords, searchQueryWordSpanElements, characterStaggerDelay, onCharacter, schedule) {
  let staggerIndex = 0;
  searchQueryWords.forEach((word, wordIndex) => {
    const wordSpanElement = searchQueryWordSpanElements[wordIndex];
    const characters = [...word];
    for (const character of characters) {
      const staggerDelay = staggerIndex++ * characterStaggerDelay;
      schedule(() => onCharacter(wordSpanElement, character), staggerDelay);
    }
    if (wordIndex < searchQueryWords.length - 1) {
      staggerIndex++;
    }
  });
}
function fadeOutPlaceholder(searchQueryElement, schedule, onComplete) {
  schedule(() => {
    searchQueryElement.style.setProperty(
      "--fade-out-duration",
      `${autoTypeConfig.placeholderFadeDurationMs}ms`
    );
    searchQueryElement.classList.add("search-query-fade-out");
    schedule(onComplete, autoTypeConfig.placeholderFadeDurationMs);
  }, autoTypeConfig.placeholderFadeAfterMs);
}
function scheduleAnimationComplete(animationDuration, schedule, onTapTryNowButton, onShowSearchResult, onStartNextSearchQuery) {
  const showSearchResultAfter = autoTypeConfig.simulateTryNowButtonTapAfterMs + simulateTapConfig.tapButtonAnimationDuration * autoTypeConfig.searchResultAppearsFactor;
  const startNextQueryAfter = Math.max(animationDuration, showSearchResultAfter) + autoTypeConfig.nextSearchResultQueryAfterMs;
  schedule(onTapTryNowButton, autoTypeConfig.simulateTryNowButtonTapAfterMs);
  schedule(onShowSearchResult, showSearchResultAfter);
  schedule(onStartNextSearchQuery, startNextQueryAfter);
}
function showSearchResult(imageElement, contentElement, searchResultImageSrc) {
  if (!searchResultImageSrc) {
    hideSearchResult$1(imageElement);
    return;
  }
  imageElement.src = searchResultImageSrc;
  void imageElement.getBoundingClientRect();
  imageElement.classList.add("visible");
  contentElement.classList.add("search-result-visible");
}
function hideSearchResult$1(imageElement) {
  if (!imageElement) return;
  imageElement.classList.remove("visible");
}
let searchQueryElement_$h;
let searchResultImageElement_$h;
let contentElement_$h;
let mousePointerContainerElement_ = null;
let tryNowButtonElement_ = null;
let showMousePointer_ = true;
const { scheduleAfter: scheduleAfter$g, cancelAll: cancelAll$g } = createScheduler();
function toOverlayCoords_(targetElement) {
  const elementRect = targetElement.getBoundingClientRect();
  const overlayRect = (mousePointerContainerElement_ ?? document.body).getBoundingClientRect();
  return {
    left: elementRect.left - overlayRect.left,
    top: elementRect.top - overlayRect.top,
    width: elementRect.width,
    height: elementRect.height
  };
}
function calculateTryNowButtonPosition_() {
  if (!tryNowButtonElement_) {
    return { x: 0, y: 0 };
  }
  const { left, top, width, height } = toOverlayCoords_(tryNowButtonElement_);
  return {
    x: left + width / 2,
    y: top + height / 2
  };
}
function calculateSearchBoxPosition_() {
  const { left, top, height } = toOverlayCoords_(searchQueryElement_$h);
  return { x: left, y: top + height / 2 };
}
function moveMousePointerTo_(x, y, onComplete, duration = 0) {
  mousePointer.moveTo(x, y, duration);
  if (onComplete) {
    scheduleAfter$g(onComplete, duration);
  }
}
function showCursorAtStart_() {
  searchQueryElement_$h.classList.remove(
    "search-query-cursor",
    "search-query-cursor-space"
  );
  searchQueryElement_$h.classList.add("search-query-cursor-left");
}
function showCursor_() {
  searchQueryElement_$h.classList.remove(
    "search-query-cursor-left",
    "search-query-cursor-space"
  );
  searchQueryElement_$h.classList.add("search-query-cursor");
}
function hideCursor_() {
  searchQueryElement_$h.classList.remove(
    "search-query-cursor",
    "search-query-cursor-left",
    "search-query-cursor-space"
  );
}
function showCaretSpace_() {
  searchQueryElement_$h.classList.remove(
    "search-query-cursor",
    "search-query-cursor-left"
  );
  searchQueryElement_$h.classList.add("search-query-cursor-space");
}
function resetSearchQuery_$g() {
  if (!searchQueryElement_$h) {
    return;
  }
  showCaretSpace_();
  searchQueryElement_$h.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
}
function initTyping_() {
  searchQueryElement_$h.textContent = "";
  searchQueryElement_$h.style.color = searchQuery.searchQueryTextColor;
  showCursor_();
}
function startAnimatingButton_() {
  tryNowButtonElement_?.classList.add("animate");
}
function stopAnimatingButton_() {
  tryNowButtonElement_?.classList.remove("animate");
}
function simulateTyping_(searchQueryText, onComplete, onTypingStart) {
  fadeOutPlaceholder(searchQueryElement_$h, scheduleAfter$g, startTyping);
  function startTyping() {
    searchQueryElement_$h.classList.remove(
      "search-query-fade-in",
      "search-query-fade-out"
    );
    initTyping_();
    if (onTypingStart) {
      onTypingStart();
    }
    let typingCharacterIndex = 0;
    function typeCharacter() {
      if (typingCharacterIndex > searchQueryText.length) {
        if (onComplete) {
          onComplete();
        }
        return;
      }
      searchQueryElement_$h.textContent = searchQueryText.slice(
        0,
        typingCharacterIndex++
      );
      scheduleAfter$g(
        typeCharacter,
        utils.randomIntInRange(
          searchQuery.minTypingDelayMs,
          searchQuery.maxTypingDelayMs
        )
      );
    }
    typeCharacter();
  }
}
function simulateTypingAndMouse_(searchQueryText, onComplete, onTypingStart) {
  simulateTyping_(
    searchQueryText,
    () => {
      hideCursor_();
      if (showMousePointer_) {
        const caretPosition = calculateSearchBoxPosition_();
        mousePointer.moveTo(caretPosition.x, caretPosition.y);
        mousePointer.show();
      }
      onComplete();
    },
    onTypingStart
  );
}
function simulateWithTap_(searchQueryText, searchResultImageSrc, onComplete) {
  const onTypingStart = () => {
    scheduleAfter$g(() => {
      simulateTap.start();
      simulateTap.startAnim();
    }, autoTypeConfig.simulateTryNowButtonTapAfterMs);
    scheduleAfter$g(
      () => showSearchResult(
        searchResultImageElement_$h,
        contentElement_$h,
        searchResultImageSrc
      ),
      autoTypeConfig.simulateTryNowButtonTapAfterMs + simulateTapConfig.tapButtonAnimationDuration * autoTypeConfig.searchResultAppearsFactor
    );
  };
  const onTypingComplete = () => {
    scheduleAfter$g(() => {
      simulateTap.stop();
      searchResultImageElement_$h.classList.remove("visible");
      onComplete();
    }, autoTypeConfig.nextSearchResultQueryAfterMs);
  };
  simulateTypingAndMouse_(searchQueryText, onTypingComplete, onTypingStart);
}
function simulateWithMousePointer_(searchQueryText, searchResultImageSrc, onComplete) {
  const onTypingComplete = () => {
    const buttonPosition = calculateTryNowButtonPosition_();
    moveMousePointerTo_(
      buttonPosition.x,
      buttonPosition.y,
      onMouseMovedToButton,
      mousePointerConfig.mouseMoveDurationMs
    );
  };
  function onMouseMovedToButton() {
    mousePointer.hide();
    startAnimatingButton_();
    scheduleAnimationComplete(
      autoTypeConfig.simulateTryNowButtonTapAfterMs,
      scheduleAfter$g,
      () => {
      },
      () => showSearchResult(
        searchResultImageElement_$h,
        contentElement_$h,
        searchResultImageSrc
      ),
      () => {
      }
    );
    scheduleAfter$g(() => {
      stopAnimatingButton_();
      onButtonAnimationComplete();
    }, autoTypeConfig.nextSearchResultQueryAfterMs);
  }
  function onButtonAnimationComplete() {
    const caretPosition = calculateSearchBoxPosition_();
    searchResultImageElement_$h.classList.remove("visible");
    const buttonPosition = calculateTryNowButtonPosition_();
    mousePointer.moveTo(buttonPosition.x, buttonPosition.y);
    mousePointer.show();
    void mousePointer.getElement()?.offsetLeft;
    moveMousePointerTo_(
      caretPosition.x,
      caretPosition.y,
      () => {
        mousePointer.hide();
        onComplete();
      },
      mousePointerConfig.mouseMoveDurationMs
    );
  }
  simulateTypingAndMouse_(searchQueryText, onTypingComplete);
}
function stopAnimation_$h() {
  mousePointer.hide();
  cancelAll$g();
  resetSearchQuery_$g();
}
function init$m({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$h();
  searchQueryElement_$h = searchQueryElement;
  searchResultImageElement_$h = searchResultImageElement;
  contentElement_$h = contentElement;
  mousePointerContainerElement_ = contentElement.parentElement ?? document.body;
  tryNowButtonElement_ = document.getElementById("try-now-button");
  const searchBoxElement = searchQueryElement.closest(".search-box");
  showMousePointer_ = searchBoxElement?.dataset.hideMousePointer === void 0;
  if (showMousePointer_) {
    mousePointer.init(mousePointerContainerElement_);
  } else {
    simulateTap.init();
  }
}
function prepare$1() {
  showCursorAtStart_();
  const caretPosition = calculateSearchBoxPosition_();
  mousePointer.moveTo(caretPosition.x, caretPosition.y);
}
function simulate$h(searchQueryText, searchResultImageSrc, onComplete) {
  if (showMousePointer_) {
    simulateWithMousePointer_(
      searchQueryText,
      searchResultImageSrc,
      onComplete
    );
  } else {
    simulateWithTap_(searchQueryText, searchResultImageSrc, onComplete);
  }
}
function cancel$h() {
  stopAnimation_$h();
}
const autoTypeCaret = { init: init$m, prepare: prepare$1, simulate: simulate$h, cancel: cancel$h };
const CONFIG$f = {
  // Minimum delay between simulated keystrokes in milliseconds. Random
  // variance between min and max makes each character feel hand typed.
  minTypingDelayMs: 10,
  // Maximum delay between simulated keystrokes in milliseconds. Random
  // variance between min and max makes each character feel hand typed.
  maxTypingDelayMs: 20
};
let searchQueryElement_$g;
let searchResultImageElement_$g;
let contentElement_$g;
const { scheduleAfter: scheduleAfter$f, cancelAll: cancelAll$f } = createScheduler();
function resetSearchQuery_$f() {
  if (!searchQueryElement_$g) {
    return;
  }
  searchQueryElement_$g.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$g.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$g.textContent = "";
}
function simulateTypingCharacter_(searchQueryText, characterIndex) {
  if (characterIndex >= searchQueryText.length) {
    return;
  }
  const spanElement = document.createElement("span");
  spanElement.textContent = searchQueryText[characterIndex];
  spanElement.classList.add("search-query-character-fade-in");
  searchQueryElement_$g.appendChild(spanElement);
  scheduleAfter$f(
    () => simulateTypingCharacter_(searchQueryText, characterIndex + 1),
    utils.randomIntInRange(CONFIG$f.minTypingDelayMs, CONFIG$f.maxTypingDelayMs)
  );
}
function stopAnimation_$g() {
  cancelAll$f();
  resetSearchQuery_$f();
}
function onSearchQueryComplete_$d(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$g);
  resetSearchQuery_$f();
  onComplete();
}
function animateSearchQuery_$f(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$f();
  const animationDuration = searchQueryText.length * ((CONFIG$f.minTypingDelayMs + CONFIG$f.maxTypingDelayMs) / 2);
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$f,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$g,
      contentElement_$g,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$d(onComplete)
  );
  simulateTypingCharacter_(searchQueryText, 0);
}
function init$l({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$g();
  searchQueryElement_$g = searchQueryElement;
  searchResultImageElement_$g = searchResultImageElement;
  contentElement_$g = contentElement;
  simulateTap.init();
}
function simulate$g(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$g,
    scheduleAfter$f,
    () => animateSearchQuery_$f(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$g() {
  stopAnimation_$g();
}
const autoTypeFadeChars = { init: init$l, simulate: simulate$g, cancel: cancel$g };
const CONFIG$e = {
  // Duration in milliseconds of the search query fade-in animation. Slow
  // enough for the full query to be read before the result appears.
  searchQueryFadeInDurationMs: 1800,
  // Duration in milliseconds of the search query fade-out animation.
  // Matched to the fade-in so the entry and exit feel balanced.
  searchQueryFadeOutDurationMs: 400
};
let searchQueryElement_$f;
let searchResultImageElement_$f;
let contentElement_$f;
const { scheduleAfter: scheduleAfter$e, cancelAll: cancelAll$e } = createScheduler();
function resetSearchQuery_$e() {
  if (!searchQueryElement_$f) {
    return;
  }
  searchQueryElement_$f.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$f.textContent = "";
}
function stopAnimation_$f() {
  cancelAll$e();
  resetSearchQuery_$e();
}
function fadeOutSearchQuery_(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$f);
  searchQueryElement_$f.style.setProperty(
    "--fade-out-duration",
    `${CONFIG$e.searchQueryFadeOutDurationMs}ms`
  );
  searchQueryElement_$f.classList.add("search-query-fade-out");
  scheduleAfter$e(() => {
    searchQueryElement_$f.classList.remove("search-query-fade-out");
    onComplete();
  }, CONFIG$e.searchQueryFadeOutDurationMs);
}
function animateSearchQuery_$e(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  searchQueryElement_$f.style.opacity = "0";
  searchQueryElement_$f.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$f.textContent = searchQueryText;
  searchQueryElement_$f.style.color = autoTypeConfig.searchQueryTextColor;
  void searchQueryElement_$f.offsetWidth;
  searchQueryElement_$f.style.opacity = "";
  searchQueryElement_$f.style.setProperty(
    "--fade-in-duration",
    `${CONFIG$e.searchQueryFadeInDurationMs}ms`
  );
  searchQueryElement_$f.classList.add("search-query-fade-in");
  scheduleAnimationComplete(
    CONFIG$e.searchQueryFadeInDurationMs,
    scheduleAfter$e,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$f,
      contentElement_$f,
      searchResultImageSrc
    ),
    () => fadeOutSearchQuery_(onComplete)
  );
}
function init$k({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$f();
  searchQueryElement_$f = searchQueryElement;
  searchResultImageElement_$f = searchResultImageElement;
  contentElement_$f = contentElement;
  simulateTap.init();
}
function simulate$f(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$f,
    scheduleAfter$e,
    () => animateSearchQuery_$e(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$f() {
  stopAnimation_$f();
}
const autoTypeFade = { init: init$k, simulate: simulate$f, cancel: cancel$f };
const CONFIG$d = {
  // Each character needs a slight head start over the previous so locking
  // reads left to right rather than all characters resolving at once.
  characterStaggerDelayMs: 30,
  // How often each character's random placeholder is replaced with a new
  // one while cycling, in milliseconds. Faster feels more frantic.
  randomCharRefreshIntervalMs: 45,
  // How long each character cycles through random placeholders before
  // locking in to its final value. Long enough to feel suspenseful.
  randomCharDurationMs: 180
};
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let searchQueryElement_$e;
let searchResultImageElement_$e;
let contentElement_$e;
let cancelled_ = false;
const { scheduleAfter: scheduleAfter$d, scheduleEvery, cancelAll: cancelAll$d } = createScheduler();
function stopAnimation_$e() {
  cancelled_ = true;
  cancelAll$d();
  resetSearchQuery_$d();
}
function resetSearchQuery_$d() {
  if (!searchQueryElement_$e) {
    return;
  }
  searchQueryElement_$e.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$e.style.height = "";
  searchQueryElement_$e.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$e.textContent = "";
}
function randomChar_(previousChar) {
  let character;
  do {
    character = CHARSET[Math.floor(Math.random() * CHARSET.length)];
  } while (character === previousChar);
  return character;
}
function scheduleCharacterScramble_(spanElement, targetCharacter, staggerDelay) {
  scheduleAfter$d(() => {
    if (cancelled_) {
      return;
    }
    spanElement.textContent = randomChar_("");
    spanElement.style.opacity = "1";
    const scrambleStart = Date.now();
    let scrambleDone = false;
    scheduleEvery(() => {
      if (scrambleDone || cancelled_) {
        scrambleDone = true;
        return;
      }
      if (Date.now() >= scrambleStart + CONFIG$d.randomCharDurationMs) {
        scrambleDone = true;
        spanElement.textContent = targetCharacter;
        spanElement.classList.add("search-query-character-scramble-locked");
      } else {
        spanElement.textContent = randomChar_(spanElement.textContent ?? "");
      }
    }, CONFIG$d.randomCharRefreshIntervalMs);
  }, staggerDelay);
}
function scheduleCharacterScrambles_(searchQueryText) {
  const characters = [...searchQueryText];
  const nonSpaceCount = characters.filter(
    (character) => character !== " "
  ).length;
  if (nonSpaceCount === 0) {
    return;
  }
  const spanEntries = characters.map((character) => {
    if (character === " ") {
      searchQueryElement_$e.appendChild(document.createTextNode(" "));
      return null;
    }
    const spanElement = document.createElement("span");
    spanElement.textContent = character;
    spanElement.style.opacity = "0";
    spanElement.classList.add("search-query-character-scramble");
    searchQueryElement_$e.appendChild(spanElement);
    return { spanElement, targetCharacter: character };
  });
  characters.forEach((character, characterIndex) => {
    if (character === " ") {
      return;
    }
    const entry = spanEntries[characterIndex];
    if (!entry) {
      return;
    }
    scheduleCharacterScramble_(
      entry.spanElement,
      entry.targetCharacter,
      characterIndex * CONFIG$d.characterStaggerDelayMs
    );
  });
}
function onSearchQueryComplete_$c(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$e);
  resetSearchQuery_$d();
  onComplete();
}
function animateSearchQuery_$d(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  searchQueryElement_$e.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$e.textContent = "";
  searchQueryElement_$e.style.color = autoTypeConfig.searchQueryTextColor;
  const characterStaggerIntervalCount = searchQueryText.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$d.characterStaggerDelayMs + CONFIG$d.randomCharDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$d,
    () => simulateTap.startAnim(),
    () => {
      if (!cancelled_) {
        showSearchResult(
          searchResultImageElement_$e,
          contentElement_$e,
          searchResultImageSrc
        );
      }
    },
    () => onSearchQueryComplete_$c(onComplete)
  );
  scheduleCharacterScrambles_(searchQueryText);
  searchQueryElement_$e.style.height = `${searchQueryElement_$e.offsetHeight}px`;
}
function init$j({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$e();
  cancelled_ = false;
  searchQueryElement_$e = searchQueryElement;
  searchResultImageElement_$e = searchResultImageElement;
  contentElement_$e = contentElement;
  simulateTap.init();
}
function simulate$e(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$e,
    scheduleAfter$d,
    () => animateSearchQuery_$d(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$e() {
  stopAnimation_$e();
}
const autoTypeScramble = { init: init$j, simulate: simulate$e, cancel: cancel$e };
const CONFIG$c = {
  // Delay in milliseconds between each word appearing. A noticeable gap
  // lets each word land before the next one arrives.
  delayBetweenWordsMs: 150,
  // Duration in milliseconds of each word's burst animation.
  wordBurstDurationMs: 400,
  // Easing curve applied to each word's burst animation.
  wordBurstEasing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
};
const BURST_VARIANTS = [
  "word-burst-scale",
  "word-burst-squish",
  "word-burst-spin",
  "word-burst-punch"
];
let searchQueryElement_$d;
let searchResultImageElement_$d;
let contentElement_$d;
const { scheduleAfter: scheduleAfter$c, cancelAll: cancelAll$c } = createScheduler();
function resetSearchQuery_$c() {
  if (!searchQueryElement_$d) {
    return;
  }
  searchQueryElement_$d.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$d.style.overflow = "";
  searchQueryElement_$d.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$d.textContent = "";
}
function applyBurstAnimation_(spanElement, lastVariant, spinDirectionAngle) {
  let variant;
  do {
    variant = BURST_VARIANTS[Math.floor(Math.random() * BURST_VARIANTS.length)];
  } while (variant === lastVariant);
  const burstScale = (1.1 + Math.random() * 0.25).toFixed(2);
  const burstRotate = (Math.random() * 20 - 10).toFixed(1);
  const spinStart = spinDirectionAngle === "180deg" ? "-180deg" : "180deg";
  spanElement.style.setProperty("--word-burst-scale", burstScale);
  spanElement.style.setProperty("--word-burst-rotate", `${burstRotate}deg`);
  spanElement.style.setProperty("--word-burst-spin-start", spinStart);
  spanElement.style.animation = `${variant} ${CONFIG$c.wordBurstDurationMs}ms ${CONFIG$c.wordBurstEasing} forwards`;
  spanElement.classList.add("search-query-word-burst");
  return {
    nextVariant: variant,
    nextSpinDirectionAngle: variant === "word-burst-spin" ? spinStart : spinDirectionAngle
  };
}
function scheduleWordAnimations_(words) {
  let lastVariant = null;
  let spinDirectionAngle = "180deg";
  words.forEach((word, wordIndex) => {
    scheduleAfter$c(() => {
      const spanElement = document.createElement("span");
      spanElement.textContent = word;
      const burst = applyBurstAnimation_(
        spanElement,
        lastVariant,
        spinDirectionAngle
      );
      lastVariant = burst.nextVariant;
      spinDirectionAngle = burst.nextSpinDirectionAngle;
      searchQueryElement_$d.appendChild(spanElement);
      if (wordIndex < words.length - 1) {
        searchQueryElement_$d.appendChild(document.createTextNode(" "));
      }
    }, wordIndex * CONFIG$c.delayBetweenWordsMs);
  });
}
function stopAnimation_$d() {
  cancelAll$c();
  resetSearchQuery_$c();
}
function onSearchQueryComplete_$b(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$d);
  resetSearchQuery_$c();
  onComplete();
}
function unclipSearchQuery_$5() {
  searchQueryElement_$d.style.overflow = "visible";
}
function animateSearchQuery_$c(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$c();
  unclipSearchQuery_$5();
  const words = splitWords(searchQueryText);
  scheduleWordAnimations_(words);
  const animationDuration = (words.length - 1) * CONFIG$c.delayBetweenWordsMs + CONFIG$c.wordBurstDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$c,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$d,
      contentElement_$d,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$b(onComplete)
  );
}
function init$i({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$d();
  searchQueryElement_$d = searchQueryElement;
  searchResultImageElement_$d = searchResultImageElement;
  contentElement_$d = contentElement;
  simulateTap.init();
}
function simulate$d(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$d,
    scheduleAfter$c,
    () => animateSearchQuery_$c(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$d() {
  stopAnimation_$d();
}
const autoTypeWordBurst = { init: init$i, simulate: simulate$d, cancel: cancel$d };
const CONFIG$b = {
  // Time in milliseconds between each character starting its drop. A stagger
  // makes the cascade read left to right rather than all dropping at once.
  characterStaggerDelayMs: 25,
  // Total duration in milliseconds of one character's drop and spring
  // animation. Longer feels more physical; shorter feels snappier.
  bounceDurationMs: 360,
  // Per-character random jitter subtracted from bounceDurationMs.
  bounceDurationJitterMinMs: 80,
  // Per-character random jitter added to bounceDurationMs.
  bounceDurationJitterMaxMs: 120,
  // Extra time after the last character lands before the query is considered
  // complete.
  characterSettleDurationMs: 120,
  // Minimum starting offset in pixels above the final resting position.
  // Characters begin above and fall down so they appear to arrive into view.
  fallHeightMin: -28,
  // Maximum starting offset in pixels above the final resting position.
  // A wider range makes some characters feel like they fell from further away.
  fallHeightMax: -6,
  // Minimum spring overshoot in pixels below the final resting position.
  // A small overshoot makes the landing feel elastic rather than a dead stop.
  springOvershootMin: 2,
  // Maximum spring overshoot in pixels below the final resting position.
  // Varied per character so each landing settles at a slightly different rate.
  springOvershootMax: 10,
  // Easing curve applied to each character's bounce-in animation.
  characterBounceInEasing: "cubic-bezier(0.22, 1, 0.36, 1)"
};
let searchQueryElement_$c;
let searchResultImageElement_$c;
let contentElement_$c;
const { scheduleAfter: scheduleAfter$b, cancelAll: cancelAll$b } = createScheduler();
function resetSearchQuery_$b() {
  if (!searchQueryElement_$c) {
    return;
  }
  searchQueryElement_$c.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$c.style.overflow = "";
  searchQueryElement_$c.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$c.textContent = "";
}
function unclipSearchQuery_$4() {
  searchQueryElement_$c.style.overflow = "visible";
}
function createCharacterSpanElement_$3(character) {
  const spanElement = document.createElement("span");
  spanElement.textContent = character;
  const fromY = utils.randomIntInRange(
    CONFIG$b.fallHeightMin,
    CONFIG$b.fallHeightMax
  );
  const springOvershoot = utils.randomIntInRange(
    CONFIG$b.springOvershootMin,
    CONFIG$b.springOvershootMax
  );
  const duration = utils.randomIntInRange(
    CONFIG$b.bounceDurationMs - CONFIG$b.bounceDurationJitterMinMs,
    CONFIG$b.bounceDurationMs + CONFIG$b.bounceDurationJitterMaxMs
  );
  spanElement.style.setProperty("--bounce-from-y", `${fromY}px`);
  spanElement.style.setProperty("--bounce-overshoot", `${springOvershoot}px`);
  spanElement.style.setProperty("--bounce-in-duration", `${duration}ms`);
  spanElement.classList.add("search-query-character-bounce");
  return spanElement;
}
function appendCharacterSpan_$4(wordSpanElement, character) {
  wordSpanElement.appendChild(createCharacterSpanElement_$3(character));
}
function stopAnimation_$c() {
  cancelAll$b();
  resetSearchQuery_$b();
}
function onSearchQueryComplete_$a(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$c);
  resetSearchQuery_$b();
  onComplete();
}
function animateSearchQuery_$b(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$b();
  unclipSearchQuery_$4();
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$c, words);
  scheduleCharacterAnimations(
    words,
    wordSpanElements,
    CONFIG$b.characterStaggerDelayMs,
    appendCharacterSpan_$4,
    scheduleAfter$b
  );
  const characterStaggerIntervalCount = searchQueryText.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$b.characterStaggerDelayMs + CONFIG$b.bounceDurationMs + CONFIG$b.characterSettleDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$b,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$c,
      contentElement_$c,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$a(onComplete)
  );
}
function init$h({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$c();
  searchQueryElement_$c = searchQueryElement;
  searchQueryElement_$c.style.setProperty(
    "--bounce-in-easing",
    CONFIG$b.characterBounceInEasing
  );
  searchResultImageElement_$c = searchResultImageElement;
  contentElement_$c = contentElement;
  simulateTap.init();
}
function simulate$c(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$c,
    scheduleAfter$b,
    () => animateSearchQuery_$b(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$c() {
  stopAnimation_$c();
}
const autoTypeBounce = { init: init$h, simulate: simulate$c, cancel: cancel$c };
const CONFIG$a = {
  // Duration in milliseconds of the clip-path sweep that reveals the full
  // query in one continuous stroke. Slow enough to read as a deliberate
  // reveal rather than an instant appearance.
  revealDurationMs: 600,
  // Easing curve applied to the reveal sweep animation.
  revealEasing: "cubic-bezier(0.4, 0, 0.2, 1)"
};
let searchQueryElement_$b;
let searchResultImageElement_$b;
let contentElement_$b;
const { scheduleAfter: scheduleAfter$a, cancelAll: cancelAll$a } = createScheduler();
function resetSearchQuery_$a() {
  if (!searchQueryElement_$b) {
    return;
  }
  searchQueryElement_$b.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$b.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out",
    "search-query-reveal-ltr"
  );
  searchQueryElement_$b.textContent = "";
}
function stopAnimation_$b() {
  cancelAll$a();
  resetSearchQuery_$a();
}
function onSearchQueryComplete_$9(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$b);
  resetSearchQuery_$a();
  onComplete();
}
function startRevealAnimation_(searchQueryText) {
  searchQueryElement_$b.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$b.textContent = searchQueryText;
  searchQueryElement_$b.style.color = autoTypeConfig.searchQueryTextColor;
  void searchQueryElement_$b.offsetWidth;
  searchQueryElement_$b.classList.add("search-query-reveal-ltr");
}
function animateSearchQuery_$a(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  startRevealAnimation_(searchQueryText);
  scheduleAnimationComplete(
    CONFIG$a.revealDurationMs,
    scheduleAfter$a,
    () => simulateTap.startAnim(),
    () => {
      searchQueryElement_$b.classList.remove("search-query-reveal-ltr");
      showSearchResult(
        searchResultImageElement_$b,
        contentElement_$b,
        searchResultImageSrc
      );
    },
    () => onSearchQueryComplete_$9(onComplete)
  );
}
function init$g({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$b();
  searchQueryElement_$b = searchQueryElement;
  searchQueryElement_$b.style.setProperty(
    "--reveal-ltr-duration",
    `${CONFIG$a.revealDurationMs}ms`
  );
  searchQueryElement_$b.style.setProperty(
    "--reveal-ltr-easing",
    CONFIG$a.revealEasing
  );
  searchResultImageElement_$b = searchResultImageElement;
  contentElement_$b = contentElement;
  simulateTap.init();
}
function simulate$b(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$b,
    scheduleAfter$a,
    () => animateSearchQuery_$a(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$b() {
  stopAnimation_$b();
}
const autoTypeReveal = { init: init$g, simulate: simulate$b, cancel: cancel$b };
const CONFIG$9 = {
  // Each reel needs a slight head start over the previous so the spin reads
  // as a cascade rather than all reels starting at once.
  characterStaggerDelayMs: 30,
  // Varied per reel so they all stop at different times, giving a genuine
  // slot machine feel rather than a synchronized stop.
  reelSpinDurationMinMs: 500,
  reelSpinDurationMaxMs: 900,
  // Extra symbols shown as each reel coasts to its final stop. More symbols
  // means a longer visible spin before landing.
  coastSymbolCountMin: 6,
  coastSymbolCountMax: 16,
  // Symbols visible above the payline in the reel window. One row above
  // gives the classic three-symbol window look when settled.
  symbolsAbovePayline: 1,
  // Symbols visible below the payline in the reel window. Extra rows below
  // keep the lower fade zone populated so the window always looks full.
  symbolsBelowPayline: 2,
  // Minimum pixels the reel travels past its final resting position before
  // snapping back. A small overshoot makes the stop feel elastic.
  reelSnapOvershootMin: 6,
  // Maximum pixels the reel travels past its final resting position before
  // snapping back. Varied per reel so each one settles at a slightly
  // different rate.
  reelSnapOvershootMax: 16,
  // Duration of the winning-line animation on each character after all reels
  // have settled.
  winningLineAnimationDurationMs: 320,
  // Delay between each character's animation so the celebration reads left to
  // right rather than all at once.
  winningLineAnimationStaggerMs: 25,
  // Color applied to each winning-line character.
  winningLineColor: "#ffd700",
  // Query length above which the right-side fade is shown to indicate the reel
  // extends beyond the visible area.
  rightFadeMinQueryLength: 39
};
let searchQueryElement_$a;
let searchResultImageElement_$a;
let contentElement_$a;
const { scheduleAfter: scheduleAfter$9, cancelAll: cancelAll$9 } = createScheduler();
function shuffle_(characters) {
  const shuffled = [...characters];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function createValidRow_(characters) {
  const nonSpaces = shuffle_(
    characters.filter((character) => character !== " ")
  );
  const spaceCount = characters.length - nonSpaces.length;
  if (spaceCount === 0) {
    return nonSpaces;
  }
  const gapCount = nonSpaces.length - 1;
  const gapIndices = Array.from({ length: gapCount }, (_, i) => i);
  for (let i = gapIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gapIndices[i], gapIndices[j]] = [gapIndices[j], gapIndices[i]];
  }
  const spacedGaps = new Set(gapIndices.slice(0, spaceCount));
  const row = [];
  for (let i = 0; i < nonSpaces.length; i++) {
    row.push(nonSpaces[i]);
    if (spacedGaps.has(i)) {
      row.push(" ");
    }
  }
  const overflow = spaceCount - Math.min(spaceCount, gapCount);
  if (overflow > 0) {
    row.splice(Math.floor(row.length / 2), 0, ...Array(overflow).fill(" "));
  }
  return row;
}
function improveUniqueness_(row, previousRow) {
  for (let i = 0; i < row.length; i++) {
    if (row[i] === " " || row[i] !== previousRow[i]) {
      continue;
    }
    for (let j = i + 1; j < row.length; j++) {
      if (row[j] !== " " && row[j] !== previousRow[i] && row[i] !== previousRow[j]) {
        [row[i], row[j]] = [row[j], row[i]];
        break;
      }
    }
  }
}
function shuffleRow_(characters, previousRow) {
  const row = createValidRow_(characters);
  if (previousRow) {
    improveUniqueness_(row, previousRow);
  }
  return row;
}
function resetReelWindow_() {
  searchQueryElement_$a.style.overflow = "";
  searchQueryElement_$a.style.whiteSpace = "";
  searchQueryElement_$a.style.clipPath = "";
  searchQueryElement_$a.style.fontFamily = "";
  searchQueryElement_$a.closest(".search-box")?.classList.remove("slot-machine-active", "slot-machine-overflow");
}
function resetSearchQuery_$9() {
  if (!searchQueryElement_$a) {
    return;
  }
  resetReelWindow_();
  searchQueryElement_$a.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$a.textContent = "";
}
function stopAnimation_$a() {
  cancelAll$9();
  resetSearchQuery_$9();
}
function onSearchQueryComplete_$8(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$a);
  resetSearchQuery_$9();
  onComplete();
}
function setupReelWindow_() {
  searchQueryElement_$a.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$a.textContent = "";
  searchQueryElement_$a.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$a.style.overflow = "visible";
  searchQueryElement_$a.style.whiteSpace = "nowrap";
  searchQueryElement_$a.style.clipPath = "inset(-9999px 0px -9999px 0)";
  searchQueryElement_$a.style.fontFamily = "monospace";
  searchQueryElement_$a.closest(".search-box")?.classList.add("slot-machine-active");
}
function measureReelDimensions_() {
  const spanElement = document.createElement("span");
  spanElement.style.cssText = "visibility:hidden;position:absolute;";
  spanElement.textContent = "A";
  searchQueryElement_$a.appendChild(spanElement);
  const characterWidth = spanElement.offsetWidth;
  const characterHeight = spanElement.offsetHeight;
  searchQueryElement_$a.removeChild(spanElement);
  const searchBoxElement = searchQueryElement_$a.closest(".search-box");
  const barHeight = searchBoxElement ? searchBoxElement.offsetHeight : characterHeight * 3;
  const characterPaddingV = Math.round((barHeight - characterHeight) / 2);
  return { characterWidth, characterHeight, barHeight, characterPaddingV };
}
function generateShuffledRows_(searchQueryText) {
  const queryCharacters = searchQueryText.split("");
  const totalRows = CONFIG$9.symbolsAbovePayline + CONFIG$9.symbolsBelowPayline + CONFIG$9.coastSymbolCountMax;
  const shuffledRows = [];
  for (let i = 0; i < totalRows; i++) {
    shuffledRows.push(shuffleRow_(queryCharacters, shuffledRows[i - 1]));
  }
  return shuffledRows;
}
function createColumnReels_(searchQueryText, shuffledRows) {
  return searchQueryText.split("").map((character, characterIndex) => {
    const coastSymbolCount = utils.randomIntInRange(
      CONFIG$9.coastSymbolCountMin,
      CONFIG$9.coastSymbolCountMax
    );
    return {
      character,
      symbolsAbovePayline: shuffledRows.slice(0, CONFIG$9.symbolsAbovePayline).map((row) => row[characterIndex]),
      symbolsBelowPayline: shuffledRows.slice(
        CONFIG$9.symbolsAbovePayline,
        CONFIG$9.symbolsAbovePayline + CONFIG$9.symbolsBelowPayline
      ).map((row) => row[characterIndex]),
      coastSymbols: shuffledRows.slice(
        CONFIG$9.symbolsAbovePayline + CONFIG$9.symbolsBelowPayline,
        CONFIG$9.symbolsAbovePayline + CONFIG$9.symbolsBelowPayline + coastSymbolCount
      ).map((row) => row[characterIndex])
    };
  });
}
function createReelRowSpanElement_(symbol, characterHeight) {
  const spanElement = document.createElement("span");
  spanElement.textContent = symbol === " " ? " " : symbol;
  spanElement.style.height = `${characterHeight}px`;
  spanElement.style.lineHeight = `${characterHeight}px`;
  return spanElement;
}
function createReelSpanElement_(characterWidth, characterHeight) {
  const spanElement = document.createElement("span");
  spanElement.classList.add("slot-machine-reel");
  spanElement.style.width = `${characterWidth}px`;
  spanElement.style.height = `${characterHeight}px`;
  return spanElement;
}
function createReelWindowSpanElement_(characterPaddingV, barHeight) {
  const spanElement = document.createElement("span");
  spanElement.classList.add("slot-machine-reel-window");
  spanElement.style.top = `-${characterPaddingV}px`;
  spanElement.style.height = `${barHeight}px`;
  spanElement.style.setProperty(
    "--slot-machine-opaque-start",
    `${characterPaddingV}px`
  );
  spanElement.style.setProperty(
    "--slot-machine-opaque-end",
    `${barHeight - characterPaddingV}px`
  );
  return spanElement;
}
function applyReelStripTimingVariance_(spanElement, coastSymbolsLength, characterHeight, reelPaylineOffset) {
  const reelStripStartY = -(CONFIG$9.symbolsAbovePayline + CONFIG$9.symbolsBelowPayline + coastSymbolsLength) * characterHeight;
  spanElement.style.setProperty(
    "--slot-machine-strip-start",
    `${reelStripStartY}px`
  );
  spanElement.style.setProperty(
    "--slot-machine-strip-travel",
    `${reelPaylineOffset}px`
  );
  const reelSpinDuration = utils.randomIntInRange(
    CONFIG$9.reelSpinDurationMinMs,
    CONFIG$9.reelSpinDurationMaxMs
  );
  spanElement.style.setProperty(
    "--slot-machine-reel-spin-duration",
    `${reelSpinDuration}ms`
  );
  const reelSnapOvershoot = utils.randomIntInRange(
    CONFIG$9.reelSnapOvershootMin,
    CONFIG$9.reelSnapOvershootMax
  );
  spanElement.style.setProperty(
    "--slot-machine-reel-stop-overshoot",
    `${reelSnapOvershoot}px`
  );
}
function createReelStripSpanElement_(reel, characterHeight, reelPaylineOffset) {
  const { character, symbolsAbovePayline, symbolsBelowPayline, coastSymbols } = reel;
  const spanElement = document.createElement("span");
  spanElement.classList.add("slot-machine-reel-strip");
  for (const symbol of symbolsAbovePayline) {
    spanElement.appendChild(createReelRowSpanElement_(symbol, characterHeight));
  }
  const paylineSpanElement = createReelRowSpanElement_(
    character,
    characterHeight
  );
  paylineSpanElement.classList.add("slot-machine-payline");
  spanElement.appendChild(paylineSpanElement);
  for (const symbol of symbolsBelowPayline) {
    spanElement.appendChild(createReelRowSpanElement_(symbol, characterHeight));
  }
  for (const symbol of coastSymbols) {
    spanElement.appendChild(createReelRowSpanElement_(symbol, characterHeight));
  }
  applyReelStripTimingVariance_(
    spanElement,
    coastSymbols.length,
    characterHeight,
    reelPaylineOffset
  );
  return spanElement;
}
function scheduleReelSpins_(columnReels, dimensions, onReelsSettled) {
  const { characterWidth, characterHeight, barHeight, characterPaddingV } = dimensions;
  const reelPaylineOffset = characterPaddingV - CONFIG$9.symbolsAbovePayline * characterHeight;
  columnReels.forEach((reel, columnIndex) => {
    scheduleAfter$9(() => {
      const reelStripSpanElement = createReelStripSpanElement_(
        reel,
        characterHeight,
        reelPaylineOffset
      );
      const reelWindowSpanElement = createReelWindowSpanElement_(
        characterPaddingV,
        barHeight
      );
      const reelSpanElement = createReelSpanElement_(
        characterWidth,
        characterHeight
      );
      reelWindowSpanElement.appendChild(reelStripSpanElement);
      reelSpanElement.appendChild(reelWindowSpanElement);
      searchQueryElement_$a.appendChild(reelSpanElement);
    }, columnIndex * CONFIG$9.characterStaggerDelayMs);
  });
  scheduleAfter$9(
    onReelsSettled,
    (columnReels.length - 1) * CONFIG$9.characterStaggerDelayMs + CONFIG$9.reelSpinDurationMaxMs
  );
}
function scheduleWinningLineAnimation_() {
  const reelSpanElements = Array.from(
    searchQueryElement_$a.querySelectorAll(".slot-machine-reel")
  );
  reelSpanElements.forEach((reelSpanElement, reelIndex) => {
    scheduleAfter$9(() => {
      reelSpanElement.style.setProperty(
        "--slot-machine-winning-line-duration",
        `${CONFIG$9.winningLineAnimationDurationMs}ms`
      );
      reelSpanElement.style.setProperty(
        "--slot-machine-winning-line-color",
        CONFIG$9.winningLineColor
      );
      reelSpanElement.classList.add("slot-machine-winning-line");
    }, reelIndex * CONFIG$9.winningLineAnimationStaggerMs);
  });
}
function animateSearchQuery_$9(searchQueryText, searchResultImageSrc, onComplete, isTruncated) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  setupReelWindow_();
  if (isTruncated) {
    searchQueryElement_$a.closest(".search-box")?.classList.add("slot-machine-overflow");
  }
  const reelDimensions = measureReelDimensions_();
  const shuffledRows = generateShuffledRows_(searchQueryText);
  const columnReels = createColumnReels_(searchQueryText, shuffledRows);
  scheduleReelSpins_(
    columnReels,
    reelDimensions,
    scheduleWinningLineAnimation_
  );
  const lastReelIndex = searchQueryText.length - 1;
  const reelSettleDelay = lastReelIndex * CONFIG$9.characterStaggerDelayMs + CONFIG$9.reelSpinDurationMaxMs;
  const animationDuration = reelSettleDelay + lastReelIndex * CONFIG$9.winningLineAnimationStaggerMs + CONFIG$9.winningLineAnimationDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$9,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$a,
      contentElement_$a,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$8(onComplete)
  );
}
function init$f({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$a();
  searchQueryElement_$a = searchQueryElement;
  searchResultImageElement_$a = searchResultImageElement;
  contentElement_$a = contentElement;
  simulateTap.init();
}
function simulate$a(searchQueryText, searchResultImageSrc, onComplete) {
  const isTruncated = searchQueryText.length > CONFIG$9.rightFadeMinQueryLength;
  const displayText = searchQueryText.slice(0, CONFIG$9.rightFadeMinQueryLength);
  fadeOutPlaceholder(
    searchQueryElement_$a,
    scheduleAfter$9,
    () => animateSearchQuery_$9(
      displayText,
      searchResultImageSrc,
      onComplete,
      isTruncated
    )
  );
}
function cancel$a() {
  stopAnimation_$a();
}
const autoTypeSlotMachine = { init: init$f, simulate: simulate$a, cancel: cancel$a };
const CONFIG$8 = {
  // Each character needs a slight head start over the previous so focus
  // sharpens left to right rather than all characters clearing at once.
  characterStaggerDelayMs: 20,
  // Duration in milliseconds of each character's focus pull animation.
  // Varied so characters do not all sharpen at the same time.
  focusPullDurationMinMs: 1200,
  focusPullDurationMaxMs: 2600,
  // Initial defocus amount per character in pixels before animating to
  // sharp. A wide range makes the effect dramatic for long queries and
  // subtle for short ones.
  defocusAmountMin: 12,
  defocusAmountMax: 32
};
let searchQueryElement_$9;
let searchResultImageElement_$9;
let contentElement_$9;
const { scheduleAfter: scheduleAfter$8, cancelAll: cancelAll$8 } = createScheduler();
function resetSearchQuery_$8() {
  if (!searchQueryElement_$9) {
    return;
  }
  searchQueryElement_$9.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$9.style.overflow = "";
  searchQueryElement_$9.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$9.textContent = "";
}
function unclipSearchQuery_$3() {
  searchQueryElement_$9.style.overflow = "visible";
}
function createCharacterSpanElement_$2(character) {
  const spanElement = document.createElement("span");
  spanElement.textContent = character;
  const defocusBlurAmount = utils.randomIntInRange(
    CONFIG$8.defocusAmountMin,
    CONFIG$8.defocusAmountMax
  );
  const duration = utils.randomIntInRange(
    CONFIG$8.focusPullDurationMinMs,
    CONFIG$8.focusPullDurationMaxMs
  );
  spanElement.style.setProperty("--focus-in-blur", `${defocusBlurAmount}px`);
  spanElement.style.setProperty("--focus-in-duration", `${duration}ms`);
  spanElement.classList.add("search-query-character-focus");
  return spanElement;
}
function stopAnimation_$9() {
  cancelAll$8();
  resetSearchQuery_$8();
}
function appendCharacterSpan_$3(wordSpanElement, character) {
  wordSpanElement.appendChild(createCharacterSpanElement_$2(character));
}
function onSearchQueryComplete_$7(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$9);
  resetSearchQuery_$8();
  onComplete();
}
function animateSearchQuery_$8(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$8();
  unclipSearchQuery_$3();
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$9, words);
  scheduleCharacterAnimations(
    words,
    wordSpanElements,
    CONFIG$8.characterStaggerDelayMs,
    appendCharacterSpan_$3,
    scheduleAfter$8
  );
  const characterStaggerIntervalCount = searchQueryText.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$8.characterStaggerDelayMs + CONFIG$8.focusPullDurationMaxMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$8,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$9,
      contentElement_$9,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$7(onComplete)
  );
}
function init$e({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$9();
  searchQueryElement_$9 = searchQueryElement;
  searchResultImageElement_$9 = searchResultImageElement;
  contentElement_$9 = contentElement;
  simulateTap.init();
}
function simulate$9(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$9,
    scheduleAfter$8,
    () => animateSearchQuery_$8(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$9() {
  stopAnimation_$9();
}
const autoTypeFocus = { init: init$e, simulate: simulate$9, cancel: cancel$9 };
const CONFIG$7 = {
  // Each character needs a slight head start over the previous so the glow
  // sweeps left to right rather than lighting everything at once.
  characterStaggerDelayMs: 30,
  // Duration of the tube strike-in animation per character. "Strike" is the
  // moment the gas ionizes and the tube lights up.
  strikeInDurationMs: 490,
  // Maximum extra delay added to each character's strike start time. Prevents
  // all characters from striking in perfect lockstep, which would look
  // mechanical.
  strikeJitterMaxMs: 30,
  // Min and max duration of one random glow pulse cycle per character.
  pulseCycleDurationMinMs: 4800,
  pulseCycleDurationMaxMs: 8e3,
  // Lowest opacity the glow dips to during a pulse dropout. Kept high enough
  // to remain readable once the query is fully lit.
  pulseFloorOpacity: 0.38,
  // Warm-white color of the hot glass tube at the character center.
  tubeColor: "rgba(255, 220, 160, 0.92)",
  // Primary glow color of the tight halo around each character.
  glowColor: "#FF6000",
  // Wider outer bloom color, slightly darker, so the light fades naturally
  // at the edges rather than cutting off sharply.
  bloomColor: "#cc4d00"
};
let searchQueryElement_$8;
let searchResultImageElement_$8;
let contentElement_$8;
const { scheduleAfter: scheduleAfter$7, cancelAll: cancelAll$7 } = createScheduler();
function resetSearchQuery_$7() {
  if (!searchQueryElement_$8) {
    return;
  }
  searchQueryElement_$8.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$8.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$8.textContent = "";
}
function createCharacterSpanElement_$1(character, animationDelayJitter) {
  const spanElement = document.createElement("span");
  spanElement.textContent = character;
  spanElement.style.setProperty(
    "--neon-flicker-duration",
    `${CONFIG$7.strikeInDurationMs}ms`
  );
  spanElement.style.setProperty("--neon-jitter", `${animationDelayJitter}ms`);
  spanElement.style.setProperty("--neon-core", CONFIG$7.tubeColor);
  spanElement.style.setProperty("--neon-color", CONFIG$7.glowColor);
  spanElement.style.setProperty("--neon-color-dim", CONFIG$7.bloomColor);
  spanElement.style.setProperty(
    "--neon-idle-dropout-opacity",
    String(CONFIG$7.pulseFloorOpacity)
  );
  spanElement.classList.add("search-query-character-neon");
  return spanElement;
}
function scheduleIdleGlowAnimation_(spanElement, delayMs) {
  const glowDuration = Math.round(
    CONFIG$7.pulseCycleDurationMinMs + Math.random() * (CONFIG$7.pulseCycleDurationMaxMs - CONFIG$7.pulseCycleDurationMinMs)
  );
  const phaseOffsetMs = -Math.round(Math.random() * glowDuration);
  scheduleAfter$7(() => {
    if (spanElement.isConnected) {
      spanElement.style.opacity = "1";
      spanElement.style.animation = `character-neon-random-glow ${glowDuration}ms ${phaseOffsetMs}ms linear infinite`;
    }
  }, delayMs);
}
function stopAnimation_$8() {
  cancelAll$7();
  resetSearchQuery_$7();
}
function appendCharacterSpan_$2(wordSpanElement, character) {
  const animationDelayJitter = Math.floor(
    Math.random() * CONFIG$7.strikeJitterMaxMs
  );
  const spanElement = createCharacterSpanElement_$1(
    character,
    animationDelayJitter
  );
  scheduleIdleGlowAnimation_(
    spanElement,
    animationDelayJitter + CONFIG$7.strikeInDurationMs
  );
  wordSpanElement.appendChild(spanElement);
}
function onSearchQueryComplete_$6(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$8);
  resetSearchQuery_$7();
  onComplete();
}
function animateSearchQuery_$7(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$7();
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$8, words);
  scheduleCharacterAnimations(
    words,
    wordSpanElements,
    CONFIG$7.characterStaggerDelayMs,
    appendCharacterSpan_$2,
    scheduleAfter$7
  );
  const characterStaggerIntervalCount = searchQueryText.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$7.characterStaggerDelayMs + CONFIG$7.strikeInDurationMs + CONFIG$7.strikeJitterMaxMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$7,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$8,
      contentElement_$8,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$6(onComplete)
  );
}
function init$d({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$8();
  searchQueryElement_$8 = searchQueryElement;
  searchResultImageElement_$8 = searchResultImageElement;
  contentElement_$8 = contentElement;
  simulateTap.init();
}
function simulate$8(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$8,
    scheduleAfter$7,
    () => animateSearchQuery_$7(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$8() {
  stopAnimation_$8();
}
const autoTypeNeon = { init: init$d, simulate: simulate$8, cancel: cancel$8 };
const CONFIG$6 = {
  // Each character needs a slight head start over the previous so
  // materializing reads left to right rather than all at once.
  characterStaggerDelayMs: 15,
  // Duration of each character's fade-in animation.
  characterFadeInDurationMs: 600,
  // Easing curve applied to each character's fade-in animation.
  characterFadeInEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
};
let searchQueryElement_$7;
let searchResultImageElement_$7;
let contentElement_$7;
const { scheduleAfter: scheduleAfter$6, cancelAll: cancelAll$6 } = createScheduler();
function resetSearchQuery_$6() {
  if (!searchQueryElement_$7) {
    return;
  }
  searchQueryElement_$7.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$7.style.overflow = "";
  searchQueryElement_$7.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$7.textContent = "";
}
function unclipSearchQuery_$2() {
  searchQueryElement_$7.style.overflow = "visible";
}
function appendCharacterSpan_$1(wordSpanElement, character) {
  const spanElement = document.createElement("span");
  spanElement.textContent = character;
  spanElement.style.setProperty(
    "--ghost-in-duration",
    `${CONFIG$6.characterFadeInDurationMs}ms`
  );
  spanElement.classList.add("search-query-character-ghost");
  wordSpanElement.appendChild(spanElement);
}
function stopAnimation_$7() {
  cancelAll$6();
  resetSearchQuery_$6();
}
function onSearchQueryComplete_$5(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$7);
  resetSearchQuery_$6();
  onComplete();
}
function animateSearchQuery_$6(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$6();
  unclipSearchQuery_$2();
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$7, words);
  scheduleCharacterAnimations(
    words,
    wordSpanElements,
    CONFIG$6.characterStaggerDelayMs,
    appendCharacterSpan_$1,
    scheduleAfter$6
  );
  const characterStaggerIntervalCount = searchQueryText.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$6.characterStaggerDelayMs + CONFIG$6.characterFadeInDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$6,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$7,
      contentElement_$7,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$5(onComplete)
  );
}
function init$c({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$7();
  searchQueryElement_$7 = searchQueryElement;
  searchQueryElement_$7.style.setProperty(
    "--ghost-in-easing",
    CONFIG$6.characterFadeInEasing
  );
  searchResultImageElement_$7 = searchResultImageElement;
  contentElement_$7 = contentElement;
  simulateTap.init();
}
function simulate$7(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$7,
    scheduleAfter$6,
    () => animateSearchQuery_$6(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$7() {
  stopAnimation_$7();
}
const autoTypeGhost = { init: init$c, simulate: simulate$7, cancel: cancel$7 };
const CONFIG$5 = {
  // Time in milliseconds between each character starting its fall. A short
  // stagger makes the cascade read left to right in a continuous stream.
  characterStaggerDelayMs: 25,
  // Minimum duration in milliseconds of one character's fall animation.
  // Varied per character so the falls feel organic rather than uniform.
  fallDurationMinMs: 200,
  // Maximum duration in milliseconds of one character's fall animation.
  // Varied per character so the falls feel organic rather than uniform.
  fallDurationMaxMs: 400,
  // Minimum starting offset in pixels above the final resting position.
  // Characters begin above and fall down so they appear to arrive into view.
  fallHeightMin: -50,
  // Maximum starting offset in pixels above the final resting position.
  // A wider range makes some characters feel like they fell from further away.
  fallHeightMax: -15,
  // Minimum duration in milliseconds of the ghost trail fade animation.
  // The trail lingers just long enough to suggest motion without competing
  // with the settled character.
  trailDurationMinMs: 180,
  // Maximum duration in milliseconds of the ghost trail fade animation.
  // Varied per character so each trail dissipates at a slightly different rate.
  trailDurationMaxMs: 320,
  // Minimum delay in milliseconds before the ghost trail begins fading. A
  // short overlap between the character landing and the trail fading reads
  // as a waterfall streak.
  trailDelayMinMs: 60,
  // Maximum delay in milliseconds before the ghost trail begins fading.
  // Varied per character so the streaks do not all disappear at once.
  trailDelayMaxMs: 140
};
let searchQueryElement_$6;
let searchResultImageElement_$6;
let contentElement_$6;
const { scheduleAfter: scheduleAfter$5, cancelAll: cancelAll$5 } = createScheduler();
function resetSearchQuery_$5() {
  if (!searchQueryElement_$6) {
    return;
  }
  searchQueryElement_$6.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$6.style.overflow = "";
  searchQueryElement_$6.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$6.textContent = "";
}
function unclipSearchQuery_$1() {
  searchQueryElement_$6.style.overflow = "visible";
}
function createFallingCharacterElement_(character) {
  const fromY = utils.randomIntInRange(
    CONFIG$5.fallHeightMin,
    CONFIG$5.fallHeightMax
  );
  const fallDuration = utils.randomIntInRange(
    CONFIG$5.fallDurationMinMs,
    CONFIG$5.fallDurationMaxMs
  );
  const trailDuration = utils.randomIntInRange(
    CONFIG$5.trailDurationMinMs,
    CONFIG$5.trailDurationMaxMs
  );
  const trailDelay = utils.randomIntInRange(
    CONFIG$5.trailDelayMinMs,
    CONFIG$5.trailDelayMaxMs
  );
  const primarySpanElement = document.createElement("span");
  primarySpanElement.classList.add("search-query-character-waterfall");
  primarySpanElement.textContent = character;
  primarySpanElement.style.setProperty("--waterfall-from-y", `${fromY}px`);
  primarySpanElement.style.setProperty(
    "--waterfall-fall-duration",
    `${fallDuration}ms`
  );
  const ghostSpanElement = document.createElement("span");
  ghostSpanElement.classList.add("search-query-character-waterfall-ghost");
  ghostSpanElement.textContent = character;
  ghostSpanElement.style.setProperty("--waterfall-from-y", `${fromY}px`);
  ghostSpanElement.style.setProperty(
    "--waterfall-trail-duration",
    `${trailDuration}ms`
  );
  ghostSpanElement.style.setProperty(
    "--waterfall-trail-delay",
    `${trailDelay}ms`
  );
  const characterElement = document.createElement("span");
  characterElement.classList.add("search-query-waterfall-character");
  characterElement.appendChild(primarySpanElement);
  characterElement.appendChild(ghostSpanElement);
  return characterElement;
}
function appendCharacterSpan_(wordSpanElement, character) {
  wordSpanElement.appendChild(createFallingCharacterElement_(character));
}
function stopAnimation_$6() {
  cancelAll$5();
  resetSearchQuery_$5();
}
function onSearchQueryComplete_$4(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$6);
  resetSearchQuery_$5();
  onComplete();
}
function animateSearchQuery_$5(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$5();
  unclipSearchQuery_$1();
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$6, words);
  scheduleCharacterAnimations(
    words,
    wordSpanElements,
    CONFIG$5.characterStaggerDelayMs,
    appendCharacterSpan_,
    scheduleAfter$5
  );
  const characterStaggerIntervalCount = searchQueryText.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$5.characterStaggerDelayMs + CONFIG$5.fallDurationMaxMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$5,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$6,
      contentElement_$6,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$4(onComplete)
  );
}
function init$b({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$6();
  searchQueryElement_$6 = searchQueryElement;
  searchResultImageElement_$6 = searchResultImageElement;
  contentElement_$6 = contentElement;
  simulateTap.init();
}
function simulate$6(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$6,
    scheduleAfter$5,
    () => animateSearchQuery_$5(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$6() {
  stopAnimation_$6();
}
const autoTypeWaterfall = { init: init$b, simulate: simulate$6, cancel: cancel$6 };
const CONFIG$4 = {
  // Minimum distance in pixels from the character's resting position that
  // a character starts its flight. Characters begin scattered in random
  // directions and converge to their final positions.
  flyDistanceMin: 40,
  // Maximum distance in pixels from the character's resting position.
  // A wider spread makes the characters feel like they arrive from further
  // away.
  flyDistanceMax: 1500,
  // Base duration in milliseconds of one character's flight animation.
  flyDurationMs: 500,
  // Per-character random jitter subtracted from flyDurationMs so characters
  // land with slight irregularity rather than all snapping in at once.
  flyDurationJitterMinMs: 60,
  // Per-character random jitter added to flyDurationMs.
  flyDurationJitterMaxMs: 80,
  // Gives characters time to fully settle after landing before the query
  // is considered complete.
  characterSettleDurationMs: 80,
  // Delay in milliseconds between each character starting its flight.
  // A small stagger makes the word assemble left to right rather than
  // all characters arriving simultaneously.
  characterStaggerDelayMs: 20,
  // Minimum scale of a character at the start of its flight. Values above 1
  // make characters appear large and shrink into place as they land.
  characterStartScaleMin: 8,
  // Maximum scale of a character at the start of its flight. Varying per
  // character makes the initial scatter feel less uniform.
  characterStartScaleMax: 32,
  // Minimum scale a character reaches just before settling to its resting size.
  // Varies per character so each landing feels slightly different.
  characterEndScaleMin: 1.05,
  // Maximum scale a character reaches just before settling to its resting size.
  // A value above 1 adds an overshoot so the landing feels weighted
  // rather than a clean stop.
  characterEndScaleMax: 1.15,
  // Maximum rotation in degrees that a character is tilted at the start of
  // its flight. Each character gets a random angle between negative and
  // positive this value, rotating to 0 as it lands.
  characterStartRotationMax: 180,
  // Easing curve applied to each character's flight animation.
  characterFlyEasing: "cubic-bezier(0.16, 1, 0.3, 1)"
};
let searchQueryElement_$5;
let searchResultImageElement_$5;
let contentElement_$5;
const { scheduleAfter: scheduleAfter$4, cancelAll: cancelAll$4 } = createScheduler();
function unclipSearchQuery_() {
  searchQueryElement_$5.style.overflow = "visible";
}
function resetSearchQuery_$4() {
  if (!searchQueryElement_$5) {
    return;
  }
  searchQueryElement_$5.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$5.style.overflow = "";
  searchQueryElement_$5.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$5.textContent = "";
  setSearchContainerOverlay_(false);
}
function setSearchContainerOverlay_(active) {
  const searchContainerElement = searchQueryElement_$5.closest(".search-container");
  if (!searchContainerElement) {
    return;
  }
  searchContainerElement.style.position = active ? "relative" : "";
  searchContainerElement.style.zIndex = active ? "10" : "";
}
function createCharacterSpanElement_(character) {
  const spanElement = document.createElement("span");
  spanElement.textContent = character;
  const angle = Math.random() * 2 * Math.PI;
  const distance = utils.randomIntInRange(
    CONFIG$4.flyDistanceMin,
    CONFIG$4.flyDistanceMax
  );
  const fromX = Math.round(Math.cos(angle) * distance);
  const fromY = Math.round(Math.sin(angle) * distance);
  const duration = utils.randomIntInRange(
    CONFIG$4.flyDurationMs - CONFIG$4.flyDurationJitterMinMs,
    CONFIG$4.flyDurationMs + CONFIG$4.flyDurationJitterMaxMs
  );
  const startScale = (CONFIG$4.characterStartScaleMin + Math.random() * (CONFIG$4.characterStartScaleMax - CONFIG$4.characterStartScaleMin)).toFixed(3);
  const endScale = (CONFIG$4.characterEndScaleMin + Math.random() * (CONFIG$4.characterEndScaleMax - CONFIG$4.characterEndScaleMin)).toFixed(3);
  const rotation = Math.round(
    (Math.random() * 2 - 1) * CONFIG$4.characterStartRotationMax
  );
  spanElement.style.setProperty("--assemble-fly-from-x", `${fromX}px`);
  spanElement.style.setProperty("--assemble-fly-from-y", `${fromY}px`);
  spanElement.style.setProperty("--assemble-fly-duration", `${duration}ms`);
  spanElement.style.setProperty("--assemble-character-start-scale", startScale);
  spanElement.style.setProperty("--assemble-character-end-scale", endScale);
  spanElement.style.setProperty(
    "--assemble-character-start-rotation",
    `${rotation}deg`
  );
  spanElement.style.opacity = "0";
  return spanElement;
}
function startCharacterAnimation_(spanElement) {
  spanElement.classList.add("search-query-character-assemble");
}
function stopAnimation_$5() {
  cancelAll$4();
  resetSearchQuery_$4();
}
function onSearchQueryComplete_$3(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$5);
  resetSearchQuery_$4();
  onComplete();
}
function animateSearchQuery_$4(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$4();
  unclipSearchQuery_();
  setSearchContainerOverlay_(true);
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$5, words);
  const characterSpanElements = [];
  words.forEach((word, wordIndex) => {
    for (const character of word) {
      const spanElement = createCharacterSpanElement_(character);
      wordSpanElements[wordIndex].appendChild(spanElement);
      characterSpanElements.push(spanElement);
    }
  });
  shuffledIndices(characterSpanElements.length).forEach((spanIndex, step) => {
    scheduleAfter$4(
      () => startCharacterAnimation_(characterSpanElements[spanIndex]),
      step * CONFIG$4.characterStaggerDelayMs
    );
  });
  const animationDuration = (characterSpanElements.length - 1) * CONFIG$4.characterStaggerDelayMs + CONFIG$4.flyDurationMs + CONFIG$4.characterSettleDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$4,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$5,
      contentElement_$5,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$3(onComplete)
  );
}
function init$a({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$5();
  searchQueryElement_$5 = searchQueryElement;
  searchQueryElement_$5.style.setProperty(
    "--assemble-character-fly-easing",
    CONFIG$4.characterFlyEasing
  );
  searchResultImageElement_$5 = searchResultImageElement;
  contentElement_$5 = contentElement;
  simulateTap.init();
}
function simulate$5(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$5,
    scheduleAfter$4,
    () => animateSearchQuery_$4(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$5() {
  stopAnimation_$5();
}
const autoTypeAssemble = { init: init$a, simulate: simulate$5, cancel: cancel$5 };
const CONFIG$3 = {
  // Delay in milliseconds between each character being revealed. A smaller
  // value makes the whole string appear quickly; a larger value gives each
  // sprinkle a more deliberate, one-at-a-time feel.
  characterStaggerDelayMs: 20,
  // Duration in milliseconds of the fade-in animation for each character.
  // Longer values produce a softer, more gradual appearance.
  characterFadeInDurationMs: 250
};
let searchQueryElement_$4;
let searchResultImageElement_$4;
let contentElement_$4;
const { scheduleAfter: scheduleAfter$3, cancelAll: cancelAll$3 } = createScheduler();
function resetSearchQuery_$3() {
  if (!searchQueryElement_$4) {
    return;
  }
  searchQueryElement_$4.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$4.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$4.textContent = "";
}
function createCharacterSpanElements_(words, wordSpanElements) {
  const characterSpanElements = [];
  words.forEach((word, wordIndex) => {
    for (const character of word) {
      const spanElement = document.createElement("span");
      spanElement.textContent = character;
      spanElement.style.setProperty(
        "--sprinkle-fade-duration",
        `${CONFIG$3.characterFadeInDurationMs}ms`
      );
      spanElement.style.opacity = "0";
      characterSpanElements.push(spanElement);
      wordSpanElements[wordIndex].appendChild(spanElement);
    }
  });
  return characterSpanElements;
}
function scheduleCharacterReveals_(characterSpanElements) {
  const shuffled = shuffledIndices(characterSpanElements.length);
  shuffled.forEach((spanIndex, revealStep) => {
    scheduleAfter$3(() => {
      characterSpanElements[spanIndex].classList.add(
        "search-query-character-sprinkle"
      );
    }, revealStep * CONFIG$3.characterStaggerDelayMs);
  });
}
function stopAnimation_$4() {
  cancelAll$3();
  resetSearchQuery_$3();
}
function onSearchQueryComplete_$2(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$4);
  resetSearchQuery_$3();
  onComplete();
}
function animateSearchQuery_$3(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$3();
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement_$4, words);
  const characterSpanElements = createCharacterSpanElements_(
    words,
    wordSpanElements
  );
  scheduleCharacterReveals_(characterSpanElements);
  const characterStaggerIntervalCount = characterSpanElements.length - 1;
  const animationDuration = characterStaggerIntervalCount * CONFIG$3.characterStaggerDelayMs + CONFIG$3.characterFadeInDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$3,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$4,
      contentElement_$4,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$2(onComplete)
  );
}
function init$9({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$4();
  searchQueryElement_$4 = searchQueryElement;
  searchResultImageElement_$4 = searchResultImageElement;
  contentElement_$4 = contentElement;
  simulateTap.init();
}
function simulate$4(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$4,
    scheduleAfter$3,
    () => animateSearchQuery_$3(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$4() {
  stopAnimation_$4();
}
const autoTypeSprinkle = { init: init$9, simulate: simulate$4, cancel: cancel$4 };
const CONFIG$2 = {
  // Time in milliseconds to wait after each query before advancing to the next.
  nextSearchResultQueryAfterMs: 5e3,
  // Time in milliseconds the placeholder text stays visible on the first run
  // before the first query appears.
  placeholderFadeAfterMs: 1e3
};
let searchQueryElement_$3;
let searchResultImageElement_$3;
let contentElement_$3;
const { scheduleAfter: scheduleAfter$2, cancelAll: cancelAll$2 } = createScheduler();
let isFirstQuery_ = true;
function resetSearchQuery_$2() {
  isFirstQuery_ = true;
  if (!searchQueryElement_$3) {
    return;
  }
  searchQueryElement_$3.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$3.textContent = "";
}
function stopAnimation_$3() {
  cancelAll$2();
  resetSearchQuery_$2();
}
function animateSearchQuery_$2(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  searchQueryElement_$3.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$3.textContent = searchQueryText;
  searchQueryElement_$3.style.color = autoTypeConfig.searchQueryTextColor;
  showSearchResult(
    searchResultImageElement_$3,
    contentElement_$3,
    searchResultImageSrc
  );
  scheduleAfter$2(
    () => {
      hideSearchResult$1(searchResultImageElement_$3);
      onComplete();
    },
    CONFIG$2.nextSearchResultQueryAfterMs - simulateTapConfig.tapButtonAnimationDuration * autoTypeConfig.searchResultAppearsFactor
  );
}
function init$8({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$3();
  searchQueryElement_$3 = searchQueryElement;
  searchResultImageElement_$3 = searchResultImageElement;
  contentElement_$3 = contentElement;
  searchResultImageElement_$3.style.transition = "none";
  simulateTap.init();
}
function simulate$3(searchQueryText, searchResultImageSrc, onComplete) {
  if (isFirstQuery_) {
    isFirstQuery_ = false;
    scheduleAfter$2(
      () => animateSearchQuery_$2(searchQueryText, searchResultImageSrc, onComplete),
      utils.prefersReducedTransparency ? 0 : CONFIG$2.placeholderFadeAfterMs
    );
  } else {
    animateSearchQuery_$2(searchQueryText, searchResultImageSrc, onComplete);
  }
}
function cancel$3() {
  stopAnimation_$3();
}
const autoTypeReducedMotion = { init: init$8, simulate: simulate$3, cancel: cancel$3 };
const CONFIG$1 = {
  // Radius of the lens circle in px.
  lensRadius: 115,
  // Vertical offset applied to the lens canvas and bezel position. Negative
  // moves the circle up relative to the search element center.
  lensYOffset: -20,
  // How much the text is scaled up inside the lens (1 = no magnification).
  magnificationFactor: 1.5,
  // Barrel distortion strength. 0 = no distortion; at 0.33 the edge
  // magnification falls to roughly 1x (normal size) while the center stays at
  // magnificationFactor, matching a real converging lens.
  barrelDistortionStrength: 0.33,
  // Blinn-Phong shininess exponent for the specular highlight. Higher values
  // produce a tighter, more glass-like spot. Real polished glass is typically
  // 128-512; lower values create a soft diffuse-looking highlight.
  specularShininess: 192,
  // Peak intensity of the specular highlight at full alignment.
  specularIntensity: 0.55,
  // Intensity of the caustic rim; the faint bright ring near the lens edge from
  // edge refraction. Keep this low or it creates a visible ring against dark
  // backgrounds.
  causticIntensity: 0.06,
  // Chromatic aberration strength. Scales the radial split between red and blue
  // sample positions; red samples inward and blue outward, matching glass
  // dispersion. At the lens rim (dist=1) the split is roughly 2-3 CSS pixels.
  chromaticAberration: 0.015,
  // Fresnel edge brightening intensity. Uses a pow(1-N.z, 3) term so the
  // brightening is concentrated at the outermost rim where glass is most
  // reflective at grazing angles.
  fresnelIntensity: 0.2,
  // Duration of the lens scan from left to right.
  scanDurationMs: 3500,
  // Duration for the lens overlays to fade in at the start and fade out at
  // the end of the animation.
  lensFadeDurationMs: 600,
  // How often the cipher characters refresh while the lens scans.
  cipherRefreshIntervalMs: 55,
  // Duration for the cipher layer to fade out once the scan completes.
  cipherFadeDurationMs: 300
};
function isVisible_(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
function drawElementBackground_(sourceContext, element, referenceRect) {
  const style = window.getComputedStyle(element);
  const backgroundColor = style.backgroundColor;
  if (!backgroundColor || backgroundColor === "rgba(0, 0, 0, 0)" || backgroundColor === "transparent") {
    return;
  }
  const elementRect = element.getBoundingClientRect();
  sourceContext.fillStyle = backgroundColor;
  sourceContext.beginPath();
  sourceContext.roundRect(
    elementRect.left - referenceRect.left,
    elementRect.top - referenceRect.top,
    elementRect.width,
    elementRect.height,
    parseFloat(style.borderRadius) || 0
  );
  sourceContext.fill();
}
function drawElementText_(sourceContext, element, referenceRect) {
  const text = element.textContent?.trim();
  if (!text) {
    return;
  }
  const style = window.getComputedStyle(element);
  const elementRect = element.getBoundingClientRect();
  const x = elementRect.left - referenceRect.left;
  const y = elementRect.top - referenceRect.top;
  sourceContext.font = style.font;
  sourceContext.fillStyle = style.color;
  sourceContext.textAlign = style.textAlign;
  sourceContext.textBaseline = "middle";
  const textX = style.textAlign === "center" ? x + elementRect.width / 2 : style.textAlign === "right" ? x + elementRect.width : x + (parseFloat(style.paddingLeft) || 0);
  sourceContext.fillText(text, textX, y + elementRect.height / 2);
}
function drawImgElements_(sourceContext, referenceRect, imageElements) {
  for (const imageElement of imageElements) {
    if (!imageElement.complete || !imageElement.naturalWidth) {
      continue;
    }
    const imageRect = imageElement.getBoundingClientRect();
    try {
      sourceContext.drawImage(
        imageElement,
        imageRect.left - referenceRect.left,
        imageRect.top - referenceRect.top,
        imageRect.width,
        imageRect.height
      );
    } catch {
    }
  }
}
function drawCssBackgroundImageElements_(sourceContext, referenceRect, searchBoxElements) {
  for (const element of searchBoxElements) {
    const elementStyle = window.getComputedStyle(element);
    const backgroundImage = elementStyle.backgroundImage;
    if (!backgroundImage || backgroundImage === "none") {
      continue;
    }
    const url = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
    if (!url) {
      continue;
    }
    const backgroundImageElement = new Image();
    backgroundImageElement.src = url;
    if (!backgroundImageElement.complete || !backgroundImageElement.naturalWidth) {
      continue;
    }
    const elementRect = element.getBoundingClientRect();
    const elementLeft = elementRect.left - referenceRect.left;
    const elementTop = elementRect.top - referenceRect.top;
    const [cssBackgroundWidth, cssBackgroundHeight] = elementStyle.backgroundSize.split(" ");
    const backgroundImageDrawWidth = cssBackgroundWidth === "auto" ? backgroundImageElement.naturalWidth : parseFloat(cssBackgroundWidth);
    const backgroundImageDrawHeight = cssBackgroundHeight && cssBackgroundHeight !== "auto" ? parseFloat(cssBackgroundHeight) : backgroundImageElement.naturalHeight;
    if (!backgroundImageDrawWidth || !backgroundImageDrawHeight) {
      continue;
    }
    const [cssBackgroundPositionX, cssBackgroundPositionY = "center"] = elementStyle.backgroundPosition.split(" ");
    let backgroundX;
    if (cssBackgroundPositionX === "right") {
      backgroundX = elementLeft + elementRect.width - backgroundImageDrawWidth;
    } else if (cssBackgroundPositionX.endsWith("%")) {
      backgroundX = elementLeft + parseFloat(cssBackgroundPositionX) / 100 * (elementRect.width - backgroundImageDrawWidth);
    } else if (cssBackgroundPositionX === "center") {
      backgroundX = elementLeft + (elementRect.width - backgroundImageDrawWidth) / 2;
    } else {
      backgroundX = elementLeft + (parseFloat(cssBackgroundPositionX) || 0);
    }
    let backgroundY;
    if (cssBackgroundPositionY === "bottom") {
      backgroundY = elementTop + elementRect.height - backgroundImageDrawHeight;
    } else if (cssBackgroundPositionY.endsWith("%")) {
      backgroundY = elementTop + parseFloat(cssBackgroundPositionY) / 100 * (elementRect.height - backgroundImageDrawHeight);
    } else if (cssBackgroundPositionY === "center") {
      backgroundY = elementTop + (elementRect.height - backgroundImageDrawHeight) / 2;
    } else {
      backgroundY = elementTop + (parseFloat(cssBackgroundPositionY) || 0);
    }
    try {
      sourceContext.drawImage(
        backgroundImageElement,
        backgroundX,
        backgroundY,
        backgroundImageDrawWidth,
        backgroundImageDrawHeight
      );
    } catch {
    }
  }
}
function wrapTextToLines_(sourceContext, searchQueryText, maxLineWidth) {
  const words = searchQueryText.split(" ");
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    const lineWithWord = currentLine ? `${currentLine} ${word}` : word;
    if (sourceContext.measureText(lineWithWord).width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = lineWithWord;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
function drawSearchQueryText_(sourceContext, searchQueryLayerContainerElement, referenceRect, searchQueryText) {
  const searchQueryLayerContainerRect = searchQueryLayerContainerElement.getBoundingClientRect();
  const searchQueryLayerContainerWidth = searchQueryLayerContainerElement.offsetWidth;
  const searchQueryLayerContainerHeight = searchQueryLayerContainerElement.offsetHeight;
  const textOffsetX = searchQueryLayerContainerRect.left - referenceRect.left;
  const textOffsetY = searchQueryLayerContainerRect.top - referenceRect.top;
  const computedStyle = window.getComputedStyle(
    searchQueryLayerContainerElement
  );
  sourceContext.font = computedStyle.font;
  sourceContext.fillStyle = autoTypeConfig.searchQueryTextColor;
  sourceContext.textAlign = computedStyle.textAlign;
  sourceContext.textBaseline = "middle";
  const textX = computedStyle.textAlign === "center" ? textOffsetX + searchQueryLayerContainerWidth / 2 : textOffsetX;
  const lines = wrapTextToLines_(
    sourceContext,
    searchQueryText,
    searchQueryLayerContainerWidth
  );
  const lineHeight = computedStyle.lineHeight === "normal" ? parseFloat(computedStyle.fontSize) * 1.2 : parseFloat(computedStyle.lineHeight);
  const startY = textOffsetY + (searchQueryLayerContainerHeight - lines.length * lineHeight) / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    sourceContext.fillText(lines[i], textX, startY + i * lineHeight);
  }
}
function prepareLensSourceCanvas(contentElement, searchQueryLayerContainerElement, searchQueryText, searchResultImageSrc) {
  const contentRect = contentElement.getBoundingClientRect();
  const contentWidth = Math.round(contentRect.width);
  const contentHeight = Math.max(
    Math.round(contentRect.height),
    contentElement.scrollHeight
  );
  if (!contentWidth || !contentHeight) {
    return null;
  }
  const devicePixelRatio = utils.getDevicePixelRatio();
  const resultImageElement = searchResultImageSrc ? contentElement.querySelector(".search-result-image") : null;
  const resultImageVisible = resultImageElement?.classList.contains("visible") ?? false;
  let extraHeight = 0;
  if (resultImageVisible && resultImageElement?.complete && resultImageElement.naturalWidth) {
    const resultImageTop = resultImageElement.getBoundingClientRect().top - contentRect.top;
    const resultImageDrawHeight = contentWidth * resultImageElement.naturalHeight / resultImageElement.naturalWidth;
    extraHeight = Math.max(
      0,
      resultImageTop + resultImageDrawHeight - contentHeight
    );
  }
  const physicalWidth = Math.round(contentWidth * devicePixelRatio);
  const physicalHeight = Math.round(
    (contentHeight + extraHeight) * devicePixelRatio
  );
  const sourceCanvas = new OffscreenCanvas(physicalWidth, physicalHeight);
  const sourceContext = sourceCanvas.getContext(
    "2d"
  );
  if (!sourceContext) {
    return null;
  }
  sourceContext.scale(devicePixelRatio, devicePixelRatio);
  const pageBackground = window.getComputedStyle(document.body).backgroundColor;
  if (pageBackground && pageBackground !== "rgba(0, 0, 0, 0)" && pageBackground !== "transparent") {
    sourceContext.fillStyle = pageBackground;
    sourceContext.fillRect(0, 0, contentWidth, contentHeight + extraHeight);
  }
  if (resultImageVisible && resultImageElement?.complete && resultImageElement.naturalWidth) {
    const imageRect = resultImageElement.getBoundingClientRect();
    const drawWidth = imageRect.width;
    const drawHeight = drawWidth * resultImageElement.naturalHeight / resultImageElement.naturalWidth;
    try {
      sourceContext.drawImage(
        resultImageElement,
        imageRect.left - contentRect.left,
        imageRect.top - contentRect.top,
        drawWidth,
        drawHeight
      );
    } catch {
    }
  }
  const searchBoxElement = contentElement.querySelector(".search-box");
  if (searchBoxElement) {
    drawElementBackground_(sourceContext, searchBoxElement, contentRect);
  }
  drawImgElements_(
    sourceContext,
    contentRect,
    contentElement.querySelectorAll(
      "img:not(.search-result-image)"
    )
  );
  const searchBoxIconButtonElement = searchBox.getSearchBoxIconButtonElement();
  drawCssBackgroundImageElements_(
    sourceContext,
    contentRect,
    searchBoxIconButtonElement ? [searchBoxIconButtonElement] : []
  );
  const taglineElement = contentElement.querySelector("#tagline");
  if (taglineElement && isVisible_(taglineElement)) {
    drawElementText_(sourceContext, taglineElement, contentRect);
  }
  const subHeadlineElement = contentElement.querySelector("#sub-headline");
  if (subHeadlineElement && isVisible_(subHeadlineElement)) {
    drawElementText_(sourceContext, subHeadlineElement, contentRect);
  }
  const tryNowButtonElement = contentElement.querySelector("#try-now-button");
  if (tryNowButtonElement && isVisible_(tryNowButtonElement)) {
    drawElementBackground_(sourceContext, tryNowButtonElement, contentRect);
    drawElementText_(sourceContext, tryNowButtonElement, contentRect);
  }
  const makeDefaultButtonElement = contentElement.querySelector(
    "#make-default-button"
  );
  if (makeDefaultButtonElement && isVisible_(makeDefaultButtonElement)) {
    drawElementBackground_(
      sourceContext,
      makeDefaultButtonElement,
      contentRect
    );
    drawElementText_(sourceContext, makeDefaultButtonElement, contentRect);
  }
  drawSearchQueryText_(
    sourceContext,
    searchQueryLayerContainerElement,
    contentRect,
    searchQueryText
  );
  return sourceCanvas;
}
const VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;
const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D uSource;
  uniform float uDevicePixelRatio;
  uniform float uPhysicalDiameter;
  uniform float uLensRadius;
  uniform float uLensX;
  uniform float uLensY;
  uniform float uMagnificationFactor;
  uniform float uBarrelStrength;
  uniform vec2 uSourcePhysicalSize;
  uniform float uScanProgress;
  uniform float uSpecularIntensity;
  uniform float uSpecularShininess;
  uniform float uCausticIntensity;
  uniform vec3 uBackgroundColor;
  uniform float uChromaticAberration;
  uniform float uFresnelIntensity;

  void main() {
    // gl_FragCoord is bottom-up; convert to top-down screen pixels.
    float screenX = gl_FragCoord.x;
    float screenY = uPhysicalDiameter - gl_FragCoord.y;

    // CSS pixel offset from the lens center.
    float cssDeltaX = screenX / uDevicePixelRatio - uLensRadius;
    float cssDeltaY = screenY / uDevicePixelRatio - uLensRadius;

    // Normalize to the unit circle.
    float normalizedX = cssDeltaX / uLensRadius;
    float normalizedY = cssDeltaY / uLensRadius;
    float distSq = normalizedX * normalizedX + normalizedY * normalizedY;

    if (distSq > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float dist = sqrt(distSq);

    // Barrel distortion reduces magnification toward the edge, matching a real
    // converging lens.
    float barrelFactor = 1.0 + uBarrelStrength * distSq;
    float nominalScale = barrelFactor / uMagnificationFactor;
    float sourceNormX = normalizedX * nominalScale;
    float sourceNormY = normalizedY * nominalScale;

    // Map to source canvas CSS coordinates, then to physical pixels.
    float srcCssX = uLensX + sourceNormX * uLensRadius;
    float srcCssY = uLensY + sourceNormY * uLensRadius;
    float srcUvX = srcCssX * uDevicePixelRatio / uSourcePhysicalSize.x;
    float srcUvY = srcCssY * uDevicePixelRatio / uSourcePhysicalSize.y;

    if (srcUvX < 0.0 || srcUvX > 1.0 || srcUvY < 0.0 || srcUvY > 1.0) {
      gl_FragColor = vec4(uBackgroundColor, 1.0);
      return;
    }

    vec4 color = texture2D(uSource, vec2(srcUvX, srcUvY));

    // Chromatic aberration: red bends less through glass than blue, so the red
    // channel is sampled slightly inward and blue slightly outward. The split
    // scales linearly with distance from center so the lens interior stays clean
    // and fringing only appears near the rim.
    float chromaticAberration = dist * uChromaticAberration;
    float rScale = nominalScale * (1.0 - chromaticAberration);
    float bScale = nominalScale * (1.0 + chromaticAberration);

    float rUvX = (uLensX + normalizedX * rScale * uLensRadius) * uDevicePixelRatio / uSourcePhysicalSize.x;
    float rUvY = (uLensY + normalizedY * rScale * uLensRadius) * uDevicePixelRatio / uSourcePhysicalSize.y;
    float bUvX = (uLensX + normalizedX * bScale * uLensRadius) * uDevicePixelRatio / uSourcePhysicalSize.x;
    float bUvY = (uLensY + normalizedY * bScale * uLensRadius) * uDevicePixelRatio / uSourcePhysicalSize.y;

    float r = (rUvX >= 0.0 && rUvX <= 1.0 && rUvY >= 0.0 && rUvY <= 1.0)
        ? texture2D(uSource, vec2(rUvX, rUvY)).r : color.r;
    float b = (bUvX >= 0.0 && bUvX <= 1.0 && bUvY >= 0.0 && bUvY <= 1.0)
        ? texture2D(uSource, vec2(bUvX, bUvY)).b : color.b;
    color = vec4(r, color.g, b, color.a);

    // Hemisphere surface normal at this pixel. Z is the depth of the sphere
    // surface above the lens plane, giving a smooth outward-pointing normal.
    vec3 N = normalize(vec3(normalizedX, normalizedY, sqrt(max(0.0, 1.0 - distSq))));

    // Viewer direction is straight out of the screen.
    vec3 V = vec3(0.0, 0.0, 1.0);

    // Light azimuth drifts from right to left as the lens scans left to right,
    // simulating a fixed overhead light source reflecting off the glass.
    float lightX = mix(0.5, -0.5, uScanProgress);
    vec3 L = normalize(vec3(lightX, -0.7, 1.0));

    // Blinn-Phong specular highlight.
    vec3 H = normalize(L + V);
    float specular = pow(max(dot(N, H), 0.0), uSpecularShininess) * uSpecularIntensity;

    // Caustic rim: bright ring near the lens edge from edge refraction.
    float caustic = smoothstep(0.65, 0.80, dist) * smoothstep(1.0, 0.80, dist) * uCausticIntensity;

    // Fresnel: glass edges are more reflective at grazing angles (Schlick
    // approximation). N.z equals cos(angle from normal), so 1.0 - N.z is 0 at
    // the lens center and approaches 1.0 at the rim.
    float fresnel = pow(1.0 - N.z, 3.0) * uFresnelIntensity;

    float lighting = specular + caustic + fresnel;
    gl_FragColor = vec4(color.rgb + lighting, color.a);
  }
`;
let lensState_ = null;
function compileShader_(gl, source, type) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function initWebGLLens(canvas, backgroundColor) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return false;
  }
  const vertexShader = compileShader_(
    gl,
    VERTEX_SHADER_SOURCE,
    gl.VERTEX_SHADER
  );
  const fragmentShader = compileShader_(
    gl,
    FRAGMENT_SHADER_SOURCE,
    gl.FRAGMENT_SHADER
  );
  if (!vertexShader || !fragmentShader) {
    return false;
  }
  const program = gl.createProgram();
  if (!program) {
    return false;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return false;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  if (!texture) {
    return false;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "uSource"), 0);
  gl.uniform1f(
    gl.getUniformLocation(program, "uLensRadius"),
    CONFIG$1.lensRadius
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uMagnificationFactor"),
    CONFIG$1.magnificationFactor
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uBarrelStrength"),
    CONFIG$1.barrelDistortionStrength
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uSpecularIntensity"),
    CONFIG$1.specularIntensity
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uSpecularShininess"),
    CONFIG$1.specularShininess
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uCausticIntensity"),
    CONFIG$1.causticIntensity
  );
  gl.uniform3fv(
    gl.getUniformLocation(program, "uBackgroundColor"),
    backgroundColor
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uChromaticAberration"),
    CONFIG$1.chromaticAberration
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "uFresnelIntensity"),
    CONFIG$1.fresnelIntensity
  );
  const uDevicePixelRatio = gl.getUniformLocation(program, "uDevicePixelRatio");
  const uPhysicalDiameter = gl.getUniformLocation(program, "uPhysicalDiameter");
  const uLensX = gl.getUniformLocation(program, "uLensX");
  const uLensY = gl.getUniformLocation(program, "uLensY");
  const uSourcePhysicalSize = gl.getUniformLocation(
    program,
    "uSourcePhysicalSize"
  );
  const uScanProgress = gl.getUniformLocation(program, "uScanProgress");
  if (!uDevicePixelRatio || !uPhysicalDiameter || !uLensX || !uLensY || !uSourcePhysicalSize || !uScanProgress) {
    return false;
  }
  lensState_ = {
    gl,
    program,
    texture,
    uniforms: {
      uDevicePixelRatio,
      uPhysicalDiameter,
      uLensX,
      uLensY,
      uSourcePhysicalSize,
      uScanProgress
    }
  };
  return true;
}
function renderWebGLLens(sourceCanvas, lensX, lensY, devicePixelRatio, physicalDiameter, scanProgress) {
  if (!lensState_) {
    return;
  }
  const { gl, texture, uniforms } = lensState_;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    sourceCanvas
  );
  gl.uniform1f(uniforms.uDevicePixelRatio, devicePixelRatio);
  gl.uniform1f(uniforms.uPhysicalDiameter, physicalDiameter);
  gl.uniform1f(uniforms.uLensX, lensX);
  gl.uniform1f(uniforms.uLensY, lensY);
  gl.uniform2f(
    uniforms.uSourcePhysicalSize,
    sourceCanvas.width,
    sourceCanvas.height
  );
  gl.uniform1f(uniforms.uScanProgress, scanProgress);
  gl.viewport(0, 0, physicalDiameter, physicalDiameter);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function destroyWebGLLens() {
  if (!lensState_) {
    return;
  }
  const { gl, program, texture } = lensState_;
  gl.deleteTexture(texture);
  gl.deleteProgram(program);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  lensState_ = null;
}
const CIPHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let searchQueryElement_$2;
let searchResultImageElement_$2;
let contentElement_$2;
const { scheduleAfter: scheduleAfter$1, cancelAll: cancelAll$1 } = createScheduler();
let cancelMagnifyingGlassScan_ = null;
let cipherIntervalId_ = null;
let startAnimationFrameId_ = null;
let magnifyingGlassFadeTimeoutId_ = null;
let lensElement_ = null;
let lensBezelElement_ = null;
let searchQueryCipherLayerSpanElement_ = null;
let searchQueryLayerSpanElement_ = null;
let scanContainerWidth_ = 0;
let scanContainerOffsetX_ = 0;
let magnifyingGlassYInContent_ = 0;
function measureLines_(layoutElement, text) {
  const textNode = layoutElement.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return { breakPositions: [], lineWidths: [] };
  }
  const range = document.createRange();
  const breakPositions = [];
  const lineWidths = [];
  let lastTop = null;
  let lineStart = 0;
  for (let i = 0; i < text.length; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const top = range.getBoundingClientRect().top;
    if (lastTop !== null && top > lastTop + 1) {
      range.setStart(textNode, lineStart);
      range.setEnd(textNode, i);
      lineWidths.push(range.getBoundingClientRect().width);
      breakPositions.push(i);
      lineStart = i;
    }
    lastTop = top;
  }
  range.setStart(textNode, lineStart);
  range.setEnd(textNode, text.length);
  lineWidths.push(range.getBoundingClientRect().width);
  return { breakPositions, lineWidths };
}
function refreshCipherContent_(cipherElement, text, lineBreakPositions, lineWidths) {
  cipherElement.textContent = "";
  const lineEnds = [...lineBreakPositions, text.length];
  let start2 = 0;
  for (let i = 0; i < lineEnds.length; i++) {
    const end = lineEnds[i];
    const lineSpan = document.createElement("span");
    lineSpan.style.cssText = `display:block;width:${lineWidths[i] ?? 0}px;white-space:nowrap;overflow:hidden`;
    let lineText = "";
    for (let j = start2; j < end; j++) {
      lineText += CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
    }
    lineSpan.textContent = lineText;
    cipherElement.appendChild(lineSpan);
    start2 = end;
  }
}
function applyCipherLensMask_(cipherLayerElement, lensX, lensY) {
  const mask = `radial-gradient(circle ${CONFIG$1.lensRadius}px at ${lensX}px ${lensY}px, transparent ${CONFIG$1.lensRadius}px, black ${CONFIG$1.lensRadius}px)`;
  cipherLayerElement.style.setProperty("-webkit-mask-image", mask);
  cipherLayerElement.style.setProperty("mask-image", mask);
}
function startCipherAnimation_(cipherLayerElement, searchQueryText, lineBreakPositions, lineWidths) {
  cipherIntervalId_ = setInterval(() => {
    refreshCipherContent_(
      cipherLayerElement,
      searchQueryText,
      lineBreakPositions,
      lineWidths
    );
  }, CONFIG$1.cipherRefreshIntervalMs);
}
function stopCipherAnimation_() {
  if (cipherIntervalId_ !== null) {
    clearInterval(cipherIntervalId_);
    cipherIntervalId_ = null;
  }
}
function createSearchQueryLayerContainer_() {
  const element = document.createElement("span");
  element.className = "magnify-container";
  element.style.setProperty(
    "--magnify-cipher-fade-duration",
    `${CONFIG$1.cipherFadeDurationMs}ms`
  );
  return element;
}
function createSearchQueryLayoutAnchorSpan_(searchQueryText) {
  const element = document.createElement("span");
  element.className = "magnify-layout";
  element.textContent = searchQueryText;
  return element;
}
function createSearchQueryCipherLayerSpan_() {
  const element = document.createElement("span");
  element.className = "magnify-cipher-layer";
  return element;
}
function createSearchQueryLayerSpan_(searchQueryText) {
  const element = document.createElement("span");
  element.className = "magnify-real-layer";
  element.style.color = autoTypeConfig.searchQueryTextColor;
  element.textContent = searchQueryText;
  return element;
}
function appendSearchQueryLayers_(searchQueryText) {
  const searchQueryLayerContainerElement = createSearchQueryLayerContainer_();
  searchQueryElement_$2.appendChild(searchQueryLayerContainerElement);
  const layoutSpanElement = createSearchQueryLayoutAnchorSpan_(searchQueryText);
  searchQueryLayerContainerElement.appendChild(layoutSpanElement);
  searchQueryCipherLayerSpanElement_ = createSearchQueryCipherLayerSpan_();
  searchQueryLayerContainerElement.appendChild(
    searchQueryCipherLayerSpanElement_
  );
  searchQueryLayerSpanElement_ = createSearchQueryLayerSpan_(searchQueryText);
  searchQueryLayerContainerElement.appendChild(searchQueryLayerSpanElement_);
  return searchQueryLayerContainerElement;
}
function applyMagnifyingGlassScanFrame_(scanX, searchQueryLayerContainerElement, searchQueryLayerContainerRect, searchQueryText, searchResultImageSrc) {
  if (!searchQueryCipherLayerSpanElement_ || !searchQueryLayerSpanElement_ || !lensElement_ || !lensBezelElement_) {
    return;
  }
  const lensCenterY = searchQueryLayerContainerRect.top + searchQueryLayerContainerElement.offsetHeight / 2 + CONFIG$1.lensYOffset;
  const cipherLeft = Math.max(
    0,
    Math.min(scanX + CONFIG$1.lensRadius, scanContainerWidth_)
  );
  searchQueryCipherLayerSpanElement_.style.clipPath = `inset(0 0 0 ${cipherLeft}px)`;
  const lensCenterYInCipherLayer = lensCenterY - searchQueryLayerContainerRect.top;
  applyCipherLensMask_(
    searchQueryCipherLayerSpanElement_,
    scanX,
    lensCenterYInCipherLayer
  );
  const revealX = Math.max(
    0,
    Math.min(scanX - CONFIG$1.lensRadius, scanContainerWidth_)
  );
  searchQueryLayerSpanElement_.style.clipPath = `inset(0 ${scanContainerWidth_ - revealX}px 0 0)`;
  const scanRange = scanContainerWidth_ + CONFIG$1.lensRadius * 2;
  const scanProgress = Math.max(
    0,
    Math.min(1, (scanX + CONFIG$1.lensRadius) / scanRange)
  );
  const sourceCanvas = prepareLensSourceCanvas(
    contentElement_$2,
    searchQueryLayerContainerElement,
    searchQueryText,
    searchResultImageSrc
  );
  if (sourceCanvas) {
    renderWebGLLens(
      sourceCanvas,
      scanContainerOffsetX_ + scanX,
      magnifyingGlassYInContent_,
      utils.getDevicePixelRatio(),
      lensElement_.width,
      scanProgress
    );
  }
  const lensPageX = searchQueryLayerContainerRect.left + scanX;
  const lensY = lensCenterY - CONFIG$1.lensRadius;
  const lensLeft = lensPageX - CONFIG$1.lensRadius;
  lensBezelElement_.style.left = `${lensLeft}px`;
  lensBezelElement_.style.top = `${lensY}px`;
  lensElement_.style.left = `${lensLeft}px`;
  lensElement_.style.top = `${lensY}px`;
}
function applyMagnifyingGlassOverlayCommonStyles_(element, lensY, diameter) {
  element.style.position = "fixed";
  element.style.top = `${lensY}px`;
  element.style.left = `-${diameter}px`;
  element.style.width = `${diameter}px`;
  element.style.height = `${diameter}px`;
  element.style.opacity = "0";
  element.style.transition = `opacity ${CONFIG$1.lensFadeDurationMs}ms ease`;
}
function createLensCanvas_(lensY, diameter) {
  const element = document.createElement("canvas");
  const physicalDiameter = Math.round(diameter * utils.getDevicePixelRatio());
  element.width = physicalDiameter;
  element.height = physicalDiameter;
  applyMagnifyingGlassOverlayCommonStyles_(element, lensY, diameter);
  element.style.zIndex = "10001";
  element.style.transform = "none";
  element.style.pointerEvents = "none";
  element.style.clipPath = `circle(${CONFIG$1.lensRadius}px at ${CONFIG$1.lensRadius}px ${CONFIG$1.lensRadius}px)`;
  return element;
}
function createLensBezel_(lensY, diameter) {
  const element = document.createElement("span");
  element.className = "magnify-lens-bezel";
  applyMagnifyingGlassOverlayCommonStyles_(element, lensY, diameter);
  element.style.zIndex = "10002";
  element.style.transform = "none";
  return element;
}
function appendMagnifyingGlassOverlays_(lensY, diameter) {
  lensElement_ = createLensCanvas_(lensY, diameter);
  document.body.appendChild(lensElement_);
  lensBezelElement_ = createLensBezel_(lensY, diameter);
  document.body.appendChild(lensBezelElement_);
}
function initLensRenderer_() {
  if (!lensElement_) {
    return false;
  }
  const bodyBackgroundColor = window.getComputedStyle(
    document.body
  ).backgroundColor;
  const isTransparent = bodyBackgroundColor === "rgba(0, 0, 0, 0)" || bodyBackgroundColor === "transparent";
  const [r, g, b] = isTransparent ? [0, 0, 0] : utils.parseCssColor(bodyBackgroundColor);
  return initWebGLLens(lensElement_, [r / 255, g / 255, b / 255]);
}
function initMagnifyingGlass_(searchQueryLayerContainerElement) {
  const diameter = CONFIG$1.lensRadius * 2;
  const containerRect = searchQueryLayerContainerElement.getBoundingClientRect();
  const lensY = containerRect.top + searchQueryLayerContainerElement.offsetHeight / 2 - CONFIG$1.lensRadius + CONFIG$1.lensYOffset;
  appendMagnifyingGlassOverlays_(lensY, diameter);
  if (!initLensRenderer_()) {
    tearDownMagnifyingGlassOverlays_();
    return;
  }
  fadeInMagnifyingGlassOverlays_();
}
function fadeInMagnifyingGlassOverlays_() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lensElement_?.style.setProperty("opacity", "1");
      lensBezelElement_?.style.setProperty("opacity", "1");
    });
  });
}
function fadeOutMagnifyingGlassOverlays_() {
  lensElement_?.style.setProperty("opacity", "0");
  lensBezelElement_?.style.setProperty("opacity", "0");
}
function onMagnifyingGlassScanComplete_() {
  searchQueryLayerSpanElement_?.style.setProperty("clip-path", "");
  searchQueryCipherLayerSpanElement_?.classList.add("magnify-cipher-fade-out");
  fadeOutMagnifyingGlassOverlays_();
  stopCipherAnimation_();
  const fadeDuration = utils.prefersReducedTransparency ? 0 : CONFIG$1.lensFadeDurationMs;
  magnifyingGlassFadeTimeoutId_ = setTimeout(() => {
    magnifyingGlassFadeTimeoutId_ = null;
    tearDownMagnifyingGlassOverlays_();
  }, fadeDuration);
}
function startMagnifyingGlassScan_(searchQueryLayerContainerElement, searchQueryText, searchResultImageSrc, onScanComplete) {
  scanContainerWidth_ = searchQueryLayerContainerElement.offsetWidth;
  const searchQueryLayerContainerRect = searchQueryLayerContainerElement.getBoundingClientRect();
  const contentRect = contentElement_$2.getBoundingClientRect();
  scanContainerOffsetX_ = searchQueryLayerContainerRect.left - contentRect.left;
  magnifyingGlassYInContent_ = searchQueryLayerContainerRect.top - contentRect.top + searchQueryLayerContainerElement.offsetHeight / 2 + CONFIG$1.lensYOffset;
  if (searchQueryLayerSpanElement_) {
    searchQueryLayerSpanElement_.style.clipPath = `inset(0 ${scanContainerWidth_}px 0 0)`;
  }
  let animationFrameId = null;
  let cancelled = false;
  const startX = -115;
  const endX = scanContainerWidth_ + CONFIG$1.lensRadius;
  const startTime = performance.now();
  const onTick = (now) => {
    if (cancelled) {
      return;
    }
    const searchQueryLayerContainerRect2 = searchQueryLayerContainerElement.getBoundingClientRect();
    const progress = Math.min((now - startTime) / CONFIG$1.scanDurationMs, 1);
    const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    const scanX = startX + (endX - startX) * easedProgress;
    applyMagnifyingGlassScanFrame_(
      scanX,
      searchQueryLayerContainerElement,
      searchQueryLayerContainerRect2,
      searchQueryText,
      searchResultImageSrc
    );
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(onTick);
    } else {
      cancelMagnifyingGlassScan_ = null;
      onScanComplete();
    }
  };
  animationFrameId = requestAnimationFrame(onTick);
  cancelMagnifyingGlassScan_ = () => {
    cancelled = true;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    cancelMagnifyingGlassScan_ = null;
  };
}
function resetSearchQuery_$1() {
  if (!searchQueryElement_$2) {
    return;
  }
  searchQueryElement_$2.style.overflow = "";
  searchQueryElement_$2.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$2.textContent = "";
  searchQueryCipherLayerSpanElement_ = null;
  searchQueryLayerSpanElement_ = null;
}
function tearDownMagnifyingGlassOverlays_() {
  lensBezelElement_?.remove();
  lensBezelElement_ = null;
  lensElement_?.remove();
  lensElement_ = null;
  destroyWebGLLens();
}
function stopAnimationStart_() {
  if (startAnimationFrameId_ !== null) {
    cancelAnimationFrame(startAnimationFrameId_);
    startAnimationFrameId_ = null;
  }
}
function stopMagnifyingGlassFade_() {
  if (magnifyingGlassFadeTimeoutId_ !== null) {
    clearTimeout(magnifyingGlassFadeTimeoutId_);
    magnifyingGlassFadeTimeoutId_ = null;
  }
}
function stopAnimation_$2() {
  stopAnimationStart_();
  stopMagnifyingGlassFade_();
  cancelMagnifyingGlassScan_?.();
  stopCipherAnimation_();
  cancelAll$1();
  tearDownMagnifyingGlassOverlays_();
  resetSearchQuery_$1();
  simulateTap.stop();
}
function onSearchQueryComplete_$1(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$2);
  resetSearchQuery_$1();
  onComplete();
}
function animateSearchQuery_$1(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_$1();
  const searchQueryLayerContainerElement = appendSearchQueryLayers_(searchQueryText);
  startAnimationFrameId_ = requestAnimationFrame(() => {
    startAnimationFrameId_ = null;
    searchQueryElement_$2.style.overflow = "visible";
    const layoutElement = searchQueryLayerContainerElement.querySelector(
      ".magnify-layout"
    );
    const { breakPositions, lineWidths } = layoutElement ? measureLines_(layoutElement, searchQueryText) : { breakPositions: [], lineWidths: [] };
    if (searchQueryCipherLayerSpanElement_) {
      refreshCipherContent_(
        searchQueryCipherLayerSpanElement_,
        searchQueryText,
        breakPositions,
        lineWidths
      );
      startCipherAnimation_(
        searchQueryCipherLayerSpanElement_,
        searchQueryText,
        breakPositions,
        lineWidths
      );
    }
    initMagnifyingGlass_(searchQueryLayerContainerElement);
    startMagnifyingGlassScan_(
      searchQueryLayerContainerElement,
      searchQueryText,
      searchResultImageSrc,
      onMagnifyingGlassScanComplete_
    );
  });
  const animationDuration = CONFIG$1.scanDurationMs + CONFIG$1.cipherFadeDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter$1,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$2,
      contentElement_$2,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_$1(onComplete)
  );
}
function init$7({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$2();
  searchQueryElement_$2 = searchQueryElement;
  searchResultImageElement_$2 = searchResultImageElement;
  contentElement_$2 = contentElement;
  simulateTap.init();
}
function simulate$2(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$2,
    scheduleAfter$1,
    () => animateSearchQuery_$1(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$2() {
  stopAnimation_$2();
}
const autoTypeMagnify = { init: init$7, simulate: simulate$2, cancel: cancel$2 };
const CONFIG = {
  // Stagger between each character's animation start.
  characterStaggerMs: 28,
  // Peak opacity the block settles to after flickering in. Kept below 1 so
  // the rectangles feel like overlay marks rather than solid fills.
  blockOpacity: 0.52,
  // Duration of the block flicker-in animation.
  blockFlickerDurationMs: 300,
  // Hold after the block settles before the cross-fade begins.
  blockHoldMs: 60,
  // Duration of the block fade-out and character fade-in cross-fade.
  revealDurationMs: 180
};
let searchQueryElement_$1;
let searchResultImageElement_$1;
let contentElement_$1;
const { scheduleAfter, cancelAll } = createScheduler();
function createCharacterSpan_(character) {
  const characterSpanElement = document.createElement("span");
  characterSpanElement.className = "redact-character";
  characterSpanElement.style.setProperty(
    "--redact-block-opacity",
    String(CONFIG.blockOpacity)
  );
  characterSpanElement.style.setProperty(
    "--redact-flicker-duration",
    `${CONFIG.blockFlickerDurationMs}ms`
  );
  characterSpanElement.style.setProperty(
    "--redact-reveal-duration",
    `${CONFIG.revealDurationMs}ms`
  );
  const layoutSpanElement = document.createElement("span");
  layoutSpanElement.className = "redact-layout";
  layoutSpanElement.textContent = character;
  characterSpanElement.appendChild(layoutSpanElement);
  const blockSpanElement = document.createElement("span");
  blockSpanElement.className = "redact-block";
  characterSpanElement.appendChild(blockSpanElement);
  const textSpanElement = document.createElement("span");
  textSpanElement.className = "redact-char-text";
  textSpanElement.textContent = character;
  characterSpanElement.appendChild(textSpanElement);
  return { characterSpanElement, blockSpanElement, textSpanElement };
}
function scheduleCharacterReveal_(blockSpanElement, textSpanElement, characterDelay) {
  scheduleAfter(() => {
    blockSpanElement.classList.add("redact-block-flicker");
  }, characterDelay);
  scheduleAfter(
    () => {
      blockSpanElement.style.animation = `redact-block-fade var(--redact-reveal-duration) ease-in forwards`;
      textSpanElement.classList.add("redact-char-reveal");
    },
    characterDelay + CONFIG.blockFlickerDurationMs + CONFIG.blockHoldMs
  );
}
function animateCharacters_(searchQueryElement, searchQueryText) {
  searchQueryElement.textContent = "";
  searchQueryElement.style.overflow = "visible";
  const words = splitWords(searchQueryText);
  const wordSpanElements = createWordSpanElements(searchQueryElement, words);
  let characterIndex = 0;
  words.forEach((word, wordIndex) => {
    for (const character of word) {
      const { characterSpanElement, blockSpanElement, textSpanElement } = createCharacterSpan_(character);
      wordSpanElements[wordIndex].appendChild(characterSpanElement);
      scheduleCharacterReveal_(
        blockSpanElement,
        textSpanElement,
        characterIndex * CONFIG.characterStaggerMs
      );
      characterIndex++;
    }
    characterIndex++;
  });
}
function resetSearchQuery_() {
  if (!searchQueryElement_$1) {
    return;
  }
  searchQueryElement_$1.style.color = autoTypeConfig.searchQueryTextColor;
  searchQueryElement_$1.style.overflow = "";
  searchQueryElement_$1.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_$1.textContent = "";
}
function stopAnimation_$1() {
  cancelAll();
  resetSearchQuery_();
}
function onSearchQueryComplete_(onComplete) {
  simulateTap.stop();
  hideSearchResult$1(searchResultImageElement_$1);
  resetSearchQuery_();
  onComplete();
}
function animateSearchQuery_(searchQueryText, searchResultImageSrc, onComplete) {
  if (!searchQueryText.trim()) {
    onComplete();
    return;
  }
  simulateTap.start();
  resetSearchQuery_();
  animateCharacters_(searchQueryElement_$1, searchQueryText);
  const animationDuration = (searchQueryText.length - 1) * CONFIG.characterStaggerMs + CONFIG.blockFlickerDurationMs + CONFIG.blockHoldMs + CONFIG.revealDurationMs;
  scheduleAnimationComplete(
    animationDuration,
    scheduleAfter,
    () => simulateTap.startAnim(),
    () => showSearchResult(
      searchResultImageElement_$1,
      contentElement_$1,
      searchResultImageSrc
    ),
    () => onSearchQueryComplete_(onComplete)
  );
}
function init$6({
  searchQueryElement,
  searchResultImageElement,
  contentElement
}) {
  stopAnimation_$1();
  searchQueryElement_$1 = searchQueryElement;
  searchResultImageElement_$1 = searchResultImageElement;
  contentElement_$1 = contentElement;
  simulateTap.init();
}
function simulate$1(searchQueryText, searchResultImageSrc, onComplete) {
  fadeOutPlaceholder(
    searchQueryElement_$1,
    scheduleAfter,
    () => animateSearchQuery_(searchQueryText, searchResultImageSrc, onComplete)
  );
}
function cancel$1() {
  stopAnimation_$1();
}
const autoTypeRedact = { init: init$6, simulate: simulate$1, cancel: cancel$1 };
let autoTypeModes_ = [];
let autoTypeModeQueue_ = [];
let activeAutotypeMode_ = null;
const autoTypeModeSearchModeMap_ = /* @__PURE__ */ new Map();
function createCaretMode_() {
  let elements;
  return {
    init(newElements) {
      elements = newElements;
    },
    prepare() {
      autoTypeCaret.init(elements);
      autoTypeCaret.prepare?.();
    },
    simulate(searchQueryText, searchResultImageSrc, onComplete) {
      autoTypeCaret.simulate(searchQueryText, searchResultImageSrc, onComplete);
    },
    cancel() {
      autoTypeCaret.cancel();
    }
  };
}
function init$5(elements, searchModes) {
  autoTypeModes_ = [];
  autoTypeModeQueue_ = [];
  autoTypeModeSearchModeMap_.clear();
  const caretMode = createCaretMode_();
  for (const [autoTypeMode, searchMode] of [
    [autoTypeAssemble, SearchMode.AutoTypeAssemble],
    [autoTypeBounce, SearchMode.AutoTypeBounce],
    [caretMode, SearchMode.AutoTypeCaret],
    [autoTypeFade, SearchMode.AutoTypeFade],
    [autoTypeFadeChars, SearchMode.AutoTypeFadeChars],
    [autoTypeFocus, SearchMode.AutoTypeFocus],
    [autoTypeGhost, SearchMode.AutoTypeGhost],
    [autoTypeMagnify, SearchMode.AutoTypeMagnify],
    [autoTypeNeon, SearchMode.AutoTypeNeon],
    [autoTypeRedact, SearchMode.AutoTypeRedact],
    [autoTypeReveal, SearchMode.AutoTypeReveal],
    [autoTypeScramble, SearchMode.AutoTypeScramble],
    [autoTypeSlotMachine, SearchMode.AutoTypeSlotMachine],
    [autoTypeSprinkle, SearchMode.AutoTypeSprinkle],
    [autoTypeWaterfall, SearchMode.AutoTypeWaterfall],
    [autoTypeWordBurst, SearchMode.AutoTypeWordBurst]
  ]) {
    if (searchModes && !searchModes.includes(searchMode)) {
      continue;
    }
    autoTypeMode.init(elements);
    autoTypeModes_.push(autoTypeMode);
    autoTypeModeSearchModeMap_.set(autoTypeMode, searchMode);
  }
  utils.debugLog(
    `AutoType random initialized with ${autoTypeModes_.length} animation ${autoTypeModes_.length === 1 ? "mode" : "modes"}`
  );
  if (autoTypeModes_.length === 0 && searchModes) {
    console.warn(
      "No modes matched searchModes filter; falling back to all modes."
    );
    init$5(elements);
  }
}
function refillQueue_() {
  const shuffled = utils.shuffleArray(autoTypeModes_);
  avoidRepeatAtStart(shuffled, activeAutotypeMode_);
  autoTypeModeQueue_.push(...shuffled);
}
function prepare() {
  if (autoTypeModeQueue_.length === 0) {
    refillQueue_();
  }
  const nextAutotypeMode = autoTypeModeQueue_.shift();
  if (nextAutotypeMode === void 0) {
    console.warn("prepare called with no animation modes available.");
    return;
  }
  activeAutotypeMode_ = nextAutotypeMode;
  utils.debugLog(`AutoType random mode: ${getActiveModeName()}`);
  activeAutotypeMode_.prepare?.();
}
function simulate(searchQueryText, searchResultImageSrc, onComplete) {
  if (!activeAutotypeMode_) {
    console.warn("simulate called before prepare in autoTypeRandom.");
    onComplete();
    return;
  }
  activeAutotypeMode_.simulate(
    searchQueryText,
    searchResultImageSrc,
    onComplete
  );
}
function cancel() {
  activeAutotypeMode_?.cancel();
}
function getActiveModeName() {
  return (activeAutotypeMode_ && autoTypeModeSearchModeMap_.get(activeAutotypeMode_)) ?? SearchMode.AutoTypeRandom;
}
const autoTypeRandom = {
  init: init$5,
  prepare,
  simulate,
  cancel,
  getActiveModeName
};
let searchQueryElement_;
let searchInputElement_$2;
let searchResultImageElement_;
let contentElement_;
let searchQueries_ = [];
let placeholder_ = "";
let activeAnimation_ = null;
let searchMode_ = SearchMode.AutoTypeFadeChars;
let searchBoxElement_$1 = null;
let searchBoxObserver_ = null;
let searchBoxAnimationFrameId_ = null;
let searchBoxTargetHeight_ = 0;
let currentSearchQuery_ = { query: "" };
let queryQueue_ = [];
let lastQueryIndex_ = -1;
let randomizeQueries_ = false;
let playAnimationFrameId_ = null;
let isActive_ = false;
let isFirstRun_ = true;
let isInitialized_ = false;
function resetToPlaceholder_(animate = true) {
  searchQueryElement_.style.opacity = "0";
  searchQueryElement_.classList.remove(
    "search-query-fade-in",
    "search-query-fade-out"
  );
  searchQueryElement_.textContent = placeholder_;
  searchQueryElement_.style.color = autoTypeConfig.placeholderColor;
  searchResultImageElement_.classList.remove("visible");
  contentElement_.classList.remove("content-search-result-shown");
  if (isFirstRun_ || !animate) {
    if (animate) {
      isFirstRun_ = false;
    }
    searchQueryElement_.style.opacity = "";
    return;
  }
  isFirstRun_ = false;
  void searchQueryElement_.offsetWidth;
  searchQueryElement_.style.setProperty(
    "--fade-in-duration",
    `${autoTypeConfig.placeholderFadeInDurationMs}ms`
  );
  searchQueryElement_.classList.add("search-query-fade-in");
  searchQueryElement_.style.opacity = "";
}
function nextQueryIndex_() {
  if (!randomizeQueries_) {
    const index2 = (lastQueryIndex_ + 1) % searchQueries_.length;
    lastQueryIndex_ = index2;
    return index2;
  }
  if (queryQueue_.length === 0) {
    const shuffled = shuffledIndices(searchQueries_.length);
    avoidRepeatAtStart(shuffled, lastQueryIndex_);
    queryQueue_.push(...shuffled);
  }
  const index = queryQueue_.shift();
  if (index === void 0) {
    console.warn("Query queue empty after refill; restarting from index 0.");
    return 0;
  }
  lastQueryIndex_ = index;
  return index;
}
function playNextQuery_() {
  if (!isActive_) {
    return;
  }
  if (!activeAnimation_) {
    console.warn("playNextQuery called with no active animation.");
    return;
  }
  if (searchQueries_.length === 0) {
    console.warn("playNextQuery called with no queries.");
    return;
  }
  resetToPlaceholder_();
  activeAnimation_.prepare?.();
  const searchModeName = searchMode_ === SearchMode.AutoTypeRandom ? autoTypeRandom.getActiveModeName() : searchMode_;
  document.dispatchEvent(
    new CustomEvent("autotype-mode-change", { detail: searchModeName })
  );
  const index = nextQueryIndex_();
  const searchQuery2 = searchQueries_[index];
  currentSearchQuery_ = searchQuery2;
  activeAnimation_.simulate(searchQuery2.query, searchQuery2.image, () => {
    if (isActive_) {
      contentElement_.classList.add("content-search-result-shown");
    }
    playNextQuery_();
  });
}
function measureNaturalHeight_(searchBoxElement) {
  const savedTransition = searchBoxElement.style.transition;
  searchBoxElement.style.transition = "none";
  searchBoxElement.style.height = "";
  const naturalHeight = searchBoxElement.offsetHeight;
  return { naturalHeight, savedTransition };
}
function animateToNaturalHeight_(searchBoxElement, visualHeight, savedTransition) {
  searchBoxElement.style.height = `${visualHeight}px`;
  searchBoxAnimationFrameId_ = requestAnimationFrame(() => {
    searchBoxAnimationFrameId_ = null;
    const shouldAnimate = contentElement_.classList.contains(
      "search-result-visible"
    );
    searchBoxElement.style.transition = shouldAnimate ? "height 0.2s ease" : "none";
    searchBoxElement.style.height = `${searchBoxTargetHeight_}px`;
    if (shouldAnimate) {
      searchBoxElement.addEventListener(
        "transitionend",
        () => {
          searchBoxElement.style.height = "";
          searchBoxElement.style.transition = "";
        },
        { once: true }
      );
    } else {
      searchBoxElement.style.height = "";
      searchBoxElement.style.transition = savedTransition;
    }
  });
}
function onSearchBoxMutation_() {
  const searchBoxElement = searchBoxElement_$1;
  if (!searchBoxElement) {
    return;
  }
  const visualHeight = Math.round(
    searchBoxElement.getBoundingClientRect().height
  );
  const { naturalHeight, savedTransition } = measureNaturalHeight_(searchBoxElement);
  if (naturalHeight === searchBoxTargetHeight_) {
    searchBoxElement.style.height = "";
    searchBoxElement.style.transition = savedTransition;
    return;
  }
  searchBoxTargetHeight_ = naturalHeight;
  if (searchBoxAnimationFrameId_ !== null) {
    cancelAnimationFrame(searchBoxAnimationFrameId_);
    searchBoxAnimationFrameId_ = null;
  }
  animateToNaturalHeight_(searchBoxElement, visualHeight, savedTransition);
}
function watchSearchBoxSize_() {
  searchBoxElement_$1 = searchQueryElement_.closest(".search-box");
  if (!searchBoxElement_$1) {
    console.warn("Search box element not found; height animation disabled.");
    return;
  }
  searchBoxTargetHeight_ = searchBoxElement_$1.offsetHeight;
  if (searchBoxAnimationFrameId_ !== null) {
    cancelAnimationFrame(searchBoxAnimationFrameId_);
    searchBoxAnimationFrameId_ = null;
  }
  searchBoxObserver_?.disconnect();
  searchBoxObserver_ = new MutationObserver(onSearchBoxMutation_);
  searchBoxObserver_.observe(searchQueryElement_, {
    childList: true,
    subtree: true,
    characterData: true
  });
}
function stopAnimation_() {
  if (playAnimationFrameId_ !== null) {
    cancelAnimationFrame(playAnimationFrameId_);
    playAnimationFrameId_ = null;
  }
  activeAnimation_?.cancel();
}
function initContentStyles_() {
  contentElement_.style.setProperty(
    "--content-slide-up-on-result-visible",
    `${autoTypeConfig.contentSlideUpOnResultVisible}px`
  );
  contentElement_.style.setProperty(
    "--content-slide-up-duration",
    `${autoTypeConfig.contentSlideUpDurationMs}ms`
  );
  contentElement_.style.setProperty(
    "--content-slide-up-easing",
    autoTypeConfig.contentSlideUpEasing
  );
}
function createSearchResultImageElement_() {
  const imageElement = document.createElement("img");
  imageElement.className = "search-result-image hidden";
  imageElement.style.cursor = "pointer";
  imageElement.style.setProperty(
    "--search-result-image-border-radius",
    `${autoTypeConfig.searchResultImageBorderRadius}px`
  );
  imageElement.style.setProperty(
    "--search-result-image-overlap-offset",
    `${autoTypeConfig.searchResultImageTopOffset}px`
  );
  imageElement.style.setProperty(
    "--search-result-image-max-width",
    `${autoTypeConfig.searchResultImageMaxWidth}px`
  );
  imageElement.style.setProperty(
    "--search-result-image-fade-in-duration",
    `${autoTypeConfig.searchResultImageFadeInDurationMs}ms`
  );
  imageElement.addEventListener("click", () => {
    if (currentSearchQuery_.query && imageElement.classList.contains("visible")) {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
      searchDispatcher.dispatchSearchWithQuery(currentSearchQuery_);
    }
  });
  contentElement_.appendChild(imageElement);
  return imageElement;
}
function initAnimation_() {
  const animationElements = {
    searchQueryElement: searchQueryElement_,
    searchResultImageElement: searchResultImageElement_,
    contentElement: contentElement_
  };
  const standardModes = {
    [SearchMode.AutoTypeFadeChars]: autoTypeFadeChars,
    [SearchMode.AutoTypeFade]: autoTypeFade,
    [SearchMode.AutoTypeScramble]: autoTypeScramble,
    [SearchMode.AutoTypeWordBurst]: autoTypeWordBurst,
    [SearchMode.AutoTypeBounce]: autoTypeBounce,
    [SearchMode.AutoTypeReveal]: autoTypeReveal,
    [SearchMode.AutoTypeSlotMachine]: autoTypeSlotMachine,
    [SearchMode.AutoTypeFocus]: autoTypeFocus,
    [SearchMode.AutoTypeNeon]: autoTypeNeon,
    [SearchMode.AutoTypeGhost]: autoTypeGhost,
    [SearchMode.AutoTypeWaterfall]: autoTypeWaterfall,
    [SearchMode.AutoTypeAssemble]: autoTypeAssemble,
    [SearchMode.AutoTypeSprinkle]: autoTypeSprinkle,
    [SearchMode.AutoTypeReducedMotion]: autoTypeReducedMotion,
    [SearchMode.AutoTypeMagnify]: autoTypeMagnify,
    [SearchMode.AutoTypeRedact]: autoTypeRedact
  };
  const standardMode = standardModes[searchMode_];
  if (standardMode) {
    standardMode.init(animationElements);
    activeAnimation_ = standardMode;
  } else if (searchMode_ === SearchMode.AutoTypeRandom) {
    const searchModes = splitSearchModes(
      searchBoxElement_$1?.dataset.searchMode ?? ""
    );
    autoTypeRandom.init(
      animationElements,
      searchModes.length > 1 ? searchModes : void 0
    );
    activeAnimation_ = autoTypeRandom;
  } else {
    autoTypeCaret.init(animationElements);
    activeAnimation_ = autoTypeCaret;
  }
}
function init$4(queries, searchMode) {
  stopAnimation_();
  isInitialized_ = false;
  isActive_ = false;
  isFirstRun_ = true;
  const searchQueryElement = document.querySelector("#search-query");
  const searchInputElement = document.querySelector("#search-input");
  const contentElement = document.querySelector(".content");
  if (!searchQueryElement || !searchInputElement || !contentElement) {
    console.warn("Required elements not found, failed to initialize autotype.");
    return;
  }
  searchQueryElement_ = searchQueryElement;
  searchInputElement_$2 = searchInputElement;
  contentElement_ = contentElement;
  initContentStyles_();
  watchSearchBoxSize_();
  contentElement_.querySelector(".search-result-image")?.remove();
  searchResultImageElement_ = createSearchResultImageElement_();
  searchQueries_ = queries;
  placeholder_ = searchInputElement_$2.placeholder;
  randomizeQueries_ = searchBoxElement_$1?.dataset.randomizeQueries !== void 0 && queries.length > 1;
  utils.debugLog(
    `Playing queries in ${randomizeQueries_ ? "random order" : "sequence"}`
  );
  queryQueue_ = [];
  lastQueryIndex_ = -1;
  searchMode_ = searchMode;
  initAnimation_();
  isInitialized_ = true;
}
function start() {
  if (!isInitialized_ || isActive_) {
    return;
  }
  utils.debugLog(`AutoType started in ${searchMode_} mode`);
  isActive_ = true;
  searchResultImageElement_.classList.remove("hidden");
  playAnimationFrameId_ = requestAnimationFrame(() => {
    playNextQuery_();
  });
}
function pause() {
  if (!isActive_) {
    return;
  }
  utils.debugLog("AutoType paused");
  isActive_ = false;
  stopAnimation_();
  isFirstRun_ = true;
  resetToPlaceholder_(false);
}
function resume() {
  if (!isInitialized_ || document.hidden) {
    return;
  }
  if (!searchInputElement_$2.classList.contains("hidden")) {
    return;
  }
  utils.debugLog("AutoType resumed");
  start();
}
function getSearchQuery$1() {
  return currentSearchQuery_;
}
function hideSearchResult() {
  if (!isInitialized_) {
    return;
  }
  searchResultImageElement_.classList.remove("visible");
  searchResultImageElement_.classList.add("hidden");
}
const autoType = {
  init: init$4,
  start,
  pause,
  resume,
  getSearchQuery: getSearchQuery$1,
  hideSearchResult
};
function createElement$1(onClick) {
  if (document.querySelector(".search-box")?.dataset.hideAskBrave !== void 0) {
    return null;
  }
  const iconElement = document.createElement("span");
  iconElement.className = "ask-brave-icon";
  const labelElement = document.createElement("span");
  labelElement.className = "ask-brave-label";
  labelElement.textContent = "Ask Brave";
  const rowElement = document.createElement("div");
  rowElement.className = "ask-brave suggestion";
  rowElement.append(iconElement, labelElement);
  rowElement.addEventListener("click", onClick);
  return rowElement;
}
const autocompleteAskBraveRow = { createElement: createElement$1 };
function createElement(contents, descriptionText, onClick) {
  const titleElement = document.createElement("div");
  titleElement.className = "suggestion-title";
  titleElement.textContent = contents;
  const imageElement = document.createElement("span");
  imageElement.className = "suggestion-image";
  const descriptionElement = document.createElement("div");
  descriptionElement.className = "suggestion-description";
  descriptionElement.textContent = descriptionText;
  const textContainerElement = document.createElement("div");
  textContainerElement.className = "suggestion-text-container";
  textContainerElement.append(titleElement, descriptionElement);
  const rowElement = document.createElement("div");
  rowElement.className = "suggestion";
  rowElement.append(imageElement, textContainerElement);
  rowElement.addEventListener("click", onClick);
  return rowElement;
}
const autocompleteSuggestionRow = { createElement };
const autocompleteConfig = {
  // Maximum number of suggestions to display. The browser may send
  // more than this; the list is sliced to this length before render.
  maxSuggestions: 5
};
const ASK_LEO_DESCRIPTION_ = "Ask Leo";
let searchContainerElement_;
let searchInputElement_$1;
let onSuggestionClick_;
let onAskBraveClick_;
let isSubscribed_ = false;
let activeIndex_ = -1;
function handleMessage_(event) {
  if (utils.targetOrigin() !== event.origin) {
    return;
  }
  const { type, value } = event.data || {};
  if (type === "richMediaSearchMatches" && Array.isArray(value)) {
    update_(value);
  }
}
function createRowElement_(contents, description) {
  if (description !== ASK_LEO_DESCRIPTION_) {
    return autocompleteSuggestionRow.createElement(
      contents,
      description,
      () => onSuggestionClick_(contents)
    );
  }
  return autocompleteAskBraveRow.createElement(() => {
    const query = searchInputElement_$1.value.trim();
    if (!query) {
      return;
    }
    onAskBraveClick_(query);
  });
}
function update_(suggestions) {
  hide();
  if (suggestions.length === 0) {
    return;
  }
  if (!searchInputElement_$1?.value.trim()) {
    return;
  }
  const containerElement = document.createElement("div");
  containerElement.id = "suggestions";
  containerElement.className = "suggestions";
  for (const { contents, description } of suggestions.slice(
    0,
    autocompleteConfig.maxSuggestions
  )) {
    const rowElement = createRowElement_(contents, description);
    if (rowElement) {
      containerElement.appendChild(rowElement);
    }
  }
  if (containerElement.children.length === 0) {
    return;
  }
  searchContainerElement_.appendChild(containerElement);
}
function init$3(searchContainerElement, searchInputElement, onSuggestionClick, onAskBraveClick) {
  searchContainerElement_ = searchContainerElement;
  searchInputElement_$1 = searchInputElement;
  onSuggestionClick_ = onSuggestionClick;
  onAskBraveClick_ = onAskBraveClick;
}
function subscribe() {
  if (!isSubscribed_) {
    window.addEventListener("message", handleMessage_);
    isSubscribed_ = true;
  }
}
function hide() {
  activeIndex_ = -1;
  document.getElementById("suggestions")?.remove();
}
function navigate(direction) {
  const containerElement = document.getElementById("suggestions");
  if (!containerElement) {
    return null;
  }
  const itemElements = containerElement.querySelectorAll(".suggestion");
  if (itemElements.length === 0) {
    return null;
  }
  itemElements[activeIndex_]?.classList.remove("suggestion--active");
  activeIndex_ += direction;
  if (activeIndex_ >= itemElements.length) {
    activeIndex_ = -1;
  }
  if (activeIndex_ < -1) {
    activeIndex_ = itemElements.length - 1;
  }
  if (activeIndex_ === -1) {
    return null;
  }
  itemElements[activeIndex_].classList.add("suggestion--active");
  return itemElements[activeIndex_].querySelector(".suggestion-title")?.textContent ?? null;
}
function getActive() {
  if (activeIndex_ === -1) {
    return null;
  }
  const containerElement = document.getElementById("suggestions");
  if (!containerElement) {
    return null;
  }
  const itemElements = containerElement.querySelectorAll(".suggestion");
  return itemElements[activeIndex_]?.querySelector(".suggestion-title")?.textContent ?? null;
}
function getActiveElement() {
  if (activeIndex_ === -1) {
    return null;
  }
  return document.getElementById("suggestions")?.querySelectorAll(".suggestion")[activeIndex_] ?? null;
}
function reset() {
  const containerElement = document.getElementById("suggestions");
  if (containerElement) {
    containerElement.querySelectorAll(".suggestion--active").forEach(
      (activeItemElement) => activeItemElement.classList.remove("suggestion--active")
    );
  }
  activeIndex_ = -1;
}
const autocomplete = {
  init: init$3,
  subscribe,
  hide,
  navigate,
  getActive,
  getActiveElement,
  reset
};
let searchInputElement_;
let autoTypeQueryElement_;
let searchBoxElement_;
let searchBoxLogoElement_ = null;
let searchBoxIconButtonElement_ = null;
function getSearchQuery_() {
  return (searchInputElement_.classList.contains("hidden") ? autoType.getSearchQuery().query : searchInputElement_.value).trim();
}
function addSearchLogo_() {
  searchBoxLogoElement_ = document.createElement("img");
  searchBoxLogoElement_.className = "search-logo";
  searchBoxLogoElement_.src = "search-logo.webp";
  searchBoxElement_.prepend(searchBoxLogoElement_);
}
function addSearchIconButton_() {
  searchBoxIconButtonElement_ = document.createElement("button");
  searchBoxIconButtonElement_.className = "search-icon-button";
  searchBoxElement_.append(searchBoxIconButtonElement_);
  searchBoxIconButtonElement_.addEventListener("click", (event) => {
    event.stopPropagation();
    const searchQuery2 = getSearchQuery_();
    if (searchQuery2) {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
      searchDispatcher.dispatchSearchWithQuery({
        query: searchQuery2,
        params: getSearchQueryParams()
      });
    }
  });
}
function switchToInteractiveTypingMode_(placeholder) {
  utils.debugLog("Switched to interactive typing mode");
  autoType.pause();
  autoType.hideSearchResult();
  autoTypeQueryElement_.classList.add("hidden");
  searchInputElement_.classList.remove("hidden");
  searchInputElement_.placeholder = placeholder;
  searchInputElement_.focus();
  autocomplete.subscribe();
  eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
}
function setupInput_() {
  let originalQuery = "";
  searchInputElement_.addEventListener("click", (event) => {
    event.stopPropagation();
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
  });
  searchInputElement_.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const selected = autocomplete.navigate(
        event.key === "ArrowDown" ? 1 : -1
      );
      searchInputElement_.value = selected ?? originalQuery;
    } else if (event.key === "Enter") {
      const activeElement = autocomplete.getActiveElement();
      if (activeElement) {
        activeElement.click();
      } else {
        const query = searchInputElement_.value.trim();
        if (query) {
          eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
          searchDispatcher.dispatchSearchWithQuery({ query });
        }
      }
    } else if (event.key === "Escape") {
      if (autocomplete.getActiveElement() !== null) {
        searchInputElement_.value = originalQuery;
        autocomplete.reset();
      } else {
        searchInputElement_.value = "";
        searchInputElement_.blur();
        autocomplete.hide();
      }
    }
  });
  searchInputElement_.addEventListener("input", () => {
    originalQuery = searchInputElement_.value;
    if (searchInputElement_.value.trim()) {
      searchDispatcher.dispatchQueryAutocomplete(searchInputElement_.value);
    } else {
      autocomplete.hide();
    }
  });
}
function init$2(searchMode) {
  const searchContainerElement = document.querySelector(".search-container");
  const searchBoxElement = document.querySelector(".search-box");
  if (!searchContainerElement || !searchBoxElement) {
    console.warn(
      "Required elements not found, failed to initialize search box."
    );
    return;
  }
  searchBoxElement_ = searchBoxElement;
  const placeholder = localizeText(
    searchBoxElement_.dataset.placeholder,
    "Ask anything, find anything..."
  );
  const searchInputElement = document.createElement("input");
  searchInputElement.id = "search-input";
  searchInputElement.type = "text";
  searchInputElement.autocomplete = "off";
  searchInputElement.spellcheck = false;
  searchInputElement.setAttribute("autocorrect", "off");
  searchInputElement.setAttribute("autocapitalize", "off");
  searchInputElement.placeholder = placeholder;
  searchBoxElement_.append(searchInputElement);
  searchInputElement_ = searchInputElement;
  if (searchBoxElement_.dataset.hideSearchLogo === void 0) {
    addSearchLogo_();
  }
  if (searchBoxElement_.dataset.hideSearchIcon === void 0) {
    addSearchIconButton_();
  }
  if (searchMode === SearchMode.Interactive) {
    searchBoxElement_.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    setupInput_();
    autocomplete.init(
      searchContainerElement,
      searchInputElement,
      (query) => {
        eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
        searchDispatcher.dispatchSearchWithQuery({ query });
      },
      (query) => {
        eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
        searchDispatcher.dispatchAskBrave(query);
      }
    );
    autocomplete.subscribe();
    return;
  }
  const autoTypeQueryElement = document.createElement("div");
  autoTypeQueryElement.id = "search-query";
  searchBoxElement_.insertBefore(autoTypeQueryElement, searchInputElement);
  searchInputElement.classList.add("hidden");
  autoTypeQueryElement_ = autoTypeQueryElement;
  autocomplete.init(
    searchContainerElement,
    searchInputElement,
    (query) => {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
      searchDispatcher.dispatchSearchWithQuery({ query });
    },
    (query) => {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
      searchDispatcher.dispatchAskBrave(query);
    }
  );
  searchBoxElement_.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!searchInputElement.classList.contains("hidden")) {
      return;
    }
    switchToInteractiveTypingMode_(placeholder);
  });
  searchBoxElement_.addEventListener("mouseenter", () => {
    if (!searchInputElement.classList.contains("hidden")) {
      return;
    }
    if (document.hidden) {
      return;
    }
    autoType.pause();
  });
  searchBoxElement_.addEventListener("mouseleave", () => {
    if (!searchInputElement.classList.contains("hidden")) {
      return;
    }
    if (document.hidden) {
      return;
    }
    autoType.resume();
  });
  setupInput_();
}
function getSearchBoxLogoElement() {
  return searchBoxLogoElement_;
}
function getSearchBoxIconButtonElement() {
  return searchBoxIconButtonElement_;
}
function getSearchQuery() {
  return getSearchQuery_();
}
function getSearchQueryParams() {
  return searchInputElement_.classList.contains("hidden") ? autoType.getSearchQuery().params : void 0;
}
const searchBox = {
  init: init$2,
  getSearchBoxLogoElement,
  getSearchBoxIconButtonElement,
  getSearchQuery,
  getSearchQueryParams
};
const tryNowButtonConfig = {
  // Background color of the Try Now button.
  backgroundColor: "#ff4000",
  // Text color of the Try Now button.
  textColor: "white",
  // Number of times the button animates after the simulated tap.
  animCycles: 3,
  // Scale factor applied on hover.
  hoverScale: 1.05
};
function init$1(getSearchQuery2, getSearchQueryParams2) {
  const buttonElement = document.getElementById("try-now-button");
  if (!buttonElement) {
    return;
  }
  buttonElement.textContent = localizeText(
    buttonElement.dataset.label,
    "Try Brave Search Now"
  );
  buttonElement.style.setProperty(
    "--try-now-button-background-color",
    buttonElement.dataset.backgroundColor ?? tryNowButtonConfig.backgroundColor
  );
  buttonElement.style.setProperty(
    "--try-now-button-color",
    buttonElement.dataset.textColor ?? tryNowButtonConfig.textColor
  );
  buttonElement.style.setProperty(
    "--anim-cycles",
    `${tryNowButtonConfig.animCycles}`
  );
  buttonElement.style.setProperty(
    "--try-now-button-hover-scale",
    `${tryNowButtonConfig.hoverScale}`
  );
  if (buttonElement.dataset.hoverBackgroundColor) {
    buttonElement.style.setProperty(
      "--try-now-button-hover-background-color",
      buttonElement.dataset.hoverBackgroundColor
    );
    buttonElement.style.setProperty("--try-now-button-hover-filter", "none");
  }
  buttonElement.addEventListener("click", (event) => {
    event.stopPropagation();
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK);
    searchDispatcher.dispatchSearchWithQuery({
      query: getSearchQuery2(),
      params: getSearchQueryParams2()
    });
  });
}
const tryNowButton = { init: init$1 };
const makeDefaultButtonConfig = {
  // Background color of the Make Default button.
  backgroundColor: "#303033",
  // Text color of the Make Default button.
  textColor: "white"
};
function init() {
  const buttonElement = document.getElementById("make-default-button");
  if (!buttonElement) {
    return;
  }
  buttonElement.textContent = localizeText(
    buttonElement.dataset.label,
    "Make Brave Search Default"
  );
  buttonElement.style.setProperty(
    "--make-default-button-background-color",
    buttonElement.dataset.backgroundColor ?? makeDefaultButtonConfig.backgroundColor
  );
  buttonElement.style.setProperty(
    "--make-default-button-color",
    buttonElement.dataset.textColor ?? makeDefaultButtonConfig.textColor
  );
  if (buttonElement.dataset.hoverBackgroundColor) {
    buttonElement.style.setProperty(
      "--make-default-button-hover-background-color",
      buttonElement.dataset.hoverBackgroundColor
    );
    buttonElement.style.setProperty(
      "--make-default-button-hover-filter",
      "none"
    );
  }
  buttonElement.addEventListener("click", (event) => {
    event.stopPropagation();
    searchDispatcher.dispatchMakeDefault();
    eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
  });
}
const makeDefaultButton = { init };
let visibilityListenerRegistered_ = false;
function resolveSearchMode_(searchModes) {
  const searchMode = searchModes.length > 1 ? SearchMode.AutoTypeRandom : searchModes[0] ?? SearchMode.AutoTypeFadeChars;
  if (utils.prefersReducedMotion) {
    return SearchMode.AutoTypeReducedMotion;
  }
  return searchMode;
}
function initTagline_() {
  const taglineElement = document.getElementById("tagline");
  if (!taglineElement) {
    return;
  }
  const taglineText = localizeText(taglineElement.dataset.label, "");
  if (taglineText) {
    taglineElement.textContent = taglineText;
  } else {
    taglineElement.style.display = "none";
  }
}
function initSubHeadline_() {
  const subHeadlineElement = document.getElementById("sub-headline");
  if (!subHeadlineElement) {
    return;
  }
  const subHeadlineText = localizeText(subHeadlineElement.dataset.label, "");
  if (subHeadlineText) {
    subHeadlineElement.textContent = subHeadlineText;
  } else {
    subHeadlineElement.style.visibility = "hidden";
  }
}
function initTryNowButton_(searchBoxElement) {
  if (searchBoxElement.dataset.hideTryNowButton !== void 0) {
    const tryNowButtonElement = document.getElementById("try-now-button");
    if (tryNowButtonElement) {
      tryNowButtonElement.style.display = "none";
    }
    return;
  }
  tryNowButton.init(
    () => searchBox.getSearchQuery(),
    () => searchBox.getSearchQueryParams()
  );
}
function initAutoType_(searchQueries, searchMode) {
  autoType.init(searchQueries, searchMode);
  autoType.start();
  if (!visibilityListenerRegistered_) {
    visibilityListenerRegistered_ = true;
    document.addEventListener("visibilitychange", () => {
      utils.debugLog(
        `Visibility changed: ${document.hidden ? "hidden" : "visible"}`
      );
      if (document.hidden) {
        autoType.pause();
      } else {
        autoType.resume();
      }
    });
  }
}
function initMakeDefaultButton_(searchBoxElement) {
  const makeDefaultButtonElement = document.getElementById(
    "make-default-button"
  );
  if (searchBoxElement.dataset.hideMakeDefaultButton !== void 0 || !utils.isChromiumMajorVersionAtLeast(148)) {
    if (makeDefaultButtonElement) {
      makeDefaultButtonElement.style.display = "none";
    }
    return;
  }
  makeDefaultButton.init();
}
function initBraveSearch() {
  document.addEventListener("DOMContentLoaded", () => {
    initWallpaper();
    const searchContainerElement = document.querySelector(".search-container");
    if (!searchContainerElement) {
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
    const json = searchBoxElement.dataset.searchQueries;
    let searchQueryLocaleMap;
    if (json) {
      try {
        searchQueryLocaleMap = JSON.parse(json);
      } catch {
        console.warn(
          "data-search-queries is not valid JSON; autotype will be disabled."
        );
      }
    }
    const searchQueries = localizeContent(searchQueryLocaleMap);
    const searchModes = splitSearchModes(
      searchBoxElement.dataset.searchMode ?? ""
    );
    const resolvedSearchMode = resolveSearchMode_(searchModes);
    const searchMode = searchQueries.length === 0 ? SearchMode.Interactive : resolvedSearchMode;
    utils.debugLog(
      `Navigator languages: ${[...navigator.languages].join(", ")}`
    );
    utils.debugLog(`Primary navigator locale: ${utils.locale}`);
    utils.debugLog(`Primary navigator language: ${utils.language}`);
    utils.debugLog(`Primary navigator region: ${utils.region ?? "unknown"}`);
    searchBox.init(searchMode);
    initTagline_();
    initSubHeadline_();
    initTryNowButton_(searchBoxElement);
    initMakeDefaultButton_(searchBoxElement);
    if (searchMode !== SearchMode.Interactive) {
      initAutoType_(searchQueries, searchMode);
    }
  });
}
initBraveSearch();
