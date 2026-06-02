// script.js
// VR Game Gradus com mapa interativo, escolha de cursos/períodos e quiz.

const API_URL = "http://localhost:3000";

// Leitura de dados do aluno do localStorage
const alunoId = localStorage.getItem("alunoId");
const nomeAluno = localStorage.getItem("nomeAluno");

// Se faltar dados, redireciona para cadastro
if (!alunoId || !nomeAluno) {
  alert("Faça o cadastro antes de iniciar o jogo.");
  window.location.href = "../site/cadastro.html";
}

// ===== DEBUG COMPONENT =====
// Registra cliques em objetos para depuração
AFRAME.registerComponent("click-debug", {
  init: function () {
    const material = this.el.getAttribute("material") || {};
    this.el.dataset.originalColor = material.color || this.el.getAttribute("color") || "#2ec4b6";

    this.el.addEventListener("click", () => {
      console.log("CLIQUE DETECTADO:", this.el.id || "sem-id");
    });

    this.el.addEventListener("mouseenter", () => {
      console.log("MIRA EM:", this.el.id || "sem-id");
      this.el.setAttribute("material", "color", "#FFD166");
    });

    this.el.addEventListener("mouseleave", () => {
      if (this.el.dataset.originalColor) {
        this.el.setAttribute("material", "color", this.el.dataset.originalColor);
      }
    });
  }
});

// Função de teste de clique
function testarClique(nome) {
  console.log("✓ Clique detectado:", nome);
}

// ===== ESTADO GLOBAL =====
let cursoSelecionado = null;
let periodoSelecionado = null;
let telaAtual = "mapa"; // mapa, salas, quiz, final

// Elementos A-Frame
const rig = document.getElementById("rig");
const interfacePanel = document.getElementById("interfacePanel");
const salasPanel = document.getElementById("salasPanel");
const contador = document.getElementById("contador");
const resultadoTitulo = document.getElementById("resultadoTitulo");
const pergunta = document.getElementById("pergunta");
const feedback = document.getElementById("feedback");
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

const btnVoltarMapa = document.getElementById("btnVoltarMapa");
const textBtnVoltar = document.getElementById("textBtnVoltar");
const btnSair = document.getElementById("btnSair");
const textBtnSair = document.getElementById("textBtnSair");

// Estado do quiz
let perguntas = [];
let perguntaAtual = null;
let perguntaAtualIndex = 0;
let pontuacaoFinal = 0;
let perguntaRespondida = false;

// ===== NAVEGAÇÃO =====

// Teleporta o rig para uma posição
function teleportar(x, z) {
  console.log("🚀 Teleportando para:", x, z);
  rig.setAttribute("position", `${x} 0 ${z}`);
}

// Mostra o mapa principal
function mostrarMapaPrincipal() {
  console.log("🗺️ Mostrando mapa principal");
  telaAtual = "mapa";
  salasPanel.setAttribute("visible", false);
  interfacePanel.setAttribute("visible", false);
  teleportar(0, 4);
}

// Escolhe um curso e mostra as salas
function escolherCursoVR(curso) {
  console.log("🏛️ Curso escolhido:", curso);
  cursoSelecionado = curso;
  telaAtual = "salas";
  interfacePanel.setAttribute("visible", false);

  // Atualiza título
  const titleEl = document.getElementById("titleSalas");
  const nomeCurso = curso === "tecnologia" ? "CC - CIENCIA DA COMPUTACAO" : "DIREITO";
  titleEl.setAttribute("text", "value", `${nomeCurso}\nESCOLHA UM PERIODO`);

  // Mostra salas conforme o curso
  const numSalas = curso === "tecnologia" ? 8 : 10;
  for (let i = 1; i <= 10; i++) {
    const salaEl = document.getElementById(`sala-periodo-${i}`);
    const textEl = document.getElementById(`sala-periodo-text-${i}`);
    if (salaEl) {
      salaEl.setAttribute("visible", i <= numSalas);
      if (textEl) textEl.setAttribute("visible", i <= numSalas);
      // Ajusta cor conforme curso
      if (curso === "tecnologia") {
        salaEl.setAttribute("material", "color", "#2a7f7f");
        salaEl.dataset.originalColor = "#2a7f7f";
      } else {
        salaEl.setAttribute("material", "color", "#6b3fa0");
        salaEl.dataset.originalColor = "#6b3fa0";
      }
    }
  }

  salasPanel.setAttribute("visible", true);
  teleportar(0, 2);
}

// Escolhe um período e inicia o quiz
async function escolherPeriodoVR(periodo) {
  console.log("PERIODO ESCOLHIDO:", periodo);
  console.log("CURSO ATUAL:", cursoSelecionado);
  periodoSelecionado = String(periodo);
  telaAtual = "quiz";
  salasPanel.setAttribute("visible", false);
  interfacePanel.setAttribute("visible", true);

  // Carrega perguntas e inicia quiz
  await iniciarQuiz();
}

