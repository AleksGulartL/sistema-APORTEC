const usuarioRepository = require("./usuario.repository");

function validarUsuario(dados) {
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

    if (!dados.senha_hash || typeof dados.senha_hash !== "string" || !dados.senha_hash.trim()) {
        const erro = new Error("O campo 'senha_hash' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return usuarioRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return usuarioRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarUsuario(dados);
    return usuarioRepository.criar(dados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarUsuario(dados);
    return usuarioRepository.atualizar(idNum, dados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return usuarioRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};