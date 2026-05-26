// script.js
// Integra o quiz VR com o backend do Gradus e carrega perguntas dos JSONs.

const API_URL = "http://localhost:3000";

// Leitura dos dados do aluno no localStorage
const alunoId = localStorage.getItem("alunoId");
const nomeAluno = localStorage.getItem("nomeAluno");
const cursoAluno = localStorage.getItem("cursoAluno");
const periodoAluno = localStorage.getItem("periodoAluno");

// Se faltar dado, redireciona para cadastro
if (!alunoId || !nomeAluno || !cursoAluno || !periodoAluno) {
  alert("Faça o cadastro antes de iniciar o jogo.");
  window.location.href = "../site/cadastro.html";
}

// Normaliza o nome do curso para as chaves dos JSONs
function nomearCurso(curso) {
  if (!curso) return "";
  const valor = curso.toLowerCase();
  if (valor.includes("comput") || valor.includes("ciência") || valor.includes("ciencia")) return "tecnologia";
  if (valor.includes("direito")) return "direito";
  return valor;
}

const cursoSelecionado = nomearCurso(cursoAluno);
const periodoSelecionado = periodoAluno.trim();

// Elementos A-Frame obrigatórios
const contadorEl = document.getElementById("contador");
const perguntaEl = document.getElementById("pergunta");
const feedbackEl = document.getElementById("feedback");
const boxEls = [
  document.getElementById("box0"),
  document.getElementById("box1"),
  document.getElementById("box2"),
  document.getElementById("box3"),
  document.getElementById("box4"),
];
const altEls = [
  document.getElementById("alt0"),
  document.getElementById("alt1"),
  document.getElementById("alt2"),
  document.getElementById("alt3"),
  document.getElementById("alt4"),
];

// Estado do quiz
let perguntas = [];
let perguntaAtual = null;
let perguntaAtualIndex = 0;
let pontuacaoFinal = 0;
let perguntaRespondida = false;

// Atualiza contador no painel
function atualizarContador() {
  const total = perguntas.length || 0;
  contadorEl.setAttribute("text", "value", `Pergunta ${Math.min(perguntaAtualIndex+1, total)} de ${total} | Pontuação: ${pontuacaoFinal}`);
}

// Atualiza feedback curto
function atualizarFeedback(mensagem, cor = "#f5c66b") {
  feedbackEl.setAttribute("text", "value", mensagem);
  feedbackEl.setAttribute("text", "color", cor);
}

// Reseta visuais das alternativas
function resetarAlternativas() {
  boxEls.forEach((box) => {
    if (!box) return;
    box.setAttribute("material", "color", "#1d2a42");
    box.setAttribute("material", "opacity", 0.96);
    box.setAttribute("visible", true);
  });
  altEls.forEach((alt) => {
    if (!alt) return;
    alt.setAttribute("visible", true);
    alt.setAttribute("text", "color", "#eef4fb");
  });
  perguntaRespondida = false;
}

// Mostra a pergunta atual no painel
function mostrarPergunta() {
  if (perguntaAtualIndex >= perguntas.length) {
    finalizarQuiz();
    return;
  }
  perguntaAtual = perguntas[perguntaAtualIndex];
  atualizarContador();
  perguntaEl.setAttribute("text", "value", perguntaAtual.pergunta || "");
  atualizarFeedback("Escolha uma alternativa.");
  resetarAlternativas();
  altEls.forEach((alt, i) => {
    if (!alt) return;
    alt.setAttribute("text", "value", perguntaAtual.opcoes[i] || "");
  });
}

// Função chamada pelos onclick das caixas A-Frame
function responder(idx) {
  if (perguntaRespondida || !perguntaAtual) return;
  perguntaRespondida = true;
  const correta = idx === perguntaAtual.correta;
  if (correta) {
    pontuacaoFinal += 10;
    atualizarFeedback("Correto!", "#3fd497");
  } else {
    atualizarFeedback("Errado!", "#ff6b6b");
  }

  // Pintar alternativas: escolha, correta e dim as outras
  boxEls.forEach((box, i) => {
    if (!box) return;
    if (i === idx) box.setAttribute("material", "color", correta ? "#39d98a" : "#ff6b6b");
    else if (i === perguntaAtual.correta) box.setAttribute("material", "color", "#39d98a");
    else box.setAttribute("material", "opacity", 0.5);
  });

  atualizarContador();
  salvarResposta(perguntaAtual, idx, correta);

  // Próxima pergunta após 2 segundos
  setTimeout(() => {
    perguntaAtualIndex += 1;
    mostrarPergunta();
  }, 2000);
}

// Carrega JSON com tratamento simples
async function carregarJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.error(`Erro ao carregar ${url}:`, err);
    alert(`Não foi possível carregar os dados do jogo. Verifique o arquivo ${url}.`);
    return null;
  }
}

// Inicializa o quiz automaticamente
async function iniciarQuiz() {
  const techJson = await carregarJson('tech.json');
  const direitoJson = await carregarJson('direito.json');
  if (!techJson || !direitoJson) return;
  const jsonCurso = cursoSelecionado === 'direito' ? direitoJson : techJson;
  const nivel = String(periodoSelecionado);
  if (!jsonCurso[cursoSelecionado] || !jsonCurso[cursoSelecionado][nivel]) {
    console.error('Perguntas não encontradas para', { cursoSelecionado, periodoSelecionado });
    alert('Não foi possível encontrar perguntas para seu curso e período. Volte ao cadastro e tente novamente.');
    window.location.href = '../site/cadastro.html';
    return;
  }
  perguntas = jsonCurso[cursoSelecionado][nivel];
  mostrarPergunta();
}

// Envia a resposta ao backend; não trava o jogo se falhar
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

// Finaliza o quiz: limpa alternativas, mostra agradecimento e pontuação
function finalizarQuiz() {
  contadorEl.setAttribute('text', 'value', `Pontuação final: ${pontuacaoFinal}`);
  perguntaEl.setAttribute('text', 'value', 'Obrigado por participar!');
  atualizarFeedback('As respostas foram registradas com sucesso.', '#bdd8ff');

  boxEls.forEach((box) => { if (box) box.setAttribute('visible', false); });
  altEls.forEach((alt) => { if (alt) alt.setAttribute('visible', false); });
}

// Tornar função disponível para os onclick do A-Frame
window.responder = responder;
window.addEventListener('load', iniciarQuiz);
