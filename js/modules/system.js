/**
 * Painel de sistema: revela as linhas em cascata e mostra dois valores reais —
 * o relógio local e o tamanho da viewport. Nada é inventado nem simulado.
 */

import { qs, qsa, on, observePresence } from '../core/dom.js';
import { coalesce } from '../core/ticker.js';

export function initSystem() {
  const panel = qs('#panel');
  if (!panel) return;

  qsa('.prow', panel).forEach((row) => {
    row.style.setProperty('--d', row.dataset.delay ?? '0');
  });

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    panel.classList.add('is-in');
    io.disconnect();
  }, { threshold: 0.25 });
  io.observe(panel);

  initClock(panel);
  initViewportReadout();
}

function initClock(panel) {
  const clock = qs('#panel-clock');
  if (!clock) return;

  let timer = 0;

  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  };

  // O relógio só corre enquanto o painel está visível.
  observePresence(panel, (visible) => {
    window.clearInterval(timer);
    if (!visible) return;
    tick();
    timer = window.setInterval(tick, 1000);
  });
}

function initViewportReadout() {
  const readout = qs('#panel-net');
  if (!readout) return;

  const update = () => {
    readout.textContent = `Viewport ${window.innerWidth}×${window.innerHeight}`;
  };

  update();
  on(window, 'resize', coalesce(update), { passive: true });
}
