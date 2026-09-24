# AquaVision: landing page de validação de demanda

Landing page com formulário próprio para medir **demanda** e **faixa de preço aceitável** do AquaVision
(sistema de apoio à detecção de afogamentos em piscinas: visão computacional + câmeras IP, com processamento
em um mini-PC no local). Sugestão da Escola de Startups (UniAmérica + Itaipu Parquetec). Demo Day: **31/10**.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Landing + formulário condicional. Página estática, sem dependências. A configuração fica no topo do `<script>` (`CONFIG`). |
| `apps-script.gs` | Web App do Google Apps Script que grava as respostas no Google Sheets, na aba **Home** e na aba **Pro**. |
| `midia/` | Fotos e vídeos de demonstração (veja "Fotos e vídeos"). |

## Formulário

A primeira pergunta, **"Onde fica a piscina?"**, separa os ramos:
**Casa → Home**; **Condomínio, Hotel/pousada, Clube ou Outro → Pro**. Cada ramo tem 8 perguntas
(6 quando a pessoa escolhe "Não pagaria").

| # | Home | Pro |
|---|---|---|
| 1 | Onde fica a piscina? | Onde fica a piscina? |
| 2 | Crianças frequentam? (sim/não + faixas de idade) | Pessoas por dia na temporada |
| 3 | Segurança atual (múltipla escolha; "Nenhuma dessas" é exclusiva) | Quem vigia a piscina |
| 4 | Já tem câmera que mostra a piscina? | Quem decide a compra |
| 5 | Preço máximo/mês (select de faixas, com "Não pagaria") | idem |
| 6 | Chance de contratar nesse valor (1 a 5). Não aparece se escolher "Não pagaria". | idem |
| 7 | Plano preferido: Fidelidade, Flex ou "Tanto faz". Não aparece se escolher "Não pagaria". | idem |
| 8 | E-mail (opcional, só para aviso de lançamento) | idem |

- A pergunta de preço usa como referência o **plano Fidelidade** (aparelho incluso na mensalidade), para que
  "valor máximo por mês" signifique a mesma coisa para todos. O texto fica em `#dica-preco` no `index.html`.
- Se a pessoa trocar a faixa de preço depois de responder a chance, a chance é apagada e precisa ser
  respondida de novo, porque ela se refere à faixa escolhida.
- A pergunta do plano apresenta a troca de forma neutra: **Fidelidade** (não paga o aparelho, mensalidade
  maior, com contrato) × **Flex** (paga o aparelho no início, mensalidade menor). Cruzando com a faixa de
  preço, dá para ver se quem aceita valores mais altos prefere não pagar o aparelho, por exemplo.
- O **consentimento LGPD** só aparece, e só é obrigatório, quando o e-mail é preenchido. O servidor também
  só grava o e-mail se houver consentimento.
- **Não há aceite de contato**: o texto diz que o e-mail serve só para o aviso de lançamento.
- Os valores **não aparecem** na página, para não influenciar as respostas.
- Há um campo invisível anti-robô (honeypot): respostas que o preenchem são ignoradas.

### Colunas na planilha

**Home:** Data/hora · Onde fica a piscina · Crianças frequentam · Idades das crianças · Segurança atual ·
Já tem câmera · Preço máximo/mês · Nível da faixa (0 = não pagaria) · Chance de contratar (1-5) ·
**Plano preferido** · **Deixou e-mail** (sim/não) · E-mail · Consentimento LGPD · Origem · Versão do formulário

**Pro:** Data/hora · Onde fica a piscina · Pessoas por dia · Quem vigia a piscina · Quem decide a compra ·
e as mesmas colunas a partir de "Preço máximo/mês".

- **Nível da faixa**: 0 = "Não pagaria", 1 = faixa mais baixa, e assim por diante. Serve para contar
  quem aceita pelo menos certa faixa, por exemplo `=CONT.SE(H:H;">=3")` na aba Home
  (na aba Pro, a coluna é a G).
- **Deixou e-mail**: permite cruzar interesse com faixa de preço sem precisar ler os e-mails.
- **Origem**: `utm_source / utm_medium / utm_campaign` da URL. Sem UTM, fica o site de origem ou `direto`.
  Use um link por canal, por exemplo `...?utm_source=whatsapp&utm_campaign=grupo-condominios`.
  O botão de compartilhar da tela final usa `utm_source=compartilhamento`.
- O script grava **pelo nome do cabeçalho**. Se uma aba já existir com colunas antigas, as colunas novas
  (como "Plano preferido") são acrescentadas no fim, sem desalinhar as respostas anteriores. Pode também
  reordenar as colunas na planilha à vontade, desde que não renomeie os cabeçalhos.
- **Versão do formulário**: vem de `CONFIG.VERSAO_FORM`. Troque o valor se mudar perguntas ou faixas
  com a pesquisa no ar, para não misturar respostas.

## Configuração (`CONFIG` no `index.html`)

```js
const CONFIG = {
  SCRIPT_URL: '',          // URL /exec do App da Web
  PRECOS_HOME: [ ... ],    // faixas em ordem crescente ("Não pagaria" entra sozinho)
  PRECOS_PRO:  [ ... ],
  VERSAO_FORM: '1',
  CONTATO_EMAIL: '',       // e-mail para pedidos de exclusão (LGPD)
  MIDIA: { hero, demo, home, pro },  // fotos e vídeos (veja abaixo)
};
```

Enquanto `SCRIPT_URL` estiver vazio, a página mostra um aviso de **modo de teste** acima do formulário
e não grava nada (a resposta aparece só no console do navegador).

## Fotos e vídeos

A página já tem os espaços prontos. Basta colocar os arquivos na pasta `midia/` e preencher
`CONFIG.MIDIA` no `index.html`. Nada precisa mudar no HTML.

