/**
 * Índice de capacidades: linhas tipográficas que abrem.
 * Um item aberto por vez, estado no atributo `aria-expanded`.
 */

import { qs, qsa, on } from '../core/dom.js';

export function initCaps() {
  const container = qs('#caps');
  if (!container) return;

  const items = qsa('.cap', container);

  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    qs('.cap__head', item)?.setAttribute('aria-expanded', String(open));
  };

  on(container, 'click', (event) => {
    const head = event.target instanceof Element ? event.target.closest('.cap__head') : null;
    if (!head) return;

    const item = head.closest('.cap');
    if (!item) return;

    const willOpen = !item.classList.contains('is-open');
    items.forEach((other) => setOpen(other, other === item && willOpen));
  });
}
