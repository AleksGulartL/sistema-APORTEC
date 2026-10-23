const { item_catalogo } = require("../../database/models");

async function listar() {
    return item_catalogo.findAll({ order: [["id_item", "ASC"]] });
}

async function buscarPorId(id) {
    return item_catalogo.findByPk(id);
}

async function criar(dados) {
    return item_catalogo.create(dados);
}

async function atualizar(id, dados) {
    const item = await item_catalogo.findByPk(id);
    if (!item) return null;
    return item.update(dados);
}

async function deletar(id) {
    const item = await item_catalogo.findByPk(id);
    if (!item) return null;
    await item.destroy();
    return item;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};