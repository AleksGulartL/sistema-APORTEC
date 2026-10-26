const pedidoRepository = require("./pedido.repository");

const STATUS_FLUXO_VALIDOS = ["Aguardando", "Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao", "Concluido"];

function validarPedido(dados) {
    const idPedidoNum = Number(dados.id_pedido);
    if (!dados.id_pedido || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
        const erro = new Error("O campo 'id_pedido' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const idOrcamentoNum = Number(dados.id_orcamento);
    if (!dados.id_orcamento || !Number.isInteger(idOrcamentoNum) || idOrcamentoNum <= 0) {
        const erro = new Error("O campo 'id_orcamento' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    if (dados.data_conversao !== undefined && dados.data_conversao !== null) {
        if (typeof dados.data_conversao !== "date" ) {
            const erro = new Error("A 'data_conversao' deve ser uma data válida.");
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

    if (dados.status_fluxo !== undefined && dados.status_fluxo !== null) {
        if (!STATUS_FLUXO_VALIDOS.includes(dados.status_fluxo)) {
            const erro = new Error("O campo 'status_fluxo' deve ser 'Aguardando', 'Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido'.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.bloqueio_fabricacao !== undefined && dados.bloqueio_fabricacao !== null) {
        if (typeof dados.bloqueio_fabricacao !== "boolean") {
            const erro = new Error("O campo 'bloqueio_fabricacao' deve ser um booleano.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.motivo_bloqueio !== undefined && dados.motivo_bloqueio !== null) {
        if (typeof dados.motivo_bloqueio !== "text" ) {
            const erro = new Error("O campo 'motivo_bloqueio' deve ser um text.");
            erro.status = 400;
            throw erro;
        }
    }

}

async function listar() {
    return pedidoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pedidoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarPedido(dados);
    const dadosFormatados = {
        ...dados,
        id_pedido: Number(dados.id_pedido),
        id_orcamento: Number(dados.id_orcamento),
    };
    return pedidoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarPedido(dados);
    const dadosFormatados = {
        ...dados,
        id_pedido: Number(dados.id_pedido),
        id_orcamento: Number(dados.id_orcamento),
    };
    return pedidoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return pedidoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};