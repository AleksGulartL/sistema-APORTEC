const express = require("express");
const item_orcamentoController = require("./itemOrcamento.controller");

const router = express.Router();

router.get(["/item_orcamento", "/pedido_item", "/pedido-itens"], item_orcamentoController.listar);
router.get(["/item_orcamento/:id", "/pedido_item/:id", "/pedido-itens/:id"], item_orcamentoController.buscarPorId);
router.post(["/item_orcamento", "/pedido_item", "/pedido-itens"], item_orcamentoController.criar);
router.put(["/item_orcamento/:id", "/pedido_item/:id", "/pedido-itens/:id"], item_orcamentoController.atualizar);
router.delete(["/item_orcamento/:id", "/pedido_item/:id", "/pedido-itens/:id"], item_orcamentoController.deletar);

module.exports = router;
