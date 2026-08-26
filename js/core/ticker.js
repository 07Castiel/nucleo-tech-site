/**
 * Um único requestAnimationFrame para o site inteiro.
 *
 * Cada módulo registra uma tarefa em vez de abrir o próprio loop: assim existe
 * um só ponto de sincronia, o loop morre quando não há nada a fazer e pausa
 * inteiro quando a aba sai de foco.
 */

const tasks = new Set();
let rafId = 0;
let previous = 0;

function frame(now) {
  const delta = previous ? Math.min(now - previous, 64) : 16.7;
  previous = now;

  for (const task of tasks) task(delta, now);

  rafId = tasks.size ? requestAnimationFrame(frame) : 0;
}

function start() {
  if (rafId || !tasks.size || document.hidden) return;
  previous = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  if (!rafId) return;
  cancelAnimationFrame(rafId);
  rafId = 0;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
  else start();
});

/**
 * Registra uma tarefa por quadro. Devolve a função que a remove.
 * @param {(delta:number, now:number) => void} task
 */
export function addTask(task) {
  tasks.add(task);
  start();
  return () => {
    tasks.delete(task);
    if (!tasks.size) stop();
  };
}

/**
 * Executa `handler` no próximo quadro após um evento, ignorando disparos
 * intermediários. Usado para scroll e resize.
 */
export function coalesce(handler) {
  let queued = false;
  return (...args) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      handler(...args);
    });
  };
}
