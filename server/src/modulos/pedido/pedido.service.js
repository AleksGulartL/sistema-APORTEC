const { ehManutencao, avaliacaoAprovada, exigirLiberacao } = require("../../utils/fluxoPedido");
const { validarTecnico } = require("../../utils/validarTecnico");
const { criarErro } = require("../../utils/criarErro");
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
            throw criarErro(`${campo} deve ser um texto de até 1000 caracteres.`);
        }
    }
    if (!isUpdate || dados.cliente_id !== undefined) {
        const idClienteNum = Number(dados.cliente_id);
        if (!dados.cliente_id || !Number.isInteger(idClienteNum) || idClienteNum <= 0) {
            throw criarErro("O campo 'cliente_id' é obrigatório e deve ser um número inteiro válido.");
        }
    }

    if (dados.tipo_pedido !== undefined && dados.tipo_pedido !== null) {
        if (!TIPOS_VALIDOS.includes(dados.tipo_pedido)) {
            throw criarErro(
                "O campo 'tipo_pedido' deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'."
            );
        }
    }

    if (dados.custo_total !== undefined && dados.custo_total !== null) {
        const custoNum = Number(dados.custo_total);
        if (isNaN(custoNum) || custoNum < 0) {
            throw criarErro("O 'custo_total' deve ser um número maior ou igual a zero.");
        }
    }

    if (dados.percentual_acrescimo !== undefined && dados.percentual_acrescimo !== null) {
        const percNum = Number(dados.percentual_acrescimo);
        if (isNaN(percNum) || percNum < 0) {
            throw criarErro("O 'percentual_acrescimo' deve ser um número maior ou igual a zero.");
        }
    }

    if (dados.status !== undefined && dados.status !== null) {
        if (!STATUS_VALIDOS.includes(dados.status)) {
            throw criarErro(`O campo 'status' deve ser um dos valores válidos: ${STATUS_VALIDOS.join(", ")}.`);
        }
    }

    if (dados.bloqueio_fabricacao !== undefined && dados.bloqueio_fabricacao !== null) {
        if (typeof dados.bloqueio_fabricacao !== "boolean") {
            throw criarErro("O campo 'bloqueio_fabricacao' deve ser um booleano.");
        }
    }

    if (dados.motivo_bloqueio !== undefined && dados.motivo_bloqueio !== null) {
        if (typeof dados.motivo_bloqueio !== "string") {
            throw criarErro("O campo 'motivo_bloqueio' deve ser um texto válido.");
        }
    }
}

