const express = require("express");
const clientesController = require("./clientes.controller");

const router = express.Router();

router.get("/clientes", clientesController.listar);
router.get("/clientes/:id", clientesController.buscarPorId);
router.post("/clientes", clientesController.criar);
router.put("/clientes/:id", clientesController.atualizar);
router.delete("/clientes/:id", clientesController.deletar);

module.exports = router;