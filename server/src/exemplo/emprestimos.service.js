const emprestimosRepository = require("./emprestimos.repository");

function validarEmprestimo(dados) {
    if (!dados.leitor_id) {
        const erro = new Error("O campo 'leitor_id' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.livro_id) {
        const erro = new Error("O campo 'livro_id' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.data_prevista) {
        const erro = new Error("O campo 'data_prevista' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return emprestimosRepository.listar();
}

async function buscarPorId(id) {
    return emprestimosRepository.buscarPorId(id);
}

async function criar(dados) {
    validarEmprestimo(dados);
    return emprestimosRepository.criar(dados);
}

async function atualizar(id, dados) {
    validarEmprestimo(dados);
    return emprestimosRepository.atualizar(id, dados);
}

async function deletar(id) {
    return emprestimosRepository.deletar(id);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
