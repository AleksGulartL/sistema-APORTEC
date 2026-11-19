const express = require("express");
const itemCatalogoController = require("./itemCatalogo.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// Rotas auxiliares de tipos e categorias
router.get(["/item_catalogo/tipos", "/tipo_item"], proteger("itemCatalogo", "listar"), itemCatalogoController.listarTipos);
router.get(["/item_catalogo/categorias", "/categoria_item"], proteger("itemCatalogo", "listar"), itemCatalogoController.listarCategorias);

// RF10 - Catálogo de itens e estoque
// A rota de alertas deve ser registrada antes de "/:id" para não ser capturada como id
router.get(["/item_catalogo/alertas-estoque", "/itens-catalogo/alertas-estoque"], proteger("itemCatalogo", "listarAlertasEstoqueMinimo"), itemCatalogoController.listarAlertasEstoqueMinimo);
router.get(["/item_catalogo", "/itens-catalogo"], proteger("itemCatalogo", "listar"), itemCatalogoController.listar);
router.get(["/item_catalogo/:id", "/itens-catalogo/:id"], proteger("itemCatalogo", "buscarPorId"), itemCatalogoController.buscarPorId);
router.post(["/item_catalogo", "/itens-catalogo"], proteger("itemCatalogo", "criar"), itemCatalogoController.criar);
router.put(["/item_catalogo/:id", "/itens-catalogo/:id"], proteger("itemCatalogo", "atualizar"), itemCatalogoController.atualizar);
router.delete(["/item_catalogo/:id", "/itens-catalogo/:id"], proteger("itemCatalogo", "deletar"), itemCatalogoController.deletar);

module.exports = router;
