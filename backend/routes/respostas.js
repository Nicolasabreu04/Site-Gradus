const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

router.get("/", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const snapshot = await db.collection("respostas").get();
    const respostas = [];

    snapshot.forEach((doc) => {
      respostas.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ mensagem: "Respostas listadas com sucesso", respostas });
  } catch (error) {
    console.error("Erro ao listar respostas:", error);
    return res.status(500).json({ mensagem: "Erro ao listar respostas" });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

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

    const novaResposta = {
      alunoId,
      nome,
      curso,
      periodo,
      pergunta,
      respostaEscolhida,
      respostaCorreta,
      acertou,
      pontuacao,
      criadoEm: new Date(),
    };

    const docRef = await db.collection("respostas").add(novaResposta);
    const respostaCriada = { id: docRef.id, ...novaResposta };

    return res.status(201).json({
      mensagem: "Resposta criada com sucesso",
      id: docRef.id,
      resposta: respostaCriada,
    });
  } catch (error) {
    console.error("Erro ao criar resposta:", error);
    return res.status(500).json({ mensagem: "Erro ao criar resposta" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const { id } = req.params;
    const docRef = db.collection("respostas").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ mensagem: "Resposta não encontrada" });
    }

    return res.json({ mensagem: "Resposta encontrada", resposta: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error("Erro ao buscar resposta:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar resposta" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const { id } = req.params;
    const docRef = db.collection("respostas").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ mensagem: "Resposta não encontrada" });
    }

    await docRef.delete();
    return res.json({ mensagem: "Resposta deletada com sucesso", id });
  } catch (error) {
    console.error("Erro ao deletar resposta:", error);
    return res.status(500).json({ mensagem: "Erro ao deletar resposta" });
  }
});

module.exports = router;
