const checklist_medicaoRepository = require("./checklist_medicao.repository");

const STATUS_APROVACAO = ["Pendente", "Aprovado", "Reprovado"];

function validarChecklistMedicao(dados) {
    const idMedicaoNum = Number(dados.id_medicao);
    if (!dados.id_medicao || !Number.isInteger(idMedicaoNum) || idMedicaoNum <= 0) {
        const erro = new Error("O campo 'id_medicao' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    const idPedidoNum = Number(dados.id_pedido);
    if (!dados.id_pedido || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
        const erro = new Error("O campo 'id_pedido' é obrigatório e deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    if (dados.medidas_vao !== undefined && dados.medidas_vao !== null) {
        if (typeof dados.medidas_vao !== "string" ) {
            const erro = new Error("A 'medidas_vao' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.tipo_vidro !== undefined && dados.tipo_vidro !== null) {
        if (typeof dados.tipo_vidro !== "string" ) {
            const erro = new Error("O campo 'tipo_vidro' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.modelo_automatizador !== undefined && dados.modelo_automatizador !== null) {
        if (typeof dados.modelo_automatizador !== "string" ) {
            const erro = new Error("O campo 'modelo_automatizador' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status_medicao !== undefined && dados.status_medicao !== null) {
        if (!STATUS_APROVACAO.includes(dados.status_medicao)) {
            const erro = new Error("O campo 'status_medicao' deve ser 'Pendente', 'Aprovado' ou 'Reprovado'.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.anexo_croqui_url !== undefined && dados.anexo_croqui_url !== null) {
        if (typeof dados.anexo_croqui_url !== "string" ) {
            const erro = new Error("O campo 'anexo_croqui_url' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }
    if (dados.anexo_fotos_url !== undefined && dados.anexo_fotos_url !== null) {
        if (typeof dados.anexo_fotos_url !== "string" ) {
            const erro = new Error("O campo 'anexo_fotos_url' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

}

async function listar() {
    return checklist_medicaoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return checklist_medicaoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarChecklistMedicao(dados);
    const dadosFormatados = {
        ...dados,
        id_medicao: Number(dados.id_medicao),
        id_pedido: Number(dados.id_pedido),
    };
    return checklist_medicaoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarChecklistMedicao(dados);
    const dadosFormatados = {
        ...dados,
        id_medicao: Number(dados.id_medicao),
        id_pedido: Number(dados.id_pedido),
    };
    return checklist_medicaoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return checklist_medicaoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};