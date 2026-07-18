"use strict";

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const photoViewer = document.querySelector("#menu-photo-viewer");
const viewerContinue = document.querySelector("#viewer-continue");
const viewerCover = document.querySelector("#viewer-cover");
const pageNames = ["Portada", "Menú oficial", "Agradecimiento"];
const viewerSurfaces = [
  document.querySelector("#surface-cover"),
  document.querySelector("#surface-menu"),
  document.querySelector("#surface-thanks"),
];

const NORMAL_SCALE_LIMIT = 1.02;
const CONTROL_RESTORE_DELAY = 320;
const IDLE_RECOVERY_DELAY = 2000;
const DOUBLE_TAP_DELAY = 320;
const MOBILE_CONTROLS_ONLY =
  window.matchMedia("(pointer: coarse)").matches ||
  navigator.maxTouchPoints > 0;

let pageFlip = null;
let pageFlipInputSuspended = false;
let panzoomGestureActive = false;
let previousControl = null;
let nextControl = null;
let viewerActive = false;
let currentPageIndex = 0;
let panzoom = null;
let activeSurface = null;
let activeSurfaceParent = null;
let viewerScale = 1;
let viewerPosition = { x: 0, y: 0 };
let activePointers = new Set();
let controlsRestoreTimer = null;
let idleRecoveryTimer = null;
let viewportResetTimer = null;
let lastTap = { time: 0, surface: null };
let suppressDoubleClickUntil = 0;
let lastInteractionAt = Date.now();
let activeWheelHandler = null;

function isZoomActive() {
  return viewerScale > NORMAL_SCALE_LIMIT;
}

function setAppHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

function suspendPageFlipInput() {
  if (!pageFlip || pageFlipInputSuspended) return;
  pageFlip.getUI()?.removeHandlers();
  pageFlipInputSuspended = true;
}

function resumePageFlipInput() {
  if (MOBILE_CONTROLS_ONLY) {
    suspendPageFlipInput();
    return;
  }
  if (!pageFlip || !pageFlipInputSuspended) return;
  pageFlip.getUI()?.setHandlers();
  pageFlipInputSuspended = false;
}

function setNavigationLocked(locked) {
  document.body.classList.toggle("is-zoomed", locked);
  book.setAttribute("aria-disabled", String(locked || viewerActive));
  if (locked) suspendPageFlipInput();
  else resumePageFlipInput();
}

function showControlsAtNormalScale() {
  if (isZoomActive() || panzoomGestureActive || activePointers.size > 0) return;
  setNavigationLocked(false);
}

function scheduleControlsRestore() {
  window.clearTimeout(controlsRestoreTimer);
  controlsRestoreTimer = window.setTimeout(() => {
    if (
      !isZoomActive() &&
      !panzoomGestureActive &&
      activePointers.size === 0
    ) {
      showControlsAtNormalScale();
    }
  }, CONTROL_RESTORE_DELAY);
}

function syncScaleState(scale) {
  viewerScale = Number.isFinite(scale) ? scale : 1;
  document.body.dataset.viewerScale = viewerScale.toFixed(3);

  if (isZoomActive() || panzoomGestureActive || activePointers.size > 1) {
    window.clearTimeout(controlsRestoreTimer);
    setNavigationLocked(true);
    return;
  }

  scheduleControlsRestore();
}

/**
 * Única ruta de recuperación para las tres vistas.
 * Restablece el mismo motor, su escala, traslación, gestos y navegación.
 */
function resetViewerState({ animate = false } = {}) {
  window.clearTimeout(controlsRestoreTimer);
  window.clearTimeout(idleRecoveryTimer);
  activePointers.clear();
  panzoomGestureActive = false;
  lastTap = { time: 0, surface: null };

  if (panzoom) {
    panzoom.reset({ animate });
  }

  viewerScale = 1;
  viewerPosition = { x: 0, y: 0 };
  setNavigationLocked(false);
  setAppHeight();
  scheduleControlsRestore();
}