| Espaço | Onde aparece | Vazio |
|---|---|---|
| `hero` | Quadro grande no topo, ao lado do título. Um vídeo aqui toca **sem som e em loop**. | Mostra a ilustração da câmera. |
| `demo` | Seção "Veja em ação", logo abaixo do topo. O 1º item fica grande; os demais, em grade. Fotos ampliam no clique. | A seção fica escondida. |
| `home`, `pro` | Foto de capa dos cartões AquaVision Home e Pro. | Mostra um ícone. |

```js
MIDIA: {
  hero: { tipo: 'video', src: 'midia/hero.mp4', poster: 'midia/hero.jpg', legenda: 'Protótipo em teste' },
  demo: [
    { tipo: 'video', src: 'midia/demo.mp4', poster: 'midia/demo.jpg', legenda: 'Protótipo detectando uma situação simulada' },
    { tipo: 'youtube', src: 'https://youtu.be/XXXXXXXXXXX', legenda: 'Demonstração completa' },
    { tipo: 'foto', src: 'midia/aparelho.jpg', alt: 'Aparelho AquaVision', legenda: 'O aparelho (mini-PC)' },
  ],
  home: 'midia/home.jpg',
  pro: 'midia/pro.jpg',
},
```

- **Tipos:** `foto` (JPG/WebP), `video` (MP4 ou WebM) e `youtube` (link ou ID). O player do YouTube só
  carrega quando a pessoa clica.
- **Vídeo:** MP4 (H.264), 1280 a 1920 px de largura, formato 16:9, idealmente **até 10 MB**. Vídeos mais
  longos ficam melhor no YouTube. O GitHub recusa arquivos acima de 100 MB. Sempre informe um `poster`
  (uma imagem do vídeo), que aparece enquanto ele carrega. Para comprimir:
  `ffmpeg -i original.mov -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -an midia/hero.mp4`
  (o `-an` tira o áudio, que o vídeo do topo não usa).
- **Fotos:** 1600 px de largura e até ~300 KB cada. Nas capas Home/Pro, prefira 16:9.
- **`alt`:** descreva a foto em poucas palavras, para leitores de tela.
- **Honestidade:** identifique na `legenda` quando for protótipo, teste ou situação simulada. Não mostre
  o produto fazendo algo que ele ainda não faz.
- **Direito de imagem:** tenha autorização de quem aparece. Com **crianças**, a autorização precisa ser dos
  pais ou responsáveis (LGPD, art. 14). Para demonstrações, prefira adultos ou pessoas não identificáveis.

## Publicar o Apps Script (pendência 1)

1. Crie uma planilha no Google Sheets e deixe-a **privada** (ela vai guardar e-mails).
2. Na planilha: **Extensões > Apps Script**. Apague o conteúdo, cole `apps-script.gs` e salve.
3. Em **Configurações do projeto**, confira o fuso horário (America/Sao_Paulo).
4. **Implantar > Nova implantação > Tipo: App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Autorize o acesso quando pedir e copie a URL que termina em `/exec`.
6. Cole a URL em `CONFIG.SCRIPT_URL` no `index.html`.

As abas **Home** e **Pro** e seus cabeçalhos são criados na primeira resposta.

> Ao mudar o `apps-script.gs` depois de publicado, vá em **Implantar > Gerenciar implantações > editar
> (lápis) > Versão: Nova versão**. Assim a URL continua a mesma. Criar uma "nova implantação" gera outra URL.

## Testar o envio (pendência 4)

O envio usa `fetch` com `mode: "no-cors"`, porque o Apps Script não responde com cabeçalhos CORS.
A página **não consegue ler a resposta**: a tela de "obrigado" só confirma que a requisição saiu.
Por isso, confira na planilha:

1. Abra a URL `/exec` no navegador. Deve aparecer "AquaVision: App da Web ativo."
2. No editor do Apps Script, rode `testarGravacao`: ela grava uma linha de teste em cada aba.
3. Abra a página com `?utm_source=teste`, responda um fluxo **Home** e um **Pro**, com e sem e-mail,
   e com "Não pagaria". Confira se as linhas chegaram certas.
4. Apague as linhas com origem `teste` antes de divulgar.

## Hospedagem

É uma página estática: GitHub Pages (Settings > Pages > Deploy from a branch), Netlify, Vercel etc.

## Textos

- Usar "apoio à detecção" / "apoio à supervisão". Nunca prometer que o produto evita afogamentos.
- O rodapé e o FAQ dizem que o AquaVision **não substitui a presença de um adulto responsável**.

## Pendências

1. [ ] Publicar o Apps Script como App da Web e colar a URL em `CONFIG.SCRIPT_URL`.
2. [ ] Definir as faixas de preço reais em `CONFIG.PRECOS_HOME` e `CONFIG.PRECOS_PRO`. As atuais são
   provisórias. O preço planejado deve ficar nas faixas do meio.
3. [ ] Confirmar a fonte e o texto exato do dado "mais da metade das mortes por afogamento de crianças de
   1 a 9 anos no Brasil acontece em piscinas" (SOBRASA). Está na seção "Por que isso importa" do
   `index.html`, marcado com o comentário `PENDÊNCIA 3`.
4. [ ] Testar o envio e conferir as linhas na planilha (veja "Testar o envio").
5. [ ] Definir a meta de validação antes de divulgar, por exemplo: nº mínimo de respostas por ramo e
   % que aceita uma faixa que cubra o payback (coluna "Nível da faixa").
6. [ ] Recomendado (LGPD): preencher `CONFIG.CONTATO_EMAIL` com um e-mail para pedidos de exclusão.
