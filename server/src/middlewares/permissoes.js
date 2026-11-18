// Matriz central de permissões (RBAC - RF01)
// Define, para cada função de controller, quais perfis de acesso podem executá-la.
// Os perfis espelham o CHECK constraint `chk_usuario_perfil` da tabela `usuario`.

const PERFIS = Object.freeze({
    ADM: "ADM",
    TECNICO: "TECNICO",
    CLIENTE: "CLIENTE"
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

    // RF02 - Clientes: cadastro pel; consulta pelas equipes que atendem o cliente
    cliente: {
        listar: [ADM, TECNICO],
        buscarPorId: [ADM, TECNICO],
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    // RF10 - Catálogo/Estoque: mantido pel; consulta liberada aos funcionários
    itemCatalogo: {
        listar: [ADM, TECNICO],
        buscarPorId: [ADM, TECNICO],
        listarAlertasEstoqueMinimo: [ADM],
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    // RF04/RF05/RF06/RF12/RF13 - Pedido (ciclo unificado Orçamento -> Pedido)
    pedido: {
        listar: [ADM, TECNICO],
        buscarPorId: [ADM, TECNICO],
        criar: [ADM],
        atualizar: [ADM],
        atualizarStatusEtapa: [ADM, TECNICO], // RF12
        coletarAssinaturaAceite: [ADM, TECNICO], // RF13
        deletar: [ADM],
    },

    // RF04 - Itens do orçamento/pedido
    itemOrcamento: {
        listar: [ADM, TECNICO],
        buscarPorId: [ADM, TECNICO],
        criar: [ADM],
        atualizar: [ADM],
        deletar: [ADM],
    },

    // RF07/RF08 - Checklist técnico de medição (preenchido pela equipe de medição)
    checklistMedicao: {
        listar: [ADM, TECNICO],
        buscarPorId: [ADM, TECNICO],
        criar: [ADM, TECNICO],
        atualizar: [ADM, TECNICO],
        deletar: [ADM],
    },

    // RF14 - Ordens de serviço (instalação / assistência técnica)
    ordemServico: {
        listar: [ADM, TECNICO],
        buscarPorId: [ADM, TECNICO],
        criar: [ADM, TECNICO],
        atualizar: [ADM, TECNICO],
        deletar: [ADM],
    },
});

module.exports = {
    PERFIS,
    FUNCIONARIOS,
    PERMISSOES,
};
