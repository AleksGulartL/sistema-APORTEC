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
    const registro = await checklist_medicao.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await checklist_medicao.findByPk(id);
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
