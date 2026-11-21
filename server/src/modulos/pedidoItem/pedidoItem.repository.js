const { sequelize, pedido_item, pedido, item_catalogo } = require("../../database/models");
const { validarOrcamentoEditavel } = require("../../utils/fluxoPedido");

function obterIncludes() {
    const includes = [];
    if (pedido) {
        includes.push({
            model: pedido,
            as: "pedido",
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

async function travarPedidoEditavel(pedidoId, transaction) {
    const regPedido = await pedido.findByPk(pedidoId, { transaction, lock: transaction.LOCK.UPDATE });
    validarOrcamentoEditavel(regPedido);
    return regPedido;
}

async function recalcularTotaisPedido(pedidoId, transaction) {
    if (!pedidoId || !pedido || !pedido_item) return;
    const opcoes = transaction ? { transaction } : {};
    const registroPedido = await pedido.findByPk(pedidoId, opcoes);
    if (!registroPedido) return;

    const itens = await pedido_item.findAll({
        where: { pedido_id: pedidoId },
        ...opcoes,
    });

    const custoTotal = itens.reduce(
        (soma, item) => soma + (Number(item.quantidade || 0) * Number(item.valor_unitario || 0)),
        0
    );

    await registroPedido.update(
        { custo_total: Number(custoTotal.toFixed(2)) },
        opcoes
    );
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
    return sequelize.transaction(async (transaction) => {
        await travarPedidoEditavel(dados.pedido_id, transaction);
        const criado = await pedido_item.create(dados, { transaction });
        await recalcularTotaisPedido(criado.pedido_id, transaction);
        return criado;
    });
}

async function atualizar(id, dados) {
    return sequelize.transaction(async (transaction) => {
        const registro = await pedido_item.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!registro) return null;
        if (dados.pedido_id !== undefined && Number(dados.pedido_id) !== Number(registro.pedido_id)) {
            throw Object.assign(new Error("Não é permitido transferir itens entre orçamentos."), { status: 400 });
        }
        await travarPedidoEditavel(registro.pedido_id, transaction);
        const atualizado = await registro.update(dados, { transaction });
        await recalcularTotaisPedido(atualizado.pedido_id, transaction);
        return atualizado;
    });
}

async function deletar(id) {
    return sequelize.transaction(async (transaction) => {
        const registro = await pedido_item.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!registro) return null;
        await travarPedidoEditavel(registro.pedido_id, transaction);
        const pedidoId = registro.pedido_id;
        await registro.destroy({ transaction });
        await recalcularTotaisPedido(pedidoId, transaction);
        return registro;
    });
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
