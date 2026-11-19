const pedidoRepository = require("./pedido.repository");

const STATUS_VALIDOS = [
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
const ETAPAS_FABRICACAO = ["Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao", "Concluido"];

function validarPedido(dados, isUpdate = false) {
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
    const dadosFormatados = {
        ...dados,
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
    const dadosFormatados = { ...dados };

    if (dadosFormatados.cliente_id !== undefined) {
        dadosFormatados.cliente_id = Number(dadosFormatados.cliente_id);
    }
    if (dadosFormatados.responsavel_producao_id !== undefined && dadosFormatados.responsavel_producao_id !== null) {
        dadosFormatados.responsavel_producao_id = Number(dadosFormatados.responsavel_producao_id);
    }

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
    if (!novoStatus || !STATUS_VALIDOS.includes(novoStatus)) {
        const erro = new Error(`O campo 'status' é obrigatório e deve ser um dos valores: ${STATUS_VALIDOS.join(", ")}.`);
        erro.status = 400;
        throw erro;
    }

    const existente = await pedidoRepository.buscarPorId(idNum);
    if (!existente) return null;

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

    const numeroSerie =
        dados.numero_serie ||
        existente.numero_serie ||
        `APORTEC-${agora.getFullYear()}-${String(idNum).padStart(4, "0")}`;

    const fimGarantia = dados.fim_garantia || umAnoDepois.toISOString().slice(0, 10);

    const pedidoAtualizado = await pedidoRepository.atualizar(idNum, {
        assinatura_cliente_instalacao: assinatura.trim(),
        numero_serie: numeroSerie,
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
