const express = require("express");
const pecaUtilizadaController = require("./pecaUtilizada.controller");

const router = express.Router();

router.get("/peca_utilizada", pecaUtilizadaController.listar);
router.get("/peca_utilizada/:id", pecaUtilizadaController.buscarPorId);
router.post("/peca_utilizada", pecaUtilizadaController.criar);
router.put("/peca_utilizada/:id", pecaUtilizadaController.atualizar);
router.delete("/peca_utilizada/:id", pecaUtilizadaController.deletar);

module.exports = router;
