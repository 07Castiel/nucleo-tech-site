/**
 * Briefing de contato.
 *
 * Não existe backend neste projeto, então o formulário não finge enviar nada:
 * ele monta a mensagem e abre o canal real escolhido — WhatsApp ou e-mail.
 * Para plugar um endpoint depois, basta preencher ENDPOINT e tratar a resposta.
 */

import { qs, qsa, on } from '../core/dom.js';

const ENDPOINT = ''; // URL do backend, quando existir. Vazio = usa WhatsApp/e-mail.
const WHATSAPP_NUMBER = '5588992658966';
const EMAIL = 'agencianucleotech@gmail.com';

const RULES = {
  'f-name': (value) => (value.trim().length >= 2 ? '' : 'Informe seu nome.'),
  'f-email': (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'E-mail inválido.'),
  'f-msg': (value) => (value.trim().length >= 12 ? '' : 'Conte um pouco mais — pelo menos uma frase.'),
};

export function initContact() {
  const form = qs('#brief');
  if (!form) return;

  const note = qs('#brief-note');

  const showError = (field, message) => {
    const wrapper = field.closest('.field');
    const slot = qs(`[data-err-for="${field.id}"]`, form);
    wrapper?.classList.toggle('has-error', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (slot) slot.textContent = message;
  };

  const validateField = (field) => {
    const rule = RULES[field.id];
    if (!rule) return true;
    const message = rule(field.value);
    showError(field, message);
    return !message;
  };

  const validate = () => {
    let firstInvalid = null;
    for (const id of Object.keys(RULES)) {
      const field = qs(`#${id}`, form);
      if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      if (note) note.textContent = 'Confira os campos destacados.';
    }
    return !firstInvalid;
  };

  const compose = () => {
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const kind = String(data.get('kind') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    return [
      'Olá, Núcleo Tech.',
      '',
      `Nome: ${name}`,
      `E-mail: ${email}`,
      `Tipo de projeto: ${kind}`,
      '',
      'Sobre o projeto:',
      message,
    ].join('\n');
  };

  /*
   * Abre por meio de um link temporário, e não com window.open.
   * Com a flag 'noopener', window.open devolve null MESMO quando abre a aba —
   * é o que a especificação manda, já que o opener não pode manter referência.
   * Testar esse retorno fazia o fallback disparar sempre e levar a aba atual
   * embora junto. Um clique em <a> não tem essa ambiguidade e continua dentro
   * do gesto do usuário, então nenhum bloqueador de pop-up interfere.
   */
  const openChannel = (url) => {
    const link = document.createElement('a');
    link.href = url;
    if (url.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
  };

  on(form, 'submit', (event) => {
    event.preventDefault();
    if (!validate()) return;

    if (ENDPOINT) {
      // Ponto de extensão para um backend real, sem alterar o resto do fluxo.
      return;
    }

    openChannel(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(compose())}`);
    if (note) note.textContent = 'Abrindo o WhatsApp com sua mensagem pronta.';
  });

  const mailButton = qs('#brief-mail');
  if (mailButton) {
    on(mailButton, 'click', () => {
      if (!validate()) return;
      const subject = encodeURIComponent('Novo projeto — via site');
      openChannel(`mailto:${EMAIL}?subject=${subject}&body=${encodeURIComponent(compose())}`);
      if (note) note.textContent = 'Abrindo seu cliente de e-mail com a mensagem pronta.';
    });
  }

  // Valida ao sair do campo, limpa o erro assim que a pessoa corrige.
  qsa('input, textarea', form).forEach((field) => {
    on(field, 'blur', () => validateField(field));
    on(field, 'input', () => {
      if (field.closest('.field')?.classList.contains('has-error')) validateField(field);
    });
  });
}
