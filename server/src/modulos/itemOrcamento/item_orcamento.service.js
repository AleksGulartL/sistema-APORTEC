const item_orcamentoRepository = require("./item_orcamento.repository");


function validarItemOrcamento(dados) {
    const idItemOrcamentoNum = Number(dados.id_item_orcamento);
    if (!dados.id_item_orcamento || !Number.isInteger(idItemOrcamentoNum) || idItemOrcamentoNum <= 0) {
        const erro = new Error("O campo 'id_item_orcamento' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const idOrcamentoNum = Number(dados.id_orcamento);
    if (!dados.id_orcamento || !Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
        const erro = new Error("O campo 'id_orcamento' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const idItemCatalogoNum = Number(dados.id_item_catalogo);
    if (idItemCatalogoNum === undefined || idItemCatalogoNum === null || !Number.isInteger(idItemCatalogoNum) || idItemCatalogoNum <= 0) {
        const erro = new Error("O campo 'id_item_catalogo' é obrigatório e deve ser um número inteiro maior que zero.");
        erro.status = 400;
        throw erro;
    }


    if (dados.quantidade !== undefined && dados.quantidade !== null) {
        if (typeof dados.quantidade !== "number" || dados.quantidade <= 0) {
            const erro = new Error("A 'quantidade' deve ser um número maior que zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.valor_total !== undefined && dados.valor_total !== null) {
        if (typeof dados.valor_total !== "number" || dados.valor_total < 0) {
            const erro = new Error("O 'valor_total' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

}

async function listar() {
    return item_orcamentoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return item_orcamentoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarItemOrcamento(dados);
    const dadosFormatados = {
        ...dados,
        id_item_orcamento: Number(dados.id_item_orcamento),
        id_orcamento: Number(dados.id_orcamento),
        id_item_catalogo: Number(dados.id_item_catalogo),
    };
    return item_orcamentoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarItemOrcamento(dados);
    const dadosFormatados = {
        ...dados,
        id_item_orcamento: Number(dados.id_item_orcamento),
        id_orcamento: Number(dados.id_orcamento),
        id_item_catalogo: Number(dados.id_item_catalogo),
    };
    return item_orcamentoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return item_orcamentoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};