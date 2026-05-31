const express = require("express");
const router = express.Router();
const pool = require("../database");

function mapAluno(row) {
  return {
    id: row.id,
    nome: row.nome,
    curso: row.curso,
    periodo: row.periodo,
    criadoEm: row.criado_em,
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM alunos ORDER BY id");
    const alunos = result.rows.map(mapAluno);
    return res.json({ mensagem: "Alunos listados com sucesso", alunos });
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    return res.status(500).json({ mensagem: "Erro ao listar alunos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nome, curso, periodo } = req.body;

    if (!nome || !curso || !periodo) {
      return res.status(400).json({ mensagem: "nome, curso e periodo são obrigatórios" });
    }

    const insertQuery = 
      "INSERT INTO alunos (nome, curso, periodo) VALUES ($1, $2, $3) RETURNING *";
    const values = [nome, curso, periodo];
    const result = await pool.query(insertQuery, values);
    const aluno = result.rows[0];

    return res.status(201).json({ mensagem: "Aluno criado com sucesso", id: aluno.id, aluno });
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    return res.status(500).json({ mensagem: "Erro ao criar aluno" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM alunos WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensagem: "Aluno não encontrado" });
    }

    return res.json({ mensagem: "Aluno encontrado", aluno: mapAluno(result.rows[0]) });
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar aluno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM alunos WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensagem: "Aluno não encontrado" });
    }

    return res.json({ mensagem: "Aluno deletado com sucesso", id });
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
    return res.status(500).json({ mensagem: "Erro ao deletar aluno" });
  }
});

module.exports = router;
