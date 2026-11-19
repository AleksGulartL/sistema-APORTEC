const clienteService = require("./cliente.service");
const { responderErroController } = require("../../utils/tratarErroController");

function extrairMensagemUnicidade(erro) {
    const constraint = erro.parent?.constraint || "";
    const campo = erro.errors?.[0]?.path || "";

    if (constraint === "uq_usuario_email" || campo === "email") {
        return "Já existe um usuário/cliente cadastrado com este e-mail.";
    }
    return "Já existe um cliente cadastrado com este CNPJ/CPF.";
}

async function listar(req, res) {
    try {
        const clientes = await clienteService.listar();
        return res.status(200).json(clientes);
    } catch (erro) {
        console.error("Erro ao buscar clientes:", erro);
        return responderErroController(res, erro);
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
        return responderErroController(res, erro);
    }
}

async function criar(req, res) {
    try {
        const registro = await clienteService.criar(req.body);
        return res.status(201).json(registro);
    } catch (erro) {
        console.error("Erro ao criar cliente:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: extrairMensagemUnicidade,
        });
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
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: extrairMensagemUnicidade,
        });
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
        return responderErroController(res, erro, {
            mensagemVinculo:
                "Não é possível excluir este cliente pois ele possui pedidos ou ordens de serviço vinculados.",
        });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
