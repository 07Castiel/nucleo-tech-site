/**
 * Motor de revelação.
 *
 * Dois contratos no HTML:
 *   [data-reveal]       → sobe e aparece quando entra na viewport
 *   [data-reveal-line]  → linha de título que sobe de dentro de uma máscara
 *
 * Elementos irmãos que entram juntos recebem um atraso escalonado via `--d`,
 * então o ritmo é declarado no HTML e resolvido pelo CSS.
 */

import { qsa, observeOnce, reducedMotion } from './dom.js';

const STAGGER_MS = 90;
const MAX_STEPS = 6;

function applyStagger(elements) {
  const groups = new Map();

  for (const el of elements) {
    const parent = el.parentElement ?? document.body;
    const group = groups.get(parent) ?? [];
    group.push(el);
    groups.set(parent, group);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.forEach((el, index) => {
      el.style.setProperty('--d', `${Math.min(index, MAX_STEPS) * STAGGER_MS}ms`);
    });
  }
}

export function initReveal() {
  const blocks = qsa('[data-reveal]');
  const lines = qsa('[data-reveal-line]');

  if (reducedMotion()) {
    [...blocks, ...lines].forEach((el) => el.classList.add('is-in'));
    return;
  }

  applyStagger(blocks);

  // As linhas de um mesmo título sobem em cascata.
  qsa('.hero__title, .cta__title').forEach((title) => {
    qsa('[data-reveal-line]', title).forEach((line, index) => {
      line.style.setProperty('--d', `${index * 110}ms`);
    });
  });

  observeOnce(blocks, (el) => el.classList.add('is-in'));

  /*
   * As linhas ficam dentro de uma máscara com overflow:hidden e começam
   * deslocadas para fora dela. Observar a própria linha nunca funcionaria: o
   * IntersectionObserver recorta pelo ancestral, o retângulo dá zero e a
   * revelação jamais dispararia. Por isso observamos a máscara.
   */
  const masks = [...new Set(lines.map((line) => line.parentElement).filter(Boolean))];
  observeOnce(masks, (mask) => {
    qsa('[data-reveal-line]', mask).forEach((line) => line.classList.add('is-in'));
  }, { threshold: 0.05 });
}

/**
 * Quebra um parágrafo em palavras e as acende conforme o bloco atravessa a tela.
 * Cada palavra é um <span>, o texto continua selecionável e legível por leitores.
 */
export function initSplitText(ticker) {
  const targets = qsa('[data-split]');
  if (!targets.length) return;

  if (reducedMotion()) return;

  for (const target of targets) {
    const words = target.textContent.trim().split(/\s+/);
    target.textContent = '';

    const spans = words.map((word, index) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      target.append(span);
      if (index < words.length - 1) target.append(' ');
      return span;
    });

    let stop = null;

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !stop) {
        stop = ticker(() => update(target, spans));
      } else if (!entry.isIntersecting && stop) {
        stop();
        stop = null;
      }
    }, { threshold: 0 });

    io.observe(target);
  }
}

function update(target, spans) {
  const rect = target.getBoundingClientRect();
  const viewport = window.innerHeight;

  // 0 quando o topo do bloco chega a 82% da tela, 1 quando o fim passa de 38%.
  const start = viewport * 0.82;
  const end = viewport * 0.38;
  const travelled = start - rect.top;
  const distance = start - end + rect.height * 0.55;
  const progress = Math.min(Math.max(travelled / distance, 0), 1);

  const lit = Math.round(progress * spans.length);
  for (let i = 0; i < spans.length; i += 1) {
    spans[i].classList.toggle('is-lit', i < lit);
  }
}
