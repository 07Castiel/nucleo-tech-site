/**
 * Cursor customizado: ponto imediato + anel que persegue com atraso.
 * Só existe em ponteiro fino. Nunca é requisito para usar o site.
 */

import { lerp, finePointer, reducedMotion, qsa } from '../core/dom.js';
import { addTask } from '../core/ticker.js';

const INTERACTIVE = 'a, button, input, select, textarea, [data-cursor], .cap__head';

export function initCursor() {
  if (!finePointer() || reducedMotion()) return;

  const root = document.createElement('div');
  root.className = 'cursor is-idle';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<span class="cursor__ring"></span><span class="cursor__dot"></span>';
  document.body.append(root);

  const ring = root.firstElementChild;
  const dot = root.lastElementChild;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;

  addTask(() => {
    ringX = lerp(ringX, targetX, 0.16);
    ringY = lerp(ringY, targetY, 0.16);
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
  });

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    targetX = event.clientX;
    targetY = event.clientY;
    root.classList.remove('is-idle');
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) {
      root.classList.add('is-hover');
    }
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) {
      root.classList.remove('is-hover');
    }
  }, { passive: true });

  document.addEventListener('pointerdown', () => root.classList.add('is-down'), { passive: true });
  document.addEventListener('pointerup', () => root.classList.remove('is-down'), { passive: true });
  document.addEventListener('mouseleave', () => root.classList.add('is-idle'));
}

/**
 * Botões magnéticos: o alvo se desloca alguns pixels na direção do ponteiro.
 * Deslocamento pequeno de propósito — deve ser sentido, não visto.
 */
export function initMagnetic() {
  if (!finePointer() || reducedMotion()) return;

  const STRENGTH = 0.28;
  const MAX = 7;

  for (const element of qsa('[data-cursor="magnetic"]')) {
    let frame = 0;

    const move = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - (rect.left + rect.width / 2)) * STRENGTH;
        const y = (event.clientY - (rect.top + rect.height / 2)) * STRENGTH;
        const clampedX = Math.max(-MAX, Math.min(MAX, x));
        const clampedY = Math.max(-MAX, Math.min(MAX, y));
        element.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
      });
    };

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.style.transform = '';
    };

    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', reset, { passive: true });
    element.addEventListener('blur', reset);
  }
}
