const obrasServicosRepository = require("./obrasServicos.repository");

function validarObraServico(dados) {
    const idClienteNum = Number(dados.id_cliente);
    if (!dados.id_cliente || !Number.isInteger(idClienteNum) || idClienteNum <= 0) {
        const erro = new Error("O campo 'id_cliente' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.endereco_instalacao || typeof dados.endereco_instalacao !== "string" || !dados.endereco_instalacao.trim()) {
        const erro = new Error("O campo 'endereco_instalacao' é obrigatório e deve ser um texto válido.");
        erro.status = 400;
        throw erro;
    }
}

async function listar() {
    return obrasServicosRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return obrasServicosRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarObraServico(dados);
    const clienteId = Number(dados.id_cliente);
    const payload = {
        ...dados,
        cliente_id: clienteId,
        id_cliente: clienteId,
    };
    return obrasServicosRepository.criar(payload);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarObraServico(dados);
    const clienteId = Number(dados.id_cliente);
    const payload = {
        ...dados,
        cliente_id: clienteId,
        id_cliente: clienteId,
    };
    return obrasServicosRepository.atualizar(idNum, payload);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return obrasServicosRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
