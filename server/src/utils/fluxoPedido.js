const CAMPOS_COMERCIAIS = [
    "cliente_id",
    "tipo_pedido",
    "endereco_instalacao",
    "forma_pagamento",
    "condicoes_pagamento",
    "percentual_acrescimo",
    "diagnostico_tecnico",
];
const CAMPOS_NUMERICOS = new Set(["cliente_id", "percentual_acrescimo"]);
const CAMPOS_CONCLUSAO = [
    "status",
    "assinatura_cliente_instalacao",
    "numero_serie",
    "fim_garantia",
    "data_conclusao",
];

function ehManutencao(pedido) {
    return ["Manutencao Corretiva", "Manutencao Preventiva"].includes(pedido.tipo_pedido);
}

function avaliacaoAprovada(pedido) {
    if (ehManutencao(pedido)) return Boolean(pedido.diagnostico_tecnico?.trim());
    const cm = pedido.checklist_medicao;
    return Boolean(cm && cm.status_aprovacao === "Aprovado" && cm.viga_ok !== false && cm.piso_ok !== false && cm.ponto_eletrico_ok !== false);
}

function exigirLiberacao(pedido) {
    if (!pedido || pedido.status === "Cancelado" || pedido.status_aprovacao !== "Aprovado" || pedido.orcamento_enviado !== true || pedido.bloqueio_fabricacao !== false || !avaliacaoAprovada(pedido)) {
        throw Object.assign(new Error("Execução bloqueada: registre a avaliação técnica e aguarde a aprovação do orçamento pelo cliente."), { status: 400 });
    }
}

function valorDiferente(campo, atual, novo) {
    if (novo === undefined) return false;
    if (CAMPOS_NUMERICOS.has(campo)) {
        if ((atual == null || atual === "") && (novo == null || novo === "")) return false;
        return Number(atual) !== Number(novo);
    }
    if (atual instanceof Date || novo instanceof Date) {
        return new Date(atual).getTime() !== new Date(novo).getTime();
    }
    return String(atual ?? "") !== String(novo ?? "");
}

function validarOrcamentoEditavel(pedido) {
    if (!pedido) {
        throw Object.assign(new Error("Pedido não encontrado."), { status: 400 });
    }
    if (pedido.orcamento_enviado || ["Cancelado", "Concluido"].includes(pedido.status)) {
        throw Object.assign(new Error("Reabra o orçamento para revisão antes de alterar seus itens."), { status: 400 });
    }
}

function validarEdicaoPedido(atual, dados = {}) {
    if (atual.status === "Concluido") {
        if (CAMPOS_CONCLUSAO.some((campo) => valorDiferente(campo, atual[campo], dados[campo]))) {
            throw Object.assign(new Error("O encerramento deste pedido já foi registrado e não pode ser refeito."), { status: 409 });
        }
    } else if (dados.status === "Concluido") {
        throw Object.assign(new Error("Finalize a OS com parecer e assinatura para concluir este pedido."), { status: 400 });
    }

    if (atual.orcamento_enviado && CAMPOS_COMERCIAIS.some((campo) => valorDiferente(campo, atual[campo], dados[campo]))) {
        throw Object.assign(new Error("Reabra o orçamento antes de alterar a proposta enviada ao cliente."), { status: 400 });
    }
}

function gerarNumeroSerie(pedidoId, dataConclusao = new Date()) {
    return `APORTEC-${dataConclusao.getFullYear()}-${String(pedidoId).padStart(4, "0")}`;
}

function calcularFimGarantia(dataConclusao = new Date()) {
    const fim = new Date(dataConclusao);
    fim.setFullYear(fim.getFullYear() + 1);
    const mes = String(fim.getMonth() + 1).padStart(2, "0");
    const dia = String(fim.getDate()).padStart(2, "0");
    return `${fim.getFullYear()}-${mes}-${dia}`;
}

function montarDadosConclusaoPedido(pedido, assinatura, dataConclusao = new Date()) {
    const payload = {
        status: "Concluido",
        assinatura_cliente_instalacao: assinatura,
        data_conclusao: dataConclusao,
    };
    if (pedido.tipo_pedido === "Instalacao") {
        payload.numero_serie = pedido.numero_serie || gerarNumeroSerie(pedido.id, dataConclusao);
        payload.fim_garantia = pedido.fim_garantia || calcularFimGarantia(dataConclusao);
    }
    return payload;
}

module.exports = {
    ehManutencao,
    avaliacaoAprovada,
    exigirLiberacao,
    validarOrcamentoEditavel,
    validarEdicaoPedido,
    gerarNumeroSerie,
    calcularFimGarantia,
    montarDadosConclusaoPedido,
};
