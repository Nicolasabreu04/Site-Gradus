const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const alunosRoutes = require("./routes/alunos");
const respostasRoutes = require("./routes/respostas");
const dashboardRoutes = require("./routes/dashboard");

// CORS: permitir origens confiáveis (frontend de produção e portas locais de desenvolvimento)
const FRONTEND_HOST = process.env.FRONTEND_HOST || "aq9qh505munydgfokb4xq80x.37.27.81.229.sslip.io";
const FRONTEND_ALLOWED = [
  `http://${FRONTEND_HOST}`,
  `https://${FRONTEND_HOST}`,
  "http://localhost:8000",
  "http://localhost:5173",
  "http://localhost:3000",
];
const ALLOWED_SSLIP = /https?:\/\/([a-z0-9-]+\.)*sslip\.io(:[0-9]+)?$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests like Postman (no origin)
      if (!origin) return callback(null, true);
      // quick exact match
      if (FRONTEND_ALLOWED.indexOf(origin) !== -1) return callback(null, true);
      // allow any sslip.io origin to support dynamic deployment hosts
      if (ALLOWED_SSLIP.test(origin)) return callback(null, true);
      // allow origin that contains the configured host (handles ports, http/https variations)
      if (origin.indexOf(FRONTEND_HOST) !== -1) return callback(null, true);
      console.warn("CORS blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

app.use("/alunos", alunosRoutes);
app.use("/respostas", respostasRoutes);
app.use("/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API Gradus funcionando com PostgreSQL");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  const dbHost = process.env.DB_HOST || "db";
  const dbPort = process.env.DB_PORT || 5432;
  try {
    await require("./database").query("SELECT 1");
    console.log(`Conectado ao PostgreSQL em ${dbHost}:${dbPort}`);
  } catch (err) {
    console.error("Falha ao conectar ao PostgreSQL durante inicialização:", err);
  }
  console.log(`Servidor rodando na porta ${PORT}`);
});
