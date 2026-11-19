const pedidoService = require("./pedido.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function listar(req, res) {
    try {
        const pedidos = await pedidoService.listar();
        return res.status(200).json(pedidos);
    } catch (erro) {
        console.error("Erro ao buscar pedidos:", erro);
        return responderErroController(res, erro);
    }
}

async function buscarPorId(req, res) {
    try {
        const pedido = await pedidoService.buscarPorId(req.params.id);
        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        return res.status(200).json(pedido);
    } catch (erro) {
        console.error("Erro ao buscar pedido:", erro);
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const pedido = await pedidoService.criar(req.body);
        return res.status(201).json(pedido);
    } catch (erro) {
        console.error("Erro ao criar pedido:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um pedido cadastrado com este número de série.",
            mensagemVinculo: "Cliente ou usuário responsável informado não existe.",
        });
    }
}

async function atualizar(req, res) {
    try {
        const pedido = await pedidoService.atualizar(req.params.id, req.body);
        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        return res.status(200).json(pedido);
    } catch (erro) {
        console.error("Erro ao atualizar pedido:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um pedido cadastrado com este número de série.",
            mensagemVinculo: "Cliente ou usuário responsável informado não existe.",
        });
    }
}

async function atualizarStatusEtapa(req, res) {
    try {
        const resultado = await pedidoService.atualizarStatusEtapa(req.params.id, req.body);
        if (!resultado) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        return res.status(200).json(resultado);
    } catch (erro) {
        console.error("Erro ao atualizar status da etapa do pedido:", erro);
        return responderErroController(res, erro, { statusPadrao: 400 });
    }
}

async function coletarAssinaturaAceite(req, res) {
    try {
        const resultado = await pedidoService.coletarAssinaturaAceite(req.params.id, req.body);
        if (!resultado) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        return res.status(200).json(resultado);
    } catch (erro) {
        console.error("Erro ao coletar assinatura de aceite do pedido:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe outra porta registrada com este número de série.",
        });
    }
}

async function deletar(req, res) {
    try {
        const pedido = await pedidoService.deletar(req.params.id);
        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado." });
        }
        return res.status(200).json({ mensagem: "Pedido removido com sucesso.", pedido });
    } catch (erro) {
        console.error("Erro ao excluir pedido:", erro);
        return responderErroController(res, erro, {
            mensagemVinculo:
                "Não é possível excluir este pedido pois ele possui Ordens de Serviço vinculadas.",
        });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    atualizarStatusEtapa,
    coletarAssinaturaAceite,
    deletar,
};
