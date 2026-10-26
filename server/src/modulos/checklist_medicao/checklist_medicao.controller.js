const checklist_medicaoService = require("./checklist_medicao.service");

async function listar(req, res) {
    try {
        const checklists = await checklist_medicaoService.listar();
        return res.status(200).json(checklists);
    } catch (erro) {
        console.error("Erro ao buscar checklist de medicao:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const checklist = await checklist_medicaoService.buscarPorId(req.params.id);
        if (!checklist) {
            return res.status(404).json({ erro: "Checklist de medicao nao encontrado." });
        }
        return res.status(200).json(checklist);
    } catch (erro) {
        console.error("Erro ao buscar checklist de medicao:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const checklist = await checklist_medicaoService.criar(req.body);
        return res.status(201).json(checklist);
    } catch (erro) {
        console.error("Erro ao criar checklist de medicao:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Medicao informada nao existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const checklist = await checklist_medicaoService.atualizar(req.params.id, req.body);
        if (!checklist) {
            return res.status(404).json({ erro: "Checklist de medicao nao encontrado." });
        }
        return res.status(200).json(checklist);
    } catch (erro) {
        console.error("Erro ao atualizar checklist de medicao:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "Medicao informada nao existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const checklist = await checklist_medicaoService.deletar(req.params.id);
        if (!checklist) {
            return res.status(404).json({ erro: "Checklist de medicao nao encontrado." });
        }
        return res.status(200).json({ mensagem: "Checklist de medicao removido com sucesso.", checklist });
    } catch (erro) {
        console.error("Erro ao excluir checklist de medicao:", erro);
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
