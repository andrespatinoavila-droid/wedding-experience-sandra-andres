const bookElement = document.querySelector("#isolated-book");
const pages = [...document.querySelectorAll(".isolated-page")];
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const status = document.querySelector("#test-status");

const pageFlip = new window.St.PageFlip(bookElement, {
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
  autoSize: false,
  maxShadowOpacity: 0.34,
  showCover: false,
  mobileScrollSupport: true,
  swipeDistance: 70,
  useMouseEvents: false,
  showPageCorners: false,
  disableFlipByClick: false,
});

function updateControls(index) {
  previousButton.disabled = index === 0;
  nextButton.disabled = index === pages.length - 1;
  status.textContent = `Página ${index + 1} de ${pages.length}`;
}

pageFlip.on("init", (event) => updateControls(event.data.page));
pageFlip.on("flip", (event) => updateControls(event.data));
pageFlip.loadFromHTML(pages);

nextButton.addEventListener("click", () => pageFlip.flipNext("bottom"));
previousButton.addEventListener("click", () => pageFlip.flipPrev("bottom"));

window.__isolatedPageFlip = pageFlip;
