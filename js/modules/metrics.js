/**
 * CASE 001 — métricas reais desta página, medidas no navegador do visitante.
 *
 * Nada aqui é escrito à mão: os valores vêm da Performance API, do DOM e de uma
 * contagem de quadros ao vivo. Se uma API não existir, o campo mostra "—" em vez
 * de um número inventado.
 */

import { qs, qsa, observePresence, reducedMotion } from '../core/dom.js';
import { addTask } from '../core/ticker.js';

const DEPENDENCIES = 0;

export function initMetrics() {
  const container = qs('#metrics');
  if (!container) return;

  const fields = new Map(
    qsa('[data-metric]', container).map((el) => [el.dataset.metric, el])
  );

  const reveal = () => {
    const values = collect();
    for (const [key, element] of fields) {
      const value = values[key];
      if (value === null || value === undefined) {
        element.textContent = '—';
        continue;
      }
      countTo(element, value);
    }
    startFpsMeter(container, fields.get('fps'));
  };

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    // Espera a página assentar para que o timing de recursos esteja completo.
    if (document.readyState === 'complete') reveal();
    else window.addEventListener('load', reveal, { once: true });
  }, { threshold: 0.2 });

  io.observe(container);
}

function collect() {
  return {
    deps: DEPENDENCIES,
    js: weightOf((entry) => entry.name.endsWith('.js')),
    css: weightOf((entry) =>
      entry.name.includes('.css') || entry.name.includes('fonts.googleapis.com/css')),
    paint: firstPaint(),
    dom: document.getElementsByTagName('*').length,
    fps: null,
  };
}

/** Soma o peso, em KB, dos recursos que casam com o filtro. */
function weightOf(match) {
  if (typeof performance?.getEntriesByType !== 'function') return null;

  const entries = performance.getEntriesByType('resource').filter(match);
  if (!entries.length) return null;

  const bytes = entries.reduce((total, entry) => {
    // transferSize é 0 quando vem do cache: o corpo codificado ainda é verdade.
    const size = entry.transferSize || entry.encodedBodySize || entry.decodedBodySize || 0;
    return total + size;
  }, 0);

  return bytes ? Math.max(1, Math.round(bytes / 1024)) : null;
}

function firstPaint() {
  if (typeof performance?.getEntriesByType !== 'function') return null;
  const entry = performance.getEntriesByType('paint')
    .find((item) => item.name === 'first-contentful-paint');
  return entry ? Math.round(entry.startTime) : null;
}

/** Contagem crescente com desaceleração. Respeita movimento reduzido. */
function countTo(element, target) {
  if (reducedMotion() || target === 0) {
    element.textContent = String(target);
    return;
  }

  const duration = 1100;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    element.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(step);
    else element.textContent = String(target);
  };

  requestAnimationFrame(step);
}

/** Média móvel de quadros por segundo, viva enquanto a seção estiver na tela. */
function startFpsMeter(container, element) {
  if (!element) return;

  let frames = 0;
  let elapsed = 0;
  let stop = null;

  const measure = (delta) => {
    frames += 1;
    elapsed += delta;
    if (elapsed < 500) return;
    element.textContent = String(Math.min(Math.round((frames * 1000) / elapsed), 240));
    frames = 0;
    elapsed = 0;
  };

  observePresence(container, (visible) => {
    if (visible && !stop) {
      stop = addTask(measure);
    } else if (!visible && stop) {
      stop();
      stop = null;
    }
  });
}
