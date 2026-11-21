const { checklist_medicao, pedido, usuario } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (pedido) {
        includes.push({
            model: pedido,
            as: "pedido",
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "tecnico",
        });
    }
    return includes;
}

// RF08 - Sincroniza automaticamente a trava de liberação para fabricação no pedido vinculado
async function sincronizarBloqueioPedido(checklist) {
    if (!checklist || !checklist.pedido_id || !pedido) return;
    const regPedido = await pedido.findByPk(checklist.pedido_id);
    if (!regPedido || ["Concluido", "Cancelado"].includes(regPedido.status)) return;

    const pendencias = [];
    if (regPedido.status_aprovacao !== "Aprovado") {
        pendencias.push("orçamento pendente de aprovação pelo cliente");
    }
    if (checklist.viga_ok === false) {
        pendencias.push("pendência de viga");
    }
    if (checklist.piso_ok === false) {
        pendencias.push("pendência de nivelamento de piso");
    }
    if (checklist.ponto_eletrico_ok === false) {
        pendencias.push("ponto elétrico ausente ou inadequado");
    }
    if (checklist.status_aprovacao !== "Aprovado") {
        pendencias.push(`checklist de medição com status '${checklist.status_aprovacao}'`);
    }

    const bloqueado = pendencias.length > 0;
    await regPedido.update({
        bloqueio_fabricacao: bloqueado,
        motivo_bloqueio: bloqueado ? `Bloqueado: ${pendencias.join("; ")}.` : null,
    });
}

async function listar() {
    return checklist_medicao.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return checklist_medicao.findByPk(id, {
        include: obterIncludes(),
    });
}

async function buscarPorPedidoId(pedidoId) {
    return checklist_medicao.findOne({
        where: { pedido_id: pedidoId },
        include: obterIncludes(),
    });
}

async function criar(dados) {
    const criado = await checklist_medicao.create(dados);
    await sincronizarBloqueioPedido(criado);
    return criado;
}

async function atualizar(id, dados) {
    const registro = await checklist_medicao.findByPk(id);
    if (!registro) return null;
    const atualizado = await registro.update(dados);
    await sincronizarBloqueioPedido(atualizado);
    return atualizado;
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
    buscarPorPedidoId,
    sincronizarBloqueioPedido,
    criar,
    atualizar,
    deletar,
};
