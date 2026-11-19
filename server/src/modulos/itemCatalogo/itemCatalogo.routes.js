const express = require("express");
const itemCatalogoController = require("./itemCatalogo.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// Rotas auxiliares de tipos e categorias
router.get(["/item_catalogo/tipos", "/tipo_item"], proteger("itemCatalogo", "listarTipos"), itemCatalogoController.listarTipos);
router.get(["/item_catalogo/categorias", "/categoria_item"], proteger("itemCatalogo", "listarCategorias"), itemCatalogoController.listarCategorias);

// RF10 - Catálogo de itens e estoque
router.get(["/item_catalogo/alertas-estoque", "/itens-catalogo/alertas-estoque"], proteger("itemCatalogo", "listarAlertasEstoqueMinimo"), itemCatalogoController.listarAlertasEstoqueMinimo);
router.get(["/item_catalogo", "/itens-catalogo"], proteger("itemCatalogo", "listar"), itemCatalogoController.listar);
router.get(["/item_catalogo/:id", "/itens-catalogo/:id"], proteger("itemCatalogo", "buscarPorId"), itemCatalogoController.buscarPorId);
router.post(["/item_catalogo", "/itens-catalogo"], proteger("itemCatalogo", "criar"), itemCatalogoController.criar);
router.put(["/item_catalogo/:id", "/itens-catalogo/:id"], proteger("itemCatalogo", "atualizar"), itemCatalogoController.atualizar);
router.delete(["/item_catalogo/:id", "/itens-catalogo/:id"], proteger("itemCatalogo", "deletar"), itemCatalogoController.deletar);

module.exports = router;
