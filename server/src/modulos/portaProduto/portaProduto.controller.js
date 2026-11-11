const portaProdutoService = require("./portaProduto.service");

async function listar(req, res) {
    try {
        const portas = await portaProdutoService.listar();
        return res.status(200).json(portas);
    } catch (erro) {
        console.error("Erro ao buscar portas/produtos:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const porta = await portaProdutoService.buscarPorId(req.params.id);
        if (!porta) {
            return res.status(404).json({ erro: "Porta/produto não encontrado." });
        }
        return res.status(200).json(porta);
    } catch (erro) {
        console.error("Erro ao buscar porta/produto:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function obterProntuarioPorId(req, res) {
    try {
        const prontuario = await portaProdutoService.obterProntuarioPorId(req.params.id);
        if (!prontuario) {
            return res.status(404).json({ erro: "Porta/produto não encontrado." });
        }
        return res.status(200).json(prontuario);
    } catch (erro) {
        console.error("Erro ao consultar prontuário da porta:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function obterProntuarioPorNumeroSerie(req, res) {
    try {
        const prontuario = await portaProdutoService.obterProntuarioPorNumeroSerie(req.params.numero_serie);
        if (!prontuario) {
            return res.status(404).json({ erro: "Porta/produto não encontrado." });
        }
        return res.status(200).json(prontuario);
    } catch (erro) {
        console.error("Erro ao consultar prontuário da porta por número de série:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const porta = await portaProdutoService.criar(req.body);
        return res.status(201).json(porta);
    } catch (erro) {
        console.error("Erro ao criar porta/produto:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe uma porta cadastrada com este número de série." });
        }
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Obra ou pedido de origem informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const porta = await portaProdutoService.atualizar(req.params.id, req.body);
        if (!porta) {
            return res.status(404).json({ erro: "Porta/produto não encontrado." });
        }
        return res.status(200).json(porta);
    } catch (erro) {
        console.error("Erro ao atualizar porta/produto:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe uma porta cadastrada com este número de série." });
        }
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Obra ou pedido de origem informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const porta = await portaProdutoService.deletar(req.params.id);
        if (!porta) {
            return res.status(404).json({ erro: "Porta/produto não encontrado." });
        }
        return res.status(200).json({ mensagem: "Porta/produto removido com sucesso." });
    } catch (erro) {
        console.error("Erro ao deletar porta/produto:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

module.exports = {
    listar,
    buscarPorId,
    obterProntuarioPorId,
    obterProntuarioPorNumeroSerie,
    criar,
    atualizar,
    deletar,
};
