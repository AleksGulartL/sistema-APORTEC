const { Op } = require("sequelize");
const { pedido, obra, usuario, checklist_medicao, movimentacao_estoque } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (obra) {
        includes.push({
            model: obra,
            as: "obra",
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "responsavel_producao",
        });
        includes.push({
            model: usuario,
            as: "usuario",
        });
    }
    if (checklist_medicao) {
        includes.push({
            model: checklist_medicao,
            as: "checklist_medicao",
        });
    }
    if (movimentacao_estoque) {
        includes.push({
            model: movimentacao_estoque,
            as: "insumo_ordem_producao",
        });
        includes.push({
            model: movimentacao_estoque,
            as: "movimentacao_estoque",
        });
    }
    return includes;
}

async function listar() {
    return pedido.findAll({
        where: {
            responsavel_producao_id: { [Op.ne]: null },
        },
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return pedido.findByPk(id, {
        include: obterIncludes(),
    });
}

async function buscarPedidoComChecklist(pedidoId) {
    return pedido.findByPk(pedidoId, {
        include: checklist_medicao ? [{ model: checklist_medicao, as: "checklist_medicao" }] : [],
    });
}

// Na modelagem unificada, a Ordem de Produção é ativada/liberada diretamente no registro do Pedido
async function criar(dados) {
    const pedidoId = Number(dados.id_pedido);
    if (pedidoId) {
        const regPedido = await pedido.findByPk(pedidoId);
        if (regPedido) {
            return regPedido.update({
                responsavel_producao_id: dados.id_responsavel_tecnico,
                data_inicio_producao: dados.data_inicio ?? new Date(),
                data_previsao_fim: dados.data_previsao_fim ?? regPedido.data_previsao_fim,
                data_conclusao: dados.data_conclusao ?? regPedido.data_conclusao,
                status_op: dados.status_op || "Em Fabricacao",
                status: dados.status || "Em Fabricacao",
                bloqueio_fabricacao: false,
                motivo_bloqueio: null,
            });
        }
    }
    return pedido.create(dados);
}

async function atualizar(id, dados) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    const payload = { ...dados };
    if (payload.id_responsavel_tecnico !== undefined) {
        payload.responsavel_producao_id = payload.id_responsavel_tecnico;
    }
    if (payload.data_inicio !== undefined) {
        payload.data_inicio_producao = payload.data_inicio;
    }
    if (payload.status_op === "Concluida") {
        payload.status = "Pronto para Instalacao";
        payload.data_conclusao = payload.data_conclusao || new Date();
    }
    return registro.update(payload);
}

async function deletar(id) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    await registro.update({
        responsavel_producao_id: null,
        status_op: "Cancelada",
    });
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    buscarPedidoComChecklist,
    criar,
    atualizar,
    deletar,
};
