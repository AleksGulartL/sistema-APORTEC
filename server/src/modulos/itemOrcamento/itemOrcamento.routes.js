const express = require("express");
const item_orcamentoController = require("./itemOrcamento.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// RF04 - Itens do orçamento/pedido
router.get(["/item_orcamento", "/pedido_item", "/pedido-itens"], proteger("itemOrcamento", "listar"), item_orcamentoController.listar);
router.get(["/item_orcamento/:id", "/pedido_item/:id", "/pedido-itens/:id"], proteger("itemOrcamento", "buscarPorId"), item_orcamentoController.buscarPorId);
router.post(["/item_orcamento", "/pedido_item", "/pedido-itens"], proteger("itemOrcamento", "criar"), item_orcamentoController.criar);
router.put(["/item_orcamento/:id", "/pedido_item/:id", "/pedido-itens/:id"], proteger("itemOrcamento", "atualizar"), item_orcamentoController.atualizar);
router.delete(["/item_orcamento/:id", "/pedido_item/:id", "/pedido-itens/:id"], proteger("itemOrcamento", "deletar"), item_orcamentoController.deletar);

module.exports = router;
