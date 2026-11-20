const usuarioService = require("./usuario.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function listar(req, res) {
    try {
        const usuarios = await usuarioService.listar();
        return res.status(200).json(usuarios);
    } catch (erro) {
        console.error("Erro ao buscar usuários:", erro);
        return responderErroController(res, erro);
    }
}

async function buscarPorId(req, res) {
    try {
        const registro = await usuarioService.buscarPorId(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const registro = await usuarioService.criar(req.body);
        return res.status(201).json(registro);
    } catch (erro) {
        console.error("Erro ao criar usuário:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um usuário cadastrado com este e-mail.",
        });
    }
}

async function atualizar(req, res) {
    try {
        const registro = await usuarioService.atualizar(req.params.id, req.body);
        if (!registro) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao atualizar usuário:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um usuário cadastrado com este e-mail.",
        });
    }
}

async function deletar(req, res) {
    try {
        const registro = await usuarioService.deletar(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        return res.status(200).json({ mensagem: "Usuário removido com sucesso.", usuario: registro });
    } catch (erro) {
        console.error("Erro ao excluir usuário:", erro);
        return responderErroController(res, erro, {
            mensagemVinculo:
                "Não é possível excluir este usuário pois existem pedidos ou ordens de serviço vinculados a ele.",
        });
    }
}

async function listarTecnicos(req, res) {
    try { return res.json(await usuarioService.listarTecnicos()); }
    catch (erro) { return responderErroController(res, erro); }
}

module.exports = {
    listarTecnicos,
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
