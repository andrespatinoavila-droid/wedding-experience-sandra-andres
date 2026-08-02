import PhotoSwipe from "../vendor/photoswipe/photoswipe.esm.min.js";
import {
  detectExperienceConfig,
} from "./experience-config.js?v=1.1.4";
import { renderMenuSurface } from "./menu-surface.js?v=component-001-foliage";

const EXPERIENCE_CONFIG = detectExperienceConfig();
document.documentElement.classList.add(EXPERIENCE_CONFIG.className);
document.documentElement.dataset.experienceProfile = EXPERIENCE_CONFIG.name;

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const menuControls = document.querySelector("#menu-photo-viewer");
const viewerContinue = document.querySelector("#viewer-continue");
const bookPageImages = [...document.querySelectorAll(".book-page__image")];
const nativeMenuSurface = document.querySelector("#native-menu-surface");
const menuTurnSurface = document.querySelector("#menu-turn-surface");

renderMenuSurface(nativeMenuSurface, {
  interactive: true,
  titleId: "native-menu-title",
});
renderMenuSurface(menuTurnSurface, {
  interactive: false,
  titleId: "turn-menu-title",
});

const pageNames = ["Menú oficial", "Agradecimiento"];
const pageImages = [
  null,
  {
    src: "img/pages/agradecimiento.png",
    width: 1170,
    height: 2532,
    alt: "Agradecimiento de Sandra Bonilla y Andrés Patiño",
  },
];

const NORMAL_ZOOM_TOLERANCE = 1.02;
const MENU_GEOMETRY_TOLERANCE = 0.5;
const MENU_GEOMETRY_SELECTORS = [
  ".menu-sheet",
  ".menu-header",
  ".badge",
  ".menu-sections",
  ".section-heading",
  ".dish-grid",
  ".dish-card",
  ".dish-icon",
  ".dish-photo",
  ".dish-photo img",
  ".dish-copy",
  ".dish-copy h3",
  ".dish-copy p",
  ".menu-footer",
];

let pageFlip = null;
let pageFlipInputSuspended = false;
let photoSwipe = null;
let previousControl = null;
let transitionInProgress = false;
let bookImagesReady = false;
let pendingPageIndex = null;
let pageActivationFrame = null;
let deferredViewportSync = false;
let activeTouchCount = 0;
let nativeGesturePending = false;
let nativeZoomReleaseFrame = null;
let menuScrollY = 0;

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

async function decodeBookImage(image) {
  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
  }

  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      // Safari puede resolver load y rechazar decode aunque la imagen sea válida.
    }
  }

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error(`No fue posible precargar ${image.currentSrc || image.src}`);
  }
}

async function preloadBookImages() {
  const menuImages = [
    ...nativeMenuSurface.querySelectorAll("img"),
    ...menuTurnSurface.querySelectorAll("img"),
  ];

  await Promise.all([...bookPageImages, ...menuImages].map(decodeBookImage));
  await document.fonts?.ready;
  bookImagesReady = true;
  document.documentElement.classList.add("book-images-ready");
}

async function waitForCurrentMenuResources() {
  const currentImages = [
    ...nativeMenuSurface.querySelectorAll("img"),
    ...menuTurnSurface.querySelectorAll("img"),
  ];

  await Promise.all(currentImages.map(decodeBookImage));
  await document.fonts?.ready;
}

async function prepareMenuTurnGeometry() {
  const visibleRect = nativeMenuSurface.getBoundingClientRect();
  book.style.setProperty("--menu-sync-width", `${visibleRect.width}px`);
  pageFlip.update();
  await waitForNextPaint();
}

function setAppHeight(options = {}) {
  const force = options?.force === true;

  if (!force && isNativeZoomed()) return;

  if (transitionInProgress && !force) {
    deferredViewportSync = true;
    return;
  }

  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  deferredViewportSync = false;
}

function suspendPageFlipInput() {
  if (!pageFlip || pageFlipInputSuspended) return;
  pageFlip.getUI()?.removeHandlers();
  pageFlipInputSuspended = true;
}

