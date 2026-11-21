const express = require("express");
const pedidoItemController = require("./pedidoItem.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

router.get(["/pedido_item", "/pedido-itens"], proteger("pedidoItem", "listar"), pedidoItemController.listar);
router.get(["/pedido_item/:id", "/pedido-itens/:id"], proteger("pedidoItem", "buscarPorId"), pedidoItemController.buscarPorId);
router.post(["/pedido_item", "/pedido-itens"], proteger("pedidoItem", "criar"), pedidoItemController.criar);
router.put(["/pedido_item/:id", "/pedido-itens/:id"], proteger("pedidoItem", "atualizar"), pedidoItemController.atualizar);
router.delete(["/pedido_item/:id", "/pedido-itens/:id"], proteger("pedidoItem", "deletar"), pedidoItemController.deletar);

module.exports = router;
