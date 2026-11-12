const clienteRepository = require("./cliente.repository");

function validarCliente(dados) {
    const usuarioId = dados.usuario_id ?? dados.id_usuario;
    const temUsuarioId = usuarioId !== undefined && usuarioId !== null && String(usuarioId).trim() !== "";

    if (temUsuarioId) {
        const idUsuarioNum = Number(usuarioId);
        if (!Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
            const erro = new Error("O campo 'usuario_id' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (!dados.nome_completo || typeof dados.nome_completo !== "string" || !dados.nome_completo.trim()) {
            const erro = new Error("O campo 'nome_completo' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.email || typeof dados.email !== "string" || !dados.email.trim()) {
            const erro = new Error("O campo 'email' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (!dados.cnpj_cpf || typeof dados.cnpj_cpf !== "string" || !dados.cnpj_cpf.trim()) {
        const erro = new Error("O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.telefone || typeof dados.telefone !== "string" || !dados.telefone.trim()) {
        const erro = new Error("O campo 'telefone' é obrigatório e deve ser um texto válido.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.endereco || typeof dados.endereco !== "string" || !dados.endereco.trim()) {
        const erro = new Error("O campo 'endereco' é obrigatório e deve ser um texto válido.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return clienteRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return clienteRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarCliente(dados);
    return clienteRepository.criar(dados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarCliente(dados);
    return clienteRepository.atualizar(idNum, dados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return clienteRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};