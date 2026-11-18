const clienteService = require("./cliente.service");

function extrairMensagemUnicidade(erro) {
    const ehDuplicado = erro.code === "23505" || erro.name === "SequelizeUniqueConstraintError";
    if (!ehDuplicado) return null;

    const constraint = erro.parent?.constraint || "";
    const campo = erro.errors?.[0]?.path || "";

    if (constraint === "uq_usuario_email" || campo === "email") {
        return "Já existe um usuário/cliente cadastrado com este e-mail.";
    }
    return "Já existe um cliente cadastrado com este CNPJ/CPF.";
}

async function listar(req, res) {
    try {
        const cliente = await clienteService.listar();
        return res.status(200).json(cliente);
    } catch (erro) {
        console.error("Erro ao buscar cliente:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const registro = await clienteService.buscarPorId(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Cliente não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao buscar cliente:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const registro = await clienteService.criar(req.body);
        return res.status(201).json(registro);
    } catch (erro) {
        console.error("Erro ao criar cliente:", erro);
        const msgDuplicado = extrairMensagemUnicidade(erro);
        if (msgDuplicado) {
            return res.status(400).json({ erro: msgDuplicado });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const registro = await clienteService.atualizar(req.params.id, req.body);
        if (!registro) {
            return res.status(404).json({ erro: "Cliente não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao atualizar cliente:", erro);
        const msgDuplicado = extrairMensagemUnicidade(erro);
        if (msgDuplicado) {
            return res.status(400).json({ erro: msgDuplicado });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const registro = await clienteService.deletar(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Cliente não encontrado." });
        }
        return res.status(200).json({ mensagem: "Cliente removido com sucesso.", cliente: registro });
    } catch (erro) {
        console.error("Erro ao excluir cliente:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
