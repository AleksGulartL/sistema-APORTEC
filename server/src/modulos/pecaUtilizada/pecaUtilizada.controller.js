const pecaUtilizadaService = require("./pecaUtilizada.service");

async function listar(req, res) {
    try {
        const pecas = await pecaUtilizadaService.listar();
        return res.status(200).json(pecas);
    } catch (erro) {
        console.error("Erro ao buscar peças utilizadas na OS:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const peca = await pecaUtilizadaService.buscarPorId(req.params.id);
        if (!peca) {
            return res.status(404).json({ erro: "Peça utilizada não encontrada." });
        }
        return res.status(200).json(peca);
    } catch (erro) {
        console.error("Erro ao buscar peça utilizada:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const peca = await pecaUtilizadaService.criar(req.body);
        return res.status(201).json(peca);
    } catch (erro) {
        console.error("Erro ao registrar peça utilizada:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Ordem de serviço ou item de catálogo informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const peca = await pecaUtilizadaService.atualizar(req.params.id, req.body);
        if (!peca) {
            return res.status(404).json({ erro: "Peça utilizada não encontrada." });
        }
        return res.status(200).json(peca);
    } catch (erro) {
        console.error("Erro ao atualizar peça utilizada:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Ordem de serviço ou item de catálogo informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const peca = await pecaUtilizadaService.deletar(req.params.id);
        if (!peca) {
            return res.status(404).json({ erro: "Peça utilizada não encontrada." });
        }
        return res.status(200).json({ mensagem: "Peça utilizada removida com sucesso." });
    } catch (erro) {
        console.error("Erro ao deletar peça utilizada:", erro);
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
