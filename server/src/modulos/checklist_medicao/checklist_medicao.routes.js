const express = require("express");
const checklist_medicaoController = require("./checklist_medicao.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

router.get(["/checklist_medicao", "/checklist-medicao"], proteger("checklistMedicao", "listar"), checklist_medicaoController.listar);
router.get(["/checklist_medicao/:id", "/checklist-medicao/:id"], proteger("checklistMedicao", "buscarPorId"), checklist_medicaoController.buscarPorId);
router.post(["/checklist_medicao", "/checklist-medicao"], proteger("checklistMedicao", "criar"), checklist_medicaoController.criar);
router.put(["/checklist_medicao/:id", "/checklist-medicao/:id"], proteger("checklistMedicao", "atualizar"), checklist_medicaoController.atualizar);
router.delete(["/checklist_medicao/:id", "/checklist-medicao/:id"], proteger("checklistMedicao", "deletar"), checklist_medicaoController.deletar);

module.exports = router;
