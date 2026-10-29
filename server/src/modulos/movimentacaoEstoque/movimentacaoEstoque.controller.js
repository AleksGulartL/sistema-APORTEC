const movimentacaoEstoqueService = require("./movimentacaoEstoque.service");

async function listar(req, res) {
    try {
        const movimentacoes = await movimentacaoEstoqueService.listar();
        return res.status(200).json(movimentacoes);
    } catch (erro) {
        console.error("Erro ao buscar movimentações de estoque:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const movimentacao = await movimentacaoEstoqueService.buscarPorId(req.params.id);
        if (!movimentacao) {
            return res.status(404).json({ erro: "Movimentação de estoque não encontrada." });
        }
        return res.status(200).json(movimentacao);
    } catch (erro) {
        console.error("Erro ao buscar movimentação de estoque:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const movimentacao = await movimentacaoEstoqueService.criar(req.body);
        return res.status(201).json(movimentacao);
    } catch (erro) {
        console.error("Erro ao registrar movimentação de estoque:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Item, usuário, ordem de produção ou ordem de serviço informada não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const movimentacao = await movimentacaoEstoqueService.atualizar(req.params.id, req.body);
        if (!movimentacao) {
            return res.status(404).json({ erro: "Movimentação de estoque não encontrada." });
        }
        return res.status(200).json(movimentacao);
    } catch (erro) {
        console.error("Erro ao atualizar movimentação de estoque:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Item, usuário, ordem de produção ou ordem de serviço informada não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const movimentacao = await movimentacaoEstoqueService.deletar(req.params.id);
        if (!movimentacao) {
            return res.status(404).json({ erro: "Movimentação de estoque não encontrada." });
        }
        return res.status(200).json({ mensagem: "Movimentação de estoque removida com sucesso." });
    } catch (erro) {
        console.error("Erro ao deletar movimentação de estoque:", erro);
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
