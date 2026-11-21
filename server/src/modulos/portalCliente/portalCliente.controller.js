const portalClienteService = require("./portalCliente.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function obterResumo(req, res) {
    try {
        const resumo = await portalClienteService.obterResumo(req.usuario);
        return res.status(200).json(resumo);
    } catch (erro) {
        console.error("Erro ao obter dados do portal do cliente:", erro);
        return responderErroController(res, erro);
    }
}

async function responderAprovacao(req, res) {
    try {
        const pedidoAtualizado = await portalClienteService.responderAprovacaoOrcamento(
            req.usuario,
            req.params.id,
            req.body || {}
        );
        return res.status(200).json(pedidoAtualizado);
    } catch (erro) {
        console.error("Erro ao responder aprovação do orçamento:", erro);
        return responderErroController(res, erro, { statusPadrao: 400 });
    }
}

async function abrirSolicitacao(req, res) {
    try {
        const os = await portalClienteService.abrirSolicitacaoManutencao(
            req.usuario,
            req.body || {}
        );
        return res.status(201).json(os);
    } catch (erro) {
        console.error("Erro ao abrir solicitação de manutenção:", erro);
        return responderErroController(res, erro, { statusPadrao: 400 });
    }
}

async function criarSolicitacao(req, res) {
    try {
        return res.status(201).json(await portalClienteService.criarSolicitacao(req.usuario, req.body || {}));
    } catch (erro) {
        return responderErroController(res, erro, { statusPadrao: 400 });
    }
}

async function assinarEncerramento(req, res) {
    try {
        const os = await portalClienteService.assinarEncerramentoOs(req.usuario, req.params.id, req.body || {});
        if (!os) return res.status(404).json({ erro: "Ordem de serviço não encontrada." });
        return res.status(200).json(os);
    } catch (erro) {
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe outra porta registrada com este número de série.",
        });
    }
}

module.exports = {
    criarSolicitacao,
    assinarEncerramento,
    obterResumo,
    responderAprovacao,
    abrirSolicitacao,
};
