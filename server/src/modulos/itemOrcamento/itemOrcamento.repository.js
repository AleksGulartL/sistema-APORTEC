const { pedido_item, pedido, item_catalogo } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (pedido) {
        includes.push({
            model: pedido,
            as: "orcamento",
        });
    }
    if (item_catalogo) {
        includes.push({
            model: item_catalogo,
            as: "item_catalogo",
        });
    }
    return includes;
}

async function recalcularTotaisPedido(pedidoId) {
    if (!pedidoId || !pedido || !pedido_item) return;
    const registroPedido = await pedido.findByPk(pedidoId);
    if (!registroPedido) return;

    const itens = await pedido_item.findAll({
        where: { pedido_id: pedidoId },
    });

    const valorTotal = itens.reduce((soma, item) => soma + Number(item.valor_total || 0), 0);

    await registroPedido.update({
        valor_total: Number(valorTotal.toFixed(2)),
    });
}

async function listar() {
    return pedido_item.findAll({
        order: [["pedido_id", "ASC"], ["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return pedido_item.findByPk(id, {
        include: obterIncludes(),
    });
}

async function buscarItemCatalogo(itemId) {
    if (!item_catalogo) return null;
    return item_catalogo.findByPk(itemId);
}

async function criar(dados) {
    const criado = await pedido_item.create(dados);
    await recalcularTotaisPedido(criado.pedido_id);
    return criado;
}

async function atualizar(id, dados) {
    const registro = await pedido_item.findByPk(id);
    if (!registro) return null;
    const atualizado = await registro.update(dados);
    await recalcularTotaisPedido(atualizado.pedido_id);
    return atualizado;
}

async function deletar(id) {
    const registro = await pedido_item.findByPk(id);
    if (!registro) return null;
    const pedidoId = registro.pedido_id;
    await registro.destroy();
    await recalcularTotaisPedido(pedidoId);
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    buscarItemCatalogo,
    recalcularTotaisPedido,
    criar,
    atualizar,
    deletar,
};
