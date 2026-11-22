const { Op, Sequelize } = require("sequelize");
const { item_catalogo, tipo_item, categoria_item, pedido_item } = require("../../database/models");
const { criarErro } = require("../../utils/criarErro");

function obterIncludes() {
    const includes = [];
    if (tipo_item) {
        includes.push({ model: tipo_item, as: "tipo" });
    }
    if (categoria_item) {
        includes.push({ model: categoria_item, as: "categoria" });
    }
    return includes;
}

async function listar() {
    return item_catalogo.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function listarAlertasEstoqueMinimo() {
    return item_catalogo.findAll({
        where: Sequelize.where(
            Sequelize.col("quantidade_atual"),
            Op.lte,
            Sequelize.col("estoque_minimo")
        ),
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return item_catalogo.findByPk(id, {
        include: obterIncludes(),
    });
}

async function listarTipos() {
    if (!tipo_item) return [];
    return tipo_item.findAll({ order: [["id", "ASC"]] });
}

async function listarCategorias() {
    if (!categoria_item) return [];
    return categoria_item.findAll({ order: [["id", "ASC"]] });
}

async function criar(dados) {
    const criado = await item_catalogo.create(dados);
    return buscarPorId(criado.id);
}

async function atualizar(id, dados) {
    const item = await item_catalogo.findByPk(id);
    if (!item) return null;
    await item.update(dados);
    return buscarPorId(id);
}

async function deletar(id) {
    const item = await item_catalogo.findByPk(id);
    if (!item) return null;
    if (pedido_item && (await pedido_item.count({ where: { item_id: id } })) > 0) {
        throw criarErro("Não é possível excluir este item pois ele está vinculado a um ou mais pedidos.", 400);
    }
    await item.destroy();
    return item;
}

module.exports = {
    listar,
    listarAlertasEstoqueMinimo,
    buscarPorId,
    listarTipos,
    listarCategorias,
    criar,
    atualizar,
    deletar,
};
