// cadastro.js
// Envia os dados do formulário para o backend e salva no localStorage.

const formCadastro = document.getElementById("cadastroForm");
const mensagemCadastro = document.getElementById("mensagemCadastro");

formCadastro.addEventListener("submit", async (event) => {
  event.preventDefault();
  mensagemCadastro.textContent = "";

  const nome = document.getElementById("nome").value.trim();
  const curso = document.getElementById("curso").value;
  const periodo = document.getElementById("periodo").value;

  if (!nome || !curso || !periodo) {
    mensagemCadastro.textContent = "Por favor, preencha todos os campos.";
    return;
  }

  const aluno = { nome, curso, periodo };

  try {
    const resposta = await fetch("http://localhost:3000/alunos", {
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
