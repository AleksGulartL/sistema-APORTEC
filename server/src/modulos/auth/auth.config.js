const autenticar = require("../../middlewares/autenticar");
const autorizar = require("../../middlewares/autorizar");

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
