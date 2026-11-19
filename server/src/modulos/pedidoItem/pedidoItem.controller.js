const pedidoItemService = require("./pedidoItem.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function listar(req, res) {
    try {
        const itens = await pedidoItemService.listar();
        return res.status(200).json(itens);
    } catch (erro) {
        console.error("Erro ao buscar itens do pedido:", erro);
        return responderErroController(res, erro);
    }
}

async function buscarPorId(req, res) {
    try {
        const item = await pedidoItemService.buscarPorId(req.params.id);
        if (!item) {
            return res.status(404).json({ erro: "Item do pedido não encontrado." });
        }
        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao buscar item do pedido:", erro);
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const item = await pedidoItemService.criar(req.body);
        return res.status(201).json(item);
    } catch (erro) {
        console.error("Erro ao criar item do pedido:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Este item já foi adicionado a este pedido.",
            mensagemVinculo: "Pedido ou item do catálogo informado não existe.",
        });
    }
}

async function atualizar(req, res) {
    try {
        const item = await pedidoItemService.atualizar(req.params.id, req.body);
        if (!item) {
            return res.status(404).json({ erro: "Item do pedido não encontrado." });
        }
        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao atualizar item do pedido:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Este item já foi adicionado a este pedido.",
            mensagemVinculo: "Pedido ou item do catálogo informado não existe.",
        });
    }
}

async function deletar(req, res) {
    try {
        const item = await pedidoItemService.deletar(req.params.id);
        if (!item) {
            return res.status(404).json({ erro: "Item do pedido não encontrado." });
        }
        return res.status(200).json({ mensagem: "Item do pedido removido com sucesso.", item });
    } catch (erro) {
        console.error("Erro ao excluir item do pedido:", erro);
        return responderErroController(res, erro);
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
