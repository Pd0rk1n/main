function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
const dispatchedEvents = /* @__PURE__ */ new Set();
function dispatchNttEvent(eventType) {
  if (dispatchedEvents.has(eventType)) return;
  dispatchedEvents.add(eventType);
  const targetOrigin = isAndroid() ? "chrome://new-tab-takeover" : "chrome://newtab";
  window.parent.postMessage(
    { type: "richMediaEvent", value: eventType },
    targetOrigin
  );
}
function bindClickEvent(selector, handler) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => element.addEventListener("click", handler));
}
function bindClickEvents(selectors, handler) {
  selectors.forEach((selector) => bindClickEvent(selector, handler));
}
function initPanAndZoom() {
  const DEFAULT_START_FROM = "center top";
  const DEFAULT_PAN_TO = "center bottom";
  const DEFAULT_SCALE_FROM = "1";
  const DEFAULT_SCALE_TO = "1.5";
  const DEFAULT_TIMING_FUNCTION = "cubic-bezier(0.25, 0.1, 0.25, 1)";
  const DEFAULT_DURATION = "3s";
  const wallpaperContainer = document.getElementById("wallpaper-container");
  if (!wallpaperContainer) {
    console.warn("Wallpaper container not found, failed to initialize.");
    return;
  }
  const wallpaper = document.getElementById("wallpaper");
  if (!wallpaper) {
    console.warn("Wallpaper not found, failed to initialize.");
    return;
  }
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion)"
  ).matches;
  if (prefersReducedMotion) {
    console.warn("User prefers reduced motion. Skipping animations.");
  }
  const panTo = parseFocalPoint(wallpaper.dataset.panTo ?? DEFAULT_PAN_TO);
  const startFrom = prefersReducedMotion ? panTo : parseFocalPoint(wallpaper.dataset.startFrom ?? DEFAULT_START_FROM);
  const zoomFrom = parseFloat(wallpaper.dataset.zoomFrom ?? DEFAULT_SCALE_FROM);
  const zoomTo = parseFloat(wallpaper.dataset.zoomTo ?? DEFAULT_SCALE_TO);
  const timingFunction = wallpaper.dataset.timingFunction ?? DEFAULT_TIMING_FUNCTION;
  const duration = parseDuration(
    wallpaper.dataset.duration ?? DEFAULT_DURATION
  );
  const panAndZoomState = {
    animation: null,
    startTime: null,
    duration: null
  };
  function parseFocalPointCoordinate(focalPoint) {
    const normalizedFocalPoint = focalPoint.trim().toLowerCase();
    if (normalizedFocalPoint.endsWith("%"))
      return parseFloat(normalizedFocalPoint);
    if (normalizedFocalPoint === "left" || normalizedFocalPoint === "top")
      return 0;
    if (normalizedFocalPoint === "center") return 50;
    if (normalizedFocalPoint === "right" || normalizedFocalPoint === "bottom")
      return 100;
    console.warn("Invalid focal point coordinate, defaulting to center.");
    return 50;
  }
  function parseFocalPoint(focalPoint) {
    const components = focalPoint.trim().split(/\s+/);
    if (components.length === 1) {
      const focalPoint2 = parseFocalPointCoordinate(components[0]);
      return { x: focalPoint2, y: focalPoint2 };
    }
    if (components.length === 2) {
      return {
        x: parseFocalPointCoordinate(components[0]),
        y: parseFocalPointCoordinate(components[1])
      };
    }
    console.warn("Invalid focal point, defaulting to center.");
    return { x: 50, y: 50 };
  }
  function parseDuration(duration2) {
    const value = duration2.trim().toLowerCase();
    if (value.endsWith("ms")) {
      return parseFloat(value);
    }
    if (value.endsWith("s")) {
      return parseFloat(value) * 1e3;
    }
    return parseFloat(value);
  }
  function calculateImageSizeToFit(imageWidth, imageHeight, containerWidth, containerHeight) {
    const imageAspectRatio = imageWidth / imageHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    let width, height;
    if (imageAspectRatio > containerAspectRatio) {
      height = containerHeight;
      width = imageAspectRatio * height;
    } else {
      width = containerWidth;
      height = width / imageAspectRatio;
    }
    return { imageSize: { width, height } };
  }
  function calculateOffsets(imageSize, focalPoint, zoom) {
    if (!wallpaperContainer) return;
    const scaledWidth = imageSize.width * zoom;
    const maxOffsetX = Math.max(
      0,
      scaledWidth - wallpaperContainer.offsetWidth
    );
    const offsetX = focalPoint.x / 100 * maxOffsetX;
    const scaledHeight = imageSize.height * zoom;
    const maxOffsetY = Math.max(
      0,
      scaledHeight - wallpaperContainer.offsetHeight
    );
    const offsetY = focalPoint.y / 100 * maxOffsetY;
    return { offsetX, offsetY };
  }
  function calculatePanAndZoomTransform(focalPoint, zoom) {
    if (!wallpaperContainer) return;
    const { imageSize } = calculateImageSizeToFit(
      wallpaper.naturalWidth,
      wallpaper.naturalHeight,
      wallpaperContainer.offsetWidth,
      wallpaperContainer.offsetHeight
    );
    const offsets = calculateOffsets(imageSize, focalPoint, zoom);
    const transform = offsets ? `translate(${-offsets.offsetX}px, ${-offsets.offsetY}px) scale(${zoom})` : "";
    return { imageSize, transform };
  }
  function calculatePanAndZoomTransforms(fromFocalPoint, toFocalPoint, fromScale, toScale) {
    const from = calculatePanAndZoomTransform(fromFocalPoint, fromScale);
    const to = calculatePanAndZoomTransform(toFocalPoint, toScale);
    return { from, to };
  }
  function updatePanAndZoom(imageSize, transform) {
    wallpaper.style.width = imageSize.width + "px";
    wallpaper.style.height = imageSize.height + "px";
    wallpaper.style.transform = transform;
  }
  function startPanAndZoomAnimation(fromTransform, toTransform, timingFunction2, duration2, elapsedTime) {
    if (panAndZoomState.animation) panAndZoomState.animation.cancel();
    const animation = wallpaper.animate(
      [{ transform: fromTransform }, { transform: toTransform }],
      {
        duration: duration2,
        easing: timingFunction2,
        fill: "forwards"
      }
    );
    animation.currentTime = elapsedTime;
    return animation;
  }
  function handleAnimationFinish(toImageSize, toTransform) {
    panAndZoomState.animation = null;
    panAndZoomState.startTime = null;
    panAndZoomState.duration = null;
    updatePanAndZoom(toImageSize, toTransform);
  }
  function panAndZoom(fromFocalPoint, toFocalPoint, fromScale, toScale, timingFunction2, duration2, progress = 0) {
    const { from, to } = calculatePanAndZoomTransforms(
      fromFocalPoint,
      toFocalPoint,
      fromScale,
      toScale
    );
    if (!from || !to) return;
    updatePanAndZoom(from.imageSize, from.transform);
    const elapsedTime = progress * duration2;
    panAndZoomState.animation = startPanAndZoomAnimation(
      from.transform,
      to.transform,
      timingFunction2,
      duration2,
      elapsedTime
    );
    panAndZoomState.startTime = performance.now() - elapsedTime;
    panAndZoomState.duration = duration2;
    panAndZoomState.animation.onfinish = () => {
      handleAnimationFinish(to.imageSize, to.transform);
    };
  }
  function calculateAnimationProgress() {
    if (panAndZoomState.animation && panAndZoomState.startTime !== null && panAndZoomState.duration !== null) {
      return (performance.now() - panAndZoomState.startTime) / panAndZoomState.duration;
    }
    return 1;
  }
  function recalculatePanAndZoom() {
    panAndZoom(
      startFrom,
      panTo,
      zoomFrom,
      zoomTo,
      timingFunction,
      panAndZoomState.duration ?? duration,
      calculateAnimationProgress()
    );
  }
  function addEventListeners() {
    window.addEventListener("resize", () => {
      recalculatePanAndZoom();
    });
    bindClickEvent("#wallpaper", () => dispatchNttEvent("click"));
  }
  function startPanAndZoom() {
    panAndZoom(startFrom, panTo, zoomFrom, zoomTo, timingFunction, duration);
  }
  addEventListeners();
  if (wallpaper.complete) {
    startPanAndZoom();
  } else {
    wallpaper.addEventListener("load", startPanAndZoom, { once: true });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_LANGUAGE_CODE = "en";
  function getLanguageCode() {
    return navigator.language.split("-")[0];
  }
  function getTranslation(languageCode, translations2) {
    return translations2[languageCode] || translations2[DEFAULT_LANGUAGE_CODE] || {};
  }
  function applyLocalizationTo(elementId, localizedText) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`${elementId} not found, using default text.`);
      return;
    }
    element.textContent = localizedText;
  }
  function applyLocalization(translations2) {
    const languageCode = getLanguageCode();
    const translation = getTranslation(languageCode, translations2);
    if (!Object.keys(translation).length) {
      console.warn("No translations found, using default text.");
      return;
    }
    for (const [elementId, localizedText] of Object.entries(translation)) {
      applyLocalizationTo(elementId, localizedText);
    }
  }
  const translations = {
    en: {
      headline: "Switch to Brave Search",
      subheadline: "More private. Better answers. No bias.",
      button: "Help me switch"
    },
    fr: {
      headline: "Passez à la recherche Brave",
      subheadline: "Privée par défaut. Pertinente par nature. Impartiale, toujours.",
      button: "Essayer la recherche Brave"
    },
    de: {
      headline: "Wechsle zu Brave Search",
      subheadline: "Mehr Privatsphäre. Klarere Ergebnisse. Unabhängig.",
      button: "Jetzt wechseln"
    }
  };
  applyLocalization(translations);
  initPanAndZoom();
  bindClickEvents([".logo", ".button"], () => dispatchNttEvent("click"));
});
