import PhotoSwipe from "../vendor/photoswipe/photoswipe.esm.min.js";

const viewer = new PhotoSwipe({
  dataSource: [
    {
      src: "img/menu/menu-oficial.png",
      width: 1024,
      height: 1536,
      alt: "Menú oficial de la boda de Sandra Bonilla y Andrés Patiño"
    }
  ],
  index: 0,
  bgOpacity: 1,
  showHideAnimationType: "none",
  allowPanToNext: false,
  loop: false,
  pinchToClose: false,
  closeOnVerticalDrag: false,
  clickToCloseNonZoomable: false,
  imageClickAction: false,
  bgClickAction: false,
  tapAction: false,
  doubleTapAction: "zoom",
  initialZoomLevel: "fit",
  secondaryZoomLevel: 1.5,
  maxZoomLevel: 4,
  wheelToZoom: true,
  escKey: false,
  arrowKeys: false,
  trapFocus: false,
  returnFocus: false
});

viewer.on("uiRegister", () => {
  viewer.ui.uiElementsData = [];
});

viewer.init();
