const { insumo_ordem_producao, ordem_producao, item_catalogo } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (ordem_producao) {
        includes.push({
            model: ordem_producao,
            as: "ordem_producao"
        });
    }
    if (item_catalogo) {
        includes.push({
            model: item_catalogo,
            as: "item_catalogo"
        });
    }
    return includes;
}

async function listar() {
    return insumo_ordem_producao.findAll({
        order: [["id_insumo_op", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return insumo_ordem_producao.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return insumo_ordem_producao.create(dados);
}

async function atualizar(id, dados) {
    const registro = await insumo_ordem_producao.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await insumo_ordem_producao.findByPk(id);
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
