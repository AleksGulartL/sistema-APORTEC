const express = require("express");
const ordemServicoController = require("./ordemServico.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// RF14 - Ordens de serviço (instalação / assistência técnica)
router.get("/ordem_servico", proteger("ordemServico", "listar"), ordemServicoController.listar);
router.get("/ordem_servico/:id", proteger("ordemServico", "buscarPorId"), ordemServicoController.buscarPorId);
router.post("/ordem_servico", proteger("ordemServico", "criar"), ordemServicoController.criar);
router.put("/ordem_servico/:id", proteger("ordemServico", "atualizar"), ordemServicoController.atualizar);
router.delete("/ordem_servico/:id", proteger("ordemServico", "deletar"), ordemServicoController.deletar);

module.exports = router;
