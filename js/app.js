import PhotoSwipe from "../vendor/photoswipe/photoswipe.esm.min.js";
import {
  detectExperienceConfig,
} from "./experience-config.js?v=1.0.0";

const EXPERIENCE_CONFIG = detectExperienceConfig();
document.documentElement.classList.add(EXPERIENCE_CONFIG.className);
document.documentElement.dataset.experienceProfile = EXPERIENCE_CONFIG.name;

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const menuControls = document.querySelector("#menu-photo-viewer");
const viewerContinue = document.querySelector("#viewer-continue");
const viewerCover = document.querySelector("#viewer-cover");
const skipLink = document.querySelector(".skip-link");
const bookPageImages = [...document.querySelectorAll(".book-page__image")];

const pageNames = ["Portada", "Menú oficial", "Agradecimiento"];
const pageImages = [
  {
    src: "img/pages/portada.png",
    width: 1170,
    height: 2532,
    alt: "Portada de la boda de Sandra Bonilla y Andrés Patiño",
  },
  {
    src: "img/menu/menu-oficial.png",
    width: 1024,
    height: 1536,
    alt: "Menú oficial de la boda de Sandra Bonilla y Andrés Patiño",
  },
  {
    src: "img/pages/agradecimiento.png",
    width: 1170,
    height: 2532,
    alt: "Agradecimiento de Sandra Bonilla y Andrés Patiño",
  },
];

const NORMAL_ZOOM_TOLERANCE = 1.02;

let pageFlip = null;
let pageFlipInputSuspended = false;
let photoSwipe = null;
let previousControl = null;
let nextControl = null;
let transitionInProgress = false;
let bookImagesReady = false;
let pendingPageIndex = null;
let pageActivationFrame = null;
let deferredViewportSync = false;

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
  await Promise.all(bookPageImages.map(decodeBookImage));
  bookImagesReady = true;
  document.documentElement.classList.add("book-images-ready");
}

function setAppHeight(options = {}) {
  const force = options?.force === true;

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

function syncZoomState() {
  const zoomed = isViewerZoomed();
  document.body.classList.toggle("is-zoomed", zoomed);
  book.setAttribute("aria-disabled", String(zoomed || transitionInProgress));

  if (zoomed) suspendPageFlipInput();
  else resumePageFlipInput();
}

function configurePhotoSwipe(pageIndex) {
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
    if (photoSwipe === viewer) photoSwipe = null;
  });

  return viewer;
}

function openPhotoViewer(pageIndex) {
  destroyPhotoViewer();
  document.body.dataset.currentPage = String(pageIndex);
  document.body.classList.add("viewer-active");
  document.body.classList.toggle("menu-viewer-active", pageIndex === 1);
  book.setAttribute("aria-hidden", "true");
  menuControls.hidden = pageIndex !== 1;
  menuControls.setAttribute("aria-hidden", String(pageIndex !== 1));

  photoSwipe = configurePhotoSwipe(pageIndex);
  photoSwipe.init();
  syncZoomState();
  document.documentElement.classList.add("app-ready");
}

function destroyPhotoViewer() {
  document.body.classList.remove(
    "is-zoomed",
    "viewer-active",
    "menu-viewer-active"
  );
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
    previousControl.hidden = pageIndex !== 2;
    previousControl.querySelector("span").textContent = "Regresar";
  }

  if (nextControl) {
    nextControl.hidden = pageIndex !== 0;
    nextControl.querySelector("span").textContent = "Ver menú";
  }

  menuControls.hidden = pageIndex !== 1;
  menuControls.setAttribute("aria-hidden", String(pageIndex !== 1));
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
  openPhotoViewer(safeIndex);
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

function beginPageTransition(action) {
  if (
    !pageFlip ||
    !bookImagesReady ||
    transitionInProgress ||
    isViewerZoomed()
  ) {
    return;
  }
  transitionInProgress = true;
  book.setAttribute("aria-disabled", "true");
  if (EXPERIENCE_CONFIG.controlsOnly) suspendPageFlipInput();

  const execute = () => {
    destroyPhotoViewer();
    menuControls.hidden = true;
    action();
  };

  execute();
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
    beginPageTransition(() => pageFlip.flipNext("bottom"));
  });
  document.body.append(nextControl);

  previousControl = document.createElement("button");
  previousControl.className = "book-control book-control--previous";
  previousControl.type = "button";
  previousControl.hidden = true;
  previousControl.setAttribute("aria-label", "Regresar a la página anterior");
  previousControl.innerHTML = '<i aria-hidden="true">←</i><span>Regresar</span>';
  previousControl.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    beginPageTransition(() => pageFlip.turnToPrevPage());
  });
  document.body.append(previousControl);

  viewerContinue.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    beginPageTransition(() => pageFlip.flipNext("bottom"));
  });

  viewerCover.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    beginPageTransition(() => pageFlip.turnToPrevPage());
  });

  skipLink?.addEventListener("click", (event) => {
    event.preventDefault();
    beginPageTransition(() => pageFlip.flip(1, "bottom"));
  });
}

function initializePageFlip() {
  if (!window.St?.PageFlip) {
    document.documentElement.classList.add("pageflip-unavailable");
    throw new Error("StPageFlip no está disponible.");
  }

  preparePages();
  const initialBookRect = book.getBoundingClientRect();

  pageFlip = new window.St.PageFlip(book, {
    width: initialBookRect.width,
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
window.visualViewport?.addEventListener("resize", setAppHeight, {
  passive: true,
});

await preloadBookImages();
initializePageFlip();
