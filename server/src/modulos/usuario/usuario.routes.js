const express = require("express");
const usuarioController = require("./usuario.controller");
const proteger = require("../../middlewares/proteger");

const router = express.Router();

// RF01 - Gestão de usuários: todas as ações exigem token válido e perfil ADM
router.get("/usuarios", proteger("usuario", "listar"), usuarioController.listar);
router.get("/usuarios/:id", proteger("usuario", "buscarPorId"), usuarioController.buscarPorId);
router.post("/usuarios", proteger("usuario", "criar"), usuarioController.criar);
router.put("/usuarios/:id", proteger("usuario", "atualizar"), usuarioController.atualizar);
router.delete("/usuarios/:id", proteger("usuario", "deletar"), usuarioController.deletar);

router.get("/tecnicos", proteger("usuario", "listarTecnicos"), usuarioController.listarTecnicos);

module.exports = router;
