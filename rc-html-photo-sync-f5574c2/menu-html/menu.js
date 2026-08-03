import { menuSections } from "./menu-data.js";

const query = new URLSearchParams(window.location.search);
const isEmbedded = window.self !== window.top;
const isTransitionCopy = query.get("transition") === "1";
const isViewer = !isEmbedded && query.get("viewer") === "1";
const viewportMeta = document.querySelector('meta[name="viewport"]');
const openViewerButton = document.querySelector("#menu-open-viewer");
const closeViewerButton = document.querySelector("#menu-close-viewer");

function getReleaseCandidate() {
  if (query.has("rc")) return query.get("rc");

  if (isEmbedded) {
    try {
      return new URL(window.top.location.href).searchParams.get("rc");
    } catch {
      return null;
    }
  }

  return null;
}

function openStandaloneViewer() {
  const viewerUrl = new URL("menu.html", window.location.href);
  viewerUrl.searchParams.set("viewer", "1");
  const releaseCandidate = getReleaseCandidate();
  if (releaseCandidate) viewerUrl.searchParams.set("rc", releaseCandidate);
  window.top.location.assign(viewerUrl.href);
}

function returnToBook() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  const bookUrl = new URL("../index.html", window.location.href);
  const releaseCandidate = getReleaseCandidate();
  if (releaseCandidate) bookUrl.searchParams.set("rc", releaseCandidate);
  window.location.assign(bookUrl.href);
}

if (isEmbedded) {
  viewportMeta.content =
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

  if (!isTransitionCopy) {
    document.documentElement.classList.add("menu-embedded");
    openViewerButton.hidden = false;
    openViewerButton.addEventListener("click", openStandaloneViewer);
    document.addEventListener("dblclick", openStandaloneViewer);
  }
} else if (isViewer) {
  document.documentElement.classList.add("menu-viewer-mode");
  closeViewerButton.hidden = false;
  closeViewerButton.addEventListener("click", returnToBook);
}

const iconPaths = {
  cup: '<path d="M7 15h20v7a10 10 0 0 1-20 0zM27 17c8-1 8 9 0 9M10 7c0-4 4-4 4-8m5 8c0-4 4-4 4-8" />',
  fish: '<path d="M4 18c8-12 20-12 28 0-8 12-20 12-28 0zm28 0 7-7-2 7 2 7z" /><circle cx="11" cy="16" r="1.5" />',
  cheese: '<path d="M6 28 12 14l15-7 9 12-6 11H9zM12 14l18 5m0 0v11M9 30h21" /><path d="M17 14c2-2 5-1 5 2 0 2-2 3-4 2m8 5c3-1 5 2 3 4m-16-4c2-1 4 1 3 3" /><circle cx="27" cy="14" r="1.3" /><circle cx="21" cy="25" r="1.2" />',
  cow: '<ellipse cx="20" cy="21" rx="12" ry="9" /><path d="M11 15 5 8m24 7 6-7M13 10q7-7 14 0" />',
  pig: '<ellipse cx="20" cy="19" rx="14" ry="10" /><ellipse cx="20" cy="23" rx="6" ry="4" /><circle cx="17" cy="23" r="1" /><circle cx="23" cy="23" r="1" />',
  pineapple: '<path d="M8 12c0-8 24-8 24 0v14c0 9-24 9-24 0zM20 6l-5-7m5 7V-2m0 8 5-7M10 15l20 16m0-16L10 31" />',
  chicken: '<ellipse cx="20" cy="23" rx="13" ry="10" /><circle cx="20" cy="9" r="6" /><path d="m26 8 7-2M16 4q2-5 4 0 2-5 4 0" />',
  shell: '<path d="M4 28C4 8 36 8 36 28zm16-15v15m-9-13 4 13m14-13-4 13" />',
  side: '<path d="M5 18h30l-4 12H9zM10 14q10-9 20 0" />',
};

function iconMarkup(icon) {
  return `<svg class="dish-icon" viewBox="0 0 42 38" aria-hidden="true">${iconPaths[icon] || iconPaths.side}</svg>`;
}

function dishMarkup(dish) {
  const photo = dish.image
    ? `<img src="../${dish.image}" alt="${dish.name}" loading="eager" decoding="async">`
    : `<span>Fotografía<br>provisional</span>`;

  return `
    <article class="dish-card">
      ${iconMarkup(dish.icon)}
      <div class="dish-photo${dish.image ? " dish-photo--official" : ""}">
        ${photo}
      </div>
      <div class="dish-copy">
        <h3>${dish.name}</h3>
        <p>${dish.description}</p>
      </div>
    </article>
  `;
}

function sectionMarkup(section) {
  return `
    <section class="menu-section menu-section--${section.id}" aria-labelledby="${section.id}-title">
      <header class="section-heading">
        <span aria-hidden="true"></span>
        <h2 id="${section.id}-title">${section.title}</h2>
        <span aria-hidden="true"></span>
      </header>
      <div class="dish-grid">${section.items.map(dishMarkup).join("")}</div>
    </section>
  `;
}

document.querySelector("#menu-sections").innerHTML = menuSections
  .map(sectionMarkup)
  .join("");

document.documentElement.classList.add("menu-ready");
