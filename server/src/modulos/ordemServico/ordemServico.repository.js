const { sequelize, ordem_servico, cliente, pedido, usuario, checklist_medicao } = require("../../database/models");
const { ehManutencao, avaliacaoAprovada, montarDadosConclusaoPedido } = require("../../utils/fluxoPedido");

const erroFluxo = (mensagem, status = 400) => Object.assign(new Error(mensagem), { status });

function obterIncludes() {
    const includes = [];
    if (pedido) {
        includes.push({
            model: pedido,
            as: "pedido",
            include: cliente
                ? [
                      {
                          model: cliente,
                          as: "cliente",
                          include: usuario
                              ? [{ model: usuario, as: "usuario", attributes: ["id", "nome_completo", "email", "perfil"] }]
                              : [],
                      },
                  ]
                : [],
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "tecnico_responsavel",
            attributes: ["id", "nome_completo", "email", "perfil"],
        });
    }
    return includes;
}

async function validarRegrasOsNaTransacao({
    pedidoId,
    tipoServico,
    novoStatus,
    tecnicoId,
    parecer,
    assinatura,
    statusAnterior,
    transaction,
}) {
    const regPedido = await pedido.findByPk(pedidoId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!regPedido) throw erroFluxo("Pedido não encontrado.", 400);
    if (["Cancelado", "Concluido"].includes(regPedido.status)) {
        throw erroFluxo("O pedido vinculado já está encerrado.", 409);
    }
    if (tipoServico !== regPedido.tipo_pedido) {
        throw erroFluxo("O tipo da OS deve corresponder ao pedido vinculado.", 400);
    }

    if (["Em Andamento", "Finalizada"].includes(novoStatus)) {
        if (!regPedido.orcamento_enviado || regPedido.status_aprovacao !== "Aprovado" || regPedido.bloqueio_fabricacao) {
            throw erroFluxo("Execução bloqueada: aguarde a aprovação do orçamento pelo cliente.", 400);
        }
        if (ehManutencao(regPedido) && !regPedido.diagnostico_tecnico?.trim()) {
            throw erroFluxo("Registre o diagnóstico técnico antes do atendimento.", 400);
        }
    }

    if (novoStatus === "Finalizada") {
        if (statusAnterior === "Cancelada") {
            throw erroFluxo("Uma OS cancelada não pode ser finalizada.", 409);
        }
        if (!parecer?.trim() || !assinatura?.trim()) {
            throw erroFluxo("Informe o parecer técnico e a assinatura do cliente para finalizar.", 400);
        }
        const tecnico = tecnicoId
            ? await usuario.findOne({ where: { id: tecnicoId, perfil: "TECNICO", ativo: true }, transaction })
            : null;
        if (!tecnico) {
            throw erroFluxo("Atribua um técnico ativo antes de finalizar a OS.", 400);
        }
        if (tipoServico === "Instalacao") {
            const cm = await checklist_medicao.findOne({ where: { pedido_id: regPedido.id }, transaction });
            const pedidoComChecklist = { tipo_pedido: regPedido.tipo_pedido, checklist_medicao: cm };
            if (regPedido.status !== "Pronto para Instalacao" || !avaliacaoAprovada(pedidoComChecklist)) {
                throw erroFluxo("Conclua a produção e aprove a medição antes de finalizar a instalação.", 400);
            }
        }
    }

    return regPedido;
}

async function listar() {
    return ordem_servico.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id, options = {}) {
    return ordem_servico.findByPk(id, {
        ...options,
        include: obterIncludes(),
    });
}

async function criar(dados) {
    return sequelize.transaction(async (transaction) => {
        const payload = { ...dados };
        delete payload.data_conclusao;

        await validarRegrasOsNaTransacao({
            pedidoId: payload.pedido_id,
            tipoServico: payload.tipo_servico,
            novoStatus: payload.status_os || "Aberta",
            tecnicoId: payload.tecnico_responsavel_id,
            parecer: payload.parecer_tecnico,
            assinatura: payload.assinatura_cliente_digital,
            statusAnterior: null,
            transaction,
        });

        return ordem_servico.create(payload, { transaction });
    });
}

async function atualizar(id, dados) {
    return sequelize.transaction(async (transaction) => {
        const registro = await ordem_servico.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!registro) return null;
        if (registro.status_os === "Finalizada") {
            throw erroFluxo("Esta OS já foi finalizada e não pode ser alterada.", 409);
        }

        const payload = { ...dados };
        delete payload.data_conclusao;

        const pedidoId = payload.pedido_id ?? registro.pedido_id;
        const tipoServico = payload.tipo_servico ?? registro.tipo_servico;
        const novoStatus = payload.status_os ?? registro.status_os;
        const tecnicoId =
            payload.tecnico_responsavel_id !== undefined ? payload.tecnico_responsavel_id : registro.tecnico_responsavel_id;
        const parecer = payload.parecer_tecnico !== undefined ? payload.parecer_tecnico : registro.parecer_tecnico;
        const assinatura =
            payload.assinatura_cliente_digital !== undefined
                ? payload.assinatura_cliente_digital
                : registro.assinatura_cliente_digital;

        const regPedido = await validarRegrasOsNaTransacao({
            pedidoId,
            tipoServico,
            novoStatus,
            tecnicoId,
            parecer,
            assinatura,
            statusAnterior: registro.status_os,
            transaction,
        });

        if (novoStatus === "Finalizada") {
            const dataConclusao = new Date();
            const assinaturaLimpa = assinatura.trim();
            payload.parecer_tecnico = parecer.trim();
            payload.assinatura_cliente_digital = assinaturaLimpa;
            payload.data_conclusao = dataConclusao;

            await registro.update(payload, { transaction });
            await regPedido.update(montarDadosConclusaoPedido(regPedido, assinaturaLimpa, dataConclusao), { transaction });
        } else {
            await registro.update(payload, { transaction });
        }

        return buscarPorId(id, { transaction });
    });
}

async function deletar(id) {
    return sequelize.transaction(async (transaction) => {
        const registro = await ordem_servico.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!registro) return null;
        if (registro.status_os === "Finalizada") {
            throw erroFluxo("Uma OS finalizada não pode ser excluída.", 409);
        }
        await registro.destroy({ transaction });
        return registro;
    });
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
