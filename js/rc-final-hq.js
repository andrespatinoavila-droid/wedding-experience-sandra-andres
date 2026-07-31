import PhotoSwipe from "../vendor/photoswipe/photoswipe.esm.min.js";

const FLIP_DURATION = 1100;
const MENU = {
  src: "img/menu/menu-final-art-v3.png",
  width: 3200,
  height: 5120,
  alt: "Menú oficial de la boda de Sandra Bonilla y Andrés Patiño",
};
const THANKS = {
  src: "img/pages/agradecimiento.png",
  width: 1170,
  height: 2532,
  alt: "Agradecimiento de Sandra Bonilla y Andrés Patiño",
};
const assets = [MENU, THANKS];

const stage = document.querySelector("#rc-stage");
const bookElement = document.querySelector("#rc-book");
const pages = [...document.querySelectorAll(".rc-page")];
const nextButton = document.querySelector("#rc-next");
const previousButton = document.querySelector("#rc-previous");

let currentPage = 0;
let transitionInProgress = false;
let viewer = null;

function waitForNextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function decodeImage(image) {
  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
  }
  if (image.decode) await image.decode().catch(() => undefined);
}

await Promise.all([...document.images].map(decodeImage));

const pageFlip = new window.St.PageFlip(bookElement, {
  width: 390,
  height: 624,
  size: "stretch",
  minWidth: 280,
  maxWidth: 625,
  minHeight: 448,
  maxHeight: 1000,
  startPage: 0,
  drawShadow: true,
  flippingTime: FLIP_DURATION,
  usePortrait: true,
  startZIndex: 10,
  autoSize: false,
  maxShadowOpacity: 0.34,
  showCover: false,
  mobileScrollSupport: true,
  swipeDistance: 70,
  useMouseEvents: false,
  showPageCorners: false,
  disableFlipByClick: true,
});
pageFlip.loadFromHTML(pages);

function isZoomed() {
  const slide = viewer?.currSlide;
  return Boolean(slide && slide.currZoomLevel > slide.zoomLevels.initial * 1.02);
}

function syncControls() {
  document.body.classList.toggle("is-zoomed", isZoomed());
  nextButton.hidden = currentPage !== 0;
  previousButton.hidden = currentPage !== 1;
}

function openViewer(index) {
  viewer?.destroy();
  viewer = new PhotoSwipe({
    dataSource: [assets[index]],
    index: 0,
    bgOpacity: 1,
    showHideAnimationType: "none",
    showAnimationDuration: 0,
    hideAnimationDuration: 0,
    zoomAnimationDuration: 220,
    allowPanToNext: false,
    closeOnVerticalDrag: false,
    pinchToClose: false,
    clickToCloseNonZoomable: false,
    tapAction: false,
    doubleTapAction: "zoom",
    wheelToZoom: true,
    returnFocus: false,
  });
  viewer.on("uiRegister", () => { viewer.ui.uiElementsData = []; });
  viewer.on("zoomPanUpdate", syncControls);
  viewer.on("destroy", () => { viewer = null; });
  viewer.init();
  syncControls();
}

function closeViewer() {
  if (!viewer) return;
  const active = viewer;
  viewer = null;
  active.destroy();
  document.body.classList.remove("is-zoomed");
}

function createTemporaryPage(asset) {
  const page = document.createElement("section");
  const image = document.createElement("img");
  page.className = "rc-page";
  image.src = asset.src;
  image.alt = "";
  image.width = asset.width;
  image.height = asset.height;
  image.draggable = false;
  page.append(image);
  return { page, image };
}

async function createReverseEngine() {
  const overlay = document.createElement("div");
  const mirror = document.createElement("div");
  const temporaryBook = document.createElement("div");
  const thanksPage = createTemporaryPage(THANKS);
  const menuPage = createTemporaryPage(MENU);

  overlay.className = "reverse-engine";
  mirror.className = "reverse-engine__mirror";
  temporaryBook.className = "reverse-engine__book";
  temporaryBook.append(thanksPage.page, menuPage.page);
  mirror.append(temporaryBook);
  overlay.append(mirror);

  const bounds = stage.getBoundingClientRect();
  Object.assign(overlay.style, {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  });
  document.body.append(overlay);
  await Promise.all([thanksPage.image, menuPage.image].map(decodeImage));

  const temporaryFlip = new window.St.PageFlip(temporaryBook, {
    width: 390,
    height: 624,
    size: "stretch",
    minWidth: 280,
    maxWidth: 625,
    minHeight: 448,
    maxHeight: 1000,
    startPage: 0,
    drawShadow: true,
    flippingTime: FLIP_DURATION,
    usePortrait: true,
    startZIndex: 10,
    autoSize: false,
    maxShadowOpacity: 0.34,
    showCover: false,
    mobileScrollSupport: true,
    swipeDistance: 70,
    useMouseEvents: false,
    showPageCorners: false,
    disableFlipByClick: true,
  });
  temporaryFlip.loadFromHTML([thanksPage.page, menuPage.page]);
  await waitForNextPaint();
  return { overlay, temporaryFlip };
}

nextButton.addEventListener("click", async () => {
  if (transitionInProgress || currentPage !== 0 || isZoomed()) return;
  transitionInProgress = true;
  document.body.classList.add("is-transitioning");
  closeViewer();

  await new Promise((resolve) => {
    pageFlip.on("changeState", (event) => {
      if (event.data === "read" && pageFlip.getCurrentPageIndex() === 1) resolve();
    });
    pageFlip.flipNext("bottom");
  });

  currentPage = 1;
  transitionInProgress = false;
  document.body.classList.remove("is-transitioning");
  openViewer(1);
});

previousButton.addEventListener("click", async () => {
  if (transitionInProgress || currentPage !== 1 || isZoomed()) return;
  transitionInProgress = true;
  document.body.classList.add("is-transitioning");
  const { overlay, temporaryFlip } = await createReverseEngine();
  closeViewer();
  pageFlip.turnToPrevPage();
  await waitForNextPaint();

  await new Promise((resolve) => {
    temporaryFlip.on("changeState", (event) => {
      if (event.data === "read" && temporaryFlip.getCurrentPageIndex() === 1) resolve();
    });
    temporaryFlip.flipNext("bottom");
  });

  temporaryFlip.destroy();
  overlay.remove();
  currentPage = 0;
  transitionInProgress = false;
  document.body.classList.remove("is-transitioning");
  openViewer(0);
});

openViewer(0);
