const express = require("express");
const itemCatalogoController = require("./itemCatalogo.controller");

const router = express.Router();

router.get("/itens-catalogo", itemCatalogoController.listar);
router.get("/itens-catalogo/:id", itemCatalogoController.buscarPorId);
router.post("/itens-catalogo", itemCatalogoController.criar);
router.put("/itens-catalogo/:id", itemCatalogoController.atualizar);
router.delete("/itens-catalogo/:id", itemCatalogoController.deletar);

module.exports = router;