function registerIdleRecovery() {
  window.clearTimeout(idleRecoveryTimer);
  idleRecoveryTimer = window.setTimeout(() => {
    const idleFor = Date.now() - lastInteractionAt;
    if (idleFor >= IDLE_RECOVERY_DELAY && viewerScale <= NORMAL_SCALE_LIMIT) {
      resetViewerState({ animate: false });
    }
  }, IDLE_RECOVERY_DELAY + 80);
}

function noteInteraction() {
  lastInteractionAt = Date.now();
  registerIdleRecovery();
}

function handlePanzoomChange(event) {
  viewerPosition = {
    x: Number(event.detail?.x) || 0,
    y: Number(event.detail?.y) || 0,
  };
  syncScaleState(Number(event.detail?.scale) || 1);
  noteInteraction();
}

function handlePanzoomStart() {
  panzoomGestureActive = true;
  setNavigationLocked(true);
  noteInteraction();
}

function handlePanzoomEnd() {
  panzoomGestureActive = false;
  noteInteraction();
  if (!isZoomActive()) scheduleControlsRestore();
}

function removeActiveViewerListeners() {
  if (!activeSurface) return;
  activeSurface.removeEventListener("panzoomchange", handlePanzoomChange);
  activeSurface.removeEventListener("panzoomstart", handlePanzoomStart);
  activeSurface.removeEventListener("panzoomend", handlePanzoomEnd);
  if (activeSurfaceParent && activeWheelHandler) {
    activeSurfaceParent.removeEventListener("wheel", activeWheelHandler);
  }
  activeWheelHandler = null;
}

function toggleViewerZoom(event) {
  if (!panzoom) return;

  if (isZoomActive()) {
    resetViewerState({ animate: true });
    return;
  }

  panzoom.zoom(2, { animate: true });
}

function activateViewerEngine(pageIndex) {
  const surface = viewerSurfaces[pageIndex];
  if (!surface || typeof window.Panzoom !== "function") {
    throw new Error("El visor Panzoom no está disponible.");
  }

  resetViewerState({ animate: false });
  removeActiveViewerListeners();
  panzoom?.destroy();

  activeSurface = surface;
  activeSurfaceParent = surface.parentElement;
  document.body.dataset.viewerEnginePage = String(pageIndex);
  panzoom = window.Panzoom(surface, {
    startScale: 1,
    minScale: 1,
    maxScale: 5,
    step: 0.35,
    canvas: false,
    disablePan: false,
    disableZoom: false,
    pinchAndPan: true,
    panOnlyWhenZoomed: true,
    animate: false,
    duration: 220,
    easing: "ease-out",
    cursor: "default",
  });

  activeSurface.addEventListener("panzoomchange", handlePanzoomChange);
  activeSurface.addEventListener("panzoomstart", handlePanzoomStart);
  activeSurface.addEventListener("panzoomend", handlePanzoomEnd);

  activeSurfaceParent.style.touchAction = "none";
  activeWheelHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    panzoomGestureActive = true;
    setNavigationLocked(true);
    panzoom.zoomWithWheel(event);
    window.clearTimeout(controlsRestoreTimer);
    controlsRestoreTimer = window.setTimeout(() => {
      panzoomGestureActive = false;
      if (!isZoomActive()) scheduleControlsRestore();
    }, CONTROL_RESTORE_DELAY);
  };
  activeSurfaceParent.addEventListener("wheel", activeWheelHandler, {
    passive: false,
  });
  resetViewerState({ animate: false });
  window.__weddingViewer = {
    get instance() {
      return panzoom;
    },
    get page() {
      return currentPageIndex;
    },
    get scale() {
      return viewerScale;
    },
    get position() {
      return { ...viewerPosition };
    },
    resetViewerState,
  };
}

