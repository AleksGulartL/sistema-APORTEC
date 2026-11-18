// Utilitário de testes: gera cabeçalhos Authorization com tokens JWT válidos por perfil
const authService = require("../modulos/auth/auth.service");

function tokenPara(perfil, extras = {}) {
    return authService.gerarToken({
        id_usuario: 1,
        nome_completo: `Usuário ${perfil}`,
        email: `${String(perfil).toLowerCase()}@aportec.com`,
        perfil,
        cargo_funcao: perfil,
        ...extras,
    });
}

function cabecalhoPara(perfil, extras = {}) {
    return { Authorization: `Bearer ${tokenPara(perfil, extras)}` };
}

module.exports = { tokenPara, cabecalhoPara };
