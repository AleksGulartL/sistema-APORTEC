const express = require("express");
const portaProdutoController = require("./portaProduto.controller");

const router = express.Router();

router.get("/porta_produto", portaProdutoController.listar);
router.get("/porta_produto/:id", portaProdutoController.buscarPorId);
router.post("/porta_produto", portaProdutoController.criar);
router.put("/porta_produto/:id", portaProdutoController.atualizar);
router.delete("/porta_produto/:id", portaProdutoController.deletar);

module.exports = router;
