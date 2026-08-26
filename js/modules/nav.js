/**
 * Navegação: cabeçalho reativo, seção ativa, menu fullscreen,
 * progresso de rolagem e rolagem suave com âncoras seguras.
 */

import { qs, qsa, on, clamp, trapFocus, lockScroll, reducedMotion } from '../core/dom.js';
import { coalesce } from '../core/ticker.js';

const HIDE_AFTER = 260;
const DELTA_MIN = 6;

export function initHeader() {
  const masthead = qs('#masthead');
  const bar = qs('#scroll-bar');
  const rail = qs('.rail');
  if (!masthead) return;

  let previous = window.scrollY;

  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    masthead.classList.toggle('is-solid', y > 24);

    const delta = y - previous;
    if (Math.abs(delta) > DELTA_MIN) {
      const hide = delta > 0 && y > HIDE_AFTER && !document.body.classList.contains('is-locked');
      masthead.classList.toggle('is-hidden', hide);
      previous = y;
    }

    if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    if (rail) rail.classList.toggle('is-visible', y > window.innerHeight * 0.55);
  };

  on(window, 'scroll', coalesce(update), { passive: true });
  update();
}

/** Marca o capítulo que está cruzando o meio da tela. */
export function initSectionTracking() {
  const sections = qsa('main > section[id]');
  if (!sections.length) return;

  const links = [...qsa('[data-nav]'), ...qsa('[data-rail]')];

  const setActive = (id) => {
    for (const link of links) {
      const target = link.dataset.nav ?? link.dataset.rail;
      link.classList.toggle('is-active', target === id);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setActive(entry.target.id);
    }
  }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

/** Menu fullscreen para telas estreitas. */
export function initMenu() {
  const menu = qs('#menu');
  const burger = qs('#burger');
  if (!menu || !burger) return;

  let releaseFocus = null;
  let open = false;

  qsa('.menu__nav a', menu).forEach((link, index) => {
    link.style.setProperty('--d', `${index * 55}ms`);
  });

  const setOpen = (next) => {
    if (open === next) return;
    open = next;

    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    lockScroll(open);

    if (open) {
      menu.removeAttribute('hidden');
      releaseFocus = trapFocus(menu);
      qs('.menu__nav a', menu)?.focus({ preventScroll: true });
    } else {
      releaseFocus?.();
      releaseFocus = null;
      // Mantém o elemento no fluxo durante a transição de saída.
      window.setTimeout(() => {
        if (!open) menu.setAttribute('hidden', '');
      }, reducedMotion() ? 0 : 340);
    }
  };

  on(burger, 'click', () => setOpen(!open));
  on(menu, 'click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
  });
  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });
  on(window, 'resize', coalesce(() => {
    if (open && window.innerWidth > 860) setOpen(false);
  }), { passive: true });
}

/**
 * Rolagem suave para âncoras internas.
 * Ignora `href="#"` — era exatamente o que quebrava a navegação antiga.
 */
export function initAnchors() {
  on(document, 'click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: reducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });

    // Mantém o histórico e o foco coerentes para teclado e leitores de tela.
    history.pushState(null, '', hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  });
}
