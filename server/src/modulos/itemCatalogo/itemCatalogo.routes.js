const express = require("express");
const itemCatalogoController = require("./itemCatalogo.controller");

const router = express.Router();

router.get("/item_catalogo", itemCatalogoController.listar);
router.get("/item_catalogo/:id", itemCatalogoController.buscarPorId);
router.post("/item_catalogo", itemCatalogoController.criar);
router.put("/item_catalogo/:id", itemCatalogoController.atualizar);
router.delete("/item_catalogo/:id", itemCatalogoController.deletar);

module.exports = router;