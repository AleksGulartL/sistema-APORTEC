const orcamentoRepository = require("./orcamento.repository");

const TIPOS_VALIDOS = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
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

    const idUsuario = dados.id_usuario_criador;
    const idUsuarioNum = Number(idUsuario);
    if (idUsuario === undefined || idUsuario === null || !Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
        const erro = new Error("O campo 'id_usuario_criador' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const tipo = dados.tipo_orcamento || dados.tipo;
    if (!tipo) {
        const erro = new Error("O campo 'tipo_orcamento' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
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
    const dadosFormatados = {
        ...dados,
        id_cliente: Number(dados.id_cliente),
        id_obra: Number(dados.id_obra),
        id_usuario_criador: Number(dados.id_usuario_criador),
        tipo_orcamento: dados.tipo_orcamento || dados.tipo
    };
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
    const dadosFormatados = {
        ...dados,
        id_cliente: Number(dados.id_cliente),
        id_obra: Number(dados.id_obra),
        id_usuario_criador: Number(dados.id_usuario_criador !== undefined ? dados.id_usuario_criador : dados.id_usuario),
        tipo_orcamento: dados.tipo_orcamento || dados.tipo,
        data_atualizacao: new Date()
    };
    return orcamentoRepository.atualizar(idNum, dadosFormatados);
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
    deletar
};