function initializeSurfaceGestures() {
  viewerSurfaces.forEach((surface) => {
    surface.addEventListener(
      "pointerdown",
      (event) => {
        if (surface !== activeSurface) return;
        activePointers.add(event.pointerId);
        noteInteraction();
        if (activePointers.size > 1) {
          panzoomGestureActive = true;
          setNavigationLocked(true);
          event.preventDefault();
          event.stopPropagation();
        }
      },
      { capture: true }
    );

    surface.addEventListener(
      "pointermove",
      (event) => {
        if (surface !== activeSurface) return;
        noteInteraction();
      },
      { capture: true }
    );

    surface.addEventListener(
      "pointerup",
      (event) => {
        if (surface !== activeSurface) return;
        activePointers.delete(event.pointerId);
        noteInteraction();

        if (event.pointerType === "touch") {
          const now = Date.now();
          if (
            lastTap.surface === surface &&
            now - lastTap.time <= DOUBLE_TAP_DELAY
          ) {
            event.preventDefault();
            event.stopPropagation();
            lastTap = { time: 0, surface: null };
            suppressDoubleClickUntil = now + 500;
            toggleViewerZoom(event);
          } else {
            lastTap = { time: now, surface };
          }
        }

        if (activePointers.size === 0) {
          panzoomGestureActive = false;
          if (!isZoomActive()) scheduleControlsRestore();
        }
      },
      { capture: true }
    );

    surface.addEventListener(
      "touchstart",
      (event) => {
        if (surface !== activeSurface || event.touches.length < 2) return;
        panzoomGestureActive = true;
        setNavigationLocked(true);
        event.preventDefault();
        event.stopPropagation();
      },
      { capture: true, passive: false }
    );

    surface.addEventListener(
      "touchmove",
      (event) => {
        if (surface !== activeSurface) return;
        noteInteraction();
      },
      { capture: true, passive: false }
    );

    ["gesturestart", "gesturechange"].forEach((eventName) => {
      surface.addEventListener(
        eventName,
        (event) => {
          if (surface !== activeSurface) return;
          panzoomGestureActive = true;
          setNavigationLocked(true);
          event.preventDefault();
          event.stopPropagation();
        },
        { capture: true, passive: false }
      );
    });

    surface.addEventListener(
      "gestureend",
      (event) => {
        if (surface !== activeSurface) return;
        event.preventDefault();
        event.stopPropagation();
        panzoomGestureActive = false;
        if (!isZoomActive()) scheduleControlsRestore();
      },
      { capture: true, passive: false }
    );

    surface.addEventListener(
      "pointercancel",
      (event) => {
        if (surface !== activeSurface) return;
        event.stopPropagation();
        activePointers.delete(event.pointerId);
        panzoomGestureActive = false;
        noteInteraction();
        if (isZoomActive()) {
          setNavigationLocked(true);
        } else {
          scheduleControlsRestore();
        }
      },
      { capture: true }
    );

    surface.addEventListener("dblclick", (event) => {
      if (surface !== activeSurface) return;
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() < suppressDoubleClickUntil) return;
      toggleViewerZoom(event);
    });
  });
}

function setViewerActive(active) {
  viewerActive = active;
  document.body.classList.toggle("viewer-active", active);
  photoViewer.hidden = !active;
  photoViewer.setAttribute("aria-hidden", String(!active));
  book.setAttribute("aria-hidden", String(active));
  book.setAttribute("aria-disabled", String(active || isZoomActive()));

  if (active) {
    window.setTimeout(() => viewerContinue.focus({ preventScroll: true }), 60);
  }
}

function preparePages() {
  pages.forEach((page) => {
    page.classList.remove(
      "is-active",
      "is-previous",
      "is-next",
      "is-turning",
      "is-turning-forward",
      "is-turning-backward"
    );
    page.removeAttribute("inert");
    page.setAttribute("aria-hidden", "false");
    page.dataset.density = "soft";
  });
}

function updatePageStatus(pageIndex) {
  const safeIndex = Math.max(
    0,
    Math.min(pageNames.length - 1, Number(pageIndex) || 0)
  );

  currentPageIndex = safeIndex;
  pageStatus.textContent = pageNames[safeIndex];
  book.dataset.currentPage = String(safeIndex);
  document.body.dataset.currentPage = String(safeIndex);

  if (previousControl) {
    previousControl.hidden = safeIndex === 0 || safeIndex === 1;
    previousControl.querySelector("span").textContent =
      safeIndex === 2 ? "Regresar" : "Portada";
  }

  if (nextControl) {
    nextControl.hidden = safeIndex !== 0;
    nextControl.querySelector("span").textContent =
      safeIndex === 0 ? "Ver menú" : "Continuar";
  }

  setViewerActive(safeIndex === 1);
  window.requestAnimationFrame(() => activateViewerEngine(safeIndex));
}

