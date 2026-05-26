// dashboard.js
// Consome o endpoint do backend e controla proteção e ações do painel.

const urlResumo = "http://localhost:3000/dashboard/resumo";
const mensagemErro = document.getElementById("mensagemErro");
const botaoAtualizar = document.getElementById("botaoAtualizar");
const botaoSair = document.getElementById("botaoSair");

const campos = {
  totalAlunos: document.getElementById("totalAlunos"),
  totalRespostas: document.getElementById("totalRespostas"),
  totalAcertos: document.getElementById("totalAcertos"),
  totalErros: document.getElementById("totalErros"),
  percentualAcertos: document.getElementById("percentualAcertos"),
  mediaPontuacaoPorResposta: document.getElementById("mediaPontuacaoPorResposta"),
};

const tabelaCurso = document.querySelector("#tabelaDesempenhoCurso tbody");
const tabelaPeriodo = document.querySelector("#tabelaDesempenhoPeriodo tbody");
const tabelaPerguntas = document.querySelector("#tabelaPerguntasErros tbody");

function verificarLogin() {
  const adminLogado = localStorage.getItem("adminLogado");
  if (adminLogado !== "true") {
    window.location.href = "login.html";
  }
}

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  mensagemErro.classList.remove("hidden");
}

function limparErro() {
  mensagemErro.classList.add("hidden");
  mensagemErro.textContent = "";
}

function preencherCards(resumo) {
  campos.totalAlunos.textContent = resumo.totalAlunos;
  campos.totalRespostas.textContent = resumo.totalRespostas;
  campos.totalAcertos.textContent = resumo.totalAcertos;
  campos.totalErros.textContent = resumo.totalErros;
  campos.percentualAcertos.textContent = `${resumo.percentualAcertos}%`;
  campos.mediaPontuacaoPorResposta.textContent = resumo.mediaPontuacaoPorResposta.toFixed(1);
}

function preencherTabela(resumoObjeto, tabela) {
  tabela.innerHTML = "";
  const entradas = Object.entries(resumoObjeto);

  if (entradas.length === 0) {
    tabela.innerHTML = '<tr><td colspan="5">Nenhum dado disponível</td></tr>';
    return;
  }

  entradas.forEach(([chave, valor]) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${chave}</td>
      <td>${valor.totalRespostas}</td>
      <td>${valor.acertos}</td>
      <td>${valor.erros}</td>
      <td>${valor.percentualAcertos}%</td>
    `;
    tabela.appendChild(linha);
  });
}

function preencherPerguntas(respostas, tabela) {
  tabela.innerHTML = "";

  if (!respostas || respostas.length === 0) {
    tabela.innerHTML = '<tr><td colspan="2">Nenhuma pergunta com erros registrada</td></tr>';
    return;
  }

  respostas.forEach((item) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.pergunta}</td>
      <td>${item.erros}</td>
    `;
    tabela.appendChild(linha);
  });
}

async function carregarResumo() {
  try {
    limparErro();
    const resposta = await fetch(urlResumo);

    if (!resposta.ok) {
      throw new Error(`Servidor retornou ${resposta.status}`);
    }

    const dados = await resposta.json();
    if (!dados.resumo) {
      throw new Error("Formato de resposta inesperado");
    }

    preencherCards(dados.resumo);
    preencherTabela(dados.resumo.desempenhoPorCurso, tabelaCurso);
    preencherTabela(dados.resumo.desempenhoPorPeriodo, tabelaPeriodo);
    preencherPerguntas(dados.resumo.perguntasComMaisErros, tabelaPerguntas);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    mostrarErro("Não foi possível carregar o dashboard. Verifique se a API está acessível e tente novamente.");
  }
}

function sair() {
  localStorage.removeItem("adminLogado");
  window.location.href = "login.html";
}

botaoAtualizar.addEventListener("click", carregarResumo);
botaoSair.addEventListener("click", sair);

verificarLogin();
carregarResumo();
