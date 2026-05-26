// login.js
// Valida o login do administrador com credenciais fixas.

const formLogin = document.getElementById("loginForm");
const mensagemLogin = document.getElementById("mensagemLogin");

formLogin.addEventListener("submit", (event) => {
  event.preventDefault();
  mensagemLogin.textContent = "";

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;

  if (usuario === "admin" && senha === "gradus123") {
    localStorage.setItem("adminLogado", "true");
    window.location.href = "dashboard.html";
  } else {
    mensagemLogin.textContent = "Usuário ou senha inválidos.";
    mensagemLogin.style.color = "#ff6b6b";
  }
});
