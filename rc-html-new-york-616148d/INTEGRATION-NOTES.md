# Prueba técnica: menú HTML

Esta carpeta es una copia experimental de Wedding Experience. No es la
aplicación activa y no debe publicarse sin aprobación.

## Arquitectura

- `index.html` conserva el libro de dos páginas.
- `js/menu-surface.js` renderiza el menú HTML directamente en el documento
  principal, sin `iframe`, visor ni cambio de modo.
- `css/menu-native.css` encapsula la presentación mediante clases exclusivas;
  no se usa Shadow DOM.
- Una segunda representación no interactiva, generada por el mismo
  renderizador, permanece dentro de StPageFlip exclusivamente para el giro.
- StPageFlip conserva la navegación, las sombras y los 1100 ms de duración.
- PhotoSwipe se conserva exclusivamente para la página de agradecimiento.
- El menú HTML superior usa el zoom nativo del navegador. No usa Panzoom,
  PhotoSwipe ni controles de entrada o salida para ampliar.

## Conversión del archivo DC

El documento experimental de Claude se convirtió a recursos web normales:

- `menu-html/menu.html`: estructura semántica y ornamentos SVG locales.
- `menu-html/menu.css`: presentación encapsulada.
- `menu-html/menu-data.js`: datos locales de secciones y platos.
- `menu-html/menu.js`: renderizado local y SVG de iconos.

La versión integrada no depende de `x-dc`, `helmet`, `sc-for`, `sc-if`,
`image-slot`, `DCLogic`, `support.js`, interpolaciones `{{ }}` ni de un
runtime externo.

## Estado visual

Esta fase valida la arquitectura, no el arte final. Los espacios
`.dish-photo` son placeholders deliberados. El PNG aprobado continúa siendo
la referencia artística para la siguiente fase.

## Validación realizada

- Móvil equivalente a 390 × 844: hoja completa, tres secciones, catorce
  elementos, avance, agradecimiento y regreso; sin desbordamiento horizontal
  ni errores de consola.
- Escritorio 1440 × 900: perfil desktop, hoja estable de 520 × 900, avance,
  cierre del visor con Escape y regreso; sin desbordamiento ni errores.
- Chrome y Edge: recorrido funcional automatizado.

La emulación confirma la configuración de zoom nativo y los eventos táctiles,
pero la sensación real del pellizco todavía debe probarse físicamente en
Safari para iPhone antes de cualquier refinamiento o publicación.

## Regreso aprobado

El regreso desde Agradecimiento reutiliza el patrón protegido en
`f486504:js/rc-final-hq.js`: un StPageFlip temporal reflejado ejecuta el mismo
`flipNext("bottom")` del avance y se elimina al finalizar. La segunda página
  temporal clona la representación HTML inferior sincronizada; no sustituye ni
  rasteriza el menú real. El motor principal cambia internamente a la página 0
  debajo de esa capa y PhotoSwipe permanece separado.

## Superficie nativa integrada

La superficie interactiva permanece montada por encima del libro mientras la
página Menú está activa. Safari amplía el documento principal directamente.
`visualViewport.scale` y los contactos táctiles bloquean StPageFlip y los
controles durante el zoom sin cancelar el gesto nativo.

Antes de CONTINUAR se sincronizan anchura, posición y desplazamiento vertical
con la representación inferior. Las diferencias admitidas son de 0,5 px. La
superficie superior se oculta en el mismo ciclo en que comienza el giro.
Durante el regreso reflejado permanece oculta hasta que el motor temporal
finaliza; luego reaparece con el desplazamiento anterior y sin reconstruirse.

## Manual oficial de diseño: fotografías de platos

Esta regla es obligatoria para los once platos del menú.

- Orden visual único: icono, fotografía, nombre y descripción.
- El icono original del MASTER permanece siempre encima de la fotografía.
- La fotografía debe percibirse como parte impresa de la misma página, nunca
  como tarjeta, bloque, cuadro o elemento pegado.
- No se permiten bordes visibles, marcos, cortes bruscos ni contrastes de fondo
  que separen la fotografía del papel marfil.
- La integración se resuelve exclusivamente mediante la transición con el
  fondo, el aire respecto al texto y el equilibrio con el icono.
- Una imagen aprobada no puede recibir cambios de color, iluminación, plato,
  encuadre ni contenido durante su integración.
- Nombre y descripción permanecen completos, visibles y sin superposición.
- Cada plato se aprueba, integra, valida y congela individualmente antes de
  continuar con el siguiente.
