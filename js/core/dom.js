/**
 * Utilitários de DOM e matemática.
 * Sem dependências. Tudo que se repete no projeto mora aqui.
 */

export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/** Registra um listener e devolve a função que o remove. */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Observa uma vez: dispara o callback quando o elemento entra e para de observar.
 * Devolve o observer para permitir desconexão antecipada.
 */
export function observeOnce(elements, callback, options = {}) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      callback(entry.target);
      io.unobserve(entry.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px', ...options });

  elements.forEach((el) => io.observe(el));
  return io;
}

/** Avisa quando um elemento entra ou sai da viewport (para ligar/desligar loops). */
export function observePresence(element, onChange, options = {}) {
  const io = new IntersectionObserver(
    ([entry]) => onChange(entry.isIntersecting),
    { threshold: 0, ...options }
  );
  io.observe(element);
  return () => io.disconnect();
}

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Prende o foco dentro de um container enquanto ele estiver aberto.
 * Devolve a função de liberação, que também restaura o foco anterior.
 */
export function trapFocus(container) {
  const previous = document.activeElement;

  const handleKeydown = (event) => {
    if (event.key !== 'Tab') return;
    const items = qsa(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const off = on(document, 'keydown', handleKeydown);

  return () => {
    off();
    if (previous instanceof HTMLElement) previous.focus();
  };
}

/** Bloqueia a rolagem sem provocar salto de layout. */
export function lockScroll(locked) {
  if (locked) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = gap > 0 ? `${gap}px` : '';
    document.body.classList.add('is-locked');
  } else {
    document.body.style.paddingRight = '';
    document.body.classList.remove('is-locked');
  }
}
