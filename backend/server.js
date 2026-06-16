const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const alunosRoutes = require("./routes/alunos");
const respostasRoutes = require("./routes/respostas");
const dashboardRoutes = require("./routes/dashboard");

// CORS: permitir origens confiáveis (frontend de produção e portas locais de desenvolvimento)
const FRONTEND_ALLOWED = [
  process.env.FRONTEND_ORIGIN || "http://aq9qh505munydgfokb4xq80x.37.27.81.229.sslip.io",
  "http://localhost:8000",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests like Postman (no origin)
      if (!origin) return callback(null, true);
      if (FRONTEND_ALLOWED.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS policy: Origin not allowed"), false);
    },
    credentials: true,
  })
);

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
