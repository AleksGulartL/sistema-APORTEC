const checklist_medicaoService = require("./checklist_medicao.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function listar(req, res) {
    try {
        const checklists = await checklist_medicaoService.listar();
        return res.status(200).json(checklists);
    } catch (erro) {
        console.error("Erro ao buscar checklists de medição:", erro);
        return responderErroController(res, erro);
    }
}

async function buscarPorId(req, res) {
    try {
        const checklist = await checklist_medicaoService.buscarPorId(req.params.id);
        if (!checklist) {
            return res.status(404).json({ erro: "Checklist de medição não encontrado." });
        }
        return res.status(200).json(checklist);
    } catch (erro) {
        console.error("Erro ao buscar checklist de medição:", erro);
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const checklist = await checklist_medicaoService.criar(req.body);
        return res.status(201).json(checklist);
    } catch (erro) {
        console.error("Erro ao criar checklist de medição:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um checklist de medição cadastrado para este pedido.",
            mensagemVinculo: "Pedido ou técnico informado não existe.",
        });
    }
}

async function atualizar(req, res) {
    try {
        const checklist = await checklist_medicaoService.atualizar(req.params.id, req.body);
        if (!checklist) {
            return res.status(404).json({ erro: "Checklist de medição não encontrado." });
        }
        return res.status(200).json(checklist);
    } catch (erro) {
        console.error("Erro ao atualizar checklist de medição:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um checklist de medição cadastrado para este pedido.",
            mensagemVinculo: "Pedido ou técnico informado não existe.",
        });
    }
}

async function deletar(req, res) {
    try {
        const checklist = await checklist_medicaoService.deletar(req.params.id);
        if (!checklist) {
            return res.status(404).json({ erro: "Checklist de medição não encontrado." });
        }
        return res.status(200).json({ mensagem: "Checklist de medição removido com sucesso.", checklist });
    } catch (erro) {
        console.error("Erro ao excluir checklist de medição:", erro);
        return responderErroController(res, erro);
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
