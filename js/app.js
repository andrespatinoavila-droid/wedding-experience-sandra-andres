"use strict";

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const photoViewer = document.querySelector("#menu-photo-viewer");
const viewerContinue = document.querySelector("#viewer-continue");
const viewerCover = document.querySelector("#viewer-cover");
const pageNames = ["Portada", "Menú oficial", "Agradecimiento"];

let pageFlip = null;
let zoomGestureLocked = false;
let previousControl = null;
let nextControl = null;
let stableViewportHeight = window.innerHeight;
let viewerActive = false;
let activeTouchCount = 0;
let lastTouchInteraction = 0;
let zoomRestoreTimer = null;

const NORMAL_SCALE_LIMIT = 1.02;

function currentViewportScale() {
  return window.visualViewport?.scale || 1;
}

function isZoomActive() {
  return currentViewportScale() > NORMAL_SCALE_LIMIT;
}

function hideControlsForZoom() {
  window.clearTimeout(zoomRestoreTimer);
  if (!document.body.classList.contains("is-zoomed")) {
    lastTouchInteraction = Date.now();
  }
  document.body.classList.add("is-zoomed");
  book.setAttribute("aria-disabled", "true");
}

function restoreControlsAfterZoom() {
  if (isZoomActive() || activeTouchCount > 0) return;
  document.body.classList.remove("is-zoomed");
  zoomGestureLocked = false;
  book.setAttribute("aria-disabled", String(viewerActive));
}

function scheduleZoomRecovery(delay = 250) {
  window.clearTimeout(zoomRestoreTimer);
  zoomRestoreTimer = window.setTimeout(restoreControlsAfterZoom, delay);
}

function syncViewportState() {
  const zoomActive = isZoomActive();
  if (zoomActive) {
    hideControlsForZoom();
  } else {
    scheduleZoomRecovery();
  }

  if (!zoomActive) {
    stableViewportHeight = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${stableViewportHeight}px`);
  }
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
  const safeIndex = Math.max(0, Math.min(pageNames.length - 1, Number(pageIndex) || 0));
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

  if (safeIndex === 1) setViewerActive(true);
  if (safeIndex !== 1 && viewerActive) setViewerActive(false);
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
    pageFlip.turnToPrevPage();
  });
  document.body.append(previousControl);

  viewerContinue.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip || isZoomActive()) return;
    setViewerActive(false);
    window.requestAnimationFrame(() => pageFlip.flipNext("bottom"));
  });

  viewerCover.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip || isZoomActive()) return;

    document.body.classList.add("viewer-returning");
    window.setTimeout(() => {
      document.body.classList.remove("viewer-returning");
      setViewerActive(false);
      pageFlip.turnToPrevPage();
    }, 380);
  });

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    pageFlip?.flip(1, "bottom");
  });
}

function initializeZoomGestureIsolation() {
  const shouldLockZoomGesture = (event) =>
    event.touches?.length > 1 || isZoomActive();

  document
    .querySelectorAll(".welcome, .thanks, #menu-viewer")
    .forEach((surface) => {
      surface.addEventListener(
        "touchstart",
        (event) => {
          activeTouchCount = event.touches.length;
          lastTouchInteraction = Date.now();
          if (shouldLockZoomGesture(event)) {
            zoomGestureLocked = true;
            hideControlsForZoom();
            event.stopPropagation();
          }
        },
        { capture: true, passive: true }
      );

      surface.addEventListener(
        "touchmove",
        (event) => {
          activeTouchCount = event.touches.length;
          lastTouchInteraction = Date.now();
          if (zoomGestureLocked || shouldLockZoomGesture(event)) {
            zoomGestureLocked = true;
            event.stopPropagation();
          }
        },
        { capture: true, passive: true }
      );

      surface.addEventListener(
        "touchend",
        (event) => {
          activeTouchCount = event.touches.length;
          lastTouchInteraction = Date.now();
          if (!zoomGestureLocked) return;
          event.stopPropagation();
          if (event.touches.length === 0) {
            scheduleZoomRecovery();
          }
        },
        { capture: true, passive: true }
      );

      surface.addEventListener(
        "touchcancel",
        (event) => {
          activeTouchCount = 0;
          lastTouchInteraction = Date.now();
          if (zoomGestureLocked) event.stopPropagation();
          scheduleZoomRecovery();
        },
        { capture: true, passive: true }
      );
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
    swipeDistance: 32,
    clickEventForward: true,
    useMouseEvents: true,
    showPageCorners: true,
    disableFlipByClick: true,
  });

  pageFlip.on("init", (event) => updatePageStatus(event.data.page));
  pageFlip.on("flip", (event) => updatePageStatus(event.data));
  pageFlip.loadFromHTML(pages);
  window.__weddingPageFlip = pageFlip;

  initializeControls();
  initializeZoomGestureIsolation();
  updatePageStatus(0);
}

syncViewportState();
window.addEventListener("resize", syncViewportState, { passive: true });
window.visualViewport?.addEventListener("resize", syncViewportState, { passive: true });
window.visualViewport?.addEventListener("scroll", syncViewportState, { passive: true });
window.setInterval(() => {
  const idleFor = Date.now() - lastTouchInteraction;
  if (
    document.body.classList.contains("is-zoomed") &&
    !isZoomActive() &&
    activeTouchCount === 0 &&
    idleFor >= 2000
  ) {
    restoreControlsAfterZoom();
  }
}, 500);
initializePageFlip();
