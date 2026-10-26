const express = require("express");
const checklist_medicaoController = require("./checklist_medicao.controller");

const router = express.Router();

router.get("/checklist_medicao", checklist_medicaoController.listar);
router.get("/checklist_medicao/:id", checklist_medicaoController.buscarPorId);
router.post("/checklist_medicao", checklist_medicaoController.criar);
router.put("/checklist_medicao/:id", checklist_medicaoController.atualizar);
router.delete("/checklist_medicao/:id", checklist_medicaoController.deletar);

module.exports = router;
