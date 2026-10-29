const insumoOrdemProducaoService = require("./insumoOrdemProducao.service");

async function listar(req, res) {
    try {
        const insumos = await insumoOrdemProducaoService.listar();
        return res.status(200).json(insumos);
    } catch (erro) {
        console.error("Erro ao buscar insumos da ordem de produção:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const insumo = await insumoOrdemProducaoService.buscarPorId(req.params.id);
        if (!insumo) {
            return res.status(404).json({ erro: "Insumo da ordem de produção não encontrado." });
        }
        return res.status(200).json(insumo);
    } catch (erro) {
        console.error("Erro ao buscar insumo da ordem de produção:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const insumo = await insumoOrdemProducaoService.criar(req.body);
        return res.status(201).json(insumo);
    } catch (erro) {
        console.error("Erro ao criar insumo da ordem de produção:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Ordem de produção ou item de catálogo informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const insumo = await insumoOrdemProducaoService.atualizar(req.params.id, req.body);
        if (!insumo) {
            return res.status(404).json({ erro: "Insumo da ordem de produção não encontrado." });
        }
        return res.status(200).json(insumo);
    } catch (erro) {
        console.error("Erro ao atualizar insumo da ordem de produção:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Ordem de produção ou item de catálogo informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const insumo = await insumoOrdemProducaoService.deletar(req.params.id);
        if (!insumo) {
            return res.status(404).json({ erro: "Insumo da ordem de produção não encontrado." });
        }
        return res.status(200).json({ mensagem: "Insumo da ordem de produção removido com sucesso." });
    } catch (erro) {
        console.error("Erro ao deletar insumo da ordem de produção:", erro);
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
