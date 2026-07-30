const FLIP_DURATION = 1100;
const MENU_IMAGE = "../img/menu/menu-oficial.png";
const THANKS_IMAGE = "../img/pages/agradecimiento.png";

const stage = document.querySelector("#test-stage");
const bookElement = document.querySelector("#custom-book");
const pages = [...document.querySelectorAll(".custom-page")];
const previousButton = document.querySelector("#custom-previous");
const nextButton = document.querySelector("#custom-next");
const status = document.querySelector("#custom-status");

let transitionInProgress = false;

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

function setControls(pageIndex, disabled = false) {
  previousButton.disabled = disabled || pageIndex === 0;
  nextButton.disabled = disabled || pageIndex === pages.length - 1;
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function createTemporaryPage(imageSource) {
  const page = document.createElement("section");
  const image = document.createElement("img");
  page.className = "custom-page";
  image.src = imageSource;
  image.alt = "";
  image.draggable = false;
  page.append(image);
  return { page, image };
}

async function createReverseEngine() {
  const overlay = document.createElement("div");
  const mirror = document.createElement("div");
  const temporaryBook = document.createElement("div");
  const thanksPage = createTemporaryPage(THANKS_IMAGE);
  const menuPage = createTemporaryPage(MENU_IMAGE);

  overlay.className = "reverse-engine";
  overlay.setAttribute("aria-hidden", "true");
  mirror.className = "reverse-engine__mirror";
  temporaryBook.className = "reverse-engine__book";
  temporaryBook.append(thanksPage.page, menuPage.page);
  mirror.append(temporaryBook);
  overlay.append(mirror);

  const bounds = stage.getBoundingClientRect();
  overlay.style.left = `${bounds.left}px`;
  overlay.style.top = `${bounds.top}px`;
  overlay.style.width = `${bounds.width}px`;
  overlay.style.height = `${bounds.height}px`;
  document.body.append(overlay);

  await Promise.all(
    [thanksPage.image, menuPage.image].map((image) =>
      image.decode ? image.decode().catch(() => undefined) : Promise.resolve()
    )
  );

  const temporaryFlip = new window.St.PageFlip(temporaryBook, {
    width: 390,
    height: 844,
    size: "stretch",
    minWidth: 280,
    maxWidth: 520,
    minHeight: 605,
    maxHeight: 1125,
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

async function playReverseAnimation() {
  if (transitionInProgress || pageFlip.getCurrentPageIndex() !== 1) return;

  transitionInProgress = true;
  setControls(1, true);
  status.textContent = "Regreso con física nativa · animando";

  const { overlay, temporaryFlip } = await createReverseEngine();
  pageFlip.turnToPrevPage();
  await waitForNextPaint();

  await new Promise((resolve) => {
    temporaryFlip.on("changeState", (event) => {
      if (event.data === "read" && temporaryFlip.getCurrentPageIndex() === 1) {
        resolve();
      }
    });
    temporaryFlip.flipNext("bottom");
  });

  temporaryFlip.destroy();
  overlay.remove();
  transitionInProgress = false;
  setControls(0);
  status.textContent = "Menú · regreso terminado · motor temporal eliminado";
}

pageFlip.on("init", (event) => setControls(event.data.page));
pageFlip.on("flip", (event) => {
  if (!transitionInProgress) {
    setControls(event.data);
    status.textContent = event.data === 1 ? "Gracias · listo" : "Menú · listo";
  }
});
pageFlip.loadFromHTML(pages);

nextButton.addEventListener("click", () => {
  if (transitionInProgress || pageFlip.getCurrentPageIndex() !== 0) return;
  transitionInProgress = true;
  setControls(0, true);
  status.textContent = "Avance nativo · animando";
  pageFlip.flipNext("bottom");
});

pageFlip.on("changeState", (event) => {
  if (event.data !== "read" || pageFlip.getCurrentPageIndex() !== 1) return;
  transitionInProgress = false;
  setControls(1);
  status.textContent = "Gracias · listo";
});

previousButton.addEventListener("click", playReverseAnimation);

window.__customReturnTest = {
  pageFlip,
  getTemporaryLayerCount: () => document.querySelectorAll(".reverse-engine").length,
};
