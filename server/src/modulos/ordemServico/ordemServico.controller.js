const ordemServicoService = require("./ordemServico.service");

async function listar(req, res) {
    try {
        const ordens = await ordemServicoService.listar();
        return res.status(200).json(ordens);
    } catch (erro) {
        console.error("Erro ao buscar ordens de serviço:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const os = await ordemServicoService.buscarPorId(req.params.id);
        if (!os) {
            return res.status(404).json({ erro: "Ordem de serviço não encontrada." });
        }
        return res.status(200).json(os);
    } catch (erro) {
        console.error("Erro ao buscar ordem de serviço:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const os = await ordemServicoService.criar(req.body);
        return res.status(201).json(os);
    } catch (erro) {
        console.error("Erro ao criar ordem de serviço:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Obra, porta ou técnico informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const os = await ordemServicoService.atualizar(req.params.id, req.body);
        if (!os) {
            return res.status(404).json({ erro: "Ordem de serviço não encontrada." });
        }
        return res.status(200).json(os);
    } catch (erro) {
        console.error("Erro ao atualizar ordem de serviço:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Obra, porta ou técnico informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const os = await ordemServicoService.deletar(req.params.id);
        if (!os) {
            return res.status(404).json({ erro: "Ordem de serviço não encontrada." });
        }
        return res.status(200).json({ mensagem: "Ordem de serviço removida com sucesso." });
    } catch (erro) {
        console.error("Erro ao deletar ordem de serviço:", erro);
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
