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

const botanicalMarkup = (side, position = "top") => `
  <svg class="botanical botanical--${position} botanical--${side}" viewBox="0 0 300 225" aria-hidden="true">
    <path class="botanical__branch" d="M8 205C42 164 38 104 98 58 145 23 210 18 291 7"/>
    <path class="botanical__branch" d="M22 174c26-15 43-35 53-62M71 83c31 1 53-12 74-40M136 37c31 12 55 7 79-7"/>
    <g class="botanical__leaf">
      <ellipse cx="30" cy="178" rx="20" ry="9" transform="rotate(-48 30 178)"/>
      <ellipse cx="29" cy="142" rx="19" ry="9" transform="rotate(-76 29 142)"/>
      <ellipse cx="49" cy="111" rx="22" ry="10" transform="rotate(-36 49 111)"/>
      <ellipse cx="75" cy="76" rx="21" ry="10" transform="rotate(13 75 76)"/>
      <ellipse cx="108" cy="56" rx="22" ry="10" transform="rotate(-19 108 56)"/>
      <ellipse cx="147" cy="37" rx="22" ry="10" transform="rotate(20 147 37)"/>
      <ellipse cx="192" cy="28" rx="20" ry="9" transform="rotate(12 192 28)"/>
      <ellipse cx="235" cy="19" rx="19" ry="8" transform="rotate(-12 235 19)"/>
    </g>
    <g class="botanical__leaf botanical__leaf--soft">
      <ellipse cx="57" cy="154" rx="15" ry="7" transform="rotate(27 57 154)"/>
      <ellipse cx="91" cy="102" rx="16" ry="7" transform="rotate(-61 91 102)"/>
      <ellipse cx="132" cy="69" rx="16" ry="7" transform="rotate(46 132 69)"/>
      <ellipse cx="177" cy="50" rx="16" ry="7" transform="rotate(-45 177 50)"/>
      <ellipse cx="225" cy="37" rx="15" ry="7" transform="rotate(38 225 37)"/>
    </g>
    <g class="botanical__berry">
      <circle cx="18" cy="125" r="4"/><circle cx="24" cy="115" r="3.5"/>
      <circle cx="63" cy="126" r="4"/><circle cx="70" cy="119" r="3.4"/>
      <circle cx="111" cy="79" r="4"/><circle cx="120" cy="75" r="3.5"/>
      <circle cx="162" cy="53" r="4"/><circle cx="171" cy="51" r="3.3"/>
      <circle cx="253" cy="27" r="4"/><circle cx="265" cy="23" r="3.4"/>
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
      ${botanicalMarkup("left", "bottom")}
      ${botanicalMarkup("right", "bottom")}
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
