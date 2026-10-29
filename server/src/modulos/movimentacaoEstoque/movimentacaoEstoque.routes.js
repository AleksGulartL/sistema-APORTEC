const express = require("express");
const movimentacaoEstoqueController = require("./movimentacaoEstoque.controller");

const router = express.Router();

router.get("/movimentacao_estoque", movimentacaoEstoqueController.listar);
router.get("/movimentacao_estoque/:id", movimentacaoEstoqueController.buscarPorId);
router.post("/movimentacao_estoque", movimentacaoEstoqueController.criar);
router.put("/movimentacao_estoque/:id", movimentacaoEstoqueController.atualizar);
router.delete("/movimentacao_estoque/:id", movimentacaoEstoqueController.deletar);

module.exports = router;