function initializeControls() {
  nextControl = document.createElement("button");
  nextControl.className = "book-control book-control--next";
  nextControl.type = "button";
  nextControl.setAttribute("aria-label", "Pasar a la página siguiente");
  nextControl.innerHTML = '<span>Ver menú</span><i aria-hidden="true">→</i>';
  nextControl.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip || isZoomActive()) return;
    resetViewerState({ animate: false });
    pageFlip.flipNext("bottom");
  });
  document.body.append(nextControl);

  previousControl = document.createElement("button");
  previousControl.className = "book-control book-control--previous";
  previousControl.type = "button";
  previousControl.hidden = true;
  previousControl.setAttribute("aria-label", "Regresar a la página anterior");
  previousControl.innerHTML = '<i aria-hidden="true">←</i><span>Portada</span>';
  previousControl.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip || isZoomActive()) return;
    resetViewerState({ animate: false });
    pageFlip.turnToPrevPage();
  });
  document.body.append(previousControl);

  viewerContinue.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip || isZoomActive()) return;
    resetViewerState({ animate: false });
    setViewerActive(false);
    window.requestAnimationFrame(() => pageFlip.flipNext("bottom"));
  });

  viewerCover.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip || isZoomActive()) return;

    resetViewerState({ animate: false });
    document.body.classList.add("viewer-returning");
    window.setTimeout(() => {
      document.body.classList.remove("viewer-returning");
      setViewerActive(false);
      pageFlip.turnToPrevPage();
    }, 380);
  });

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (!pageFlip || isZoomActive()) return;
    resetViewerState({ animate: false });
    pageFlip.flip(1, "bottom");
  });
}

function initializePageFlip() {
  if (!window.St?.PageFlip) {
    document.documentElement.classList.add("pageflip-unavailable");
    throw new Error("StPageFlip no está disponible.");
  }

  preparePages();

  pageFlip = new window.St.PageFlip(book, {
    width: 390,
    height: 844,
    size: "stretch",
    minWidth: 280,
    maxWidth: 520,
    minHeight: 605,
    maxHeight: 1125,
    startPage: 0,
    drawShadow: true,
    flippingTime: 1100,
    usePortrait: true,
    startZIndex: 10,
    autoSize: true,
    maxShadowOpacity: 0.34,
    showCover: false,
    mobileScrollSupport: true,
    swipeDistance: 70,
    clickEventForward: true,
    useMouseEvents: !MOBILE_CONTROLS_ONLY,
    showPageCorners: true,
    disableFlipByClick: true,
  });

  pageFlip.on("init", (event) => updatePageStatus(event.data.page));
  pageFlip.on("flip", (event) => updatePageStatus(event.data));
  pageFlip.loadFromHTML(pages);
  window.__weddingPageFlip = pageFlip;
  document.body.dataset.mobilePageFlip = MOBILE_CONTROLS_ONLY
    ? "controls-only"
    : "free-swipe";

  initializeControls();
  initializeSurfaceGestures();
  updatePageStatus(0);
}

function handleViewportResize() {
  if (isZoomActive() || panzoomGestureActive || activePointers.size > 0) {
    return;
  }

  setAppHeight();
  window.clearTimeout(viewportResetTimer);
  viewportResetTimer = window.setTimeout(() => {
    resetViewerState({ animate: false });
  }, 120);
}

function handleOrientationChange() {
  setAppHeight();
  window.clearTimeout(viewportResetTimer);
  viewportResetTimer = window.setTimeout(() => {
    resetViewerState({ animate: false });
  }, 120);
}

setAppHeight();
window.addEventListener("orientationchange", handleOrientationChange, {
  passive: true,
});
window.addEventListener("resize", handleViewportResize, { passive: true });
window.visualViewport?.addEventListener("resize", handleViewportResize, {
  passive: true,
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !isZoomActive()) {
    setAppHeight();
    scheduleControlsRestore();
  }
});

initializePageFlip();
