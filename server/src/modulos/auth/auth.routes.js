const express = require("express");
const authController = require("./auth.controller");
const autenticar = require("../../middlewares/autenticar");

const router = express.Router();

// Rotas públicas (Padrão Handout / REST)
router.post("/auth/login", authController.login);
router.post("/auth/registrar", authController.registrar);
router.post("/auth/cadastro", authController.registrar);
router.post("/auth/logout", authController.logout);

// Rotas de compatibilidade direta com a aula prática (aula-auth-template)
router.post("/login", authController.login);
router.post("/novoUsuario", authController.registrar);
router.post("/logout", authController.logout);

// Rota protegida - retorna informações do usuário autenticado no token
router.get("/auth/perfil", autenticar, authController.perfil);
router.get("/auth/me", autenticar, authController.perfil);

module.exports = router;
