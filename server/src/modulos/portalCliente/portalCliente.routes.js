const express = require("express");
const portalClienteController = require("./portalCliente.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// Rotas exclusivas do Portal do Cliente (escopo isolado pelo cliente vinculado ao token)
router.get("/portal-cliente/resumo", proteger("portalCliente", "obterResumo"), portalClienteController.obterResumo);
router.patch("/portal-cliente/pedidos/:id/aprovacao", proteger("portalCliente", "responderAprovacao"), portalClienteController.responderAprovacao);
router.post("/portal-cliente/ordens-servico", proteger("portalCliente", "abrirSolicitacao"), portalClienteController.abrirSolicitacao);

module.exports = router;
