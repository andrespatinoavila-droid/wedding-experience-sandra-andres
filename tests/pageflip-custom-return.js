const FLIP_DURATION = 1100;
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

function createReverseSheet() {
  const sheet = document.createElement("div");
  const leaf = document.createElement("div");
  const face = document.createElement("div");
  const back = document.createElement("div");
  const image = document.createElement("img");
  const curl = document.createElement("div");

  sheet.className = "reverse-sheet";
  sheet.setAttribute("aria-hidden", "true");

  leaf.className = "reverse-sheet__leaf";
  face.className = "reverse-sheet__face";
  back.className = "reverse-sheet__back";
  image.src = THANKS_IMAGE;
  image.alt = "";
  image.draggable = false;
  curl.className = "reverse-sheet__curl";
  face.append(image, curl);
  leaf.append(face, back);
  sheet.append(leaf);

  const shadow = document.createElement("div");
  shadow.className = "reverse-sheet__shadow";
  sheet.append(shadow);
  const bounds = stage.getBoundingClientRect();
  sheet.style.left = `${bounds.left}px`;
  sheet.style.top = `${bounds.top}px`;
  sheet.style.width = `${bounds.width}px`;
  sheet.style.height = `${bounds.height}px`;
  document.body.append(sheet);

  return { sheet, leaf, curl, shadow, image };
}

async function playReverseAnimation() {
  if (transitionInProgress || pageFlip.getCurrentPageIndex() !== 1) return;

  transitionInProgress = true;
  setControls(1, true);
  status.textContent = "Regreso personalizado · animando";

  const { sheet, leaf, curl, shadow, image } = createReverseSheet();
  await (image.decode ? image.decode().catch(() => undefined) : Promise.resolve());
  await waitForNextPaint();

  pageFlip.turnToPrevPage();
  await waitForNextPaint();

  const leafAnimation = leaf.animate(
    [
      {
        transform: "translate3d(0, 0, 0) rotateY(0deg) skewY(0deg)",
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        filter: "brightness(1)",
      },
      {
        transform: "translate3d(0, 0, 34px) rotateY(24deg) skewY(-0.35deg)",
        clipPath: "polygon(0 0, 99% 0.4%, 96.5% 50%, 99% 99.6%, 0 100%)",
        filter: "brightness(0.98)",
        offset: 0.24,
      },
      {
        transform: "translate3d(0, 0, 52px) rotateY(76deg) skewY(-0.8deg)",
        clipPath: "polygon(0 0, 96% 1%, 90% 50%, 96% 99%, 0 100%)",
        filter: "brightness(0.93)",
        offset: 0.56,
      },
      {
        transform: "translate3d(0, 0, 18px) rotateY(132deg) skewY(-0.3deg)",
        clipPath: "polygon(0 0, 98% 0.5%, 95% 50%, 98% 99.5%, 0 100%)",
        filter: "brightness(0.88)",
        offset: 0.82,
      },
      {
        transform: "translate3d(0, 0, 0) rotateY(180deg) skewY(0deg)",
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        filter: "brightness(0.86)",
      },
    ],
    {
      duration: FLIP_DURATION,
      easing: "cubic-bezier(0.37, 0, 0.2, 1)",
      fill: "forwards",
    }
  );

  const curlAnimation = curl.animate(
    [
      { opacity: 0 },
      { opacity: 0.9, offset: 0.46 },
      { opacity: 0.25, offset: 0.82 },
      { opacity: 0 },
    ],
    {
      duration: FLIP_DURATION,
      easing: "cubic-bezier(0.37, 0, 0.2, 1)",
      fill: "forwards",
    }
  );

  const shadowAnimation = shadow.animate(
    [
      { opacity: 0, transform: "translate3d(-100%, 0, 0)" },
      { opacity: 0.22, transform: "translate3d(110%, 0, 0)", offset: 0.5 },
      { opacity: 0, transform: "translate3d(385%, 0, 0)" },
    ],
    {
      duration: FLIP_DURATION,
      easing: "cubic-bezier(0.37, 0, 0.2, 1)",
      fill: "forwards",
    }
  );

  await Promise.all([
    leafAnimation.finished,
    curlAnimation.finished,
    shadowAnimation.finished,
  ]);

  sheet.remove();
  transitionInProgress = false;
  setControls(0);
  status.textContent = "Menú · regreso terminado · cero capas temporales";
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
  getTemporaryLayerCount: () => document.querySelectorAll(".reverse-sheet").length,
};
