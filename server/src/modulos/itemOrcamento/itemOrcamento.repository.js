const { item_orcamento, orcamento, item_catalogo } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (orcamento) includes.push({
        model: orcamento,
        as: "orcamento"
    });
    if (item_catalogo) includes.push({
        model: item_catalogo,
        as: "item_catalogo"
    });
    return includes;
}

async function listar() {
    return item_orcamento.findAll({
        order: [["id_orcamento", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return item_orcamento.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return item_orcamento.create(dados);
}

async function atualizar(id, dados) {
    const registro = await item_orcamento.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await item_orcamento.findByPk(id);
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