function resumePageFlipInput() {
  if (EXPERIENCE_CONFIG.controlsOnly) {
    suspendPageFlipInput();
    return;
  }

  if (!pageFlip || !pageFlipInputSuspended) return;
  pageFlip.getUI()?.setHandlers();
  pageFlipInputSuspended = false;
}

function isViewerZoomed() {
  const slide = photoSwipe?.currSlide;
  if (!slide) return false;
  return slide.currZoomLevel > slide.zoomLevels.initial * NORMAL_ZOOM_TOLERANCE;
}

function getNativeScale() {
  return Number(window.visualViewport?.scale) || 1;
}

function isNativeZoomed() {
  return getNativeScale() > NORMAL_ZOOM_TOLERANCE;
}

function isAnyZoomed() {
  return isViewerZoomed() || isNativeZoomed() || nativeGesturePending;
}

function setNativeZoomActive(active) {
  document.body.classList.toggle("native-zoom-active", active);
  document.body.classList.toggle("is-zoomed", active || isViewerZoomed());
  book.setAttribute("aria-disabled", String(active || transitionInProgress));

  if (active) suspendPageFlipInput();
  else resumePageFlipInput();
}

function cancelNativeZoomRelease() {
  if (nativeZoomReleaseFrame === null) return;
  window.cancelAnimationFrame(nativeZoomReleaseFrame);
  nativeZoomReleaseFrame = null;
}

function scheduleNativeZoomRelease() {
  cancelNativeZoomRelease();
  nativeZoomReleaseFrame = window.requestAnimationFrame(() => {
    nativeZoomReleaseFrame = window.requestAnimationFrame(() => {
      nativeZoomReleaseFrame = null;
      if (activeTouchCount > 0 || isNativeZoomed()) return;

      nativeGesturePending = false;
      setNativeZoomActive(false);
      setAppHeight({ force: true });
    });
  });
}

function syncNativeZoomState() {
  if (
    isNativeZoomed() ||
    activeTouchCount >= 2 ||
    (nativeGesturePending && activeTouchCount > 0)
  ) {
    cancelNativeZoomRelease();
    setNativeZoomActive(true);
    return;
  }

  scheduleNativeZoomRelease();
}

function syncZoomState() {
  const zoomed = isAnyZoomed();
  document.body.classList.toggle("is-zoomed", zoomed);
  book.setAttribute("aria-disabled", String(zoomed || transitionInProgress));

  if (zoomed) suspendPageFlipInput();
  else resumePageFlipInput();
}

function configurePhotoSwipe(pageIndex) {
  if (!pageImages[pageIndex]) return null;

  const viewer = new PhotoSwipe({
    dataSource: [pageImages[pageIndex]],
    index: 0,
    ...EXPERIENCE_CONFIG.photoSwipe,
  });

  viewer.on("uiRegister", () => {
    viewer.ui.uiElementsData = [];
  });
  viewer.on("zoomPanUpdate", syncZoomState);
  viewer.on("change", syncZoomState);
  viewer.on("destroy", () => {
    if (photoSwipe !== viewer) return;

    photoSwipe = null;
    if (transitionInProgress) return;

    document.body.classList.remove(
      "is-zoomed",
      "viewer-active",
      "menu-viewer-active"
    );
    book.setAttribute("aria-hidden", "false");
    book.setAttribute("aria-disabled", "false");
    updateControls(Number(document.body.dataset.currentPage) || 0);
    resumePageFlipInput();
  });

  return viewer;
}

function openPhotoViewer(pageIndex) {
  destroyPhotoViewer();
  document.body.dataset.currentPage = String(pageIndex);
  document.body.classList.add("viewer-active");
  document.body.classList.remove("menu-transition-active");
  document.body.classList.toggle("menu-viewer-active", pageIndex === 0);
  book.setAttribute("aria-hidden", "true");
  menuControls.hidden = pageIndex !== 0;
  menuControls.setAttribute("aria-hidden", String(pageIndex !== 0));

  photoSwipe = configurePhotoSwipe(pageIndex);
  photoSwipe.init();
  syncZoomState();
  document.documentElement.classList.add("app-ready");
}

