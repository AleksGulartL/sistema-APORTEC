const pedidoItemRepository = require("./pedidoItem.repository");

function extrairPedidoId(dados) {
    return dados.pedido_id ?? dados.id_pedido ?? dados.id_orcamento;
}

function extrairItemId(dados) {
    return dados.item_id ?? dados.id_item_catalogo ?? dados.id_item;
}

function validarPedidoItem(dados, isUpdate = false) {
    const pedidoIdRaw = extrairPedidoId(dados);
    const itemIdRaw = extrairItemId(dados);

    if (!isUpdate) {
        const pedidoIdNum = Number(pedidoIdRaw);
        if (!pedidoIdRaw || !Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
            const erro = new Error("O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const itemIdNum = Number(itemIdRaw);
        if (!itemIdRaw || !Number.isInteger(itemIdNum) || itemIdNum <= 0) {
            const erro = new Error("O campo 'item_id' é obrigatório e deve ser um número inteiro maior que zero.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (pedidoIdRaw !== undefined) {
            const pedidoIdNum = Number(pedidoIdRaw);
            if (!Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
                const erro = new Error("O campo 'pedido_id' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (itemIdRaw !== undefined) {
            const itemIdNum = Number(itemIdRaw);
            if (!Number.isInteger(itemIdNum) || itemIdNum <= 0) {
                const erro = new Error("O campo 'item_id' deve ser um número inteiro maior que zero.");
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
    return pedidoItemRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pedidoItemRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarPedidoItem(dados);
    const pedidoId = Number(extrairPedidoId(dados));
    const itemId = Number(extrairItemId(dados));
    const quantidade = dados.quantidade !== undefined ? Number(dados.quantidade) : 1;

    let valorUnitario = dados.valor_unitario !== undefined ? Number(dados.valor_unitario) : undefined;
    if (valorUnitario === undefined && typeof pedidoItemRepository.buscarItemCatalogo === "function") {
        const itemCat = await pedidoItemRepository.buscarItemCatalogo(itemId);
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
        pedido_id: pedidoId,
        item_id: itemId,
        quantidade,
        valor_unitario: valorUnitario ?? 0,
        valor_total: valorTotal ?? 0,
    };

    return pedidoItemRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarPedidoItem(dados, true);
    const dadosFormatados = {};

    const pedidoIdRaw = extrairPedidoId(dados);
    if (pedidoIdRaw !== undefined) {
        dadosFormatados.pedido_id = Number(pedidoIdRaw);
    }

    const itemIdRaw = extrairItemId(dados);
    if (itemIdRaw !== undefined) {
        dadosFormatados.item_id = Number(itemIdRaw);
    }

    if (dados.quantidade !== undefined) {
        dadosFormatados.quantidade = Number(dados.quantidade);
    }
    if (dados.valor_unitario !== undefined) {
        dadosFormatados.valor_unitario = Number(dados.valor_unitario);
    }
    if (dados.valor_total !== undefined) {
        dadosFormatados.valor_total = Number(dados.valor_total);
    }

    return pedidoItemRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pedidoItemRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
