const express = require("express");
const insumoOrdemProducaoController = require("./insumoOrdemProducao.controller");

const router = express.Router();

router.get("/insumo_ordem_producao", insumoOrdemProducaoController.listar);
router.get("/insumo_ordem_producao/:id", insumoOrdemProducaoController.buscarPorId);
router.post("/insumo_ordem_producao", insumoOrdemProducaoController.criar);
router.put("/insumo_ordem_producao/:id", insumoOrdemProducaoController.atualizar);
router.delete("/insumo_ordem_producao/:id", insumoOrdemProducaoController.deletar);

module.exports = router;
