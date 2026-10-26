const { checklist_medicao, pedido} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (pedido) includes.push({
        model: pedido,
        as: "pedido"
    });
    return includes;
}

async function listar() {
    return checklist_medicao.findAll({
        order: [["id_medicao", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return checklist_medicao.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return checklist_medicao.create(dados);
}

async function atualizar(id, dados) {
    const checklist_medicao = await checklist_medicao.findByPk(id);
    if (!checklist_medicao) return null;
    return checklist_medicao.update(dados);
}

async function deletar(id) {
    const checklist_medicao = await checklist_medicao.findByPk(id);
    if (!checklist_medicao) return null;
    await checklist_medicao.destroy();
    return checklist_medicao;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
