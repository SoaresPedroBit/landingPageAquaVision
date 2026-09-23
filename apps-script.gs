/**
 * AquaVision — recebe as respostas da landing page e grava no Google Sheets.
 *
 * Como publicar (veja o README para o passo a passo):
 *   1. Na planilha: Extensões > Apps Script, cole este arquivo e salve.
 *   2. Implantar > Nova implantação > Tipo "App da Web".
 *      Executar como: "Eu". Quem pode acessar: "Qualquer pessoa".
 *   3. Copie a URL (termina em /exec) para CONFIG.SCRIPT_URL no index.html.
 *   Ao alterar este código, publique uma NOVA VERSÃO da mesma implantação
 *   (Implantar > Gerenciar implantações > editar), senão a URL continua com o código antigo.
 *
 * Cada ramo grava em uma aba ("Home" e "Pro"). As abas e os cabeçalhos
 * são criados automaticamente na primeira resposta.
 */

// Vazio = usa a planilha à qual o script está vinculado (Extensões > Apps Script).
// Para um script avulso, cole aqui o ID da planilha (o trecho entre /d/ e /edit na URL).
const SPREADSHEET_ID = '';

// [cabeçalho na planilha, campo enviado pela página]
const COMUNS_FIM = [
  ['Preço máximo/mês', 'precoFaixa'],
  ['Nível da faixa (0 = não pagaria)', 'precoNivel'],
  ['Chance de contratar (1-5)', 'chance'],
  ['Deixou e-mail', 'deixouEmail'],
  ['E-mail', 'email'],
  ['Consentimento LGPD', 'consentimento'],
  ['Origem', 'origem'],
  ['Versão do formulário', 'versao'],
];

const ABAS = {
  home: {
    nome: 'Home',
    colunas: [
      ['Data/hora', 'dataHora'],
      ['Onde fica a piscina', 'local'],
      ['Crianças frequentam', 'criancas'],
      ['Idades das crianças', 'idades'],
      ['Segurança atual', 'seguranca'],
      ['Já tem câmera', 'camera'],
    ].concat(COMUNS_FIM),
  },
  pro: {
    nome: 'Pro',
    colunas: [
      ['Data/hora', 'dataHora'],
      ['Onde fica a piscina', 'local'],
      ['Pessoas por dia', 'pessoas'],
      ['Quem vigia a piscina', 'vigia'],
      ['Quem decide a compra', 'decide'],
    ].concat(COMUNS_FIM),
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const dados = lerDados_(e);

  // Honeypot: campo invisível que só robôs preenchem. Finge sucesso e não grava.
  if (dados.website) return resposta_({ ok: true });

  const aba = ABAS[dados.ramo];
  if (!aba) return resposta_({ ok: false, erro: 'ramo inválido' });

  const linha = montarLinha_(aba, normalizar_(dados));

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return resposta_({ ok: false, erro: 'planilha ocupada, tente de novo' });
  }
  try {
    obterAba_(aba).appendRow(linha);
  } finally {
    lock.releaseLock();
  }
  return resposta_({ ok: true });
}

// Abrir a URL /exec no navegador mostra esta mensagem: serve para conferir a publicação.
function doGet() {
  return ContentService.createTextOutput('AquaVision: App da Web ativo. As respostas chegam via POST.');
}

/**
 * Pendência 4: rode esta função no editor (Executar) para gravar uma linha
 * de teste em cada aba. Depois apague as linhas com origem "teste".
 */
function testarGravacao() {
  const exemplos = [
    {
      ramo: 'home', local: 'Casa', criancas: 'Sim', idades: ['Até 3 anos', '4 a 6 anos'],
      seguranca: ['Cerca ou grade com portão'], camera: 'Não tenho câmera',
      precoFaixa: 'R$ 50 a R$ 79', precoNivel: 3, chance: 4,
      email: 'teste@exemplo.com', consentimento: true, origem: 'teste', versao: 'teste',
    },
    {
      ramo: 'pro', local: 'Condomínio', pessoas: '21 a 50', vigia: 'Funcionário com outras funções',
      decide: 'Síndico(a) ou administradora', precoFaixa: 'Não pagaria', precoNivel: 0, chance: '',
      email: '', consentimento: false, origem: 'teste', versao: 'teste',
    },
  ];
  exemplos.forEach(function (d) {
    const r = doPost({ postData: { contents: JSON.stringify(d), type: 'text/plain' } });
    Logger.log(d.ramo + ': ' + r.getContent());
  });
}

/* ---------------- auxiliares ---------------- */

function lerDados_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      const obj = JSON.parse(e.postData.contents);
      if (obj && typeof obj === 'object') return obj;
    } catch (err) {
      // não é JSON: tenta os parâmetros de formulário abaixo
    }
  }
  return (e && e.parameter) || {};
}

function normalizar_(d) {
  const email = String(d.email || '').trim().toLowerCase().slice(0, 254);
  const consentiu = d.consentimento === true || d.consentimento === 'true' || d.consentimento === 'sim';
  // Só guarda o e-mail se for válido E tiver consentimento (LGPD).
  const guardarEmail = EMAIL_RE.test(email) && consentiu;
  const nivel = inteiro_(d.precoNivel, 0, 20);

  return {
    dataHora: new Date(),
    local: texto_(d.local),
    criancas: texto_(d.criancas),
    idades: lista_(d.idades),
    seguranca: lista_(d.seguranca),
    camera: texto_(d.camera),
    pessoas: texto_(d.pessoas),
    vigia: texto_(d.vigia),
    decide: texto_(d.decide),
    precoFaixa: texto_(d.precoFaixa),
    precoNivel: nivel,
    // Quem escolhe "Não pagaria" não responde a chance.
    chance: nivel === 0 ? '' : inteiro_(d.chance, 1, 5),
    deixouEmail: guardarEmail ? 'sim' : 'não',
    email: guardarEmail ? texto_(email, 254) : '',
    consentimento: guardarEmail ? 'sim' : '',
    origem: texto_(d.origem, 120),
    versao: texto_(d.versao, 20),
  };
}

function montarLinha_(aba, valores) {
  return aba.colunas.map(function (c) {
    const v = valores[c[1]];
    return v === undefined || v === null ? '' : v;
  });
}

function obterAba_(aba) {
  const planilha = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = planilha.getSheetByName(aba.nome);
  if (!sheet) sheet = planilha.insertSheet(aba.nome);
  if (sheet.getLastRow() === 0) {
    const cabecalho = aba.colunas.map(function (c) { return c[0]; });
    sheet.appendRow(cabecalho);
    sheet.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
  return sheet;
}

// Texto seguro para célula: sem caracteres de controle, com limite de tamanho
// e sem virar fórmula (valores começando com = + - @ ganham um apóstrofo).
function texto_(v, max) {
  if (v === undefined || v === null) return '';
  let s = String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function lista_(v) {
  const itens = Array.isArray(v) ? v : (v ? [v] : []);
  return texto_(itens.map(function (i) { return String(i).trim(); }).filter(String).join(', '), 500);
}

function inteiro_(v, min, max) {
  if (v === '' || v === undefined || v === null) return '';
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : '';
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
