const express = require("express");
const ordemProducaoController = require("./ordemProducao.controller");

const router = express.Router();

router.get("/ordem_producao", ordemProducaoController.listar);
router.get("/ordem_producao/:id", ordemProducaoController.buscarPorId);
router.post("/ordem_producao", ordemProducaoController.criar);
router.put("/ordem_producao/:id", ordemProducaoController.atualizar);
router.delete("/ordem_producao/:id", ordemProducaoController.deletar);

module.exports = router;
