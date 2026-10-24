const usuarioService = require("./usuario.service");

async function listar(req, res) {
    try {
        const usuarios = await usuarioService.listar();
        return res.status(200).json(usuarios);
    } catch (erro) {
        console.error("Erro ao buscar usuários:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
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
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const registro = await usuarioService.criar(req.body);
        return res.status(201).json(registro);
    } catch (erro) {
        console.error("Erro ao criar usuário:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe um usuário cadastrado com este e-mail." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
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
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Já existe um usuário cadastrado com este e-mail." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
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