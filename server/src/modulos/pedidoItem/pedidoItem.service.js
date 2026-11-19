const pedidoItemRepository = require("./pedidoItem.repository");

function validarPedidoItem(dados, isUpdate = false) {
    if (!isUpdate) {
        const pedidoIdNum = Number(dados.pedido_id);
        if (!dados.pedido_id || !Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
            const erro = new Error("O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const itemIdNum = Number(dados.item_id);
        if (!dados.item_id || !Number.isInteger(itemIdNum) || itemIdNum <= 0) {
            const erro = new Error("O campo 'item_id' é obrigatório e deve ser um número inteiro maior que zero.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.pedido_id !== undefined) {
            const pedidoIdNum = Number(dados.pedido_id);
            if (!Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
                const erro = new Error("O campo 'pedido_id' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.item_id !== undefined) {
            const itemIdNum = Number(dados.item_id);
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
    validarPedidoItem(dados, false);
    const pedidoId = Number(dados.pedido_id);
    const itemId = Number(dados.item_id);
    const quantidade = dados.quantidade !== undefined ? Number(dados.quantidade) : 1;

    let valorUnitario = dados.valor_unitario !== undefined ? Number(dados.valor_unitario) : undefined;
    if (valorUnitario === undefined && typeof pedidoItemRepository.buscarItemCatalogo === "function") {
        const itemCat = await pedidoItemRepository.buscarItemCatalogo(itemId);
        if (itemCat && itemCat.valor_unitario_padrao !== undefined) {
            valorUnitario = Number(itemCat.valor_unitario_padrao);
        }
    }

    return pedidoItemRepository.criar({
        pedido_id: pedidoId,
        item_id: itemId,
        quantidade,
        valor_unitario: valorUnitario ?? 0,
    });
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

    if (dados.pedido_id !== undefined) {
        dadosFormatados.pedido_id = Number(dados.pedido_id);
    }
    if (dados.item_id !== undefined) {
        dadosFormatados.item_id = Number(dados.item_id);
    }
    if (dados.quantidade !== undefined) {
        dadosFormatados.quantidade = Number(dados.quantidade);
    }
    if (dados.valor_unitario !== undefined) {
        dadosFormatados.valor_unitario = Number(dados.valor_unitario);
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
