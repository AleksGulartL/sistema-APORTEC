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
    const idCliente = dados.cliente_id ?? dados.id_cliente;
    const temCliente = idCliente !== undefined && idCliente !== null;

    if (!isUpdate && !temCliente) {
        const idOrcamentoNum = Number(dados.id_orcamento);
        if (!dados.id_orcamento || !Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
            const erro = new Error("O campo 'cliente_id' (ou 'id_orcamento') é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    } else if (temCliente) {
        const idClienteNum = Number(idCliente);
        if (!Number.isInteger(idClienteNum) || idClienteNum <= 0) {
            const erro = new Error("O campo 'cliente_id' deve ser um número inteiro válido.");
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

    const statusInformado = dados.status || dados.status_fluxo;
    if (statusInformado !== undefined && statusInformado !== null) {
        if (!STATUS_FLUXO_VALIDOS.includes(statusInformado)) {
            const erro = new Error(
                "O campo 'status' deve ser 'Aguardando', 'Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao' ou 'Concluido'."
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
    if (dados.id_cliente !== undefined || dados.cliente_id !== undefined) {
        dadosFormatados.cliente_id = Number(dados.cliente_id ?? dados.id_cliente);
    }
    if (dados.id_usuario_criador !== undefined || dados.usuario_criador_id !== undefined) {
        dadosFormatados.usuario_criador_id = Number(dados.usuario_criador_id ?? dados.id_usuario_criador);
    }
    if (dados.status_fluxo) {
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
    if (dadosFormatados.id_cliente !== undefined || dadosFormatados.cliente_id !== undefined) {
        dadosFormatados.cliente_id = Number(dadosFormatados.cliente_id ?? dadosFormatados.id_cliente);
    }
    if (dadosFormatados.status_fluxo) {
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
async function coletarAssinaturaAceite(id, dados = {}) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const assinatura = dados.assinatura_cliente_instalacao;
    if (!assinatura || typeof assinatura !== "string" || !assinatura.trim()) {
        const erro = new Error("A assinatura digital do cliente é obrigatória para formalizar o aceite da instalação.");
        erro.status = 400;
        throw erro;
    }

    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;

    const agora = new Date();
    const umAnoDepois = new Date(agora);
    umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);

    const numeroSeriePorta =
        dados.numero_serie_porta ||
        dados.numero_serie ||
        existente.numero_serie_porta ||
        `APORTEC-${agora.getFullYear()}-${String(idNum).padStart(4, "0")}`;

    const fimGarantia = dados.fim_garantia || umAnoDepois.toISOString().slice(0, 10);

    const pedidoAtualizado = await pedidoRepository.atualizar(idNum, {
        assinatura_cliente_instalacao: assinatura.trim(),
        numero_serie_porta: numeroSeriePorta,
        fim_garantia: fimGarantia,
        status: "Concluido",
        data_conclusao: agora,
    });

    return {
        pedido: pedidoAtualizado,
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
