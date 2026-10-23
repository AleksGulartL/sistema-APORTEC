const express = require("express");
const obrasServicosController = require("./obrasServicos.controller");

const router = express.Router();

router.get("/obras-servicos", obrasServicosController.listar);
router.get("/obras-servicos/:id", obrasServicosController.buscarPorId);
router.post("/obras-servicos", obrasServicosController.criar);
router.put("/obras-servicos/:id", obrasServicosController.atualizar);
router.delete("/obras-servicos/:id", obrasServicosController.deletar);

module.exports = router;