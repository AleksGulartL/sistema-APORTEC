const express = require("express");
const ordemProducaoController = require("./ordemProducao.controller");
const authService = require("../auth/auth.service");

const router = express.Router();

// Extrai o usuário autenticado se o cabeçalho Authorization estiver presente
function extrairUsuarioSePresente(req, _res, next) {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const token = authHeader.slice(7).trim();
            req.usuario = authService.verificarToken(token);
        } catch {
            // Prossegue sem contexto de token caso inválido
        }
    }
    next();
}

router.use(extrairUsuarioSePresente);

const ROTAS_BASE = ["/ordem_producao", "/ordem-producao", "/ordens-producao"];
const ROTAS_ID = ["/ordem_producao/:id", "/ordem-producao/:id", "/ordens-producao/:id"];
const ROTAS_CONCLUIR = [
    "/ordem_producao/:id/concluir",
    "/ordem-producao/:id/concluir",
    "/ordens-producao/:id/concluir",
];

router.get(ROTAS_BASE, ordemProducaoController.listar);
router.get(ROTAS_ID, ordemProducaoController.buscarPorId);
router.post(ROTAS_BASE, ordemProducaoController.criar);
router.post(ROTAS_CONCLUIR, ordemProducaoController.concluir);
router.put(ROTAS_ID, ordemProducaoController.atualizar);
router.delete(ROTAS_ID, ordemProducaoController.deletar);

module.exports = router;
