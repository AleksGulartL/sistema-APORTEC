const express = require("express");
const orcamentoController = require("./orcamento.controller");

const router = express.Router();

router.get("/orcamento", orcamentoController.listar);
router.get("/orcamento/:id", orcamentoController.buscarPorId);
router.post("/orcamento", orcamentoController.criar);
router.put("/orcamento/:id", orcamentoController.atualizar);
router.delete("/orcamento/:id", orcamentoController.deletar);

module.exports = router;
