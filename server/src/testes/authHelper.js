const authService = require("../modulos/auth/auth.service");

function tokenPara(perfil, extras = {}) {
    return authService.gerarToken({
        id: 1,
        nome_completo: `Usuário ${perfil}`,
        email: `${String(perfil).toLowerCase()}@gmail.com`,
        perfil,
        ...extras,
    });
}

function cabecalhoPara(perfil, extras = {}) {
    return { Authorization: `Bearer ${tokenPara(perfil, extras)}` };
}

module.exports = { tokenPara, cabecalhoPara };
