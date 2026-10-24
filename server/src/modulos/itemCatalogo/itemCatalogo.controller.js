const itemCatalogoService = require("./itemCatalogo.service");

async function listar(req, res) {
    try {
        const itens = await itemCatalogoService.listar();
        return res.status(200).json(itens);
    } catch (erro) {
        console.error("Erro ao buscar itens do catálogo:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const item = await itemCatalogoService.buscarPorId(req.params.id);
        if (!item) {
            return res.status(404).json({ erro: "Item do catálogo não encontrado." });
        }
        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao buscar item do catálogo:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const item = await itemCatalogoService.criar(req.body);
        return res.status(201).json(item);
    } catch (erro) {
        console.error("Erro ao criar item do catálogo:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe um item com este código de referência." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const item = await itemCatalogoService.atualizar(req.params.id, req.body);
        if (!item) {
            return res.status(404).json({ erro: "Item do catálogo não encontrado." });
        }
        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao atualizar item do catálogo:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe um item com este código de referência." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const item = await itemCatalogoService.deletar(req.params.id);
        if (!item) {
            return res.status(404).json({ erro: "Item do catálogo não encontrado." });
        }
        return res.status(200).json({ mensagem: "Item do catálogo removido com sucesso.", item });
    } catch (erro) {
        console.error("Erro ao excluir item do catálogo:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};