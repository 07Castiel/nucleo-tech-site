/**
 * Abertura.
 *
 * Curta de propósito: sobe até 92% enquanto as fontes carregam, completa assim
 * que a página está pronta e sai. Teto rígido de 1500 ms — uma cortina nunca
 * pode ser o motivo de alguém esperar.
 */

import { qs, lockScroll, reducedMotion } from '../core/dom.js';

const CEILING_MS = 1500;
const MINIMUM_MS = 620;

export function initIntro() {
  const intro = qs('#intro');
  if (!intro) return Promise.resolve();

  if (reducedMotion()) {
    intro.remove();
    return Promise.resolve();
  }

  const counter = qs('#intro-count');
  const bar = qs('#intro-bar');
  const started = performance.now();

  lockScroll(true);

  return new Promise((resolve) => {
    let value = 0;
    let finishing = false;
    let frame = 0;

    const paint = () => {
      if (counter) counter.textContent = String(Math.round(value)).padStart(3, '0');
      if (bar) bar.style.width = `${value}%`;
    };

    const step = () => {
      const elapsed = performance.now() - started;
      const target = finishing || elapsed > CEILING_MS ? 100 : 92;
      value += (target - value) * (finishing ? 0.22 : 0.055);

      if (value > 99.4) value = 100;
      paint();

      if (value === 100 && elapsed > MINIMUM_MS) {
        close();
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const close = () => {
      cancelAnimationFrame(frame);
      intro.classList.add('is-done');
      lockScroll(false);
      window.setTimeout(() => {
        intro.remove();
        resolve();
      }, 640);
    };

    const ready = Promise.all([
      document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((done) => window.addEventListener('load', done, { once: true })),
    ]);

    ready.then(() => { finishing = true; });
    window.setTimeout(() => { finishing = true; }, CEILING_MS);

    frame = requestAnimationFrame(step);
  });
}
