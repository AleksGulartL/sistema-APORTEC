const express = require("express");
const authController = require("./auth.controller");
const autenticar = require("../../middlewares/autenticar");

const router = express.Router();

router.post("/auth/login", authController.login);
router.post("/auth/registrar", autenticar.rotasPublicas, authController.registrar);
router.post("/auth/logout", authController.logout);

router.get("/auth/perfil", autenticar, authController.perfil);
router.patch("/auth/alterar-senha", autenticar, authController.alterarSenha);

module.exports = router;
