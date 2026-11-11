const express = require("express");
const itemCatalogoController = require("./itemCatalogo.controller");

const router = express.Router();

router.get(["/item_catalogo/alertas-estoque", "/itens-catalogo/alertas-estoque"], itemCatalogoController.listarAlertasEstoqueMinimo);
router.get(["/item_catalogo", "/itens-catalogo"], itemCatalogoController.listar);
router.get(["/item_catalogo/:id", "/itens-catalogo/:id"], itemCatalogoController.buscarPorId);
router.post(["/item_catalogo", "/itens-catalogo"], itemCatalogoController.criar);
router.put(["/item_catalogo/:id", "/itens-catalogo/:id"], itemCatalogoController.atualizar);
router.delete(["/item_catalogo/:id", "/itens-catalogo/:id"], itemCatalogoController.deletar);

module.exports = router;
