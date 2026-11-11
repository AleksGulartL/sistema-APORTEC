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
        include: item_catalogo ? [{ model: item_catalogo, as: "item_catalogo" }] : [],
    });

    let totalMercadorias = 0;
    let totalServicos = 0;

    for (const item of itens) {
        const subtotal = Number(item.valor_total || 0);
        const tipoItem = String(item.item_catalogo?.tipo || "Material").toUpperCase();
        if (tipoItem === "SERVICO") {
            totalServicos += subtotal;
        } else {
            totalMercadorias += subtotal;
        }
    }

    const bruto = totalMercadorias + totalServicos;
    const descontoPct = Number(registroPedido.desconto_percentual || 0);
    const liquido = Number((bruto * (1 - descontoPct / 100)).toFixed(2));

    await registroPedido.update({
        total_mercadorias: Number(totalMercadorias.toFixed(2)),
        total_servicos: Number(totalServicos.toFixed(2)),
        valor_total: liquido,
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