function openHtmlMenu() {
  destroyPhotoViewer();
  document.body.dataset.currentPage = "0";
  document.body.classList.add("html-menu-active");
  document.body.classList.remove("menu-transition-active");
  document.documentElement.classList.add("html-menu-active");
  book.setAttribute("aria-hidden", "false");
  menuControls.hidden = false;
  menuControls.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("app-ready");
  window.scrollTo(0, menuScrollY);
  syncZoomState();
}

function destroyPhotoViewer() {
  document.body.classList.remove(
    "is-zoomed",
    "viewer-active",
    "menu-viewer-active",
    "html-menu-active",
    "native-zoom-active"
  );
  document.documentElement.classList.remove("html-menu-active");
  book.setAttribute("aria-hidden", "false");
  book.setAttribute("aria-disabled", String(transitionInProgress));

  if (photoSwipe) {
    const viewer = photoSwipe;
    photoSwipe = null;
    viewer.destroy();
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

function updateControls(pageIndex) {
  if (previousControl) {
    previousControl.hidden = pageIndex !== 1;
    previousControl.querySelector("span").textContent = "Regresar";
  }

  menuControls.hidden = pageIndex !== 0;
  menuControls.setAttribute("aria-hidden", String(pageIndex !== 0));
}

function updatePageStatus(pageIndex) {
  const safeIndex = Math.max(
    0,
    Math.min(pageNames.length - 1, Number(pageIndex) || 0)
  );

  transitionInProgress = false;
  if (deferredViewportSync) {
    setAppHeight({ force: true });
    pageFlip?.update();
  }
  pageStatus.textContent = pageNames[safeIndex];
  book.dataset.currentPage = String(safeIndex);
  document.body.dataset.currentPage = String(safeIndex);
  updateControls(safeIndex);
  if (safeIndex === 0) openHtmlMenu();
  else openPhotoViewer(safeIndex);
}

function schedulePageActivation(pageIndex) {
  pendingPageIndex = pageIndex;

  if (pageActivationFrame !== null) {
    window.cancelAnimationFrame(pageActivationFrame);
  }

  pageActivationFrame = window.requestAnimationFrame(() => {
    pageActivationFrame = window.requestAnimationFrame(() => {
      const pageToActivate = pendingPageIndex;
      pendingPageIndex = null;
      pageActivationFrame = null;
      updatePageStatus(pageToActivate);
    });
  });
}

function syncMenuRepresentations() {
  menuScrollY = Math.max(0, window.scrollY || 0);
  menuTurnSurface.style.setProperty("--menu-turn-offset", `${-menuScrollY}px`);

  const visibleRect = nativeMenuSurface.getBoundingClientRect();
  const initialTurnRect = menuTurnSurface.getBoundingClientRect();
  const pageTopCorrection = initialTurnRect.top - visibleRect.top;
  menuTurnSurface.style.setProperty(
    "--menu-turn-offset",
    `${-menuScrollY - pageTopCorrection}px`
  );

  const bookRect = book.getBoundingClientRect();
  const turnRect = menuTurnSurface.getBoundingClientRect();
  const comparisons = [];
  let maxDelta = 0;
  let structureMatches = true;

  MENU_GEOMETRY_SELECTORS.forEach((selector) => {
    const visibleElements = [...nativeMenuSurface.querySelectorAll(selector)];
    const turnElements = [...menuTurnSurface.querySelectorAll(selector)];

    if (visibleElements.length !== turnElements.length) {
      structureMatches = false;
      comparisons.push({
        selector,
        visibleCount: visibleElements.length,
        turnCount: turnElements.length,
      });
      return;
    }

    visibleElements.forEach((visibleElement, index) => {
      const turnElement = turnElements[index];
      const visibleElementRect = visibleElement.getBoundingClientRect();
      const turnElementRect = turnElement.getBoundingClientRect();
      const deltas = {
        left: Math.abs(visibleElementRect.left - turnElementRect.left),
        top: Math.abs(visibleElementRect.top - turnElementRect.top),
        width: Math.abs(visibleElementRect.width - turnElementRect.width),
        height: Math.abs(visibleElementRect.height - turnElementRect.height),
      };
      const elementMaxDelta = Math.max(...Object.values(deltas));
      maxDelta = Math.max(maxDelta, elementMaxDelta);

      if (elementMaxDelta > MENU_GEOMETRY_TOLERANCE) {
        comparisons.push({ selector, index, deltas });
      }
    });
  });

  const geometry = {
    visible: visibleRect.toJSON(),
    book: bookRect.toJSON(),
    turn: turnRect.toJSON(),
    widthDelta: Math.abs(visibleRect.width - bookRect.width),
    leftDelta: Math.abs(visibleRect.left - bookRect.left),
    topDelta: Math.abs(visibleRect.top - turnRect.top),
    maxDelta,
    structureMatches,
    mismatches: comparisons,
  };

  window.__weddingMenuGeometry = geometry;
  if (new URLSearchParams(window.location.search).has("debug")) {
    document.documentElement.dataset.menuGeometry = JSON.stringify({
      widthDelta: geometry.widthDelta,
      leftDelta: geometry.leftDelta,
      topDelta: geometry.topDelta,
      maxDelta: geometry.maxDelta,
      structureMatches: geometry.structureMatches,
      mismatchCount: geometry.mismatches.length,
      mismatches: geometry.mismatches.slice(0, 12),
      visible: geometry.visible,
      book: geometry.book,
      turn: geometry.turn,
    });
  }
  return (
    geometry.widthDelta <= MENU_GEOMETRY_TOLERANCE &&
    geometry.leftDelta <= MENU_GEOMETRY_TOLERANCE &&
    geometry.topDelta <= MENU_GEOMETRY_TOLERANCE &&
    geometry.structureMatches &&
    geometry.maxDelta <= MENU_GEOMETRY_TOLERANCE
  );
}

async function beginPageTransition(action) {
  if (
    !pageFlip ||
    !bookImagesReady ||
    transitionInProgress ||
    isAnyZoomed() ||
    activeTouchCount > 0 ||
    getNativeScale() > NORMAL_ZOOM_TOLERANCE
  ) {
    return;
  }

  transitionInProgress = true;
  book.setAttribute("aria-disabled", "true");
  if (EXPERIENCE_CONFIG.controlsOnly) suspendPageFlipInput();

  document.body.classList.add("menu-book-preparing");
  await waitForCurrentMenuResources();
  await prepareMenuTurnGeometry();

  if (!syncMenuRepresentations()) {
    console.error("Las representaciones del menú no están sincronizadas.");
    document.body.classList.remove("menu-book-preparing");
    transitionInProgress = false;
    book.setAttribute("aria-disabled", "false");
    resumePageFlipInput();
    return;
  }

  const execute = () => {
    document.body.classList.remove("menu-book-preparing");
    document.body.classList.add("menu-transition-active");
    destroyPhotoViewer();
    menuControls.hidden = true;
    action();
  };

  execute();
}

function flipFromBottom(direction) {
  const bounds = pageFlip.getBoundsRect();
  const isForward = direction === "forward";

  pageFlip.getFlipController().flip({
    x: isForward
      ? bounds.left + 2 * bounds.pageWidth - 10
      : bounds.left + 10,
    y: bounds.height - 2,
  });
}

function createTemporaryThanksPage() {
  const page = document.createElement("section");
  const image = document.createElement("img");
  const asset = pageImages[1];

  page.className = "reverse-page";
  image.src = asset.src;
  image.alt = "";
  image.width = asset.width;
  image.height = asset.height;
  image.draggable = false;
  page.append(image);

  return {
    page,
    ready: decodeBookImage(image),
  };
}

function createTemporaryMenuPage() {
  const page = document.createElement("section");
  const viewport = document.createElement("div");
  const menuClone = document.createElement("div");

  page.className = "reverse-page";
  viewport.className = "reverse-page__menu";
  viewport.setAttribute("aria-hidden", "true");
  menuClone.className = menuTurnSurface.className;
  menuClone.dataset.interactive = "false";
  menuClone.innerHTML = nativeMenuSurface.innerHTML;
  menuClone.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });
  viewport.append(menuClone);
  page.append(viewport);

  return {
    page,
    menuClone,
    ready: Promise.all(
      [...menuClone.querySelectorAll("img")].map(decodeBookImage)
    ),
  };
}

