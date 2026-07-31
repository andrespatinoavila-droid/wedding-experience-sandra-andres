import PhotoSwipe from "../vendor/photoswipe/photoswipe.esm.min.js";
import {
  detectExperienceConfig,
} from "./experience-config.js?v=1.1.4";

const EXPERIENCE_CONFIG = detectExperienceConfig();
document.documentElement.classList.add(EXPERIENCE_CONFIG.className);
document.documentElement.dataset.experienceProfile = EXPERIENCE_CONFIG.name;

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const menuControls = document.querySelector("#menu-photo-viewer");
const viewerContinue = document.querySelector("#viewer-continue");
const bookPageImages = [...document.querySelectorAll(".book-page__image")];
const menuHtmlFrame = document.querySelector("#menu-html-frame");

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

let pageFlip = null;
let pageFlipInputSuspended = false;
let photoSwipe = null;
let previousControl = null;
let transitionInProgress = false;
let bookImagesReady = false;
let pendingPageIndex = null;
let pageActivationFrame = null;
let deferredViewportSync = false;

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
  const menuFrameReady = new Promise((resolve, reject) => {
    if (menuHtmlFrame.contentDocument?.readyState === "complete") {
      resolve();
      return;
    }

    menuHtmlFrame.addEventListener("load", resolve, { once: true });
    menuHtmlFrame.addEventListener("error", reject, { once: true });
  });

  await Promise.all([
    ...bookPageImages.map(decodeBookImage),
    menuFrameReady,
  ]);
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
  book.setAttribute("aria-hidden", "false");
  menuControls.hidden = false;
  menuControls.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("app-ready");
  syncZoomState();
}

function destroyPhotoViewer() {
  document.body.classList.remove(
    "is-zoomed",
    "viewer-active",
    "menu-viewer-active",
    "html-menu-active"
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
  const frame = document.createElement("iframe");

  page.className = "reverse-page";
  frame.className = "reverse-page__menu";
  frame.src = menuHtmlFrame.src;
  frame.title = "";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  page.append(frame);

  const ready = new Promise((resolve, reject) => {
    frame.addEventListener("load", resolve, { once: true });
    frame.addEventListener("error", reject, { once: true });
  });

  return { page, ready };
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

  return { overlay, temporaryFlip };
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
    reverseEngine?.temporaryFlip.destroy();
    reverseEngine?.overlay.remove();
    document.body.classList.remove("is-reversing");
    pendingPageIndex = null;
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
window.visualViewport?.addEventListener("resize", setAppHeight, {
  passive: true,
});

await preloadBookImages();
initializePageFlip();
