const express = require("express");
const pedidoController = require("./pedido.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// RF04/RF05/RF06 - Pedido (ciclo unificado Orçamento -> Pedido)
router.get("/pedido", proteger("pedido", "listar"), pedidoController.listar);
router.get("/pedido/:id", proteger("pedido", "buscarPorId"), pedidoController.buscarPorId);
router.post("/pedido", proteger("pedido", "criar"), pedidoController.criar);
router.put("/pedido/:id", proteger("pedido", "atualizar"), pedidoController.atualizar);
// RF12 - Atualização da etapa do pedido (gera checklist de pré-saída)
router.patch("/pedido/:id/status", proteger("pedido", "atualizarStatusEtapa"), pedidoController.atualizarStatusEtapa);
// RF13 - Assinatura digital de aceite da instalação
router.post("/pedido/:id/aceite-instalacao", proteger("pedido", "coletarAssinaturaAceite"), pedidoController.coletarAssinaturaAceite);
router.delete("/pedido/:id", proteger("pedido", "deletar"), pedidoController.deletar);

router.patch("/pedido/:id/avaliacao", proteger("pedido", "registrarAvaliacao"), pedidoController.registrarAvaliacao);

router.patch("/pedido/:id/enviar-orcamento", proteger("pedido", "enviarOrcamento"), pedidoController.enviarOrcamento);

router.patch("/pedido/:id/reabrir-orcamento", proteger("pedido", "reabrirOrcamento"), pedidoController.reabrirOrcamento);

module.exports = router;
