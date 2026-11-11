const express = require("express");
const obrasServicosController = require("./obrasServicos.controller");

const router = express.Router();

router.get(["/obras-servicos", "/obra", "/obras"], obrasServicosController.listar);
router.get(["/obras-servicos/:id", "/obra/:id", "/obras/:id"], obrasServicosController.buscarPorId);
router.post(["/obras-servicos", "/obra", "/obras"], obrasServicosController.criar);
router.put(["/obras-servicos/:id", "/obra/:id", "/obras/:id"], obrasServicosController.atualizar);
router.delete(["/obras-servicos/:id", "/obra/:id", "/obras/:id"], obrasServicosController.deletar);

module.exports = router;
