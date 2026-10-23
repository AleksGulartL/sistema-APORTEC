const obrasServicosRepository = require("./obrasServicos.repository");

function validarObraServico(dados) {
    if (!dados.id_cliente) {
        const erro = new Error("O campo 'id_cliente' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (!dados.endereco_instalacao) {
        const erro = new Error("O campo 'endereco_instalacao' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return obrasServicosRepository.listar();
}

async function buscarPorId(id) {
    return obrasServicosRepository.buscarPorId(id);
}

async function criar(dados) {
    validarObraServico(dados);
    return obrasServicosRepository.criar(dados);
}

async function atualizar(id, dados) {
    validarObraServico(dados);
    return obrasServicosRepository.atualizar(id, dados);
}

async function deletar(id) {
    return obrasServicosRepository.deletar(id);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};