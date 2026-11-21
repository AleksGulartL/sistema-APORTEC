const PERFIS = Object.freeze({
    ADM: "ADM",
    TECNICO: "TECNICO",
    CLIENTE: "CLIENTE",
});

const { ADM, TECNICO, CLIENTE } = PERFIS;

const FUNCIONARIOS = [ADM, TECNICO];

const PERMISSOES = Object.freeze({
    usuario: {
        listarTecnicos: FUNCIONARIOS,
        listar: [ADM],
        buscarPorId: [ADM],
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    cliente: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    itemCatalogo: {
        listar: FUNCIONARIOS,
        listarTipos: FUNCIONARIOS,
        listarCategorias: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        listarAlertasEstoqueMinimo: [ADM],
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    pedido: {
        registrarAvaliacao: [TECNICO],
        enviarOrcamento: [ADM],
        reabrirOrcamento: [ADM],
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: [ADM],
        atualizar: [ADM],
        atualizarStatusEtapa: FUNCIONARIOS,
        coletarAssinaturaAceite: FUNCIONARIOS,
        deletar: [ADM],
    },

    pedidoItem: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    checklistMedicao: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: FUNCIONARIOS,
        atualizar: FUNCIONARIOS,
        deletar: [ADM],
    },

    ordemServico: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: FUNCIONARIOS,
        atualizar: FUNCIONARIOS,
        deletar: [ADM],
    },

    portalCliente: {
        obterResumo: [CLIENTE],
        criarSolicitacao: [CLIENTE],
        responderAprovacao: [CLIENTE],
        abrirSolicitacao: [CLIENTE],
        assinarEncerramento: [CLIENTE],
    },
});

module.exports = {
    PERFIS,
    FUNCIONARIOS,
    PERMISSOES,
};
