// Matriz central de permissões (RBAC - RF01)
// Define, para cada função de controller, quais perfis de acesso podem executá-la.
// Os perfis espelham o CHECK constraint `chk_usuario_perfil` da tabela `usuario`.

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
        atualizarStatusEtapa: FUNCIONARIOS, // RF12
        coletarAssinaturaAceite: FUNCIONARIOS, // RF13
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

    // RF07/RF08 - Checklist técnico de medição (preenchido pela equipe técnica/ADM)
    checklistMedicao: {
        listar: FUNCIONARIOS,
        buscarPorId: FUNCIONARIOS,
        criar: FUNCIONARIOS,
        atualizar: FUNCIONARIOS,
        deletar: [ADM],
    },

    // RF14 - Ordens de serviço (instalação / assistência técnica)
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
        responderAprovacao: [CLIENTE],
        abrirSolicitacao: [CLIENTE],
    },
});

module.exports = {
    PERFIS,
    FUNCIONARIOS,
    PERMISSOES,
};
