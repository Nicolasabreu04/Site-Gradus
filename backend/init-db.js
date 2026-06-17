const pool = require("./database");

const sql = `
CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  curso VARCHAR(100) NOT NULL,
  periodo VARCHAR(20) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS respostas (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  curso VARCHAR(100) NOT NULL,
  periodo VARCHAR(20) NOT NULL,
  pergunta TEXT NOT NULL,
  resposta_escolhida TEXT NOT NULL,
  resposta_correta TEXT NOT NULL,
  acertou BOOLEAN NOT NULL,
  pontuacao INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDb() {
  try {
    await pool.query(sql);
    console.log("Tabelas verificadas/criadas com sucesso");
  } catch (error) {
    console.error("Erro ao verificar/criar tabelas:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDb();
