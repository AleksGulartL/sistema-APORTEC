const express = require("express");
const clienteController = require("./cliente.controller");

const router = express.Router();

router.get("/cliente", clienteController.listar);
router.get("/cliente/:id", clienteController.buscarPorId);
router.post("/cliente", clienteController.criar);
router.put("/cliente/:id", clienteController.atualizar);
router.delete("/cliente/:id", clienteController.deletar);

module.exports = router;