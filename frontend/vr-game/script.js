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

// Faz textos e placas olharem para a câmera e manterem-se verticais
AFRAME.registerComponent('face-camera', {
  init: function () {
    this.cameraEl = document.getElementById('camera');
    this.tempVec = new THREE.Vector3();
  },
  tick: function () {
    if (!this.cameraEl || !this.el.object3D) return;
    const camObj = this.cameraEl.object3D;
    camObj.getWorldPosition(this.tempVec);
    this.el.object3D.lookAt(this.tempVec);
    // keep text upright: zero X and Z rotation
    this.el.object3D.rotation.x = 0;
    this.el.object3D.rotation.z = 0;
  }
});

// Função de teste de clique
function testarClique(nome) {
  console.log("✓ Clique detectado:", nome);
}

// ===== ESTADO GLOBAL =====
let cursoSelecionado = null;
let periodoSelecionado = null;
let periodoCorredorAtual = 1;
let telaAtual = "mapa"; // mapa, salas, corredor, quiz, final

// Constante para fonte que suporta acentos
const FONT_UNICODE = "https://cdn.aframe.io/fonts/DejaVu-sdf.fnt";

// Função helper para adicionar texto com suporte a acentos
function addTextWithFont(entity, value, options = {}) {
  const textStr = `value: ${value}; font: ${FONT_UNICODE}${options.style ? '; ' + options.style : ''}`;
  entity.setAttribute("text", textStr);
}

function capitalizarPrimeiraLetra(texto) {
  if (!texto || typeof texto !== "string") return texto;
  const trimmed = texto.trimStart();
  if (!trimmed) return texto;
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

function formatarTextoQuiz(texto) {
  return capitalizarPrimeiraLetra(texto);
}

// Elementos A-Frame
const rig = document.getElementById("rig");
const interfacePanel = document.getElementById("interfacePanel");
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
const btnRefazer = document.getElementById("btnRefazer");
const textBtnRefazer = document.getElementById("textBtnRefazer");
const btnSair = document.getElementById("btnSair");
const textBtnSair = document.getElementById("textBtnSair");
const portasCorredor = document.getElementById("portasCorredor");

// Cria as portas do corredor contínuo
criarPortasCorredor();

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
  document.getElementById("rig").setAttribute("position", `${x} 0 ${z}`);
}

// Mostra o mapa principal
function mostrarMapaPrincipal() {
  console.log("🗺️ Mostrando mapa principal");
  telaAtual = "mapa";
  interfacePanel.setAttribute("visible", false);

  const predioCC = document.getElementById("predioCCGroup");
  const predioDireito = document.getElementById("predioDireitoGroup");
  const tpInicio = document.getElementById("tpInicio");
  const tpCentro = document.getElementById("tpCentro");
  if (predioCC) predioCC.setAttribute("visible", true);
  if (predioDireito) predioDireito.setAttribute("visible", true);
  if (tpInicio) tpInicio.setAttribute("visible", true);
  if (tpCentro) tpCentro.setAttribute("visible", true);
  teleportar(0, 4);
}

function criarPortasCorredor() {
  if (!portasCorredor) return;

  const infoCursos = [
    // Afastar portas das salas para fora do caminho central
    { curso: "tecnologia", label: "CC", max: 8, x: -6, doorColor: "#2ec4b6" },
    { curso: "direito", label: "DIREITO", max: 10, x: 6, doorColor: "#d88ca4" },
  ];

  infoCursos.forEach(({ curso, label, max, x, doorColor }) => {
    for (let periodo = 1; periodo <= max; periodo += 1) {
      const z = -6 - periodo * 4;
      const portaGroup = document.createElement("a-entity");
      portaGroup.setAttribute("position", `${x} 0 ${z}`);
      portaGroup.setAttribute("id", `${label.toLowerCase()}Porta${periodo}`);

      const moldura = document.createElement("a-box");
      moldura.setAttribute("width", "2.6");
      moldura.setAttribute("height", "2.4");
      moldura.setAttribute("depth", "0.18");
      moldura.setAttribute("color", "#ffffff");
      moldura.setAttribute("position", "0 1.2 0");

      const porta = document.createElement("a-box");
      porta.setAttribute("class", "clickable click-debug");
      porta.setAttribute("width", "2.2");
      porta.setAttribute("height", "2");
      porta.setAttribute("depth", "0.3");
      porta.setAttribute("color", doorColor);
      porta.setAttribute("position", "0 1.2 0");
      porta.setAttribute("onclick", `iniciarQuizPorSala('${curso}', ${periodo})`);

      const placa = document.createElement("a-entity");
      const ordinal = `${periodo}º Período`;
      
      placa.setAttribute(
        "text",
        `value: ${ordinal}; width: 3.5; color: #000000; anchor: center; align: center; fontSize: 80; font: ${FONT_UNICODE}`
      );
      placa.setAttribute("position", "0 2.45 0.18");
      placa.setAttribute("pointer-events", "none");
      placa.setAttribute("face-camera", "");

      portaGroup.appendChild(moldura);
      portaGroup.appendChild(porta);
      portaGroup.appendChild(placa);
      portasCorredor.appendChild(portaGroup);
    }
  });
}

