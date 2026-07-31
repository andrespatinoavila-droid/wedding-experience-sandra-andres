import { menuSections } from "../menu-html/menu-data.js";

const iconPaths = {
  cup: '<path d="M7 15h20v7a10 10 0 0 1-20 0zM27 17c8-1 8 9 0 9M10 7c0-4 4-4 4-8m5 8c0-4 4-4 4-8" />',
  fish: '<path d="M4 18c8-12 20-12 28 0-8 12-20 12-28 0zm28 0 7-7-2 7 2 7z" /><circle cx="11" cy="16" r="1.5" />',
  cheese: '<path d="M5 29 20 5l16 24z" /><circle cx="20" cy="21" r="2" /><circle cx="14" cy="26" r="1.6" />',
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
  return `
    <article class="dish-card">
      ${iconMarkup(dish.icon)}
      <div class="dish-photo" role="img" aria-label="Fotografía provisional de ${dish.name}">
        <span>Fotografía<br>provisional</span>
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

const botanicalMarkup = (side) => `
  <svg class="botanical botanical--${side}" viewBox="0 0 280 220" aria-hidden="true">
    <path d="M10 190C40 150 30 90 90 50 130 24 190 14 260 10" fill="none" stroke="currentColor" stroke-width="2"/>
    <g fill="currentColor">
      <ellipse cx="35" cy="165" rx="16" ry="8" transform="rotate(-40 35 165)"/>
      <ellipse cx="28" cy="130" rx="15" ry="7" transform="rotate(-70 28 130)"/>
      <ellipse cx="45" cy="95" rx="17" ry="8" transform="rotate(-30 45 95)"/>
      <ellipse cx="80" cy="65" rx="16" ry="8" transform="rotate(10 80 65)"/>
      <ellipse cx="120" cy="42" rx="17" ry="8" transform="rotate(20 120 42)"/>
      <ellipse cx="165" cy="28" rx="16" ry="8" transform="rotate(15 165 28)"/>
    </g>
  </svg>
`;

export function renderMenuSurface(container, options = {}) {
  const interactive = options.interactive !== false;
  const titleId = options.titleId || "menu-title";

  container.classList.add("native-menu-surface");
  container.dataset.interactive = String(interactive);
  container.innerHTML = `
    <article class="menu-sheet" aria-labelledby="${titleId}">
      ${botanicalMarkup("left")}
      ${botanicalMarkup("right")}
      <aside class="badge" aria-label="Nueve opciones">
        <strong>9</strong>
        <span>opciones para llenar de más motivos esta celebración</span>
      </aside>
      <header class="menu-header">
        <p class="monogram">S | A</p>
        <div class="heart-rule" aria-hidden="true">♥</div>
        <h1 id="${titleId}">Menú de boda</h1>
        <p class="couple">Sandra Bonilla &amp; Andrés Patiño</p>
        <p class="welcome">
          Para nuestra familia y amigos, con amor:
          <strong>elige el plato que hará</strong>
          <em>este día aún más especial.</em>
        </p>
      </header>
      <main class="menu-sections">
        ${menuSections.map(sectionMarkup).join("")}
      </main>
      <footer class="menu-footer">
        Con amor, cuidamos cada detalle para que disfruten de una experiencia inolvidable.
      </footer>
    </article>
  `;

  return container;
}
