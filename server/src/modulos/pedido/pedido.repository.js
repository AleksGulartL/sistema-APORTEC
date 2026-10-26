const { orcamento, item_catalogo} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (orcamento) includes.push({
        model: orcamento,
        as: "orcamento"
    });
    return includes;
}

async function listar() {
    return pedido.findAll({
        order: [["id_pedido", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return item_orcamento.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return pedido.create(dados);
}

async function atualizar(id, dados) {
    const pedido = await pedido.findByPk(id);
    if (!pedido) return null;
    return pedido.update(dados);
}

async function deletar(id) {
    const pedido = await pedido.findByPk(id);
    if (!pedido) return null;
    await pedido.destroy();
    return pedido;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
