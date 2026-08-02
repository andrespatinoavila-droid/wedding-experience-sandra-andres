export const configMobile = Object.freeze({
  name: "mobile",
  className: "experience-mobile",
  controlsOnly: true,
  photoSwipe: Object.freeze({
    bgOpacity: 1,
    showHideAnimationType: "none",
    showAnimationDuration: 0,
    hideAnimationDuration: 0,
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
    returnFocus: false,
  }),
  pageFlip: Object.freeze({
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
    clickEventForward: true,
    useMouseEvents: true,
    showPageCorners: true,
    disableFlipByClick: true,
  }),
});

export const configDesktop = Object.freeze({
  name: "desktop",
  className: "experience-desktop",
  controlsOnly: false,
  photoSwipe: Object.freeze({
    bgOpacity: 1,
    showHideAnimationType: "none",
    showAnimationDuration: 0,
    hideAnimationDuration: 0,
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
    secondaryZoomLevel: 1.75,
    maxZoomLevel: 4,
    wheelToZoom: true,
    escKey: true,
    arrowKeys: false,
    trapFocus: false,
    returnFocus: false,
  }),
  pageFlip: Object.freeze({
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
    clickEventForward: true,
    useMouseEvents: false,
    showPageCorners: true,
    disableFlipByClick: true,
  }),
});

export function selectExperienceConfig(capabilities) {
  const isDesktop =
    capabilities.finePointer &&
    capabilities.hover &&
    capabilities.desktopWidth &&
    !capabilities.coarsePointer &&
    capabilities.touchPoints === 0;

  return isDesktop ? configDesktop : configMobile;
}

export function detectExperienceConfig(
  browserWindow = window,
  browserNavigator = navigator
) {
  return selectExperienceConfig({
    finePointer: browserWindow.matchMedia("(pointer: fine)").matches,
    hover: browserWindow.matchMedia("(hover: hover)").matches,
    coarsePointer: browserWindow.matchMedia("(pointer: coarse)").matches,
    desktopWidth: browserWindow.matchMedia("(min-width: 64rem)").matches,
    touchPoints: Number(browserNavigator.maxTouchPoints) || 0,
  });
}
