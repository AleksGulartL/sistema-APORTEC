const { pedido, obra, cliente, usuario, pedido_item, checklist_medicao } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (obra) {
        includes.push({
            model: obra,
            as: "obra_servico",
            include: cliente ? [{ model: cliente, as: "cliente" }] : [],
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario",
        });
    }
    if (pedido_item) {
        includes.push({
            model: pedido_item,
            as: "itens",
        });
    }
    if (checklist_medicao) {
        includes.push({
            model: checklist_medicao,
            as: "checklist_medicao",
        });
    }
    return includes;
}

async function listar() {
    return pedido.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return pedido.findByPk(id, {
        include: obterIncludes(),
    });
}

async function criar(dados) {
    const payload = { ...dados };
    if (!payload.codigo_proposta) {
        const sufixo = Math.floor(1000 + Math.random() * 9000);
        payload.codigo_proposta = `ORC-${new Date().getFullYear()}-${sufixo}`;
    }
    return pedido.create(payload);
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
    deletar,
};
