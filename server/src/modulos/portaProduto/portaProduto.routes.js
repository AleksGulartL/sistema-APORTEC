const express = require("express");
const portaProdutoController = require("./portaProduto.controller");

const router = express.Router();

router.get(["/porta_produto", "/portas"], portaProdutoController.listar);
router.get(["/porta_produto/serie/:numero_serie/prontuario", "/portas/serie/:numero_serie/prontuario"], portaProdutoController.obterProntuarioPorNumeroSerie);
router.get(["/porta_produto/:id/prontuario", "/portas/:id/prontuario"], portaProdutoController.obterProntuarioPorId);
router.get(["/porta_produto/:id", "/portas/:id"], portaProdutoController.buscarPorId);
router.post(["/porta_produto", "/portas"], portaProdutoController.criar);
router.put(["/porta_produto/:id", "/portas/:id"], portaProdutoController.atualizar);
router.delete(["/porta_produto/:id", "/portas/:id"], portaProdutoController.deletar);

module.exports = router;
