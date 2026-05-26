const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

router.get("/", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const snapshot = await db.collection("alunos").get();
    const alunos = [];

    snapshot.forEach((doc) => {
      alunos.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ mensagem: "Alunos listados com sucesso", alunos });
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    return res.status(500).json({ mensagem: "Erro ao listar alunos" });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const { nome, curso, periodo } = req.body;

    if (!nome || !curso || !periodo) {
      return res.status(400).json({ mensagem: "nome, curso e periodo são obrigatórios" });
    }

    const novoAluno = {
      nome,
      curso,
      periodo,
      criadoEm: new Date(),
    };

    const docRef = await db.collection("alunos").add(novoAluno);
    const alunoCriado = { id: docRef.id, ...novoAluno };

    return res.status(201).json({
      mensagem: "Aluno criado com sucesso",
      id: docRef.id,
      aluno: alunoCriado,
    });
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    return res.status(500).json({ mensagem: "Erro ao criar aluno" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const { id } = req.params;
    const docRef = db.collection("alunos").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ mensagem: "Aluno não encontrado" });
    }

    return res.json({ mensagem: "Aluno encontrado", aluno: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar aluno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const { id } = req.params;
    const docRef = db.collection("alunos").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ mensagem: "Aluno não encontrado" });
    }

    await docRef.delete();
    return res.json({ mensagem: "Aluno deletado com sucesso", id });
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
    return res.status(500).json({ mensagem: "Erro ao deletar aluno" });
  }
});

module.exports = router;