async function prepareReverseTurnGeometry() {
  await waitForCurrentMenuResources();
  const finalMenuRect = nativeMenuSurface.getBoundingClientRect();
  book.style.setProperty("--menu-sync-width", `${finalMenuRect.width}px`);
  pageFlip.update();
  await waitForNextPaint();
}

function alignReverseMenu(menuClone) {
  menuClone.style.setProperty("--menu-turn-offset", `${-menuScrollY}px`);
  const finalMenuRect = nativeMenuSurface.getBoundingClientRect();
  const initialCloneRect = menuClone.getBoundingClientRect();
  const topCorrection = initialCloneRect.top - finalMenuRect.top;
  menuClone.style.setProperty(
    "--menu-turn-offset",
    `${-menuScrollY - topCorrection}px`
  );
}

async function createApprovedReverseEngine() {
  const overlay = document.createElement("div");
  const mirror = document.createElement("div");
  const temporaryBook = document.createElement("div");
  const thanksPage = createTemporaryThanksPage();
  const menuPage = createTemporaryMenuPage();

  overlay.className = "reverse-engine";
  mirror.className = "reverse-engine__mirror";
  temporaryBook.className = "reverse-engine__book";
  temporaryBook.append(thanksPage.page, menuPage.page);
  mirror.append(temporaryBook);
  overlay.append(mirror);

  const bounds = book.getBoundingClientRect();
  Object.assign(overlay.style, {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  });
  document.body.append(overlay);
  await Promise.all([thanksPage.ready, menuPage.ready]);

  const temporaryFlip = new window.St.PageFlip(temporaryBook, {
    width: Math.min(EXPERIENCE_CONFIG.pageFlip.maxWidth, bounds.width),
    height: bounds.height,
    ...EXPERIENCE_CONFIG.pageFlip,
    startPage: 0,
    useMouseEvents: false,
    showPageCorners: false,
  });
  temporaryFlip.loadFromHTML([thanksPage.page, menuPage.page]);
  await waitForNextPaint();
  alignReverseMenu(menuPage.menuClone);
  await waitForNextPaint();

  return { overlay, temporaryFlip, menuClone: menuPage.menuClone };
}

