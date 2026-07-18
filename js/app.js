"use strict";

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");
const menuViewer = document.querySelector("#menu-viewer");
const menuCanvas = menuViewer?.querySelector(".menu-viewer__canvas");
const officialMenu = document.querySelector("#official-menu");

const pageNames = ["Portada", "Menú oficial", "Agradecimiento"];
const desktopTurnDuration = 780;
const mobileTurnDuration = 1200;
let currentPage = 0;
let isTurning = false;
let gestureStart = null;

const zoom = {
  scale: 1,
  x: 0,
  y: 0,
  pointers: new Map(),
  panX: 0,
  panY: 0,
  pinchDistance: 0,
  pinchScale: 1,
};

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function setPageAccessibility(page, isActive) {
  page.setAttribute("aria-hidden", String(!isActive));
  if (isActive) {
    page.removeAttribute("inert");
  } else {
    page.setAttribute("inert", "");
  }
}

function renderPages() {
  pages.forEach((page, index) => {
    page.classList.toggle("is-active", index === currentPage);
    page.classList.toggle("is-previous", index < currentPage);
    page.classList.toggle("is-next", index > currentPage);
    setPageAccessibility(page, index === currentPage);
  });

  pageStatus.textContent = pageNames[currentPage];
}

function resetMenuZoom() {
  zoom.scale = 1;
  zoom.x = 0;
  zoom.y = 0;
  renderMenuZoom();
}

function goToPage(targetPage) {
  if (isTurning || targetPage < 0 || targetPage >= pages.length || targetPage === currentPage) return;
  if (currentPage === 1 && zoom.scale > 1) return;

  const leavingPage = pages[currentPage];
  isTurning = true;
  leavingPage.classList.add("is-turning");
  currentPage = targetPage;
  renderPages();

  window.setTimeout(() => {
    leavingPage.classList.remove("is-turning");
    isTurning = false;
    pages[currentPage].querySelector(".page-control")?.focus({ preventScroll: true });
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 230
    : window.matchMedia("(max-width: 47.99rem)").matches
      ? mobileTurnDuration
      : desktopTurnDuration);
}

function renderMenuZoom() {
  if (!menuViewer || !menuCanvas) return;

  if (zoom.scale <= 1) {
    zoom.scale = 1;
    zoom.x = 0;
    zoom.y = 0;
  } else {
    const bounds = menuViewer.getBoundingClientRect();
    zoom.x = clamp(zoom.x, -(bounds.width * (zoom.scale - 1)) / 2, (bounds.width * (zoom.scale - 1)) / 2);
    zoom.y = clamp(zoom.y, -(bounds.height * (zoom.scale - 1)) / 2, (bounds.height * (zoom.scale - 1)) / 2);
  }

  menuCanvas.style.transform = `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`;
  menuViewer.classList.toggle("is-zoomed", zoom.scale > 1);
}

function pointerDistance() {
  const [first, second] = [...zoom.pointers.values()];
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function initializeMenuZoom() {
  if (!menuViewer || !menuCanvas || !officialMenu) return;

  menuViewer.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoom.scale = clamp(zoom.scale * (event.deltaY < 0 ? 1.12 : 0.89), 1, 4);
      renderMenuZoom();
    },
    { passive: false }
  );

  menuViewer.addEventListener("pointerdown", (event) => {
    menuViewer.setPointerCapture(event.pointerId);
    zoom.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (zoom.pointers.size === 1) {
      zoom.panX = event.clientX;
      zoom.panY = event.clientY;
    } else if (zoom.pointers.size === 2) {
      zoom.pinchDistance = pointerDistance();
      zoom.pinchScale = zoom.scale;
    }
  });

  menuViewer.addEventListener("pointermove", (event) => {
    if (!zoom.pointers.has(event.pointerId)) return;
    event.preventDefault();
    zoom.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (zoom.pointers.size === 2) {
      zoom.scale = clamp(zoom.pinchScale * (pointerDistance() / zoom.pinchDistance), 1, 4);
      renderMenuZoom();
    } else if (zoom.scale > 1) {
      zoom.x += event.clientX - zoom.panX;
      zoom.y += event.clientY - zoom.panY;
      zoom.panX = event.clientX;
      zoom.panY = event.clientY;
      renderMenuZoom();
    }
  });

  function releasePointer(event) {
    zoom.pointers.delete(event.pointerId);
    if (zoom.pointers.size === 1) {
      const [remaining] = zoom.pointers.values();
      zoom.panX = remaining.x;
      zoom.panY = remaining.y;
    }
  }

  menuViewer.addEventListener("pointerup", releasePointer);
  menuViewer.addEventListener("pointercancel", releasePointer);
  menuViewer.addEventListener("lostpointercapture", releasePointer);
  menuViewer.addEventListener("dblclick", () => {
    zoom.scale = zoom.scale > 1 ? 1 : 2;
    zoom.x = 0;
    zoom.y = 0;
    renderMenuZoom();
  });

  window.addEventListener("resize", renderMenuZoom);
  officialMenu.addEventListener("load", renderMenuZoom, { once: true });
  renderMenuZoom();
}

function initializeNavigation() {
  book.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (control) {
      goToPage(currentPage + (control.dataset.action === "next" ? 1 : -1));
      return;
    }

    if (currentPage === 1 && zoom.scale > 1) return;

    const position = event.clientX / window.innerWidth;
    if (position >= 0.88) goToPage(currentPage + 1);
    if (position <= 0.12) goToPage(currentPage - 1);
  });

  book.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || zoom.pointers.size > 1) return;
    gestureStart = { x: event.clientX, y: event.clientY };
  });

  book.addEventListener("pointerup", (event) => {
    if (!gestureStart || (currentPage === 1 && zoom.scale > 1)) {
      gestureStart = null;
      return;
    }

    const deltaX = event.clientX - gestureStart.x;
    const deltaY = event.clientY - gestureStart.y;
    gestureStart = null;

    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    goToPage(currentPage + (deltaX < 0 ? 1 : -1));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goToPage(currentPage + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goToPage(currentPage - 1);
    } else if (event.key === "Escape" && currentPage === 1 && zoom.scale > 1) {
      resetMenuZoom();
    }
  });

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    goToPage(1);
  });
}

renderPages();
initializeMenuZoom();
initializeNavigation();
