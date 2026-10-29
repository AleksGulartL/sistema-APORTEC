const express = require("express");
const ordemServicoController = require("./ordemServico.controller");

const router = express.Router();

router.get("/ordem_servico", ordemServicoController.listar);
router.get("/ordem_servico/:id", ordemServicoController.buscarPorId);
router.post("/ordem_servico", ordemServicoController.criar);
router.put("/ordem_servico/:id", ordemServicoController.atualizar);
router.delete("/ordem_servico/:id", ordemServicoController.deletar);

module.exports = router;