async function iniciarQuizPorSala(curso, periodo) {
  console.log("🎓 Iniciando quiz por sala", curso, periodo);
  cursoSelecionado = curso;
  periodoSelecionado = String(periodo);
  telaAtual = "quiz";
  interfacePanel.setAttribute("visible", true);
  interfacePanel.setAttribute("position", "0 2 -42");
  teleportar(0, -38);
  resultadoTitulo.setAttribute("visible", false);
  await iniciarQuiz();
}


// Escolhe um período e inicia o quiz
async function escolherPeriodoVR(periodo) {
  console.log("PERIODO ESCOLHIDO:", periodo);
  console.log("CURSO ATUAL:", cursoSelecionado);
  periodoSelecionado = String(periodo);
  telaAtual = "quiz";
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
  btnRefazer.setAttribute("visible", false);
  textBtnRefazer.setAttribute("visible", false);
  btnSair.setAttribute("visible", false);
  textBtnSair.setAttribute("visible", false);
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
  btnRefazer.setAttribute("visible", false);
  textBtnRefazer.setAttribute("visible", false);
  btnSair.setAttribute("visible", false);
  textBtnSair.setAttribute("visible", false);
  interfacePanel.setAttribute("visible", true);
  interfacePanel.setAttribute("position", "0 2 -42");
  teleportar(0, -38);
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
    `value: Pergunta ${pergNum} de ${total} | Pontuação: ${pontuacaoFinal}; font: ${FONT_UNICODE}`
  );
}

// Atualiza feedback
function atualizarFeedback(msg, cor = "#f5c66b") {
  feedback.setAttribute("text", `value: ${msg}; color: ${cor}; font: ${FONT_UNICODE}`);
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
  pergunta.setAttribute("text", `value: ${formatarTextoQuiz(perguntaAtual.pergunta || "")}; font: ${FONT_UNICODE}`);
  atualizarFeedback("Escolha uma alternativa.");
  resetarAlternativas();
  altEls.forEach((alt, i) => {
    if (!alt) return;
    alt.setAttribute(
      "text",
      `value: ${formatarTextoQuiz(perguntaAtual.opcoes[i] || "")}; font: ${FONT_UNICODE}`
    );
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
    atualizarFeedback("NENHUMA PERGUNTA ENCONTRADA PARA ESTE PERÍODO", "#ff6b6b");
    pergunta.setAttribute("text", `value: Nenhuma pergunta encontrada para este período.; font: ${FONT_UNICODE}`);
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
    pergunta: formatarTextoQuiz(p.pergunta),
    respostaEscolhida: formatarTextoQuiz(p.opcoes[idx]),
    respostaCorreta: formatarTextoQuiz(p.opcoes[p.correta]),
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
    `value: PONTUACAO FINAL: ${pontuacaoFinal} / ${perguntas.length * 10 || 50}; font: ${FONT_UNICODE}`
  );
  resultadoTitulo.setAttribute("visible", true);
  resultadoTitulo.setAttribute("text", `value: RESULTADO FINAL; font: ${FONT_UNICODE}`);
  pergunta.setAttribute(
    "text",
    `value: Obrigado por participar.; font: ${FONT_UNICODE}`
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
  btnRefazer.setAttribute("visible", true);
  textBtnRefazer.setAttribute("visible", true);
  btnSair.setAttribute("visible", true);
  textBtnSair.setAttribute("visible", true);
}

// ===== INICIALIZAÇÃO =====
window.responder = responder;
window.teleportar = teleportar;
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

