"use strict";

const stage = document.querySelector("#isolated-stage");
const surface = document.querySelector("#isolated-surface");
const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
const debugEntries = [];
let currentScale = 1;
let currentPosition = { x: 0, y: 0 };
let lastTapAt = 0;
let suppressDoubleClickUntil = 0;

function debugLog(type, detail = {}) {
  if (!debugMode) return;
  const entry = {
    at: new Date().toISOString().slice(11, 23),
    type,
    scale: Number(currentScale.toFixed(3)),
    x: Number(currentPosition.x.toFixed(2)),
    y: Number(currentPosition.y.toFixed(2)),
    ...detail,
  };
  debugEntries.push(entry);
  if (debugEntries.length > 28) debugEntries.shift();
  let panel = document.querySelector("#isolated-debug-panel");
  if (!panel) {
    panel = document.createElement("pre");
    panel.id = "isolated-debug-panel";
    Object.assign(panel.style, {
      position: "fixed",
      zIndex: "10",
      top: "0",
      left: "0",
      width: "100%",
      maxHeight: "36vh",
      margin: "0",
      padding: "0.45rem",
      overflow: "auto",
      background: "rgba(0,0,0,.82)",
      color: "#9fffa0",
      font: "10px/1.25 monospace",
      pointerEvents: "none",
      whiteSpace: "pre-wrap",
    });
    document.body.append(panel);
  }
  panel.textContent = debugEntries
    .map((item) => `${item.at} ${item.type} s=${item.scale} x=${item.x} y=${item.y}`)
    .join("\n");
  console.debug("[isolated-viewer]", entry);
}

if (typeof window.Panzoom !== "function") {
  throw new Error("Panzoom no está disponible.");
}

const isolatedPanzoom = window.Panzoom(surface, {
  startScale: 1,
  minScale: 1,
  maxScale: 5,
  step: 0.35,
  canvas: false,
  contain: false,
  disablePan: false,
  disableZoom: false,
  pinchAndPan: true,
  panOnlyWhenZoomed: true,
  animate: false,
  cursor: "default",
});

surface.addEventListener("panzoomstart", () => debugLog("panzoomstart"));
surface.addEventListener("panzoomchange", (event) => {
  currentScale = Number(event.detail?.scale) || 1;
  currentPosition = {
    x: Number(event.detail?.x) || 0,
    y: Number(event.detail?.y) || 0,
  };
  debugLog("panzoomchange");
});
surface.addEventListener("panzoomend", () => debugLog("panzoomend"));

["pointerdown", "pointermove", "pointerup", "pointercancel"].forEach((eventName) => {
  surface.addEventListener(
    eventName,
    (event) => {
      debugLog(eventName, { pointerId: event.pointerId });
    },
    { capture: true }
  );
});

["touchstart", "touchmove", "touchend", "touchcancel"].forEach((eventName) => {
  surface.addEventListener(
    eventName,
    (event) => {
      debugLog(eventName, { touches: event.touches.length });
    },
    { capture: true, passive: true }
  );
});

function toggleZoom() {
  if (currentScale > 1.02) {
    debugLog("doubletap-panzoom.reset");
    isolatedPanzoom.reset({ animate: true });
  } else {
    debugLog("doubletap-panzoom.zoom");
    isolatedPanzoom.zoom(2, { animate: true });
  }
}

surface.addEventListener(
  "pointerup",
  (event) => {
    if (event.pointerType !== "touch") return;
    const now = Date.now();
    if (now - lastTapAt <= 320) {
      event.preventDefault();
      event.stopPropagation();
      suppressDoubleClickUntil = now + 500;
      lastTapAt = 0;
      toggleZoom();
    } else {
      lastTapAt = now;
    }
  },
  { capture: true }
);

surface.addEventListener("dblclick", (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (Date.now() < suppressDoubleClickUntil) return;
  toggleZoom();
});

stage.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    isolatedPanzoom.zoomWithWheel(event);
    debugLog("wheel");
  },
  { passive: false }
);

window.__isolatedPanzoom = isolatedPanzoom;
