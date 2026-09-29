# Núcleo Tech

Site da Núcleo Tech: sites, sistemas sob medida, atendimento automático no
WhatsApp e inteligência artificial para empresas. Sobral, CE.

**O site tem um objetivo só: fazer o visitante clicar no WhatsApp.**
Toda seção leva a isso. Se uma mudança não ajuda nesse objetivo, ela não entra.

HTML, CSS e JavaScript puros. Sem framework, sem `package.json`, sem etapa de
montagem. Abrir os arquivos num servidor estático é a publicação inteira.

---

## Rodar na sua máquina

```bash
python3 -m http.server 8080
# http://localhost:8080
```

Não há instalação nem dependências.

---

## Arquivos

```
index.html                      A página inteira. Todo o texto está aqui.
style.css                       Todo o visual.
robots.txt

favicon.ico  favicon.svg        Ícones da aba e do celular (kit da marca).
apple-touch-icon.png
icon-192.png  icon-512.png
icon-maskable-512.png
site.webmanifest
og-image.png                    Imagem da prévia quando o link é compartilhado.

brand/                          A logo em SVG, nas versões do kit da marca.
assets/fonts/
  archivo.woff2                 Títulos e texto. Fonte variável, com o eixo de
                                largura (wdth) que o .nt-display usa em 112%.
  jetbrains-mono-600.woff2      Rótulos em caixa alta (.nt-label).
```

> **Atenção ao publicar na Vercel:** os ícones e a pasta `brand/` ficam na raiz
> do repositório, ao lado do `index.html`. **Não crie uma pasta `public/`.**
> Com o preset "Other", a Vercel passaria a publicar só o conteúdo dela e o
> site inteiro daria erro 404.

---

## Como mexer no conteúdo

Tudo está em `index.html`, em português, sem nenhum sistema de template.

| O que mudar | Onde |
|---|---|
| Textos de qualquer seção | direto no `index.html` |
| Acrescentar um case | copie o bloco `<article class="case">` inteiro e troque os textos (há um comentário marcando o ponto) |
| Perguntas frequentes | cada `<details class="q">` é uma pergunta |
| WhatsApp, e-mail, Instagram | procure por `5588993020040`. O número aparece nos botões, no rodapé e nos dados estruturados |

### Um número de WhatsApp só

O site inteiro usa **(88) 99302-0040**, sempre com o mesmo link:

```
https://wa.me/5588993020040?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20N%C3%BAcleo%20Tech
```

Se um dia o número mudar, troque em todas as ocorrências de uma vez. Dois
números diferentes no mesmo site já causaram confusão aqui antes.

### Regra dos textos

Quem lê é dono ou gerente de empresa, não programador. **Se um dono de loja de
50 anos não entender na primeira leitura, reescreva.** Nada de "deploy",
"stack", "framework", "API", "performance", "escalável", "soluções digitais".
Fale do resultado para o cliente, não da técnica.

### O que está faltando preencher

- **Foto do Leonardo** na seção "Quem faz". Enquanto não houver, o bloco mostra
  o símbolo da marca. O comentário no `index.html` explica como trocar.

Nada neste site é inventado: não há cliente, número, prazo ou depoimento que
não tenha sido confirmado. Se um dado não pôde ser verificado, ele não está aqui.

---

## Marca

Cores e fontes vêm do kit da marca (`brand-tokens.css`), copiados para o topo
do `style.css` como variáveis `--nt-*`.

| Token | Valor | Uso |
|---|---|---|
| `--nt-ink` | `#0b1012` | fundo principal |
| `--nt-surface` | `#141b1e` | cartões |
| `--nt-line` | `#1e2629` | bordas |
| `--nt-ice` | `#f3f6f6` | texto (17,6:1) |
| `--nt-teal` | `#2dd4bf` | destaques e botão principal (10,3:1) |
| `--nt-gray-300` | `#a9b6b9` | texto de apoio (9,2:1) |
| `--nt-gray-500` | `#7c8b8f` | legendas (5,4:1) |

**Logo:** no cabeçalho, a horizontal para fundo escuro, com no mínimo 140px de
largura (regra do manual). Não estique, não gire, não troque as cores, sem
sombra. Onde não couberem 140px, use só o símbolo (`brand/simbolo-escuro.svg`).

**Fontes servidas pelo próprio site.** Nenhuma requisição ao Google Fonts nem a
qualquer outro domínio: menos conexões, nada bloqueando a primeira pintura e o
texto aparecendo antes no 4G fraco. Se um dia alguém trocar por um `<link>` do
Google, o site fica mais lento. Foi medido.

---

## Regras que sustentam a velocidade

- **Celular primeiro.** Testado em 360px de largura. Nenhuma rolagem lateral.
- **Texto de 16px para cima** e todo botão ou link com pelo menos 44px de área
  de toque.
- **Só animações de `transform` e `opacity`**, que não obrigam o navegador a
  recalcular a página. `prefers-reduced-motion: reduce` desliga tudo.
- **Imagens em WebP**, sempre com `width` e `height` escritos, e `loading="lazy"`
  em tudo que estiver fora da primeira tela. É isso que mantém o deslocamento
  de layout em zero.
- **Quase nenhum JavaScript.** O único script do site cabe no fim do
  `index.html` e faz uma coisa: revelar os blocos conforme entram na tela.
  As perguntas frequentes são `<details>` nativos e não precisam de código.
  Sem JavaScript, o site continua inteiro e legível.

### Medição (Lighthouse, celular)

| | |
|---|---|
| Desempenho | 99 |
| Acessibilidade | 100 |
| Boas práticas | 100 |
| SEO | 100 |
| Peso total da página | 159 KB (fontes incluídas) |
| Deslocamento de layout | 0 |

---

## Publicação na Vercel

Site estático puro: **não há build**.

- Framework Preset: **Other**
- Build Command, Output Directory, Install Command: todos **vazios**

O endereço é `https://agencianucleotech.vercel.app`. Ele aparece escrito no
`index.html` em `canonical`, `og:url` e `og:image`. O Open Graph exige
endereço completo, senão a prévia do link no WhatsApp não carrega a imagem.
Se o domínio mudar, troque nesses três lugares.

### Antes de divulgar

Cole o endereço numa conversa do WhatsApp e confira se a prévia aparece com a
imagem. Confira também se estes endereços abrem:

- `/favicon.ico`
- `/og-image.png`
- `/site.webmanifest`
- `/brand/logo-horizontal-escuro.svg`

---

Feito por Leonardo Brito.
