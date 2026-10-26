const item_orcamentoService = require("./itemOrcamento.service");

async function listar(req, res) {
    try {
        const item_orcamentos = await item_orcamentoService.listar();
        return res.status(200).json(item_orcamentos);
    } catch (erro) {
        console.error("Erro ao buscar itens do orçamento:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const item_orcamento = await item_orcamentoService.buscarPorId(req.params.id);
        if (!item_orcamento) {
            return res.status(404).json({ erro: "Item do orçamento não encontrado." });
        }
        return res.status(200).json(item_orcamento);
    } catch (erro) {
        console.error("Erro ao buscar item do orçamento:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const item_orcamento = await item_orcamentoService.criar(req.body);
        return res.status(201).json(item_orcamento);
    } catch (erro) {
        console.error("Erro ao criar item do orçamento:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Pedido, produto ou serviço informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const item_orcamento = await item_orcamentoService.atualizar(req.params.id, req.body);
        if (!item_orcamento) {
            return res.status(404).json({ erro: "Item do orçamento não encontrado." });
        }
        return res.status(200).json(item_orcamento);
    } catch (erro) {
        console.error("Erro ao atualizar item do orçamento:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Pedido, produto ou serviço informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const item_orcamento = await item_orcamentoService.deletar(req.params.id);
        if (!item_orcamento) {
            return res.status(404).json({ erro: "Item do orçamento não encontrado." });
        }
        return res.status(200).json({ mensagem: "Item do orçamento removido com sucesso.", item_orcamento });
    } catch (erro) {
        console.error("Erro ao excluir item do orçamento:", erro);
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
