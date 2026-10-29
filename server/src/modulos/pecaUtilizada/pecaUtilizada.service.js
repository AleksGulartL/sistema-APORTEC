const pecaUtilizadaRepository = require("./pecaUtilizada.repository");

function validarPecaUtilizada(dados, isUpdate = false) {
    if (!isUpdate) {
        const idOsNum = Number(dados.id_os);
        if (!dados.id_os || !Number.isInteger(idOsNum) || idOsNum <= 0) {
            const erro = new Error("O campo 'id_os' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const idItemNum = Number(dados.id_item);
        if (!dados.id_item || !Number.isInteger(idItemNum) || idItemNum <= 0) {
            const erro = new Error("O campo 'id_item' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (dados.quantidade_utilizada !== undefined && dados.quantidade_utilizada !== null) {
            const qtdNum = Number(dados.quantidade_utilizada);
            if (isNaN(qtdNum) || qtdNum <= 0) {
                const erro = new Error("O campo 'quantidade_utilizada' deve ser um número maior que zero.");
                erro.status = 400;
                throw erro;
            }
        }
    } else {
        if (dados.id_os !== undefined) {
            const idOsNum = Number(dados.id_os);
            if (!Number.isInteger(idOsNum) || idOsNum <= 0) {
                const erro = new Error("O campo 'id_os' deve ser um número inteiro válido.");
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

        if (dados.quantidade_utilizada !== undefined) {
            const qtdNum = Number(dados.quantidade_utilizada);
            if (isNaN(qtdNum) || qtdNum <= 0) {
                const erro = new Error("O campo 'quantidade_utilizada' deve ser um número maior que zero.");
                erro.status = 400;
                throw erro;
            }
        }
    }
}

async function listar() {
    return pecaUtilizadaRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pecaUtilizadaRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarPecaUtilizada(dados);
    const dadosFormatados = {
        ...dados,
        id_os: Number(dados.id_os),
        id_item: Number(dados.id_item),
        quantidade_utilizada: dados.quantidade_utilizada !== undefined ? Number(dados.quantidade_utilizada) : 1.00,
    };

    delete dadosFormatados.id_peca_os;
    return pecaUtilizadaRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarPecaUtilizada(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_os !== undefined) {
        dadosFormatados.id_os = Number(dadosFormatados.id_os);
    }
    if (dadosFormatados.id_item !== undefined) {
        dadosFormatados.id_item = Number(dadosFormatados.id_item);
    }
    if (dadosFormatados.quantidade_utilizada !== undefined) {
        dadosFormatados.quantidade_utilizada = Number(dadosFormatados.quantidade_utilizada);
    }

    delete dadosFormatados.id_peca_os;
    return pecaUtilizadaRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pecaUtilizadaRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
