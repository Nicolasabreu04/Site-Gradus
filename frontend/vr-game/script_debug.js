// script_debug.js
// Versão instrumentada do script do quiz VR: logs, normalização, carregamento robusto.

const API_URL = "http://localhost:3000";

// Ler localStorage e log para diagnóstico
const alunoId = localStorage.getItem("alunoId");
const nomeAluno = localStorage.getItem("nomeAluno");
const cursoAluno = localStorage.getItem("cursoAluno");
const periodoAluno = localStorage.getItem("periodoAluno");
console.log("Dados localStorage:", { alunoId, nomeAluno, cursoAluno, periodoAluno });

if (!alunoId || !nomeAluno || !cursoAluno || !periodoAluno) {
  alert("Faça o cadastro antes de iniciar o jogo.");
  window.location.href = "../site/cadastro.html";
  throw new Error("Dados do aluno ausentes - redirecionando para cadastro");
}

function normalizarCurso(curso) {
  if (!curso) return 'tecnologia';
  const semAcento = curso.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (semAcento.includes('comput') || semAcento.includes('computacao')) return 'tecnologia';
  if (semAcento.includes('direito')) return 'direito';
  return 'tecnologia';
}

// Elementos A-Frame
const contadorEl = document.getElementById('contador');
const perguntaEl = document.getElementById('pergunta');
const feedbackEl = document.getElementById('feedback');
const boxEls = [
  document.getElementById('box0'),
  document.getElementById('box1'),
  document.getElementById('box2'),
  document.getElementById('box3'),
  document.getElementById('box4'),
];
const altEls = [
  document.getElementById('alt0'),
  document.getElementById('alt1'),
  document.getElementById('alt2'),
  document.getElementById('alt3'),
  document.getElementById('alt4'),
];

let bancoPerguntas = { tecnologia: {}, direito: {} };
let cursoSelecionado = '';
let periodoSelecionado = '';
let perguntas = [];
let perguntaAtual = null;
let perguntaAtualIndex = 0;
let pontuacaoFinal = 0;
let perguntaRespondida = false;

function setText(el, value, color) {
  if (!el) return;
  el.setAttribute('text', 'value', value);
  if (color) el.setAttribute('text', 'color', color);
}

function atualizarContador() {
  const total = perguntas.length || 0;
  setText(contadorEl, `Pergunta ${Math.min(perguntaAtualIndex+1, total)} de ${total} | Pontuação: ${pontuacaoFinal}`);
}

function atualizarFeedback(mensagem, cor = '#f5c66b') {
  setText(feedbackEl, mensagem, cor);
}

function resetarAlternativas() {
  boxEls.forEach((box) => {
    if (!box) return;
    box.setAttribute('material', 'color', '#1d2a42');
    box.setAttribute('material', 'opacity', 0.96);
    box.setAttribute('visible', true);
  });
  altEls.forEach((alt) => {
    if (!alt) return;
    alt.setAttribute('visible', true);
    alt.setAttribute('text', 'color', '#eef4fb');
  });
  perguntaRespondida = false;
}

function mostrarPergunta() {
  if (perguntaAtualIndex >= perguntas.length) {
    finalizarQuiz();
    return;
  }
  perguntaAtual = perguntas[perguntaAtualIndex];
  atualizarContador();
  setText(perguntaEl, perguntaAtual.pergunta || '');
  atualizarFeedback('Escolha uma alternativa.');
  resetarAlternativas();
  altEls.forEach((alt, i) => {
    if (!alt) return;
    alt.setAttribute('text', 'value', perguntaAtual.opcoes[i] || '');
  });
}

function responder(idx) {
  if (perguntaRespondida || !perguntaAtual) return;
  perguntaRespondida = true;
  const correta = idx === perguntaAtual.correta;
  if (correta) {
    pontuacaoFinal += 10;
    atualizarFeedback('Correto!', '#3fd497');
  } else {
    atualizarFeedback('Errado!', '#ff6b6b');
  }
  boxEls.forEach((box, i) => {
    if (!box) return;
    if (i === idx) box.setAttribute('material', 'color', correta ? '#39d98a' : '#ff6b6b');
    else if (i === perguntaAtual.correta) box.setAttribute('material', 'color', '#39d98a');
    else box.setAttribute('material', 'opacity', 0.5);
  });
  atualizarContador();
  salvarResposta(perguntaAtual, idx, correta);
  setTimeout(() => {
    perguntaAtualIndex += 1;
    mostrarPergunta();
  }, 2000);
}

async function carregarBancoPerguntas() {
  try {
    const rTech = await fetch('tech.json');
    if (!rTech.ok) throw new Error(`tech.json HTTP ${rTech.status}`);
    const techJson = await rTech.json();
    console.log('tech.json:', techJson);

    const rDir = await fetch('direito.json');
    if (!rDir.ok) throw new Error(`direito.json HTTP ${rDir.status}`);
    const direitoJson = await rDir.json();
    console.log('direito.json:', direitoJson);

    bancoPerguntas.tecnologia = techJson.tecnologia || techJson.tech || techJson;
    bancoPerguntas.direito = direitoJson.direito || direitoJson;

    cursoSelecionado = normalizarCurso(cursoAluno);
    periodoSelecionado = periodoAluno.toString();

    perguntas = bancoPerguntas[cursoSelecionado]?.[periodoSelecionado] || [];

    console.log('Curso selecionado:', cursoSelecionado);
    console.log('Período selecionado:', periodoSelecionado);
    console.log('Perguntas selecionadas (count):', perguntas.length);

    if (!perguntas || perguntas.length === 0) {
      setText(perguntaEl, 'Nenhuma pergunta encontrada para este curso e período.');
      atualizarFeedback('Verifique o cadastro ou os arquivos JSON.', '#ffcc66');
      return;
    }

    mostrarPergunta();
  } catch (error) {
    console.error('Erro ao carregar quiz:', error);
    setText(perguntaEl, 'Erro ao carregar o quiz.');
    atualizarFeedback('Abra o console para detalhes.', '#ff6b6b');
  }
}

async function salvarResposta(p, idx, correta) {
  const body = {
    alunoId,
    nome: nomeAluno,
    curso: cursoAluno,
    periodo: periodoAluno,
    pergunta: p.pergunta,
    respostaEscolhida: p.opcoes[idx],
    respostaCorreta: p.opcoes[p.correta],
    acertou: correta,
    pontuacao: correta ? 10 : 0,
  };
  try {
    await fetch(`${API_URL}/respostas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('Resposta enviada ao backend', body);
  } catch (err) {
    console.error('Erro ao salvar resposta no backend:', err);
  }
}

function finalizarQuiz() {
  setText(contadorEl, `Pontuação final: ${pontuacaoFinal}`);
  setText(perguntaEl, 'Obrigado por participar!');
  atualizarFeedback('As respostas foram registradas com sucesso.', '#bdd8ff');
  boxEls.forEach((box) => { if (box) box.setAttribute('visible', false); });
  altEls.forEach((alt) => { if (alt) alt.setAttribute('visible', false); });
}

window.responder = responder;
window.addEventListener('load', () => {
  carregarBancoPerguntas();
});