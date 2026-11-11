const pedidoRepository = require("./pedido.repository");

const STATUS_FLUXO_VALIDOS = [
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

const ETAPAS_FABRICACAO = ["Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao", "Concluido"];

function validarPedido(dados, isUpdate = false) {
    const temObra = dados.obra_id !== undefined || dados.id_obra !== undefined;
    const idOrcamentoRaw = dados.id_orcamento !== undefined ? dados.id_orcamento : dados.pedido_id;

    if (!isUpdate && !temObra) {
        const idOrcamentoNum = Number(idOrcamentoRaw);
        if (!idOrcamentoRaw || !Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
            const erro = new Error("O campo 'id_orcamento' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    } else if (idOrcamentoRaw !== undefined) {
        const idOrcamentoNum = Number(idOrcamentoRaw);
        if (!Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
            const erro = new Error("O campo 'id_orcamento' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_conversao !== undefined && dados.data_conversao !== null) {
        if (isNaN(new Date(dados.data_conversao).getTime())) {
            const erro = new Error("A 'data_conversao' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.valor_total !== undefined && dados.valor_total !== null) {
        const valorNum = Number(dados.valor_total);
        if (isNaN(valorNum) || valorNum < 0) {
            const erro = new Error("O 'valor_total' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    const statusFluxo = dados.status_fluxo !== undefined ? dados.status_fluxo : dados.status;
    if (statusFluxo !== undefined && statusFluxo !== null) {
        if (!STATUS_FLUXO_VALIDOS.includes(statusFluxo)) {
            const erro = new Error(
                "O campo 'status_fluxo' deve ser 'Aguardando', 'Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao' ou 'Concluido'."
            );
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
    validarPedido(dados);
    const dadosFormatados = { ...dados };

    if (dados.id_orcamento !== undefined) {
        dadosFormatados.id_orcamento = Number(dados.id_orcamento);
    }
    if (dados.obra_id !== undefined || dados.id_obra !== undefined) {
        dadosFormatados.obra_id = Number(dados.obra_id ?? dados.id_obra);
    }
    if (dados.usuario_criador_id !== undefined || dados.id_usuario_criador !== undefined) {
        dadosFormatados.usuario_criador_id = Number(dados.usuario_criador_id ?? dados.id_usuario_criador);
    }
    if (dados.status_fluxo && !dadosFormatados.status) {
        dadosFormatados.status = dados.status_fluxo;
    }

    delete dadosFormatados.id_pedido;
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
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_orcamento !== undefined) {
        dadosFormatados.id_orcamento = Number(dadosFormatados.id_orcamento);
    }
    if (dadosFormatados.status_fluxo && !dadosFormatados.status) {
        dadosFormatados.status = dadosFormatados.status_fluxo;
    }

    delete dadosFormatados.id_pedido;
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

    const novoStatus = dados.status || dados.status_fluxo;
    if (!novoStatus || !STATUS_FLUXO_VALIDOS.includes(novoStatus)) {
        const erro = new Error(
            "O campo 'status' é obrigatório e deve ser 'Aguardando', 'Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao' ou 'Concluido'."
        );
        erro.status = 400;
        throw erro;
    }

    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;

    // RF08 - Impede avanço para etapas de fabricação se o bloqueio estiver ativo
    if (ETAPAS_FABRICACAO.includes(novoStatus) && existente.bloqueio_fabricacao === true) {
        const erro = new Error(
            existente.motivo_bloqueio ||
                "Bloqueio de fabricação ativo: verifique a aprovação do orçamento e o checklist técnico de medição."
        );
        erro.status = 400;
        throw erro;
    }

    const payloadAtualizacao = {
        status: novoStatus,
        status_fluxo: novoStatus,
    };
    if (novoStatus === "Concluido") {
        payloadAtualizacao.status_op = "Concluida";
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

// RF13 - Coletar Assinatura Digital de Aceite na Obra e iniciar garantia da Porta Instalada
async function coletarAssinaturaAceite(id, dados = {}) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const assinatura = dados.assinatura_cliente_instalacao || dados.assinatura_cliente_digital || dados.assinatura;
    if (!assinatura || typeof assinatura !== "string" || !assinatura.trim()) {
        const erro = new Error("A assinatura digital do cliente é obrigatória para formalizar o aceite da instalação.");
        erro.status = 400;
        throw erro;
    }

    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;

    const agora = new Date();
    const pedidoAtualizado = await pedidoRepository.atualizar(idNum, {
        assinatura_cliente_instalacao: assinatura.trim(),
        data_aceite_instalacao: agora,
        status: "Concluido",
        status_op: "Concluida",
        data_conclusao: agora,
    });

    let portaInstalada = null;
    if (typeof pedidoRepository.registrarPortaInstalada === "function") {
        portaInstalada = await pedidoRepository.registrarPortaInstalada(existente, dados);
    }

    return {
        pedido: pedidoAtualizado,
        porta_instalada: portaInstalada,
    };
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

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    atualizarStatusEtapa,
    coletarAssinaturaAceite,
    deletar,
};
