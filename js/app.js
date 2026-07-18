"use strict";

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const pageNames = ["Portada", "Menú oficial", "Agradecimiento"];

let pageFlip = null;
let menuGestureLocked = false;
let previousControl = null;

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
    previousControl.hidden = safeIndex === 0;
    previousControl.querySelector("span").textContent =
      safeIndex === 2 ? "Regresar" : "Portada";
  }
}

function initializeControls() {
  previousControl = document.createElement("button");
  previousControl.className = "global-page-previous";
  previousControl.type = "button";
  previousControl.hidden = true;
  previousControl.setAttribute("aria-label", "Regresar a la página anterior");
  previousControl.innerHTML = '<i aria-hidden="true">←</i><span>Portada</span>';
  previousControl.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!pageFlip) return;
    pageFlip.turnToPrevPage();
  });
  document.body.append(previousControl);

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    pageFlip?.flip(1, "bottom");
  });
}

function initializeMenuGestureIsolation() {
  const menuViewer = document.querySelector("#menu-viewer");
  if (!menuViewer) return;

  const shouldLockMenuGesture = (event) =>
    event.touches?.length > 1 || (window.visualViewport?.scale || 1) > 1.01;

  menuViewer.addEventListener(
    "touchstart",
    (event) => {
      if (shouldLockMenuGesture(event)) {
        menuGestureLocked = true;
        event.stopPropagation();
      }
    },
    { capture: true, passive: true }
  );

  menuViewer.addEventListener(
    "touchmove",
    (event) => {
      if (menuGestureLocked || shouldLockMenuGesture(event)) {
        menuGestureLocked = true;
        event.stopPropagation();
      }
    },
    { capture: true, passive: true }
  );

  menuViewer.addEventListener(
    "touchend",
    (event) => {
      if (!menuGestureLocked) return;
      event.stopPropagation();
      if (event.touches.length === 0) {
        window.setTimeout(() => {
          menuGestureLocked = false;
        }, 80);
      }
    },
    { capture: true, passive: true }
  );

  menuViewer.addEventListener(
    "touchcancel",
    (event) => {
      if (menuGestureLocked) event.stopPropagation();
      menuGestureLocked = false;
    },
    { capture: true, passive: true }
  );
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
  initializeMenuGestureIsolation();
  updatePageStatus(0);
}

initializePageFlip();
