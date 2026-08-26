/**
 * NÚCLEO TECH
 * Ponto de entrada. Orquestra os módulos e não implementa nada por conta própria.
 *
 * Zero dependências de terceiros. Um único requestAnimationFrame no site inteiro
 * (js/core/ticker.js). Cada módulo falha isolado: um erro em um recurso decorativo
 * nunca derruba o conteúdo.
 */

import { qs } from './core/dom.js';
import { addTask } from './core/ticker.js';
import { initReveal, initSplitText } from './core/reveal.js';
import { initIntro } from './modules/intro.js';
import { initNucleus } from './modules/nucleus.js';
import { initCursor, initMagnetic } from './modules/cursor.js';
import { initHeader, initSectionTracking, initMenu, initAnchors } from './modules/nav.js';
import { initCommand } from './modules/command.js';
import { initCaps } from './modules/caps.js';
import { initSystem } from './modules/system.js';
import { initMetrics } from './modules/metrics.js';
import { initContact } from './modules/contact.js';

/** Executa um módulo sem deixar que ele derrube os demais. */
function safely(name, run) {
  try {
    return run();
  } catch (error) {
    console.error(`[núcleo] módulo "${name}" falhou:`, error);
    return undefined;
  }
}

function boot() {
  // Navegação e conteúdo primeiro: é o que precisa funcionar sempre.
  safely('anchors', initAnchors);
  safely('header', initHeader);
  safely('sections', initSectionTracking);
  safely('menu', initMenu);
  safely('command', initCommand);
  safely('caps', initCaps);
  safely('contact', initContact);

  // Depois a camada de experiência.
  safely('reveal', initReveal);
  safely('split', () => initSplitText(addTask));
  safely('system', initSystem);
  safely('metrics', initMetrics);
  safely('nucleus', () => initNucleus(qs('#nucleus')));
  safely('cursor', initCursor);
  safely('magnetic', initMagnetic);

  const year = qs('#year');
  if (year) year.textContent = String(new Date().getFullYear());
}

safely('intro', initIntro);
boot();
