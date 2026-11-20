// Matriz central de permissões (RBAC - RF01)
// Define, para cada função de controller, quais perfis de acesso podem executá-la.

const PERFIS = Object.freeze({
    ADM: "ADM",
    TECNICO: "TECNICO",
    CLIENTE: "CLIENTE",
});

const { ADM, TECNICO, CLIENTE } = PERFIS;

const FUNCIONARIOS = [ADM, TECNICO];

const PERMISSOES = Object.freeze({
    // RF01 - Gestão de usuários: exclusiva do ADM
    usuario: {
        listar: [ADM],
        buscarPorId: [ADM],
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    // RF02 - Clientes: cadastro pelo ADM; consulta pelos colaboradores internos
    cliente: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    // RF10 - Catálogo/Estoque: mantido pelo ADM; consulta liberada aos colaboradores
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

    // RF04/RF05/RF06/RF12/RF13 - Pedido (ciclo unificado Orçamento -> Pedido)
    pedido: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: [ADM],
        atualizar: [ADM],
        atualizarStatusEtapa: FUNCIONARIOS,
        coletarAssinaturaAceite: FUNCIONARIOS,
        deletar: [ADM],
    },

    // RF04/RF06 - Itens do pedido
    pedidoItem: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    // RF07/RF08 - Checklist técnico de medição
    checklistMedicao: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: FUNCIONARIOS,
        atualizar: FUNCIONARIOS,
        deletar: [ADM],
    },

    // RF14 - Ordens de serviço
    ordemServico: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: FUNCIONARIOS,
        atualizar: FUNCIONARIOS,
        deletar: [ADM],
    },

    // Portal do Cliente (escopo isolado aos registros do próprio cliente autenticado)
    portalCliente: {
        obterResumo: [CLIENTE],
        criarSolicitacao: [CLIENTE],
        responderAprovacao: [CLIENTE],
        abrirSolicitacao: [CLIENTE],
    },
});

module.exports = {
    PERFIS,
    FUNCIONARIOS,
    PERMISSOES,
};
