const express = require("express");
const router = express.Router();
const pool = require("../database");

function mapResposta(row) {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    nome: row.nome,
    curso: row.curso,
    periodo: row.periodo,
    pergunta: row.pergunta,
    respostaEscolhida: row.resposta_escolhida,
    respostaCorreta: row.resposta_correta,
    acertou: row.acertou,
    pontuacao: row.pontuacao,
    criadoEm: row.criado_em,
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM respostas ORDER BY id");
    const respostas = result.rows.map(mapResposta);
    return res.json({ mensagem: "Respostas listadas com sucesso", respostas });
  } catch (error) {
    console.error("Erro ao listar respostas:", error);
    return res.status(500).json({ mensagem: "Erro ao listar respostas" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      alunoId,
      nome,
      curso,
      periodo,
      pergunta,
      respostaEscolhida,
      respostaCorreta,
      acertou,
      pontuacao,
    } = req.body;

    if (
      !alunoId ||
      !nome ||
      !curso ||
      !periodo ||
      !pergunta ||
      !respostaEscolhida ||
      !respostaCorreta
    ) {
      return res.status(400).json({
        mensagem:
          "alunoId, nome, curso, periodo, pergunta, respostaEscolhida e respostaCorreta são obrigatórios",
      });
    }

    if (typeof acertou !== "boolean") {
      return res.status(400).json({ mensagem: "acertou deve ser true ou false" });
    }

    if (typeof pontuacao !== "number") {
      return res.status(400).json({ mensagem: "pontuacao deve ser um número" });
    }

    const insertQuery = `
      INSERT INTO respostas (
        aluno_id,
        nome,
        curso,
        periodo,
        pergunta,
        resposta_escolhida,
        resposta_correta,
        acertou,
        pontuacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      alunoId,
      nome,
      curso,
      periodo,
      pergunta,
      respostaEscolhida,
      respostaCorreta,
      acertou,
      pontuacao,
    ];

    const result = await pool.query(insertQuery, values);
    const resposta = mapResposta(result.rows[0]);

    return res.status(201).json({ mensagem: "Resposta criada com sucesso", id: resposta.id, resposta });
  } catch (error) {
    console.error("Erro ao criar resposta:", error);
    return res.status(500).json({ mensagem: "Erro ao criar resposta" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM respostas WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensagem: "Resposta não encontrada" });
    }

    return res.json({ mensagem: "Resposta encontrada", resposta: mapResposta(result.rows[0]) });
  } catch (error) {
    console.error("Erro ao buscar resposta:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar resposta" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM respostas WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensagem: "Resposta não encontrada" });
    }

    return res.json({ mensagem: "Resposta deletada com sucesso", id });
  } catch (error) {
    console.error("Erro ao deletar resposta:", error);
    return res.status(500).json({ mensagem: "Erro ao deletar resposta" });
  }
});

module.exports = router;
