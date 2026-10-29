const insumoOrdemProducaoRepository = require("./insumoOrdemProducao.repository");

const STATUS_BAIXA = ["Pendente", "Baixado"];

function validarInsumoOrdemProducao(dados, isUpdate = false) {
    if (!isUpdate) {
        const idOpNum = Number(dados.id_op);
        if (!dados.id_op || !Number.isInteger(idOpNum) || idOpNum <= 0) {
            const erro = new Error("O campo 'id_op' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const idItemNum = Number(dados.id_item);
        if (!dados.id_item || !Number.isInteger(idItemNum) || idItemNum <= 0) {
            const erro = new Error("O campo 'id_item' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const qtdPlanejada = Number(dados.quantidade_planejada);
        if (dados.quantidade_planejada === undefined || dados.quantidade_planejada === null || isNaN(qtdPlanejada) || qtdPlanejada <= 0) {
            const erro = new Error("O campo 'quantidade_planejada' é obrigatório e deve ser um número maior que zero.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.id_op !== undefined) {
            const idOpNum = Number(dados.id_op);
            if (!Number.isInteger(idOpNum) || idOpNum <= 0) {
                const erro = new Error("O campo 'id_op' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.id_item !== undefined) {
            const idItemNum = Number(dados.id_item);
            if (!Number.isInteger(idItemNum) || idItemNum <= 0) {
                const erro = new Error("O campo 'id_item' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.quantidade_planejada !== undefined) {
            const qtdPlanejada = Number(dados.quantidade_planejada);
            if (isNaN(qtdPlanejada) || qtdPlanejada <= 0) {
                const erro = new Error("O campo 'quantidade_planejada' deve ser um número maior que zero.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.quantidade_baixada !== undefined && dados.quantidade_baixada !== null) {
        const qtdBaixada = Number(dados.quantidade_baixada);
        if (isNaN(qtdBaixada) || qtdBaixada < 0) {
            const erro = new Error("O campo 'quantidade_baixada' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status_baixa !== undefined && dados.status_baixa !== null) {
        if (!STATUS_BAIXA.includes(dados.status_baixa)) {
            const erro = new Error("O campo 'status_baixa' deve ser 'Pendente' ou 'Baixado'.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return insumoOrdemProducaoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return insumoOrdemProducaoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarInsumoOrdemProducao(dados);
    const dadosFormatados = {
        ...dados,
        id_op: Number(dados.id_op),
        id_item: Number(dados.id_item),
        quantidade_planejada: Number(dados.quantidade_planejada),
    };

    if (dadosFormatados.quantidade_baixada !== undefined) {
        dadosFormatados.quantidade_baixada = Number(dadosFormatados.quantidade_baixada);
    }

    delete dadosFormatados.id_insumo_op;
    return insumoOrdemProducaoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarInsumoOrdemProducao(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_op !== undefined) {
        dadosFormatados.id_op = Number(dadosFormatados.id_op);
    }
    if (dadosFormatados.id_item !== undefined) {
        dadosFormatados.id_item = Number(dadosFormatados.id_item);
    }
    if (dadosFormatados.quantidade_planejada !== undefined) {
        dadosFormatados.quantidade_planejada = Number(dadosFormatados.quantidade_planejada);
    }
    if (dadosFormatados.quantidade_baixada !== undefined) {
        dadosFormatados.quantidade_baixada = Number(dadosFormatados.quantidade_baixada);
    }

    delete dadosFormatados.id_insumo_op;
    return insumoOrdemProducaoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return insumoOrdemProducaoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
