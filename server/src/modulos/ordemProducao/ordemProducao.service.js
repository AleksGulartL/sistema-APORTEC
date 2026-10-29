const ordemProducaoRepository = require("./ordemProducao.repository");

const STATUS_OP = ["Planejada", "Em Fabricacao", "Em fabricação", "Concluida", "Cancelada"];

function validarOrdemProducao(dados, isUpdate = false) {
    if (!isUpdate) {
        const idPedidoNum = Number(dados.id_pedido);
        if (!dados.id_pedido || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
            const erro = new Error("O campo 'id_pedido' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const idResponsavelTecnicoNum = Number(dados.id_responsavel_tecnico);
        if (!dados.id_responsavel_tecnico || !Number.isInteger(idResponsavelTecnicoNum) || idResponsavelTecnicoNum <= 0) {
            const erro = new Error("O campo 'id_responsavel_tecnico' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.id_pedido !== undefined) {
            const idPedidoNum = Number(dados.id_pedido);
            if (!Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
                const erro = new Error("O campo 'id_pedido' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.id_responsavel_tecnico !== undefined) {
            const idResponsavelTecnicoNum = Number(dados.id_responsavel_tecnico);
            if (!Number.isInteger(idResponsavelTecnicoNum) || idResponsavelTecnicoNum <= 0) {
                const erro = new Error("O campo 'id_responsavel_tecnico' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.data_inicio !== undefined && dados.data_inicio !== null) {
        if (isNaN(new Date(dados.data_inicio).getTime())) {
            const erro = new Error("A 'data_inicio' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_previsao_fim !== undefined && dados.data_previsao_fim !== null) {
        if (isNaN(new Date(dados.data_previsao_fim).getTime())) {
            const erro = new Error("A 'data_previsao_fim' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_conclusao !== undefined && dados.data_conclusao !== null) {
        if (isNaN(new Date(dados.data_conclusao).getTime())) {
            const erro = new Error("A 'data_conclusao' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status_op !== undefined && dados.status_op !== null) {
        if (!STATUS_OP.includes(dados.status_op)) {
            const erro = new Error("O campo 'status_op' deve ser 'Planejada', 'Em Fabricacao', 'Concluida' ou 'Cancelada'.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return ordemProducaoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return ordemProducaoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarOrdemProducao(dados);
    const dadosFormatados = {
        ...dados,
        id_pedido: Number(dados.id_pedido),
        id_responsavel_tecnico: Number(dados.id_responsavel_tecnico),
    };

    if (dadosFormatados.status_op === "Em fabricação") {
        dadosFormatados.status_op = "Em Fabricacao";
    }

    delete dadosFormatados.id_op;
    return ordemProducaoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarOrdemProducao(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_pedido !== undefined) {
        dadosFormatados.id_pedido = Number(dadosFormatados.id_pedido);
    }
    if (dadosFormatados.id_responsavel_tecnico !== undefined) {
        dadosFormatados.id_responsavel_tecnico = Number(dadosFormatados.id_responsavel_tecnico);
    }
    if (dadosFormatados.status_op === "Em fabricação") {
        dadosFormatados.status_op = "Em Fabricacao";
    }

    delete dadosFormatados.id_op;
    return ordemProducaoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return ordemProducaoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};