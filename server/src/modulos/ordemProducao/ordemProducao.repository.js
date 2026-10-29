const {ordem_producao, pedido, usuario, insumo_ordem_producao, movimentacao_estoque} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (pedido) includes.push({
        model: pedido,
        as: "pedido"
    });
    if (usuario) includes.push({
        model: usuario,
        as: "usuario"
    });
    if (insumo_ordem_producao) includes.push({
        model: insumo_ordem_producao,
        as: "insumo_ordem_producao"
    });
    if (movimentacao_estoque) includes.push({
        model: movimentacao_estoque,
        as: "movimentacao_estoque"
    });
    return includes;
}

async function listar() {
    return ordem_producao.findAll({
        order: [["id_op", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return ordem_producao.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return ordem_producao.create(dados);
}

async function atualizar(id, dados) {
    const registro = await ordem_producao.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await ordem_producao.findByPk(id);
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
