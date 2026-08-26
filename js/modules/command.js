/**
 * NÚCLEO COMMAND — navegação rápida em Ctrl/⌘ + K.
 *
 * Não é enfeite: é a maneira mais rápida de percorrer o site no teclado.
 * Diálogo modal completo — foco preso, Esc fecha, setas navegam, Enter executa.
 */

import { qs, qsa, on, trapFocus, lockScroll, reducedMotion } from '../core/dom.js';

const WHATSAPP = 'https://wa.me/5588992658966';
const EMAIL = 'nucleotech.suporte@gmail.com.br';

const COMMANDS = [
  { id: 'home',         label: 'Início',              hint: 'Seção', badge: '01', type: 'link', target: '#home' },
  { id: 'manifesto',    label: 'Manifesto',           hint: 'Seção', badge: '02', type: 'link', target: '#manifesto' },
  { id: 'services',     label: 'Capacidades',         hint: 'Seção', badge: '03', type: 'link', target: '#services' },
  { id: 'technologies', label: 'Stack',               hint: 'Seção', badge: '04', type: 'link', target: '#technologies' },
  { id: 'process',      label: 'Processo',            hint: 'Seção', badge: '05', type: 'link', target: '#process' },
  { id: 'case',         label: 'Case 001',            hint: 'Seção', badge: '06', type: 'link', target: '#case' },
  { id: 'about',        label: 'Núcleo',              hint: 'Seção', badge: '07', type: 'link', target: '#about' },
  { id: 'contact',      label: 'Contato',             hint: 'Seção', badge: '08', type: 'link', target: '#contact' },
  { id: 'whatsapp',     label: 'Abrir WhatsApp',      hint: 'Ação',  badge: '→',  type: 'external', target: WHATSAPP },
  { id: 'mail',         label: 'Escrever um e-mail',  hint: 'Ação',  badge: '→',  type: 'external', target: `mailto:${EMAIL}` },
  { id: 'copy',         label: 'Copiar e-mail',       hint: 'Ação',  badge: '⧉',  type: 'copy',     target: EMAIL },
  { id: 'grid',         label: 'Alternar grade',      hint: 'Ação',  badge: '#',  type: 'grid' },
];

export function initCommand() {
  const root = qs('#command');
  const input = qs('#cmd-input');
  const list = qs('#cmd-list');
  if (!root || !input || !list) return;

  const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  const keyLabel = qs('#cmd-key');
  if (keyLabel && isMac) keyLabel.textContent = '⌘';

  let open = false;
  let results = COMMANDS;
  let cursor = 0;
  let releaseFocus = null;

  function render() {
    list.textContent = '';

    if (!results.length) {
      const empty = document.createElement('li');
      empty.className = 'cmd__empty';
      empty.textContent = 'Nada encontrado.';
      list.append(empty);
      return;
    }

    results.forEach((command, index) => {
      const item = document.createElement('li');
      item.className = 'cmd__item';
      item.id = `cmd-opt-${command.id}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === cursor));

      const badge = document.createElement('i');
      badge.textContent = command.badge;

      const label = document.createElement('span');
      label.textContent = command.label;

      const hint = document.createElement('em');
      hint.textContent = command.hint;

      item.append(badge, label, hint);
      item.addEventListener('click', () => run(command));
      item.addEventListener('pointermove', () => {
        if (cursor === index) return;
        cursor = index;
        syncSelection();
      });

      list.append(item);
    });

    syncSelection();
  }

  function syncSelection() {
    const items = qsa('.cmd__item', list);
    items.forEach((item, index) => {
      item.setAttribute('aria-selected', String(index === cursor));
    });
    const active = items[cursor];
    if (active) {
      input.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  function filter(query) {
    const term = query.trim().toLowerCase();
    results = term
      ? COMMANDS.filter((command) => command.label.toLowerCase().includes(term))
      : COMMANDS;
    cursor = 0;
    render();
  }

  function run(command) {
    setOpen(false);

    switch (command.type) {
      case 'link': {
        const target = document.querySelector(command.target);
        target?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
        break;
      }
      case 'external':
        window.open(command.target, '_blank', 'noopener');
        break;
      case 'copy':
        navigator.clipboard?.writeText(command.target).catch(() => {});
        break;
      case 'grid':
        document.documentElement.classList.toggle('show-grid');
        break;
      default:
        break;
    }
  }

  function setOpen(next) {
    if (open === next) return;
    open = next;

    root.classList.toggle('is-open', open);
    lockScroll(open);

    if (open) {
      root.removeAttribute('hidden');
      input.value = '';
      filter('');
      releaseFocus = trapFocus(root);
      input.focus({ preventScroll: true });
    } else {
      releaseFocus?.();
      releaseFocus = null;
      window.setTimeout(() => {
        if (!open) root.setAttribute('hidden', '');
      }, reducedMotion() ? 0 : 340);
    }
  }

  on(document, 'keydown', (event) => {
    const shortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (shortcut) {
      event.preventDefault();
      setOpen(!open);
      return;
    }

    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = (cursor + 1) % Math.max(results.length, 1);
      syncSelection();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      cursor = (cursor - 1 + results.length) % Math.max(results.length, 1);
      syncSelection();
    } else if (event.key === 'Enter' && results[cursor]) {
      event.preventDefault();
      run(results[cursor]);
    }
  });

  on(input, 'input', () => filter(input.value));
  qsa('[data-command-open]').forEach((button) => on(button, 'click', () => setOpen(true)));
  qsa('[data-command-close]').forEach((element) => on(element, 'click', () => setOpen(false)));

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', 'cmd-list');
  render();
}
