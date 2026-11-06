const autenticar = require("../../middlewares/autenticar");
const autorizar = require("../../middlewares/autorizar");

// Compatibilidade direta com o template da aula e com a apostila
const requireJWTAuth = autenticar;
const requirePermissao = autorizar;
const verificarPermissaoMiddleware = autorizar;

module.exports = {
    autenticar,
    autorizar,
    requireJWTAuth,
    requirePermissao,
    verificarPermissaoMiddleware,
};
