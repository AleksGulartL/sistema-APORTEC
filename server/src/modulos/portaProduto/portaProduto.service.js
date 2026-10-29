const portaProdutoRepository = require("./portaProduto.repository");

function validarPortaProduto(dados, isUpdate = false) {
    if (!isUpdate) {
        if (!dados.numero_serie || typeof dados.numero_serie !== "string" || !dados.numero_serie.trim()) {
            const erro = new Error("O campo 'numero_serie' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }

        const idObraNum = Number(dados.id_obra);
        if (!dados.id_obra || !Number.isInteger(idObraNum) || idObraNum <= 0) {
            const erro = new Error("O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.modelo_automatizador || typeof dados.modelo_automatizador !== "string" || !dados.modelo_automatizador.trim()) {
            const erro = new Error("O campo 'modelo_automatizador' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.numero_serie !== undefined) {
            if (typeof dados.numero_serie !== "string" || !dados.numero_serie.trim()) {
                const erro = new Error("O campo 'numero_serie' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.id_obra !== undefined) {
            const idObraNum = Number(dados.id_obra);
            if (!Number.isInteger(idObraNum) || idObraNum <= 0) {
                const erro = new Error("O campo 'id_obra' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.modelo_automatizador !== undefined) {
            if (typeof dados.modelo_automatizador !== "string" || !dados.modelo_automatizador.trim()) {
                const erro = new Error("O campo 'modelo_automatizador' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.id_pedido_origem !== undefined && dados.id_pedido_origem !== null) {
        const idPedidoNum = Number(dados.id_pedido_origem);
        if (!Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
            const erro = new Error("O campo 'id_pedido_origem' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_instalacao !== undefined && dados.data_instalacao !== null) {
        if (isNaN(new Date(dados.data_instalacao).getTime())) {
            const erro = new Error("A 'data_instalacao' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.fim_garantia_motor !== undefined && dados.fim_garantia_motor !== null) {
        if (isNaN(new Date(dados.fim_garantia_motor).getTime())) {
            const erro = new Error("A 'fim_garantia_motor' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.fim_garantia_geral !== undefined && dados.fim_garantia_geral !== null) {
        if (isNaN(new Date(dados.fim_garantia_geral).getTime())) {
            const erro = new Error("A 'fim_garantia_geral' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return portaProdutoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return portaProdutoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarPortaProduto(dados);
    const dadosFormatados = {
        ...dados,
        id_obra: Number(dados.id_obra),
    };

    if (dadosFormatados.id_pedido_origem !== undefined && dadosFormatados.id_pedido_origem !== null) {
        dadosFormatados.id_pedido_origem = Number(dadosFormatados.id_pedido_origem);
    }

    delete dadosFormatados.id_porta;
    return portaProdutoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarPortaProduto(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_obra !== undefined) {
        dadosFormatados.id_obra = Number(dadosFormatados.id_obra);
    }
    if (dadosFormatados.id_pedido_origem !== undefined && dadosFormatados.id_pedido_origem !== null) {
        dadosFormatados.id_pedido_origem = Number(dadosFormatados.id_pedido_origem);
    }

    delete dadosFormatados.id_porta;
    return portaProdutoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return portaProdutoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
