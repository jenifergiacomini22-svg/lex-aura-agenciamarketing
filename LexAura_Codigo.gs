// ═══════════════════════════════════════════════════════════
// LEX AURA APP — Código.gs  (API REST)
// Frentes: jenifer | douglas | agencia | socios-la
// ═══════════════════════════════════════════════════════════

const SPREADSHEET_ID = '';   // Cole aqui o ID da sua Google Sheet da Lex Aura
const SHEET_IDEIAS   = 'Ideias';
const SHEET_TAREFAS  = 'Tarefas';
const SHEET_HABITOS  = 'Habitos';

// ── Chave de segurança ──
const API_KEY = 'GS@2026';  // Mesma senha do app HTML

// ═══════════════════════════════════════════════════════════
// ENTRY POINTS — doGet e doPost
// ═══════════════════════════════════════════════════════════

function doGet(e) {
  if (!e || !e.parameter) {
    return resposta({ status: 'Lex Aura API ativa', versao: '2.0' }, null);
  }
  const callback = e.parameter.callback || null;
  if (!e.parameter.key) return resposta({ status: 'Lex Aura API ativa' }, callback);
  if (e.parameter.key !== API_KEY) return resposta({ error: 'Acesso negado' }, callback);
  const acao = e.parameter.acao || 'getAllData';
  try {
    if (acao === 'getAllData') return resposta(getAllData(), callback);
    if (acao === 'saveAllData') {
      const data = JSON.parse(e.parameter.data || '{}');
      return resposta(saveAllData(data), callback);
    }
    return resposta({ error: 'Ação não reconhecida' }, callback);
  } catch(err) {
    return resposta({ error: err.message });
  }
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch(err) { return resposta({ error: 'JSON inválido' }); }

  if (body.key !== API_KEY) return resposta({ error: 'Acesso negado' });

  try {
    if (body.acao === 'saveAllData') return resposta(saveAllData(body.data));
    return resposta({ error: 'Ação não reconhecida' });
  } catch(err) {
    return resposta({ error: err.message });
  }
}

