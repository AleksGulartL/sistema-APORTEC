const express = require("express");
const usuarioController = require("./usuario.controller");

const router = express.Router();

router.get("/usuarios", usuarioController.listar);
router.get("/usuarios/:id", usuarioController.buscarPorId);
router.post("/usuarios", usuarioController.criar);
router.put("/usuarios/:id", usuarioController.atualizar);
router.delete("/usuarios/:id", usuarioController.deletar);

module.exports = router;