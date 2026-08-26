# Núcleo Tech

Site institucional da Núcleo Tech — engenharia de software sob medida, Sobral/CE.

**Zero dependências de terceiros em produção.** Sem framework, sem bundler, sem
biblioteca de animação. Abrir `index.html` em um servidor estático é o deploy.

---

## Rodar localmente

O projeto usa ES modules, que exigem HTTP (não funcionam em `file://`):

```bash
python3 -m http.server 8080
# http://localhost:8080
```

Não há build, nem instalação, nem `package.json`.

---

## Estrutura

```
index.html            Documento único, 8 capítulos, todo o conteúdo em HTML
style.css             Sistema visual completo, organizado em @layer
robots.txt
sitemap.xml
assets/
  favicon.svg
  apple-touch-icon.png
  og-image.png        1200×630, para compartilhamento
  fonts/              Archivo · Inter · IBM Plex Mono (subset latin, woff2)
js/
  main.js             Orquestra os módulos e nada mais
  core/
    dom.js            Seletores, matemática, foco preso, trava de rolagem
    ticker.js         O único requestAnimationFrame do site
    reveal.js         Revelações por scroll e acendimento palavra a palavra
  modules/
    intro.js          Abertura (teto rígido de 1500 ms)
    nucleus.js        Instrumento do hero, Canvas 2D
    cursor.js         Cursor customizado e botões magnéticos
    nav.js            Cabeçalho, capítulo ativo, menu, âncoras
    command.js        Navegação rápida em Ctrl/⌘ + K
    caps.js           Índice de capacidades
    system.js         Painel de stack (relógio e viewport reais)
    metrics.js        Métricas medidas do próprio site
    contact.js        Briefing → WhatsApp ou e-mail
```

### Decisões que sustentam a arquitetura

**Um só `requestAnimationFrame`.** Todo módulo que anima registra uma tarefa em
`core/ticker.js`. O loop para sozinho quando ninguém precisa dele e pausa inteiro
quando a aba perde o foco. Nenhum módulo abre o próprio loop.

**Cada módulo falha isolado.** `main.js` envolve cada inicialização em `safely()`.
Um erro no cursor não derruba o formulário.

**O conteúdo não depende de JavaScript.** Os estados iniciais das animações só
existem sob a classe `.js`, aplicada por um script inline no `<head>`. Com JS
desligado, o site continua legível e navegável por inteiro.

**Fontes auto-hospedadas.** Nenhuma requisição a terceiros, nenhum DNS extra e
nada bloqueando a primeira pintura. Só o subset `latin` (164 KB no total),
suficiente para português.

**Tipografia que não quebra.** Os títulos que precisam ocupar uma linha só são
dimensionados a partir da largura útil real (`--fit-w`), não de `vw` chutado.
A maior linha do hero mede 7,9em, então `font-size: --fit-w / 8.15` cabe em
qualquer tela entre 320px e 2560px. O mesmo vale para os títulos de seção, onde a
restrição é a palavra mais longa (`TRABALHAMOS`, 8,52em).

---

## Sistema visual

Tokens em `@layer tokens` no topo do `style.css`.

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#08090B` | Fundo |
| `--paper` | `#EDEEEA` | Texto principal |
| `--fg-2` | `#9AA0A6` | Texto secundário (7,5:1) |
| `--fg-3` | `#757A80` | Rótulos mono de 11px (4,7:1) |
| `--signal` | `#00E5C7` | Cor de assinatura — um destaque por tela |

Tipografia: **Archivo** (display), **Inter** (texto), **IBM Plex Mono**
(rótulos técnicos).

Movimento: uma curva de entrada (`--ease-out`) e uma de estado (`--ease-io`),
quatro durações. `prefers-reduced-motion: reduce` desliga a abertura, o canvas,
o cursor e todas as revelações — o conteúdo aparece pronto.

---

## Como editar o conteúdo

Tudo está em `index.html`, em português, sem template engine.

- **Capacidades** — `<article class="cap">` na seção `#services`.
- **Stack** — `<li class="prow">` na seção `#technologies`.
- **Processo** — `<li class="step">` na seção `#process`.
- **Contato** — número e e-mail em `js/modules/contact.js` e `js/modules/command.js`.

### Portfólio

A seção `#case` hoje apresenta o próprio site como Case 001, com números medidos
em tempo real. Quando houver projetos de clientes para publicar, eles entram como
uma nova seção antes dela — a estrutura de capítulos já comporta.

Nada neste site é fictício: não há clientes, números, depoimentos ou tecnologias
inventados. Se um dado não pôde ser verificado, ele não está aqui.

---

## Formulário de contato

Não há backend, e o formulário **não finge enviar nada**. Ele valida, monta a
mensagem e abre o canal real escolhido — WhatsApp (primário) ou e-mail.

Para plugar um backend, preencha `ENDPOINT` em `js/modules/contact.js` e trate a
resposta no ponto de extensão já marcado; o resto do fluxo continua igual.

---

## Antes de publicar

1. **Domínio.** `og:url`, `og:image`, `twitter:image`, `robots.txt` e
   `sitemap.xml` assumem `https://nucleotech.com.br/`. Se o domínio for outro,
   troque nesses quatro lugares. A `<link rel="canonical">` é relativa e continua
   correta em qualquer domínio.
2. **E-mail.** O endereço `nucleotech.suporte@gmail.com.br` veio do site
   anterior e provavelmente tem um erro de digitação (`gmail.com.br` não existe
   como domínio do Gmail). Ele foi preservado exatamente como estava — confirme
   e corrija em `index.html`, `js/modules/contact.js` e `js/modules/command.js`.
3. **Compressão.** Ative gzip/brotli no servidor. O CSS e o JS caem para menos de
   um terço do tamanho.

---

Feito por Leonardo Brito.