async function runApprovedReverseTransition() {
  if (
    !pageFlip ||
    !bookImagesReady ||
    transitionInProgress ||
    isViewerZoomed() ||
    Number(document.body.dataset.currentPage) !== 1
  ) {
    return;
  }

  transitionInProgress = true;
  document.body.classList.add("is-reversing");
  book.setAttribute("aria-disabled", "true");
  if (EXPERIENCE_CONFIG.controlsOnly) suspendPageFlipInput();

  let reverseEngine = null;

  try {
    await prepareReverseTurnGeometry();
    reverseEngine = await createApprovedReverseEngine();
    destroyPhotoViewer();
    menuControls.hidden = true;
    pageFlip.turnToPrevPage();
    await waitForNextPaint();

    await new Promise((resolve) => {
      reverseEngine.temporaryFlip.on("flip", (event) => {
        if (Number(event.data) === 1) resolve();
      });
      reverseEngine.temporaryFlip.flipNext("bottom");
    });
  } finally {
    pendingPageIndex = null;
    document.documentElement.classList.add("html-menu-active");
    document.body.classList.add("html-menu-active");
    window.scrollTo(0, menuScrollY);
    await waitForCurrentMenuResources();
    await waitForNextPaint();
    await waitForNextPaint();
    reverseEngine?.temporaryFlip.destroy();
    reverseEngine?.overlay.remove();
    document.body.classList.remove("is-reversing");
    updatePageStatus(0);
  }
}

function initializeControls() {
  previousControl = document.createElement("button");
  previousControl.className = "book-control book-control--previous";
  previousControl.type = "button";
  previousControl.hidden = true;
  previousControl.setAttribute("aria-label", "Regresar a la página anterior");
  previousControl.innerHTML = '<i aria-hidden="true">←</i><span>Regresar</span>';
  previousControl.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    runApprovedReverseTransition();
  });
  document.body.append(previousControl);

  viewerContinue.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    beginPageTransition(() => flipFromBottom("forward"));
  });

}

