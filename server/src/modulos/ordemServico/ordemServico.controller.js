const ordemServicoService = require("./ordemServico.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function listar(req, res) {
    try {
        const ordens = await ordemServicoService.listar();
        return res.status(200).json(ordens);
    } catch (erro) {
        console.error("Erro ao buscar ordens de serviço:", erro);
        return responderErroController(res, erro);
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
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const os = await ordemServicoService.criar(req.body);
        return res.status(201).json(os);
    } catch (erro) {
        console.error("Erro ao criar ordem de serviço:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemVinculo: "Pedido ou técnico responsável informado não existe.",
        });
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
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemVinculo: "Pedido ou técnico responsável informado não existe.",
        });
    }
}

async function deletar(req, res) {
    try {
        const os = await ordemServicoService.deletar(req.params.id);
        if (!os) {
            return res.status(404).json({ erro: "Ordem de serviço não encontrada." });
        }
        return res.status(200).json({ mensagem: "Ordem de serviço removida com sucesso.", os });
    } catch (erro) {
        console.error("Erro ao deletar ordem de serviço:", erro);
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
