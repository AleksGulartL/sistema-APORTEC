const express = require("express");
const emprestimosController = require("./usuario.controller");

const router = express.Router();

router.get("/emprestimos", emprestimosController.listar);
router.get("/emprestimos/:id", emprestimosController.buscarPorId);
router.post("/emprestimos", emprestimosController.criar);
router.put("/emprestimos/:id", emprestimosController.atualizar);
router.delete("/emprestimos/:id", emprestimosController.deletar);

module.exports = router;



