const itemCatalogoRepository = require("./itemCatalogo.repository");

function validarItemCatalogo(dados) {
    if (!dados.tipo) {
        const erro = new Error("O campo 'tipo' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.descricao) {
        const erro = new Error("O campo 'descricao' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.unidade_medida) {
        const erro = new Error("O campo 'unidade_medida' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return itemCatalogoRepository.listar();
}

async function buscarPorId(id) {
    return itemCatalogoRepository.buscarPorId(id);
}

async function criar(dados) {
    validarItemCatalogo(dados);
    return itemCatalogoRepository.criar(dados);
}

async function atualizar(id, dados) {
    validarItemCatalogo(dados);
    return itemCatalogoRepository.atualizar(id, dados);
}

async function deletar(id) {
    return itemCatalogoRepository.deletar(id);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};