// Volta ao mapa principal
function voltarMapa() {
  console.log("↩️ Voltando ao mapa...");
  telaAtual = "mapa";
  cursoSelecionado = null;
  periodoSelecionado = null;
  perguntaAtualIndex = 0;
  pontuacaoFinal = 0;
  perguntaRespondida = false;
  perguntas = [];
  perguntaAtual = null;
  atualizarFeedback("", "#f5c66b");
  pergunta.setAttribute("text", "value", "");
  resultadoTitulo.setAttribute("visible", false);
  boxEls.forEach((box) => {
    if (box) {
      box.setAttribute("visible", true);
      box.setAttribute("material", "color", "#1d2a42");
      box.setAttribute("material", "opacity", 0.96);
    }
  });
  altEls.forEach((alt) => {
    if (alt) {
      alt.setAttribute("visible", true);
      alt.setAttribute("text", "value", "");
    }
  });
  btnVoltarMapa.setAttribute("visible", false);
  textBtnVoltar.setAttribute("visible", false);
  btnSair.setAttribute("visible", false);
  textBtnSair.setAttribute("visible", false);
  salasPanel.setAttribute("visible", false);
  interfacePanel.setAttribute("visible", false);
  // Mostrar mapa/prédios e posicionar o rig na praça
  const predioCC = document.getElementById("predioCCGroup");
  const predioDireito = document.getElementById("predioDireitoGroup");
  if (predioCC) predioCC.setAttribute("visible", true);
  if (predioDireito) predioDireito.setAttribute("visible", true);
  // Teleporta para a praça central
  teleportar(0, 4);
}

async function novoQuiz() {
  console.log("🔄 Reiniciando quiz...");
  if (!cursoSelecionado || !periodoSelecionado) {
    console.warn("Nenhum curso/período selecionado para reiniciar quiz.");
    return;
  }
  telaAtual = "quiz";
  perguntaAtualIndex = 0;
  pontuacaoFinal = 0;
  perguntaRespondida = false;
  perguntas = [];
  perguntaAtual = null;
  resultadoTitulo.setAttribute("visible", false);
  atualizarFeedback("", "#f5c66b");
  pergunta.setAttribute("text", "value", "");
  boxEls.forEach((box) => {
    if (box) {
      box.setAttribute("visible", true);
      box.setAttribute("material", "color", "#1d2a42");
      box.setAttribute("material", "opacity", 0.96);
    }
  });
  altEls.forEach((alt) => {
    if (alt) {
      alt.setAttribute("visible", true);
      alt.setAttribute("text", "value", "");
    }
  });
  btnVoltarMapa.setAttribute("visible", false);
  textBtnVoltar.setAttribute("visible", false);
  btnSair.setAttribute("visible", false);
  textBtnSair.setAttribute("visible", false);
  salasPanel.setAttribute("visible", false);
  interfacePanel.setAttribute("visible", true);
  await iniciarQuiz();
}

// Sai da experiência VR
function sairExperiencia() {
  console.log("🚪 Saindo da experiência VR");
  window.location.href = "../site/index.html";
}

// ===== QUIZ =====

// Normaliza nome do curso para as chaves dos JSONs
function normalizarCurso(curso) {
  if (!curso) return "";
  const valor = curso.toLowerCase();
  if (
    valor.includes("comput") ||
    valor.includes("ciência") ||
    valor.includes("ciencia")
  )
    return "tecnologia";
  if (valor.includes("direito")) return "direito";
  return valor;
}

// Atualiza contador
function atualizarContador() {
  const total = perguntas.length || 0;
  const pergNum = Math.min(perguntaAtualIndex + 1, total);
  contador.setAttribute(
    "text",
    "value",
    `Pergunta ${pergNum} de ${total} | Pontuação: ${pontuacaoFinal}`
  );
}

// Atualiza feedback
function atualizarFeedback(msg, cor = "#f5c66b") {
  feedback.setAttribute("text", "value", msg);
  feedback.setAttribute("text", "color", cor);
}

// Reseta alternativas
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

// Mostra a pergunta atual
function mostrarPergunta() {
  resultadoTitulo.setAttribute("visible", false);
  if (perguntaAtualIndex >= perguntas.length) {
    finalizarQuiz();
    return;
  }
  perguntaAtual = perguntas[perguntaAtualIndex];
  atualizarContador();
  pergunta.setAttribute("text", "value", perguntaAtual.pergunta || "");
  atualizarFeedback("Escolha uma alternativa.");
  resetarAlternativas();
  altEls.forEach((alt, i) => {
    if (!alt) return;
    alt.setAttribute("text", "value", perguntaAtual.opcoes[i] || "");
  });
}