function resposta(dados, callback) {
  const json = JSON.stringify(dados);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════
// DADOS COMPLETOS
// ═══════════════════════════════════════════════════════════

function getAllData() {
  return {
    ideas:     getIdeas(),
    tasks:     getTasks(),
    habits:    getHabits(),
    dreams:    getDreams(),
    courses:   getCourses(),
    scripts:   getScripts(),
    prompts:   getPrompts(),
    rascunhos: getRascunhos()
  };
}

function saveAllData(data) {
  if (data.ideas)     saveIdeasToSheet(data.ideas);
  if (data.habits)    saveHabitsToSheet(data.habits);
  if (data.tasks)     saveTasksToSheet(data.tasks);
  if (data.dreams)    saveDreamsToSheet(data.dreams);
  if (data.courses)   saveCoursesToSheet(data.courses);
  if (data.scripts)   saveScriptsToSheet(data.scripts);
  if (data.prompts)   savePromptsToSheet(data.prompts);
  if (data.rascunhos) saveRascunhosToSheet(data.rascunhos);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// IDEIAS
// Frentes: jenifer | douglas | agencia | socios-la
// ═══════════════════════════════════════════════════════════

function getIdeas() {
  const sheet = getOrCreateSheet(SHEET_IDEIAS, [
    'ID','Título','Descrição','Tipo','Frente','Link','Imagem','Status','DataCriacao','DataPublicacao',
    'Perfil','NumArtes','TipoArte','Legenda','Hashtags','Categoria','Responsavel','Impacto','CategoriaConteudo'
  ]);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  return data.slice(1).filter(r => r[0]).map(r => ({
    id:                r[0],
    titulo:            r[1],
    descricao:         r[2],
    tipo:              r[3],
    frente:            r[4],
    link:              r[5]  || null,
    image:             r[6]  || null,
    status:            r[7],
    dataCriacao:       r[8],
    dataPublicacao:    r[9]  || null,
    perfil:            r[10] || null,
    numArtes:          r[11] || null,
    tipoArte:          r[12] || null,
    legenda:           r[13] || null,
    hashtags:          r[14] || null,
    categoria:         r[15] || null,
    responsavel:       r[16] || null,
    impacto:           r[17] || null,
    categoriaConteudo: r[18] || 'conteudo'
  }));
}

function saveIdeasToSheet(ideas) {
  const sheet = getOrCreateSheet(SHEET_IDEIAS, [
    'ID','Título','Descrição','Tipo','Frente','Link','Imagem','Status','DataCriacao','DataPublicacao',
    'Perfil','NumArtes','TipoArte','Legenda','Hashtags','Categoria','Responsavel','Impacto','CategoriaConteudo'
  ]);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  ideas.forEach(i => {
    sheet.appendRow([
      i.id, i.titulo, i.descricao || '', i.tipo, i.frente,
      i.link || '', '', i.status, i.dataCriacao || '', i.dataPublicacao || '',
      i.perfil || '', i.numArtes || '', i.tipoArte || '', i.legenda || '', i.hashtags || '',
      i.categoria || '', i.responsavel || '', i.impacto || '', i.categoriaConteudo || 'conteudo'
    ]);
  });
}

// ── Filtros por frente ──
function getJeniferIdeas()  { return getIdeas().filter(i => i.frente === 'jenifer'); }
function getDouglasIdeas()  { return getIdeas().filter(i => i.frente === 'douglas'); }
function getAgenciaIdeas()  { return getIdeas().filter(i => i.frente === 'agencia'); }
function getSociosIdeas()   { return getIdeas().filter(i => i.frente === 'socios-la'); }

// ── Roteiros por sócio ──
function getRoteirosJenifer() {
  return getIdeas().filter(i => i.frente === 'jenifer' && i.tipo === 'roteiro' && (i.status === 'gravar' || i.status === 'roteiro'));
}
function getRoteirosDouglas() {
  return getIdeas().filter(i => i.frente === 'douglas' && i.tipo === 'roteiro' && (i.status === 'gravar' || i.status === 'roteiro'));
}

// ═══════════════════════════════════════════════════════════
// TAREFAS
// ═══════════════════════════════════════════════════════════

function getTasks() {
  const sheet = getOrCreateSheet(SHEET_TAREFAS, [
    'Data','ID','Título','Hora','Prioridade','Nota','Done','IdeaId'
  ]);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};

  const tasks = {};
  data.slice(1).filter(r => r[0] && r[1]).forEach(r => {
    const date = r[0];
    if (!tasks[date]) tasks[date] = [];
    tasks[date].push({
      id:         r[1],
      titulo:     r[2],
      hora:       r[3] || '',
      prioridade: r[4] || 'MÉDIA',
      nota:       r[5] || '',
      done:       r[6] === true || r[6] === 'TRUE',
      ideaId:     r[7] || null
    });
  });
  return tasks;
}

function saveTasksToSheet(tasks) {
  const sheet = getOrCreateSheet(SHEET_TAREFAS, [
    'Data','ID','Título','Hora','Prioridade','Nota','Done','IdeaId'
  ]);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  Object.entries(tasks).forEach(([date, dayTasks]) => {
    dayTasks.forEach(t => {
      sheet.appendRow([date, t.id, t.titulo, t.hora || '', t.prioridade || 'MÉDIA',
        t.nota || '', t.done ? 'TRUE' : 'FALSE', t.ideaId || '']);
    });
  });
}

// ═══════════════════════════════════════════════════════════
// HÁBITOS
// ═══════════════════════════════════════════════════════════

function getHabits() {
  const sheet = getOrCreateSheet(SHEET_HABITOS, [
    'ID','Nome','Descrição','IdeaId','Completados'
  ]);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  return data.slice(1).filter(r => r[0]).map(r => ({
    id:          r[0],
    nome:        r[1],
    descricao:   r[2] || '',
    ideaId:      r[3] || null,
    completados: r[4] ? r[4].toString().split(',').filter(Boolean) : []
  }));
}

function saveHabitsToSheet(habits) {
  const sheet = getOrCreateSheet(SHEET_HABITOS, [
    'ID','Nome','Descrição','IdeaId','Completados'
  ]);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  habits.forEach(h => {
    sheet.appendRow([h.id, h.nome, h.descricao || '', h.ideaId || '',
      (h.completados || []).join(',')]);
  });
}

// ═══════════════════════════════════════════════════════════
// SONHOS, CURSOS, ROTEIROS, PROMPTS, RASCUNHOS
// (PropertiesService — prefixo "la_" para não misturar com GS App)
// ═══════════════════════════════════════════════════════════

function getDreams() {
  const raw = PropertiesService.getScriptProperties().getProperty('la_dreams');
  return raw ? JSON.parse(raw) : [];
}
function saveDreamsToSheet(d) {
  PropertiesService.getScriptProperties().setProperty('la_dreams', JSON.stringify(d));
}

function getCourses() {
  const raw = PropertiesService.getScriptProperties().getProperty('la_courses');
  return raw ? JSON.parse(raw) : [];
}
function saveCoursesToSheet(d) {
  PropertiesService.getScriptProperties().setProperty('la_courses', JSON.stringify(d));
}

// Roteiros — { id, titulo, conteudo, socio: 'jenifer' | 'douglas' }
function getScripts() {
  const raw = PropertiesService.getScriptProperties().getProperty('la_scripts');
  return raw ? JSON.parse(raw) : [];
}
function saveScriptsToSheet(d) {
  PropertiesService.getScriptProperties().setProperty('la_scripts', JSON.stringify(d));
}

function getPrompts() {
  const raw = PropertiesService.getScriptProperties().getProperty('la_prompts');
  return raw ? JSON.parse(raw) : [];
}
function savePromptsToSheet(d) {
  PropertiesService.getScriptProperties().setProperty('la_prompts', JSON.stringify(d));
}

// Rascunhos — { id, texto, frente, dataCriacao }
function getRascunhos() {
  const raw = PropertiesService.getScriptProperties().getProperty('la_rascunhos');
  return raw ? JSON.parse(raw) : [];
}
function saveRascunhosToSheet(d) {
  PropertiesService.getScriptProperties().setProperty('la_rascunhos', JSON.stringify(d));
}

// ═══════════════════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════════════════

function getStats() {
  const ideas = getIdeas();
  return {
    total:     ideas.length,
    jenifer:   ideas.filter(i => i.frente === 'jenifer').length,
    douglas:   ideas.filter(i => i.frente === 'douglas').length,
    agencia:   ideas.filter(i => i.frente === 'agencia').length,
    socios:    ideas.filter(i => i.frente === 'socios-la').length,
    porStatus: {
      bruto:     ideas.filter(i => i.status === 'bruto').length,
      roteiro:   ideas.filter(i => i.status === 'roteiro').length,
      gravar:    ideas.filter(i => i.status === 'gravar').length,
      publicado: ideas.filter(i => i.status === 'publicado').length
    }
  };
}

// ═══════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════

function getOrCreateSheet(name, headers) {
  let ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    const hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setBackground('#7B52A0');  // Roxo Lex Aura
    hRange.setFontColor('#FFFFFF');
    hRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function log(msg) {
  Logger.log(JSON.stringify(msg));
}
