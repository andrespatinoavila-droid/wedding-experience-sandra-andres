"use strict";

const book = document.querySelector("#wedding-book");
const pages = [...document.querySelectorAll(".book-page")];
const pageStatus = document.querySelector("#page-status");

const pageNames = ["Portada", "Menú oficial", "Agradecimiento"];
const pageTurnDuration = 900;
let currentPage = 0;
let isTurning = false;
let gestureStart = null;

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

function pageFace(sourcePage, side) {
  const face = document.createElement("div");
  const visualClasses = [...sourcePage.classList].filter(
    (className) => !className.startsWith("is-") && className !== "book-page"
  );
  face.className = `page-leaf__face page-leaf__${side} ${visualClasses.join(" ")}`;
  face.innerHTML = sourcePage.innerHTML;
  face.setAttribute("aria-hidden", "true");
  face.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  face.querySelectorAll("button, a").forEach((element) => element.setAttribute("tabindex", "-1"));
  return face;
}

function createTurningLeaf(fromPage, toPage, direction) {
  const leaf = document.createElement("div");
  leaf.className = `page-leaf is-leaf-${direction}`;

  if (direction === "forward") {
    leaf.append(pageFace(fromPage, "front"), pageFace(toPage, "back"));
  } else {
    leaf.append(pageFace(toPage, "front"), pageFace(fromPage, "back"));
  }

  book.append(leaf);
  return leaf;
}

function goToPage(targetPage) {
  if (isTurning || targetPage < 0 || targetPage >= pages.length || targetPage === currentPage) return;

  const leavingPage = pages[currentPage];
  const destinationPage = pages[targetPage];
  const turnDirection = targetPage > currentPage ? "forward" : "backward";
  const turningLeaf = createTurningLeaf(leavingPage, destinationPage, turnDirection);
  isTurning = true;
  currentPage = targetPage;
  renderPages();

  window.setTimeout(() => {
    turningLeaf.remove();
    isTurning = false;
    pages[currentPage].querySelector(".page-control")?.focus({ preventScroll: true });
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 280
    : pageTurnDuration);
}

function initializeNavigation() {
  book.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (control) {
      goToPage(currentPage + (control.dataset.action === "next" ? 1 : -1));
      return;
    }

    const position = event.clientX / window.innerWidth;
    if (position >= 0.88) goToPage(currentPage + 1);
    if (position <= 0.12) goToPage(currentPage - 1);
  });

  book.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    if (!event.isPrimary) {
      gestureStart = null;
      return;
    }
    gestureStart = { x: event.clientX, y: event.clientY };
  });

  book.addEventListener("pointercancel", () => {
    gestureStart = null;
  });

  book.addEventListener("pointerup", (event) => {
    if (!gestureStart) {
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
    }
  });

  document.querySelector(".skip-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    goToPage(1);
  });
}

renderPages();
initializeNavigation();
