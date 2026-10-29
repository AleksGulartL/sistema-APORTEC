const { pedido, orcamento } = require("../../database/models");

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
    return pedido.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return pedido.create(dados);
}

async function atualizar(id, dados) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    await registro.destroy();
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