function initializePageFlip() {
  if (!window.St?.PageFlip) {
    document.documentElement.classList.add("pageflip-unavailable");
    throw new Error("StPageFlip no está disponible.");
  }

  preparePages();
  const initialBookRect = book.getBoundingClientRect();
  const initialPageWidth = Math.min(
    EXPERIENCE_CONFIG.pageFlip.maxWidth,
    initialBookRect.width
  );

  pageFlip = new window.St.PageFlip(book, {
    width: initialPageWidth,
    height: initialBookRect.height,
    ...EXPERIENCE_CONFIG.pageFlip,
  });

  pageFlip.on("init", (event) => updatePageStatus(event.data.page));
  pageFlip.on("flip", (event) => {
    pendingPageIndex = event.data;

    if (pageFlip.getState() === "read") {
      schedulePageActivation(event.data);
    }
  });
  pageFlip.on("changeState", (event) => {
    if (event.data === "read" && pendingPageIndex !== null) {
      schedulePageActivation(pendingPageIndex);
    }
  });
  pageFlip.loadFromHTML(pages);
  window.__weddingPageFlip = pageFlip;
  document.body.dataset.experienceProfile = EXPERIENCE_CONFIG.name;
  document.body.dataset.mobilePageFlip = EXPERIENCE_CONFIG.controlsOnly
    ? "controls-only"
    : "free-swipe";

  initializeControls();
  if (EXPERIENCE_CONFIG.controlsOnly) suspendPageFlipInput();
}

setAppHeight();
window.addEventListener("orientationchange", setAppHeight, { passive: true });
window.addEventListener("resize", setAppHeight, { passive: true });
window.addEventListener("orientationchange", syncNativeZoomState, {
  passive: true,
});
window.addEventListener("resize", syncNativeZoomState, { passive: true });
window.visualViewport?.addEventListener("resize", setAppHeight, {
  passive: true,
});
window.visualViewport?.addEventListener("resize", syncNativeZoomState, {
  passive: true,
});
window.visualViewport?.addEventListener("scroll", syncNativeZoomState, {
  passive: true,
});

nativeMenuSurface.addEventListener(
  "touchstart",
  (event) => {
    activeTouchCount = event.touches.length;
    if (activeTouchCount < 2) return;

    nativeGesturePending = true;
    setNativeZoomActive(true);
    event.stopPropagation();
  },
  { capture: true, passive: true }
);

nativeMenuSurface.addEventListener(
  "touchmove",
  (event) => {
    activeTouchCount = event.touches.length;
    if (!nativeGesturePending && !isNativeZoomed()) return;

    setNativeZoomActive(true);
    event.stopPropagation();
  },
  { capture: true, passive: true }
);

const finishNativeTouch = (event) => {
  activeTouchCount = event.touches?.length || 0;
  syncNativeZoomState();
};

nativeMenuSurface.addEventListener("touchend", finishNativeTouch, {
  capture: true,
  passive: true,
});
nativeMenuSurface.addEventListener("touchcancel", finishNativeTouch, {
  capture: true,
  passive: true,
});
nativeMenuSurface.addEventListener(
  "gesturestart",
  (event) => {
    nativeGesturePending = true;
    setNativeZoomActive(true);
    event.stopPropagation();
  },
  { capture: true, passive: true }
);
nativeMenuSurface.addEventListener("gesturechange", syncNativeZoomState, {
  capture: true,
  passive: true,
});
nativeMenuSurface.addEventListener("gestureend", scheduleNativeZoomRelease, {
  capture: true,
  passive: true,
});

window.addEventListener(
  "scroll",
  () => {
    if (
      document.documentElement.classList.contains("html-menu-active") &&
      !isNativeZoomed()
    ) {
      menuScrollY = Math.max(0, window.scrollY || 0);
    }
  },
  { passive: true }
);

await preloadBookImages();
initializePageFlip();
