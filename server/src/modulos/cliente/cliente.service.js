const clientesRepository = require("./clientes.repository");

function validarCliente(dados) {
    if (!dados.nome_completo) {
        const erro = new Error("O campo 'nome_completo' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.cnpj_cpf) {
        const erro = new Error("O campo 'cnpj_cpf' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.telefone) {
        const erro = new Error("O campo 'telefone' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.email) {
        const erro = new Error("O campo 'email' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.endereco) {
        const erro = new Error("O campo 'endereco' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return clientesRepository.listar();
}

async function buscarPorId(id) {
    return clientesRepository.buscarPorId(id);
}

async function criar(dados) {
    validarCliente(dados);
    return clientesRepository.criar(dados);
}

async function atualizar(id, dados) {
    validarCliente(dados);
    return clientesRepository.atualizar(id, dados);
}

async function deletar(id) {
    return clientesRepository.deletar(id);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};