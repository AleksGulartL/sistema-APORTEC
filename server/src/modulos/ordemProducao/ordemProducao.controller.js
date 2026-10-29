const ordemProducaoService = require("./ordemProducao.service");

async function listar(req, res) {
    try {
        const ordens = await ordemProducaoService.listar();
        return res.status(200).json(ordens);
    } catch (erro) {
        console.error("Erro ao buscar ordens de produção:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const op = await ordemProducaoService.buscarPorId(req.params.id);
        if (!op) {
            return res.status(404).json({ erro: "Ordem de produção não encontrada." });
        }
        return res.status(200).json(op);
    } catch (erro) {
        console.error("Erro ao buscar ordem de produção:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const op = await ordemProducaoService.criar(req.body);
        return res.status(201).json(op);
    } catch (erro) {
        console.error("Erro ao criar ordem de produção:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Pedido ou responsável técnico informado não existe." });
        }
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe uma ordem de produção vinculada a este pedido." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const op = await ordemProducaoService.atualizar(req.params.id, req.body);
        if (!op) {
            return res.status(404).json({ erro: "Ordem de produção não encontrada." });
        }
        return res.status(200).json(op);
    } catch (erro) {
        console.error("Erro ao atualizar ordem de produção:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Pedido ou responsável técnico informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const op = await ordemProducaoService.deletar(req.params.id);
        if (!op) {
            return res.status(404).json({ erro: "Ordem de produção não encontrada." });
        }
        return res.status(200).json({ mensagem: "Ordem de produção removida com sucesso." });
    } catch (erro) {
        console.error("Erro ao deletar ordem de produção:", erro);
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
