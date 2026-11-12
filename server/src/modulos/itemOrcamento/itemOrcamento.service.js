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
        if (dados.id_item_catalogo === undefined || dados.id_item_catalogo === null || !Number.isInteger(idItemCatalogoNum) || idItemCatalogoNum <= 0) {
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

    if (dados.valor_unitario !== undefined && dados.valor_unitario !== null) {
        const valorUnitNum = Number(dados.valor_unitario);
        if (isNaN(valorUnitNum) || valorUnitNum < 0) {
            const erro = new Error("O 'valor_unitario' deve ser um número maior ou igual a zero.");
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
    const pedidoId = Number(dados.id_orcamento);
    const itemId = Number(dados.id_item_catalogo);
    const quantidade = dados.quantidade !== undefined ? Number(dados.quantidade) : 1;

    let valorUnitario = dados.valor_unitario !== undefined ? Number(dados.valor_unitario) : undefined;
    if (valorUnitario === undefined && typeof itemOrcamentoRepository.buscarItemCatalogo === "function") {
        const itemCat = await itemOrcamentoRepository.buscarItemCatalogo(itemId);
        if (itemCat && itemCat.valor_unitario_padrao !== undefined) {
            valorUnitario = Number(itemCat.valor_unitario_padrao);
        }
    }

    let valorTotal = dados.valor_total !== undefined ? Number(dados.valor_total) : undefined;
    if (valorTotal === undefined && valorUnitario !== undefined) {
        valorTotal = Number((quantidade * valorUnitario).toFixed(2));
    } else if (valorUnitario === undefined && valorTotal !== undefined && quantidade > 0) {
        valorUnitario = Number((valorTotal / quantidade).toFixed(2));
    }

    const dadosFormatados = {
        ...dados,
        pedido_id: pedidoId,
        id_orcamento: pedidoId,
        item_id: itemId,
        id_item_catalogo: itemId,
        quantidade,
        valor_unitario: valorUnitario ?? 0,
        valor_total: valorTotal ?? 0,
    };

    delete dadosFormatados.id_item_orcamento;
    delete dadosFormatados.id;
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

    if (dados.id_orcamento !== undefined) {
        dadosFormatados.pedido_id = Number(dados.id_orcamento);
        dadosFormatados.id_orcamento = Number(dados.id_orcamento);
    }

    if (dados.id_item_catalogo !== undefined) {
        dadosFormatados.item_id = Number(dados.id_item_catalogo);
        dadosFormatados.id_item_catalogo = Number(dados.id_item_catalogo);
    }

    if (dadosFormatados.quantidade !== undefined) {
        dadosFormatados.quantidade = Number(dadosFormatados.quantidade);
    }
    if (dadosFormatados.valor_unitario !== undefined) {
        dadosFormatados.valor_unitario = Number(dadosFormatados.valor_unitario);
    }
    if (dadosFormatados.valor_total !== undefined) {
        dadosFormatados.valor_total = Number(dadosFormatados.valor_total);
    }

    delete dadosFormatados.id_item_orcamento;
    delete dadosFormatados.id;
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
    deletar,
};
