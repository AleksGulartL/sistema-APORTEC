const express = require("express");
const authController = require("./auth.controller");
const autenticar = require("../../middlewares/autenticar");

const router = express.Router();

// Rotas públicas (Padrão Handout / REST)
router.post("/auth/login", authController.login);
// Cadastro público: sem token o perfil é sempre o de menor privilégio (CLIENTE);
// somente um ADM autenticado pode definir o perfil de acesso do novo usuário.
router.post("/auth/registrar", autenticar.rotasPublicas, authController.registrar);
router.post("/auth/cadastro", autenticar.rotasPublicas, authController.registrar);
router.post("/auth/logout", authController.logout);

// Rotas de compatibilidade direta com a aula prática (aula-auth-template)
router.post("/login", authController.login);
router.post("/novoUsuario", autenticar.rotasPublicas, authController.registrar);
router.post("/logout", authController.logout);

// Rota protegida - retorna informações do usuário autenticado no token
router.get("/auth/perfil", autenticar, authController.perfil);
router.get("/auth/me", autenticar, authController.perfil);

module.exports = router;
