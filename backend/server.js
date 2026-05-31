const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const alunosRoutes = require("./routes/alunos");
const respostasRoutes = require("./routes/respostas");
const dashboardRoutes = require("./routes/dashboard");

app.use(cors());
app.use(express.json());

app.use("/alunos", alunosRoutes);
app.use("/respostas", respostasRoutes);
app.use("/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API Gradus funcionando com PostgreSQL");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
