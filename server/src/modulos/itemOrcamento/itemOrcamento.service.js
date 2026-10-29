const itemOrcamentoRepository = require("./itemOrcamento.repository");

function validarItemOrcamento(dados, isUpdate = false) {
    if (!isUpdate) {
        const idOrcamentoNum = Number(dados.id_orcamento);
        if (!dados.id_orcamento || !Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
            const erro = new Error("O campo 'id_orcamento' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const idItemCatalogoNum = Number(dados.id_item_catalogo);
        if (idItemCatalogoNum === undefined || idItemCatalogoNum === null || !Number.isInteger(idItemCatalogoNum) || idItemCatalogoNum <= 0) {
            const erro = new Error("O campo 'id_item_catalogo' é obrigatório e deve ser um número inteiro maior que zero.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.id_orcamento !== undefined) {
            const idOrcamentoNum = Number(dados.id_orcamento);
            if (!Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
                const erro = new Error("O campo 'id_orcamento' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.id_item_catalogo !== undefined) {
            const idItemCatalogoNum = Number(dados.id_item_catalogo);
            if (!Number.isInteger(idItemCatalogoNum) || idItemCatalogoNum <= 0) {
                const erro = new Error("O campo 'id_item_catalogo' deve ser um número inteiro maior que zero.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.quantidade !== undefined && dados.quantidade !== null) {
        const quantidadeNum = Number(dados.quantidade);
        if (isNaN(quantidadeNum) || quantidadeNum <= 0) {
            const erro = new Error("A 'quantidade' deve ser um número maior que zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.valor_total !== undefined && dados.valor_total !== null) {
        const valorTotalNum = Number(dados.valor_total);
        if (isNaN(valorTotalNum) || valorTotalNum < 0) {
            const erro = new Error("O 'valor_total' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return itemOrcamentoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return itemOrcamentoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarItemOrcamento(dados);
    const dadosFormatados = {
        ...dados,
        id_orcamento: Number(dados.id_orcamento),
        id_item_catalogo: Number(dados.id_item_catalogo),
    };

    if (dadosFormatados.quantidade !== undefined) {
        dadosFormatados.quantidade = Number(dadosFormatados.quantidade);
    }
    if (dadosFormatados.valor_total !== undefined) {
        dadosFormatados.valor_total = Number(dadosFormatados.valor_total);
    }

    delete dadosFormatados.id_item_orcamento;
    return itemOrcamentoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarItemOrcamento(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_orcamento !== undefined) {
        dadosFormatados.id_orcamento = Number(dadosFormatados.id_orcamento);
    }
    if (dadosFormatados.id_item_catalogo !== undefined) {
        dadosFormatados.id_item_catalogo = Number(dadosFormatados.id_item_catalogo);
    }
    if (dadosFormatados.quantidade !== undefined) {
        dadosFormatados.quantidade = Number(dadosFormatados.quantidade);
    }
    if (dadosFormatados.valor_total !== undefined) {
        dadosFormatados.valor_total = Number(dadosFormatados.valor_total);
    }

    delete dadosFormatados.id_item_orcamento;
    return itemOrcamentoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return itemOrcamentoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
