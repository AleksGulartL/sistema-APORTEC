const itemCatalogoService = require("./itemCatalogo.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function listar(req, res) {
    try {
        const itens = await itemCatalogoService.listar();
        return res.status(200).json(itens);
    } catch (erro) {
        console.error("Erro ao buscar itens do catálogo:", erro);
        return responderErroController(res, erro);
    }
}

async function listarTipos(req, res) {
    try {
        const tipos = await itemCatalogoService.listarTipos();
        return res.status(200).json(tipos);
    } catch (erro) {
        console.error("Erro ao listar tipos de item:", erro);
        return responderErroController(res, erro);
    }
}

async function listarCategorias(req, res) {
    try {
        const categorias = await itemCatalogoService.listarCategorias();
        return res.status(200).json(categorias);
    } catch (erro) {
        console.error("Erro ao listar categorias de item:", erro);
        return responderErroController(res, erro);
    }
}

async function listarAlertasEstoqueMinimo(req, res) {
    try {
        const alertas = await itemCatalogoService.listarAlertasEstoqueMinimo();
        return res.status(200).json(alertas);
    } catch (erro) {
        console.error("Erro ao buscar alertas de estoque mínimo:", erro);
        return responderErroController(res, erro);
    }
}

async function buscarPorId(req, res) {
    try {
        const item = await itemCatalogoService.buscarPorId(req.params.id);
        if (!item) {
            return res.status(404).json({ erro: "Item do catálogo não encontrado." });
        }
        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao buscar item do catálogo:", erro);
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const item = await itemCatalogoService.criar(req.body);
        return res.status(201).json(item);
    } catch (erro) {
        console.error("Erro ao criar item do catálogo:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um item com este código de referência.",
            mensagemVinculo: "Tipo ou categoria informada não existe.",
        });
    }
}

async function atualizar(req, res) {
    try {
        const item = await itemCatalogoService.atualizar(req.params.id, req.body);
        if (!item) {
            return res.status(404).json({ erro: "Item do catálogo não encontrado." });
        }
        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao atualizar item do catálogo:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um item com este código de referência.",
            mensagemVinculo: "Tipo ou categoria informada não existe.",
        });
    }
}

async function deletar(req, res) {
    try {
        const item = await itemCatalogoService.deletar(req.params.id);
        if (!item) {
            return res.status(404).json({ erro: "Item do catálogo não encontrado." });
        }
        return res.status(200).json({ mensagem: "Item do catálogo removido com sucesso.", item });
    } catch (erro) {
        console.error("Erro ao deletar item do catálogo:", erro);
        return responderErroController(res, erro, {
            mensagemVinculo:
                "Não é possível excluir este item pois ele está vinculado a um ou mais pedidos.",
        });
    }
}

module.exports = {
    listar,
    listarTipos,
    listarCategorias,
    listarAlertasEstoqueMinimo,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
