const orcamentoRepository = require("./orcamento.repository");

const TIPOS_VALIDOS = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva", "Misto"];
const STATUS_VALIDOS = ["Pendente", "Aprovado", "Reprovado"];

function validarOrcamento(dados) {
    const idClienteNum = Number(dados.id_cliente);
    if (!dados.id_cliente || !Number.isInteger(idClienteNum) || idClienteNum <= 0) {
        const erro = new Error("O campo 'id_cliente' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const idObraNum = Number(dados.id_obra);
    if (!dados.id_obra || !Number.isInteger(idObraNum) || idObraNum <= 0) {
        const erro = new Error("O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const idUsuarioNum = Number(dados.id_usuario_criador);
    if (dados.id_usuario_criador === undefined || dados.id_usuario_criador === null || !Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
        const erro = new Error("O campo 'id_usuario_criador' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.tipo_orcamento) {
        const erro = new Error("O campo 'tipo_orcamento' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    if (!TIPOS_VALIDOS.includes(dados.tipo_orcamento)) {
        const erro = new Error("O campo 'tipo_orcamento' deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'.");
        erro.status = 400;
        throw erro;
    }

    if (dados.valor_total !== undefined && dados.valor_total !== null) {
        if (typeof dados.valor_total !== "number" || dados.valor_total < 0) {
            const erro = new Error("O 'valor_total' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.total_mercadorias !== undefined && dados.total_mercadorias !== null) {
        if (typeof dados.total_mercadorias !== "number" || dados.total_mercadorias < 0) {
            const erro = new Error("O 'total_mercadorias' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.total_servicos !== undefined && dados.total_servicos !== null) {
        if (typeof dados.total_servicos !== "number" || dados.total_servicos < 0) {
            const erro = new Error("O 'total_servicos' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.desconto_percentual !== undefined && dados.desconto_percentual !== null) {
        const desc = Number(dados.desconto_percentual);
        if (isNaN(desc) || desc < 0 || desc > 100) {
            const erro = new Error("O 'desconto_percentual' deve estar entre 0 e 100.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status_aprovacao !== undefined && dados.status_aprovacao !== null) {
        if (!STATUS_VALIDOS.includes(dados.status_aprovacao)) {
            const erro = new Error("O campo 'status_aprovacao' deve ser 'Pendente', 'Aprovado' ou 'Reprovado'.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return orcamentoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return orcamentoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarOrcamento(dados);
    const idObra = Number(dados.id_obra);
    const idUsuario = Number(dados.id_usuario_criador);
    const tipo = dados.tipo_orcamento;

    const dadosFormatados = {
        ...dados,
        obra_id: idObra,
        id_obra: idObra,
        usuario_criador_id: idUsuario,
        id_usuario_criador: idUsuario,
        tipo_pedido: tipo,
        tipo_orcamento: tipo,
    };
    if (dados.id_cliente !== undefined) {
        dadosFormatados.id_cliente = Number(dados.id_cliente);
    }
    if (dadosFormatados.status_aprovacao === "Aprovado" && !dadosFormatados.data_aprovacao) {
        dadosFormatados.data_aprovacao = new Date();
    }
    return orcamentoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarOrcamento(dados);
    const idObra = Number(dados.id_obra);
    const idUsuario = Number(dados.id_usuario_criador);
    const tipo = dados.tipo_orcamento;

    const dadosFormatados = {
        ...dados,
        obra_id: idObra,
        id_obra: idObra,
        usuario_criador_id: idUsuario,
        id_usuario_criador: idUsuario,
        tipo_pedido: tipo,
        tipo_orcamento: tipo,
        data_atualizacao: new Date(),
    };
    if (dados.id_cliente !== undefined) {
        dadosFormatados.id_cliente = Number(dados.id_cliente);
    }
    return orcamentoRepository.atualizar(idNum, dadosFormatados);
}

// RF05 - Aprovação de Orçamento pelo Cliente
async function aprovar(id, dados = {}) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const statusAprovacao = dados.status_aprovacao || "Aprovado";
    if (!["Aprovado", "Reprovado"].includes(statusAprovacao)) {
        const erro = new Error("O status de decisão deve ser 'Aprovado' ou 'Reprovado'.");
        erro.status = 400;
        throw erro;
    }

    const existente = await orcamentoRepository.buscarPorId(idNum);
    if (!existente) return null;

    const checklistAprovado =
        existente.checklist_medicao &&
        existente.checklist_medicao.status_aprovacao === "Aprovado" &&
        existente.checklist_medicao.viga_ok !== false &&
        existente.checklist_medicao.piso_ok !== false &&
        existente.checklist_medicao.ponto_eletrico_ok !== false;

    const desbloqueado = statusAprovacao === "Aprovado" && Boolean(checklistAprovado);

    return orcamentoRepository.atualizar(idNum, {
        status_aprovacao: statusAprovacao,
        data_aprovacao: statusAprovacao === "Aprovado" ? new Date() : null,
        data_fechamento: statusAprovacao === "Reprovado" ? new Date() : existente.data_fechamento,
        status: statusAprovacao === "Reprovado" ? "Cancelado" : existente.status || "Aguardando",
        bloqueio_fabricacao: !desbloqueado,
        motivo_bloqueio: desbloqueado
            ? null
            : statusAprovacao !== "Aprovado"
              ? "Orçamento reprovado ou pendente de aprovação do cliente."
              : "Aguardando aprovação do checklist técnico de medição.",
    });
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return orcamentoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    aprovar,
    deletar,
};
