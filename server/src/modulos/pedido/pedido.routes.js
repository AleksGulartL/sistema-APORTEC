const express = require("express");
const pedidoController = require("./pedido.controller");

const router = express.Router();

router.get("/pedido", pedidoController.listar);
router.get("/pedido/:id", pedidoController.buscarPorId);
router.post("/pedido", pedidoController.criar);
router.put("/pedido/:id", pedidoController.atualizar);
router.patch("/pedido/:id/status", pedidoController.atualizarStatusEtapa);
router.post("/pedido/:id/aceite-instalacao", pedidoController.coletarAssinaturaAceite);
router.delete("/pedido/:id", pedidoController.deletar);

module.exports = router;
