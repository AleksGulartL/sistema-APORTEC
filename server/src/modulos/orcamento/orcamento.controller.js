const orcamentoService = require("./orcamento.service");

async function listar(req, res) {
    try {
        const orcamentos = await orcamentoService.listar();
        return res.status(200).json(orcamentos);
    } catch (erro) {
        console.error("Erro ao buscar orçamentos:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const registro = await orcamentoService.buscarPorId(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Orçamento não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao buscar orçamento:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const registro = await orcamentoService.criar(req.body);
        return res.status(201).json(registro);
    } catch (erro) {
        console.error("Erro ao criar orçamento:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Cliente, obra ou usuário informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const registro = await orcamentoService.atualizar(req.params.id, req.body);
        if (!registro) {
            return res.status(404).json({ erro: "Orçamento não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao atualizar orçamento:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Cliente, obra ou usuário informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const registro = await orcamentoService.deletar(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Orçamento não encontrado." });
        }
        return res.status(200).json({ mensagem: "Orçamento removido com sucesso.", orcamento: registro });
    } catch (erro) {
        console.error("Erro ao excluir orçamento:", erro);
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
