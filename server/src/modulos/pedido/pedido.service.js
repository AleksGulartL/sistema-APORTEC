const { ehManutencao, avaliacaoAprovada, exigirLiberacao } = require("../../utils/fluxoPedido");
const { validarTecnico } = require("../../utils/validarTecnico");
const pedidoRepository = require("./pedido.repository");

const STATUS_VALIDOS = [
    "Recebida",
    "Em Avaliacao",
    "Em Atendimento",
    "Rascunho",
    "Pendente",
    "Aguardando",
    "Planejada",
    "Em Fabricacao",
    "Montagem",
    "Testes",
    "Pronto para Instalacao",
    "Concluido",
    "Cancelado",
];

const TIPOS_VALIDOS = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
const ETAPAS_FABRICACAO = ["Em Atendimento", "Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao", "Concluido"];

function validarPedido(dados, isUpdate = false) {
    for (const campo of ["forma_pagamento", "condicoes_pagamento"]) {
        if (dados[campo] != null && (typeof dados[campo] !== "string" || dados[campo].length > 1000)) {
            throw Object.assign(new Error(`${campo} deve ser um texto de até 1000 caracteres.`), { status: 400 });
        }
    }
    if (!isUpdate || dados.cliente_id !== undefined) {
        const idClienteNum = Number(dados.cliente_id);
        if (!dados.cliente_id || !Number.isInteger(idClienteNum) || idClienteNum <= 0) {
            const erro = new Error("O campo 'cliente_id' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.tipo_pedido !== undefined && dados.tipo_pedido !== null) {
        if (!TIPOS_VALIDOS.includes(dados.tipo_pedido)) {
            const erro = new Error(
                "O campo 'tipo_pedido' deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'."
            );
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.custo_total !== undefined && dados.custo_total !== null) {
        const custoNum = Number(dados.custo_total);
        if (isNaN(custoNum) || custoNum < 0) {
            const erro = new Error("O 'custo_total' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.percentual_acrescimo !== undefined && dados.percentual_acrescimo !== null) {
        const percNum = Number(dados.percentual_acrescimo);
        if (isNaN(percNum) || percNum < 0) {
            const erro = new Error("O 'percentual_acrescimo' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status !== undefined && dados.status !== null) {
        if (!STATUS_VALIDOS.includes(dados.status)) {
            const erro = new Error(`O campo 'status' deve ser um dos valores válidos: ${STATUS_VALIDOS.join(", ")}.`);
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.bloqueio_fabricacao !== undefined && dados.bloqueio_fabricacao !== null) {
        if (typeof dados.bloqueio_fabricacao !== "boolean") {
            const erro = new Error("O campo 'bloqueio_fabricacao' deve ser um booleano.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.motivo_bloqueio !== undefined && dados.motivo_bloqueio !== null) {
        if (typeof dados.motivo_bloqueio !== "string") {
            const erro = new Error("O campo 'motivo_bloqueio' deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return pedidoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pedidoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarPedido(dados, false);
    await validarTecnico(dados.responsavel_producao_id);
    if (dados.status && !["Rascunho", "Recebida"].includes(dados.status)) {
        throw Object.assign(new Error("O cadastro deve iniciar como Rascunho ou Recebida."), { status: 400 });
    }
    if (dados.status === "Recebida" && (typeof dados.descricao_solicitacao !== "string" || !dados.descricao_solicitacao.trim())) {
        throw Object.assign(new Error("Descreva o serviço solicitado."), { status: 400 });
    }
    const dadosFormatados = {
        ...dados,
        status: dados.status || "Rascunho",
        status_aprovacao: "Pendente",
        bloqueio_fabricacao: true,
        custo_total: 0,
        orcamento_enviado: false,
        diagnostico_tecnico: null,
        cliente_id: Number(dados.cliente_id),
    };

    if (dados.usuario_criador_id !== undefined && dados.usuario_criador_id !== null) {
        dadosFormatados.usuario_criador_id = Number(dados.usuario_criador_id);
    }
    if (dados.responsavel_producao_id !== undefined && dados.responsavel_producao_id !== null) {
        dadosFormatados.responsavel_producao_id = Number(dados.responsavel_producao_id);
    }

    delete dadosFormatados.id;
    return pedidoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarPedido(dados, true);
    await validarTecnico(dados.responsavel_producao_id);
    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;
    if (dados.status_aprovacao !== undefined && dados.status_aprovacao !== existente.status_aprovacao) {
        throw Object.assign(new Error("A aprovação deve ser registrada pelo cliente no orçamento enviado."), { status: 400 });
    }
    const campos = ["cliente_id", "tipo_pedido", "endereco_instalacao", "descricao_solicitacao", "forma_pagamento", "condicoes_pagamento", "percentual_acrescimo", "responsavel_producao_id", "data_previsao_fim"];
    const comerciais = campos.filter((campo) => !["responsavel_producao_id", "data_previsao_fim"].includes(campo));
    if (existente.orcamento_enviado && comerciais.some((campo) => dados[campo] !== undefined && String(dados[campo] ?? "") !== String(existente[campo] ?? ""))) {
        throw Object.assign(new Error("Reabra o orçamento para revisão antes de alterar os dados comerciais."), { status: 400 });
    }
    const dadosFormatados = Object.fromEntries(campos.filter((campo) => dados[campo] !== undefined).map((campo) => [campo, dados[campo]]));

    if (dadosFormatados.cliente_id !== undefined) {
        dadosFormatados.cliente_id = Number(dadosFormatados.cliente_id);
    }
    if (dadosFormatados.responsavel_producao_id !== undefined && dadosFormatados.responsavel_producao_id !== null) {
        dadosFormatados.responsavel_producao_id = Number(dadosFormatados.responsavel_producao_id);
    }

    if (dadosFormatados.responsavel_producao_id && existente.status === "Recebida") dadosFormatados.status = "Em Avaliacao";

    delete dadosFormatados.id;
    return pedidoRepository.atualizar(idNum, dadosFormatados);
}

// RF12 - Atualizar Status da Etapa do Pedido e gerar automaticamente Checklist de Pré-Saída
async function atualizarStatusEtapa(id, dados = {}) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const novoStatus = dados.status;
    if (novoStatus === "Concluido") {
        throw Object.assign(new Error("Finalize a OS com parecer e assinatura para concluir este pedido."), { status: 400 });
    }
    if (!novoStatus || !STATUS_VALIDOS.includes(novoStatus)) {
        const erro = new Error(`O campo 'status' é obrigatório e deve ser um dos valores: ${STATUS_VALIDOS.join(", ")}.`);
        erro.status = 400;
        throw erro;
    }

    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;
    if (existente.status === "Concluido") throw Object.assign(new Error("Este pedido já foi concluído."), { status: 409 });

    if (
        ETAPAS_FABRICACAO.includes(novoStatus) &&
        (existente.bloqueio_fabricacao === true || existente.status_aprovacao !== "Aprovado")
    ) {
        const erro = new Error(
            existente.motivo_bloqueio ||
                "Bloqueio de fabricação ativo: verifique a aprovação do orçamento e o checklist técnico de medição."
        );
        erro.status = 400;
        throw erro;
    }

    if (ETAPAS_FABRICACAO.includes(novoStatus)) exigirLiberacao(existente);
    if (novoStatus === "Em Atendimento" && !ehManutencao(existente)) {
        throw Object.assign(new Error("Em Atendimento é uma etapa de manutenção."), { status: 400 });
    }
    if (ehManutencao(existente) && ["Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao"].includes(novoStatus)) {
        throw Object.assign(new Error("Manutenções seguem a etapa Em Atendimento."), { status: 400 });
    }
    const payloadAtualizacao = { status: novoStatus };
    if (novoStatus === "Concluido") {
        payloadAtualizacao.data_conclusao = new Date();
    }

    const pedidoAtualizado = await pedidoRepository.atualizar(idNum, payloadAtualizacao);

    let checklist_pre_saida = null;
    if (novoStatus === "Pronto para Instalacao" && typeof pedidoRepository.gerarChecklistPreSaida === "function") {
        checklist_pre_saida = await pedidoRepository.gerarChecklistPreSaida(idNum);
    }

    return {
        pedido: pedidoAtualizado,
        checklist_pre_saida,
    };
}

// RF13 & RF15 - Coletar Assinatura Digital de Aceite e registrar número de série e garantia no próprio Pedido
async function coletarAssinaturaAceite() {
    throw Object.assign(new Error("O aceite agora é registrado exclusivamente na finalização da OS."), { status: 410 });
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pedidoRepository.deletar(idNum);
}

async function registrarAvaliacao(id, dados, solicitante) {
    const reg = await buscarPorId(id);
    if (!reg) return null;
    if (Number(reg.responsavel_producao_id) !== Number(solicitante.id)) {
        throw Object.assign(new Error("Somente o técnico atribuído pode registrar a avaliação."), { status: 403 });
    }
    if (reg.orcamento_enviado || ["Cancelado", "Concluido"].includes(reg.status)) {
        throw Object.assign(new Error("O orçamento precisa estar em preparação para registrar a avaliação."), { status: 400 });
    }
    const texto = typeof dados.diagnostico_tecnico === "string" ? dados.diagnostico_tecnico.trim() : "";
    if (!texto) throw Object.assign(new Error("Informe o diagnóstico e o serviço recomendado."), { status: 400 });
    return pedidoRepository.atualizar(Number(id), { diagnostico_tecnico: texto, data_avaliacao: new Date(), status: "Em Avaliacao" });
}

async function enviarOrcamento(id) {
    const reg = await buscarPorId(id);
    if (!reg) return null;
    if (reg.orcamento_enviado || ["Cancelado", "Concluido", "Em Atendimento"].includes(reg.status)) {
        throw Object.assign(new Error("Este orçamento não está disponível para envio."), { status: 400 });
    }
    await validarTecnico(reg.responsavel_producao_id);
    if (!reg.responsavel_producao_id || (ehManutencao(reg) ? !reg.diagnostico_tecnico?.trim() : !reg.checklist_medicao)) {
        throw Object.assign(new Error("Atribua um técnico e registre a avaliação técnica antes de enviar o orçamento."), { status: 400 });
    }
    if (!reg.itens?.length) throw Object.assign(new Error("Adicione os itens ou serviços ao orçamento antes de enviar."), { status: 400 });
    return pedidoRepository.atualizar(Number(id), { orcamento_enviado: true, status: "Pendente", status_aprovacao: "Pendente",
        bloqueio_fabricacao: true, motivo_bloqueio: "Aguardando aprovação do orçamento pelo cliente.", data_aprovacao: null });
}

async function reabrirOrcamento(id) {
    const reg = await buscarPorId(id);
    if (!reg) return null;
    if (!reg.orcamento_enviado || !["Rascunho", "Recebida", "Em Avaliacao", "Pendente", "Aguardando", "Planejada"].includes(reg.status) || reg.ordens_servico?.some((os) => ["Em Andamento", "Finalizada"].includes(os.status_os))) {
        throw Object.assign(new Error("Não é possível revisar um orçamento em execução ou encerrado."), { status: 400 });
    }
    return pedidoRepository.atualizar(Number(id), { orcamento_enviado: false, status: "Rascunho", status_aprovacao: "Pendente",
        data_aprovacao: null, bloqueio_fabricacao: true, motivo_bloqueio: "Orçamento em revisão; aguardando novo envio e aprovação." });
}

module.exports = {
    registrarAvaliacao, enviarOrcamento, reabrirOrcamento,
    listar,
    buscarPorId,
    criar,
    atualizar,
    atualizarStatusEtapa,
    coletarAssinaturaAceite,
    deletar,
};
