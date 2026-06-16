// cadastro.js
// Envia os dados do formulário para o backend e salva no localStorage.

const formCadastro = document.getElementById("cadastroForm");
const mensagemCadastro = document.getElementById("mensagemCadastro");
const selectCurso = document.getElementById("curso");
const selectPeriodo = document.getElementById("periodo");

const CURSO_CC_VALUE = "Ciencia da Computacao";
const PERIODO_MAX_CC = 8;
const PERIODO_MAX_DEFAULT = 10;

function atualizarPeriodosPorCurso(curso) {
  const maxPeriodo = curso === CURSO_CC_VALUE ? PERIODO_MAX_CC : PERIODO_MAX_DEFAULT;
  const periodoAtual = selectPeriodo.value;

  selectPeriodo.innerHTML = '<option value="">Selecione o período</option>';

  for (let i = 1; i <= maxPeriodo; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = String(i);
    selectPeriodo.appendChild(option);
  }

  if (periodoAtual && Number(periodoAtual) <= maxPeriodo) {
    selectPeriodo.value = periodoAtual;
  }
}

selectCurso.addEventListener("change", () => {
  atualizarPeriodosPorCurso(selectCurso.value);
});

window.addEventListener("DOMContentLoaded", () => {
  atualizarPeriodosPorCurso(selectCurso.value);
});

formCadastro.addEventListener("submit", async (event) => {
  event.preventDefault();
  mensagemCadastro.textContent = "";

  const nome = document.getElementById("nome").value.trim();
  const curso = selectCurso.value;
  const periodo = selectPeriodo.value;

  if (!nome || !curso || !periodo) {
    mensagemCadastro.textContent = "Por favor, preencha todos os campos.";
    return;
  }

  const aluno = { nome, curso, periodo };

  try {
    const resposta = await fetch("http://wmglwrrkay8u8z62bj6n2axs.37.27.81.229.sslip.io/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aluno),
    });

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status}`);
    }

    const dados = await resposta.json();

    const alunoId = dados.id || dados.aluno?.id || "";
    const nomeAluno = dados.aluno?.nome || nome;
    const cursoAluno = dados.aluno?.curso || curso;
    const periodoAluno = dados.aluno?.periodo || periodo;

    localStorage.setItem("alunoId", alunoId);
    localStorage.setItem("nomeAluno", nomeAluno);
    localStorage.setItem("cursoAluno", cursoAluno);
    localStorage.setItem("periodoAluno", periodoAluno);

    // Mantém compatibilidade com outras partes do app
    localStorage.setItem("nome", nomeAluno);
    localStorage.setItem("curso", cursoAluno);
    localStorage.setItem("periodo", periodoAluno);

    mensagemCadastro.textContent = "Cadastro realizado com sucesso! Redirecionando...";
    mensagemCadastro.style.color = "#3fd497";

    setTimeout(() => {
      window.location.href = "../vr-game/index.html";
    }, 900);
  } catch (error) {
    console.error("Erro ao cadastrar aluno:", error);
    mensagemCadastro.textContent = "Não foi possível cadastrar. Verifique a API e tente novamente.";
    mensagemCadastro.style.color = "#ff6b6b";
  }
});