// Responde uma pergunta
function responder(idx) {
  console.log("✅ Resposta selecionada:", idx);
  if (perguntaRespondida || !perguntaAtual) return;
  perguntaRespondida = true;

  const correta = idx === perguntaAtual.correta;
  if (correta) {
    pontuacaoFinal += 10;
    atualizarFeedback("Correto!", "#3fd497");
  } else {
    atualizarFeedback("Errado!", "#ff6b6b");
  }

  // Pinta alternativas
  boxEls.forEach((box, i) => {
    if (!box) return;
    if (i === idx) box.setAttribute("material", "color", correta ? "#39d98a" : "#ff6b6b");
    else if (i === perguntaAtual.correta)
      box.setAttribute("material", "color", "#39d98a");
    else box.setAttribute("material", "opacity", 0.5);
  });

  atualizarContador();
  salvarResposta(perguntaAtual, idx, correta);

  // Próxima pergunta
  setTimeout(() => {
    perguntaAtualIndex += 1;
    mostrarPergunta();
  }, 2000);
}

// Carrega JSON
async function carregarJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.error(`❌ Erro ao carregar ${url}:`, err);
    alert(`Não foi possível carregar ${url}.`);
    return null;
  }
}

// Inicializa o quiz
async function iniciarQuiz() {
  console.log("🎮 Iniciando quiz...");
  const techJson = await carregarJson("tech.json");
  const direitoJson = await carregarJson("direito.json");
  if (!techJson || !direitoJson) {
    mostrarMapaPrincipal();
    return;
  }

  const jsonCurso =
    cursoSelecionado === "direito" ? direitoJson : techJson;
  const nivel = periodoSelecionado;

  if (
    !jsonCurso[cursoSelecionado] ||
    !jsonCurso[cursoSelecionado][nivel]
  ) {
    console.error("❌ Perguntas não encontradas", {
      cursoSelecionado,
      periodoSelecionado,
    });
    perguntas = [];
    perguntaAtual = null;
    interfacePanel.setAttribute("visible", true);
    salasPanel.setAttribute("visible", false);
    atualizarFeedback("NENHUMA PERGUNTA ENCONTRADA PARA ESTE PERIODO", "#ff6b6b");
    pergunta.setAttribute("text", "value", "Nenhuma pergunta encontrada para este período.");
    boxEls.forEach((box) => {
      if (box) box.setAttribute("visible", false);
    });
    altEls.forEach((alt) => {
      if (alt) alt.setAttribute("visible", false);
    });
    return;
  }

  perguntas = jsonCurso[cursoSelecionado][nivel];
  console.log(`✅ ${perguntas.length} perguntas carregadas`);
  mostrarPergunta();
}

// Salva resposta no backend
async function salvarResposta(p, idx, correta) {
  const body = {
    alunoId,
    nome: nomeAluno,
    curso: cursoSelecionado === "tecnologia" ? "Ciência da Computação" : "Direito",
    periodo: periodoSelecionado,
    pergunta: p.pergunta,
    respostaEscolhida: p.opcoes[idx],
    respostaCorreta: p.opcoes[p.correta],
    acertou: correta,
    pontuacao: correta ? 10 : 0,
  };
  try {
    await fetch(`${API_URL}/respostas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("💾 Resposta enviada ao backend");
  } catch (err) {
    console.error("❌ Erro ao salvar resposta:", err);
  }
}

// Finaliza o quiz
function finalizarQuiz() {
  console.log("🏁 Quiz finalizado!");
  telaAtual = "final";
  contador.setAttribute(
    "text",
    "value",
    `PONTUACAO FINAL: ${pontuacaoFinal} / ${perguntas.length * 10 || 50}`
  );
  resultadoTitulo.setAttribute("visible", true);
  resultadoTitulo.setAttribute("text", "value", "RESULTADO FINAL");
  pergunta.setAttribute(
    "text",
    "value",
    "Obrigado por participar."
  );
  atualizarFeedback(
    "Escolha uma opção abaixo.",
    "#bdd8ff"
  );

  // Esconde alternativas
  boxEls.forEach((box) => {
    if (box) box.setAttribute("visible", false);
  });
  altEls.forEach((alt) => {
    if (alt) alt.setAttribute("visible", false);
  });

  // Mostra botões
  btnVoltarMapa.setAttribute("position", "-1.3 -0.8 0.08");
  textBtnVoltar.setAttribute("position", "-1.3 -0.8 0.15");
  btnSair.setAttribute("position", "1.3 -0.8 0.08");
  textBtnSair.setAttribute("position", "1.3 -0.8 0.15");
  btnVoltarMapa.setAttribute("visible", true);
  textBtnVoltar.setAttribute("visible", true);
  btnSair.setAttribute("visible", true);
  textBtnSair.setAttribute("visible", true);
}

// ===== INICIALIZAÇÃO =====
window.responder = responder;
window.teleportar = teleportar;
window.escolherCursoVR = escolherCursoVR;
window.escolherPeriodoVR = escolherPeriodoVR;
window.voltarMapa = voltarMapa;
window.novoQuiz = novoQuiz;
window.voltarParaPraca = voltarMapa;
window.sairExperiencia = sairExperiencia;
window.testarClique = testarClique;
window.mostrarMapaPrincipal = mostrarMapaPrincipal;

window.addEventListener("load", () => {
  console.log("🚀 VR Game iniciado!");
  mostrarMapaPrincipal();
});

