const autenticar = require("./autenticar");
const autorizar = require("./autorizar");
const { PERMISSOES } = require("./permissoes");

// Retorna a cadeia [autenticar, autorizar(perfis)] para uma função de controller,
// consultando a matriz central de permissões (permissoes.js).
// Uso: router.get("/cliente", proteger("cliente", "listar"), clienteController.listar);
function proteger(modulo, acao) {
    const perfis = PERMISSOES[modulo] && PERMISSOES[modulo][acao];
    if (!perfis || perfis.length === 0) {
        // Falha na inicialização: impede subir uma rota sem regra de acesso definida
        throw new Error(`Permissão não definida para '${modulo}.${acao}' em middlewares/permissoes.js.`);
    }
    return [autenticar, autorizar(perfis)];
}

module.exports = proteger;
