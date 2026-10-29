const movimentacaoEstoqueRepository = require("./movimentacaoEstoque.repository");

const TIPOS_MOVIMENTACAO = ["Entrada", "Baixa_Producao", "Baixa_OS", "Ajuste"];

function validarMovimentacaoEstoque(dados, isUpdate = false) {
    if (!isUpdate) {
        const idItemNum = Number(dados.id_item);
        if (!dados.id_item || !Number.isInteger(idItemNum) || idItemNum <= 0) {
            const erro = new Error("O campo 'id_item' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const idUsuarioNum = Number(dados.id_usuario);
        if (!dados.id_usuario || !Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
            const erro = new Error("O campo 'id_usuario' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.tipo_movimentacao || !TIPOS_MOVIMENTACAO.includes(dados.tipo_movimentacao)) {
            const erro = new Error("O campo 'tipo_movimentacao' é obrigatório e deve ser 'Entrada', 'Baixa_Producao', 'Baixa_OS' ou 'Ajuste'.");
            erro.status = 400;
            throw erro;
        }

        const quantidadeNum = Number(dados.quantidade);
        if (dados.quantidade === undefined || dados.quantidade === null || isNaN(quantidadeNum) || quantidadeNum <= 0) {
            const erro = new Error("O campo 'quantidade' é obrigatório e deve ser um número maior que zero.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.id_item !== undefined) {
            const idItemNum = Number(dados.id_item);
            if (!Number.isInteger(idItemNum) || idItemNum <= 0) {
                const erro = new Error("O campo 'id_item' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.id_usuario !== undefined) {
            const idUsuarioNum = Number(dados.id_usuario);
            if (!Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
                const erro = new Error("O campo 'id_usuario' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.tipo_movimentacao !== undefined && !TIPOS_MOVIMENTACAO.includes(dados.tipo_movimentacao)) {
            const erro = new Error("O campo 'tipo_movimentacao' deve ser 'Entrada', 'Baixa_Producao', 'Baixa_OS' ou 'Ajuste'.");
            erro.status = 400;
            throw erro;
        }

        if (dados.quantidade !== undefined) {
            const quantidadeNum = Number(dados.quantidade);
            if (isNaN(quantidadeNum) || quantidadeNum <= 0) {
                const erro = new Error("O campo 'quantidade' deve ser um número maior que zero.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.id_op !== undefined && dados.id_op !== null) {
        const idOpNum = Number(dados.id_op);
        if (!Number.isInteger(idOpNum) || idOpNum <= 0) {
            const erro = new Error("O campo 'id_op' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.id_ordem_servico !== undefined && dados.id_ordem_servico !== null) {
        const idOsNum = Number(dados.id_ordem_servico);
        if (!Number.isInteger(idOsNum) || idOsNum <= 0) {
            const erro = new Error("O campo 'id_ordem_servico' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_hora !== undefined && dados.data_hora !== null) {
        if (isNaN(new Date(dados.data_hora).getTime())) {
            const erro = new Error("A 'data_hora' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.fornecedor !== undefined && dados.fornecedor !== null) {
        if (typeof dados.fornecedor !== "string") {
            const erro = new Error("O campo 'fornecedor' deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return movimentacaoEstoqueRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return movimentacaoEstoqueRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarMovimentacaoEstoque(dados);
    const dadosFormatados = {
        ...dados,
        id_item: Number(dados.id_item),
        id_usuario: Number(dados.id_usuario),
        quantidade: Number(dados.quantidade),
    };

    if (dadosFormatados.id_op !== undefined && dadosFormatados.id_op !== null) {
        dadosFormatados.id_op = Number(dadosFormatados.id_op);
    }
    if (dadosFormatados.id_ordem_servico !== undefined && dadosFormatados.id_ordem_servico !== null) {
        dadosFormatados.id_ordem_servico = Number(dadosFormatados.id_ordem_servico);
    }

    delete dadosFormatados.id_movimentacao;
    return movimentacaoEstoqueRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarMovimentacaoEstoque(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_item !== undefined) {
        dadosFormatados.id_item = Number(dadosFormatados.id_item);
    }
    if (dadosFormatados.id_usuario !== undefined) {
        dadosFormatados.id_usuario = Number(dadosFormatados.id_usuario);
    }
    if (dadosFormatados.quantidade !== undefined) {
        dadosFormatados.quantidade = Number(dadosFormatados.quantidade);
    }
    if (dadosFormatados.id_op !== undefined && dadosFormatados.id_op !== null) {
        dadosFormatados.id_op = Number(dadosFormatados.id_op);
    }
    if (dadosFormatados.id_ordem_servico !== undefined && dadosFormatados.id_ordem_servico !== null) {
        dadosFormatados.id_ordem_servico = Number(dadosFormatados.id_ordem_servico);
    }

    delete dadosFormatados.id_movimentacao;
    return movimentacaoEstoqueRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return movimentacaoEstoqueRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
