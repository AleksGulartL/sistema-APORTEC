const express = require("express");
const clienteController = require("./cliente.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// RF02 - Clientes
router.get("/cliente", proteger("cliente", "listar"), clienteController.listar);
router.get("/cliente/:id", proteger("cliente", "buscarPorId"), clienteController.buscarPorId);
router.post("/cliente", proteger("cliente", "criar"), clienteController.criar);
router.put("/cliente/:id", proteger("cliente", "atualizar"), clienteController.atualizar);
router.delete("/cliente/:id", proteger("cliente", "deletar"), clienteController.deletar);

module.exports = router;
