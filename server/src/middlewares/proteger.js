const autenticar = require("./autenticar");
const autorizar = require("./autorizar");
const { PERMISSOES } = require("./permissoes");

function proteger(modulo, acao) {
    const perfis = PERMISSOES[modulo] && PERMISSOES[modulo][acao];
    if (!perfis || perfis.length === 0) {
        throw new Error(`Permissão não definida para '${modulo}.${acao}' em middlewares/permissoes.js.`);
    }
    return [autenticar, autorizar(perfis)];
}

module.exports = proteger;