async function listar() {
    return pedidoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }
    return pedidoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarPedido(dados, false);
    await validarTecnico(dados.responsavel_producao_id);
    if (dados.status && !["Rascunho", "Recebida"].includes(dados.status)) {
        throw criarErro("O cadastro deve iniciar como Rascunho ou Recebida.");
    }
    if (dados.status === "Recebida" && (typeof dados.descricao_solicitacao !== "string" || !dados.descricao_solicitacao.trim())) {
        throw criarErro("Descreva o serviço solicitado.");
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
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }

    validarPedido(dados, true);
    await validarTecnico(dados.responsavel_producao_id);
    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;
    if (dados.status_aprovacao !== undefined && dados.status_aprovacao !== existente.status_aprovacao) {
        throw criarErro("A aprovação deve ser registrada pelo cliente no orçamento enviado.");
    }
    const campos = ["cliente_id", "tipo_pedido", "endereco_instalacao", "descricao_solicitacao", "forma_pagamento", "condicoes_pagamento", "percentual_acrescimo", "responsavel_producao_id", "data_previsao_fim"];
    const comerciais = campos.filter((campo) => !["responsavel_producao_id", "data_previsao_fim"].includes(campo));
    if (existente.orcamento_enviado && comerciais.some((campo) => dados[campo] !== undefined && String(dados[campo] ?? "") !== String(existente[campo] ?? ""))) {
        throw criarErro("Reabra o orçamento para revisão antes de alterar os dados comerciais.");
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

async function atualizarStatusEtapa(id, dados = {}) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }

    const novoStatus = dados.status;
    if (novoStatus === "Concluido") {
        throw criarErro("Finalize a OS com parecer e assinatura para concluir este pedido.");
    }
    if (!novoStatus || !STATUS_VALIDOS.includes(novoStatus)) {
        throw criarErro(`O campo 'status' é obrigatório e deve ser um dos valores: ${STATUS_VALIDOS.join(", ")}.`);
    }

    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;
    if (existente.status === "Concluido") throw criarErro("Este pedido já foi concluído.", 409);

    if (
        ETAPAS_FABRICACAO.includes(novoStatus) &&
        (existente.bloqueio_fabricacao === true || existente.status_aprovacao !== "Aprovado")
    ) {
        throw criarErro(
            existente.motivo_bloqueio ||
                "Bloqueio de fabricação ativo: verifique a aprovação do orçamento e o checklist técnico de medição."
        );
    }

    if (ETAPAS_FABRICACAO.includes(novoStatus)) exigirLiberacao(existente);
    if (novoStatus === "Em Atendimento" && !ehManutencao(existente)) {
        throw criarErro("Em Atendimento é uma etapa de manutenção.");
    }
    if (ehManutencao(existente) && ["Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao"].includes(novoStatus)) {
        throw criarErro("Manutenções seguem a etapa Em Atendimento.");
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

async function coletarAssinaturaAceite() {
    throw criarErro("O aceite agora é registrado exclusivamente na finalização da OS.", 410);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }
    return pedidoRepository.deletar(idNum);
}

async function registrarAvaliacao(id, dados, solicitante) {
    const reg = await buscarPorId(id);
    if (!reg) return null;
    if (Number(reg.responsavel_producao_id) !== Number(solicitante.id)) {
        throw criarErro("Somente o técnico atribuído pode registrar a avaliação.", 403);
    }
    if (reg.orcamento_enviado || ["Cancelado", "Concluido"].includes(reg.status)) {
        throw criarErro("O orçamento precisa estar em preparação para registrar a avaliação.");
    }
    const texto = typeof dados.diagnostico_tecnico === "string" ? dados.diagnostico_tecnico.trim() : "";
    if (!texto) throw criarErro("Informe o diagnóstico e o serviço recomendado.");
    return pedidoRepository.atualizar(Number(id), { diagnostico_tecnico: texto, data_avaliacao: new Date(), status: "Em Avaliacao" });
}

async function enviarOrcamento(id) {
    const reg = await buscarPorId(id);
    if (!reg) return null;
    if (reg.orcamento_enviado || ["Cancelado", "Concluido", "Em Atendimento"].includes(reg.status)) {
        throw criarErro("Este orçamento não está disponível para envio.");
    }
    await validarTecnico(reg.responsavel_producao_id);
    if (!reg.responsavel_producao_id || (ehManutencao(reg) ? !reg.diagnostico_tecnico?.trim() : !reg.checklist_medicao)) {
        throw criarErro("Atribua um técnico e registre a avaliação técnica antes de enviar o orçamento.");
    }
    if (!reg.itens?.length) throw criarErro("Adicione os itens ou serviços ao orçamento antes de enviar.");
    return pedidoRepository.atualizar(Number(id), { orcamento_enviado: true, status: "Pendente", status_aprovacao: "Pendente",
        bloqueio_fabricacao: true, motivo_bloqueio: "Aguardando aprovação do orçamento pelo cliente.", data_aprovacao: null });
}

async function reabrirOrcamento(id) {
    const reg = await buscarPorId(id);
    if (!reg) return null;
    if (!reg.orcamento_enviado || !["Rascunho", "Recebida", "Em Avaliacao", "Pendente", "Aguardando", "Planejada"].includes(reg.status) || reg.ordens_servico?.some((os) => ["Em Andamento", "Finalizada"].includes(os.status_os))) {
        throw criarErro("Não é possível revisar um orçamento em execução ou encerrado.");
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
