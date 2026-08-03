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

function iconMarkup(icon) {
  return `<img class="dish-icon" src="../img/icons/option-1/${icon}.png" alt="" aria-hidden="true" loading="eager" decoding="async">`;
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
