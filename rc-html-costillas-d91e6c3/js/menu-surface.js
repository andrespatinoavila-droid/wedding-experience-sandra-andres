import { menuSections } from "../menu-html/menu-data.js";

function iconMarkup(icon) {
  return `<img class="dish-icon" src="img/icons/option-1/${icon}.png" alt="" aria-hidden="true" loading="eager" decoding="async">`;
}

function dishMarkup(dish) {
  const photo = dish.image
    ? `<img src="${dish.image}" alt="${dish.name}" loading="eager" decoding="async">`
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
      ${botanicalMarkup("left", "bottom")}
      ${botanicalMarkup("right", "bottom")}
      <aside class="badge" aria-label="Nueve opciones">
        <svg class="badge__frame" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
          <path d="M1 1H99V121.5L50 149 1 121.5Z" />
          <path d="M4 4H96V119.6L50 145.4 4 119.6Z" />
        </svg>
        <i class="badge__heart" aria-hidden="true">♡</i>
        <div class="badge__number"><strong>9</strong><small>OPCIONES</small></div>
        <span>opciones para<br>llenar de más<br>motivos esta<br>celebración</span>
        <svg class="badge__ornament" viewBox="0 0 100 34" aria-hidden="true">
          <path class="badge__ornament-branch" d="M6 24C23 23 34 18 44 10M94 24C77 23 66 18 56 10" />
          <g class="badge__ornament-leaves">
            <ellipse cx="17" cy="21" rx="4.6" ry="1.8" transform="rotate(-17 17 21)" />
            <ellipse cx="27" cy="18" rx="4.5" ry="1.8" transform="rotate(-29 27 18)" />
            <ellipse cx="36" cy="14" rx="4.2" ry="1.7" transform="rotate(-38 36 14)" />
            <ellipse cx="43" cy="9" rx="3.8" ry="1.6" transform="rotate(-52 43 9)" />
            <ellipse cx="83" cy="21" rx="4.6" ry="1.8" transform="rotate(17 83 21)" />
            <ellipse cx="73" cy="18" rx="4.5" ry="1.8" transform="rotate(29 73 18)" />
            <ellipse cx="64" cy="14" rx="4.2" ry="1.7" transform="rotate(38 64 14)" />
            <ellipse cx="57" cy="9" rx="3.8" ry="1.6" transform="rotate(52 57 9)" />
          </g>
          <path class="badge__ornament-heart" d="M50 10c-5.5-4.4-10 3.2 0 10 10-6.8 5.5-14.4 0-10Z" />
          <circle cx="50" cy="26" r="1.6" />
        </svg>
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
