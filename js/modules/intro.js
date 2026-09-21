/**
 * Abertura.
 *
 * Duas fases em sequência, uma só Promise:
 *
 *  1) Forja — as letras "NÚCLEO TECH" caem em 3D (js/vendor/forge.*, único
 *     ponto do site com uma dependência de terceiro, carregado via dynamic
 *     import e só depois de checar prefers-reduced-motion). Se não carregar
 *     dentro do orçamento, ou o motion estiver reduzido, esta fase é pulada
 *     e cai direto na fase 2.
 *  2) Contador — a abertura original: sobe até 92% enquanto as fontes
 *     carregam, completa assim que a página está pronta, teto rígido de
 *     1500 ms. Uma cortina nunca pode ser o motivo de alguém esperar.
 *
 * Pular (clique, Esc ou qualquer tecla) encerra as duas fases imediatamente.
 */

import { qs, lockScroll, reducedMotion } from '../core/dom.js';

const CEILING_MS = 1500;
const MINIMUM_MS = 620;
const FORGE_LOAD_BUDGET_MS = 1000;
const FORGE_BUNDLE_URL = '../vendor/forge.bundle.js';
const FORGE_FONT_URL = 'assets/fonts/intro-archivo-black.typeface.json';

export function initIntro() {
  const intro = qs('#intro');
  if (!intro) return Promise.resolve();

  if (reducedMotion()) {
    intro.remove();
    return Promise.resolve();
  }

  lockScroll(true);

  let skipNow = null;
  let wasSkipped = false;
  const requestSkip = () => {
    wasSkipped = true;
    if (skipNow) skipNow();
  };
  const onKey = () => requestSkip();
  const onClick = () => requestSkip();
  window.addEventListener('keydown', onKey);
  intro.addEventListener('click', onClick);

  function detachSkipListeners() {
    window.removeEventListener('keydown', onKey);
    intro.removeEventListener('click', onClick);
  }

  return runForgePhase(intro, (fn) => { skipNow = fn; }, () => wasSkipped)
    .then(() => runCounterPhase(intro, (fn) => { skipNow = fn; }, () => wasSkipped))
    .then(() => { detachSkipListeners(); });
}

/** Fase 1 — resolve assim que a cena 3D terminou (ou nunca começou). */
function runForgePhase(intro, setSkip, wasSkipped) {
  return new Promise((resolve) => {
    const stage = qs('.intro__stage', intro);
    const canvas = qs('.intro__canvas', intro);
    if (!stage || !canvas) {
      resolve();
      return;
    }

    let settled = false;
    const finishForge = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    // Se o clique/tecla chegou antes do bundle carregar, não há controller
    // ainda para pular — nada além de encerrar a fase assim que ela puder.
    setSkip(finishForge);

    const timeoutId = window.setTimeout(finishForge, FORGE_LOAD_BUDGET_MS);
    const isMobile = window.matchMedia('(max-width: 639px)').matches;

    Promise.all([
      import(FORGE_BUNDLE_URL),
      fetch(FORGE_FONT_URL).then((r) => {
        if (!r.ok) throw new Error('font fetch failed');
        return r.json();
      }),
    ])
      .then(([mod, fontData]) => {
        if (settled) return;
        window.clearTimeout(timeoutId);

        // O pedido de pular chegou enquanto isto carregava: não vale mais a
        // pena montar a cena, só para descartá-la no quadro seguinte.
        if (wasSkipped()) {
          finishForge();
          return;
        }

        intro.classList.add('has-forge');
        stage.classList.add('is-live');

        const controller = mod.runForge({
          container: intro,
          canvas,
          fontData,
          isMobile,
          onDone: () => {
            stage.remove();
            finishForge();
          },
        });

        setSkip(() => {
          if (controller && controller.skip) controller.skip();
        });
      })
      .catch(() => {
        window.clearTimeout(timeoutId);
        finishForge();
      });
  });
}

/** Fase 2 — o contador original, inalterado além do gancho de skip. */
function runCounterPhase(intro, setSkip, wasSkipped) {
  const counter = qs('#intro-count');
  const bar = qs('#intro-bar');
  const started = performance.now();

  return new Promise((resolve) => {
    let value = 0;
    let finishing = false;
    let frame = 0;

    const close = (skipped) => {
      cancelAnimationFrame(frame);
      intro.classList.add('is-done');
      if (skipped) intro.classList.add('is-skipped');
      lockScroll(false);
      window.setTimeout(() => {
        intro.remove();
        resolve();
      }, skipped ? 0 : 640);
    };

    setSkip(() => close(true));

    // A forja já foi pulada — não há por que animar o contador também.
    if (wasSkipped()) {
      close(true);
      return;
    }

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
        close(false);
        return;
      }
      frame = requestAnimationFrame(step);
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
