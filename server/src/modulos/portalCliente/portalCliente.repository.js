const {
    cliente,
    usuario,
    pedido,
    pedido_item,
    item_catalogo,
    checklist_medicao,
    ordem_servico,
} = require("../../database/models");

async function buscarClientePorUsuarioId(usuarioId) {
    return cliente.findOne({
        where: { usuario_id: usuarioId },
        include: [
            {
                model: usuario,
                as: "usuario",
                attributes: ["id", "nome_completo", "email", "perfil", "ativo"],
            },
        ],
    });
}

async function listarPedidosDoCliente(clienteId) {
    return pedido.findAll({
        where: { cliente_id: clienteId },
        order: [["id", "DESC"]],
        include: [
            {
                model: usuario,
                as: "responsavel_producao",
                attributes: ["id", "nome_completo"],
            },
            {
                model: pedido_item,
                as: "itens",
                include: [{ model: item_catalogo, as: "item_catalogo" }],
            },
            {
                model: checklist_medicao,
                as: "checklist_medicao",
            },
            {
                model: ordem_servico,
                as: "ordens_servico",
            },
        ],
    });
}

async function listarOrdensServicoDoCliente(clienteId) {
    return ordem_servico.findAll({
        order: [["id", "DESC"]],
        include: [
            {
                model: pedido,
                as: "pedido",
                where: { cliente_id: clienteId },
                required: true,
                attributes: ["id", "numero_serie", "status", "fim_garantia"],
            },
            {
                model: usuario,
                as: "tecnico_responsavel",
                attributes: ["id", "nome_completo"],
            },
        ],
    });
}

async function buscarPedidoDoClientePorId(pedidoId, clienteId) {
    return pedido.findOne({
        where: { id: pedidoId, cliente_id: clienteId },
        include: [{ model: checklist_medicao, as: "checklist_medicao" }],
    });
}

async function atualizarPedido(regPedido, dados) {
    return regPedido.update(dados);
}

async function criarOrdemServicoCliente(dados) {
    return ordem_servico.create(dados);
}

module.exports = {
    buscarClientePorUsuarioId,
    listarPedidosDoCliente,
    listarOrdensServicoDoCliente,
    buscarPedidoDoClientePorId,
    atualizarPedido,
    criarOrdemServicoCliente,
};
