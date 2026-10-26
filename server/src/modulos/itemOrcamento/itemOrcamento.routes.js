const express = require("express");
const item_orcamentoController = require("./itemOrcamento.controller");

const router = express.Router();

router.get("/item_orcamento", item_orcamentoController.listar);
router.get("/item_orcamento/:id", item_orcamentoController.buscarPorId);
router.post("/item_orcamento", item_orcamentoController.criar);
router.put("/item_orcamento/:id", item_orcamentoController.atualizar);
router.delete("/item_orcamento/:id", item_orcamentoController.deletar);

module.exports = router;
