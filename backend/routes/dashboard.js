const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

router.get("/", (req, res) => {
  res.json({ mensagem: "Rota de dashboard funcionando" });
});

router.get("/resumo", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ mensagem: "Firebase não está configurado." });
    }

    const alunosSnapshot = await db.collection("alunos").get();
    const respostasSnapshot = await db.collection("respostas").get();

    const totalAlunos = alunosSnapshot.size;
    const totalRespostas = respostasSnapshot.size;

    let totalAcertos = 0;
    let totalErros = 0;
    let pontuacaoTotal = 0;

    const desempenhoPorCurso = {};
    const desempenhoPorPeriodo = {};
    const errosPorPergunta = {};

    respostasSnapshot.forEach((doc) => {
      const resposta = doc.data();
      const acertou = resposta.acertou === true;
      const erro = !acertou;

      if (acertou) {
        totalAcertos += 1;
      } else {
        totalErros += 1;
      }

      const pontuacao = typeof resposta.pontuacao === "number" ? resposta.pontuacao : 0;
      pontuacaoTotal += pontuacao;

      const curso = resposta.curso || "Desconhecido";
      const periodo = resposta.periodo || "Desconhecido";
      const pergunta = resposta.pergunta || "Desconhecida";

      if (!desempenhoPorCurso[curso]) {
        desempenhoPorCurso[curso] = { totalRespostas: 0, acertos: 0, erros: 0, percentualAcertos: 0 };
      }
      desempenhoPorCurso[curso].totalRespostas += 1;
      if (acertou) {
        desempenhoPorCurso[curso].acertos += 1;
      } else {
        desempenhoPorCurso[curso].erros += 1;
      }

      if (!desempenhoPorPeriodo[periodo]) {
        desempenhoPorPeriodo[periodo] = { totalRespostas: 0, acertos: 0, erros: 0, percentualAcertos: 0 };
      }
      desempenhoPorPeriodo[periodo].totalRespostas += 1;
      if (acertou) {
        desempenhoPorPeriodo[periodo].acertos += 1;
      } else {
        desempenhoPorPeriodo[periodo].erros += 1;
      }

      if (!errosPorPergunta[pergunta]) {
        errosPorPergunta[pergunta] = 0;
      }
      if (erro) {
        errosPorPergunta[pergunta] += 1;
      }
    });

    Object.keys(desempenhoPorCurso).forEach((curso) => {
      const item = desempenhoPorCurso[curso];
      item.percentualAcertos = item.totalRespostas > 0 ? Math.round((item.acertos / item.totalRespostas) * 100) : 0;
    });

    Object.keys(desempenhoPorPeriodo).forEach((periodo) => {
      const item = desempenhoPorPeriodo[periodo];
      item.percentualAcertos = item.totalRespostas > 0 ? Math.round((item.acertos / item.totalRespostas) * 100) : 0;
    });

    const percentualAcertos = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0;
    const percentualErros = totalRespostas > 0 ? Math.round((totalErros / totalRespostas) * 100) : 0;
    const mediaPontuacaoPorResposta = totalRespostas > 0 ? pontuacaoTotal / totalRespostas : 0;

    const perguntasComMaisErros = Object.entries(errosPorPergunta)
      .map(([pergunta, erros]) => ({ pergunta, erros }))
      .sort((a, b) => b.erros - a.erros);

    const resumo = {
      totalAlunos,
      totalRespostas,
      totalAcertos,
      totalErros,
      percentualAcertos,
      percentualErros,
      pontuacaoTotal,
      mediaPontuacaoPorResposta,
      desempenhoPorCurso,
      desempenhoPorPeriodo,
      perguntasComMaisErros,
    };

    return res.json({ mensagem: "Resumo do dashboard gerado com sucesso", resumo });
  } catch (error) {
    console.error("Erro ao gerar resumo do dashboard:", error);
    return res.status(500).json({ mensagem: "Erro ao gerar resumo do dashboard" });
  }
});

module.exports = router;
