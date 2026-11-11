const checklist_medicaoRepository = require("./checklist_medicao.repository");

const STATUS_APROVACAO = ["Pendente", "Aprovado", "Reprovado"];

function obterPedidoId(dados) {
    return dados.pedido_id !== undefined ? dados.pedido_id : dados.id_pedido;
}

function validarChecklistMedicao(dados, isUpdate = false) {
    const rawPedidoId = obterPedidoId(dados);

    if (!isUpdate) {
        const idPedidoNum = Number(rawPedidoId);
        if (!rawPedidoId || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
            const erro = new Error("O campo 'id_pedido' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.medidas_vao || typeof dados.medidas_vao !== "string" || !dados.medidas_vao.trim()) {
            const erro = new Error("O campo 'medidas_vao' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (rawPedidoId !== undefined) {
            const idPedidoNum = Number(rawPedidoId);
            if (!Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
                const erro = new Error("O campo 'id_pedido' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.medidas_vao !== undefined && dados.medidas_vao !== null) {
            if (typeof dados.medidas_vao !== "string" || !dados.medidas_vao.trim()) {
                const erro = new Error("A 'medidas_vao' deve ser uma string válida.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.quantidade_folhas !== undefined && dados.quantidade_folhas !== null) {
        const folhasNum = Number(dados.quantidade_folhas);
        if (!Number.isInteger(folhasNum) || folhasNum <= 0) {
            const erro = new Error("O campo 'quantidade_folhas' deve ser um número inteiro maior que zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.tipo_vidro !== undefined && dados.tipo_vidro !== null) {
        if (typeof dados.tipo_vidro !== "string") {
            const erro = new Error("O campo 'tipo_vidro' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.modelo_automatizador !== undefined && dados.modelo_automatizador !== null) {
        if (typeof dados.modelo_automatizador !== "string") {
            const erro = new Error("O campo 'modelo_automatizador' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

    const statusAprovacao = dados.status_aprovacao !== undefined ? dados.status_aprovacao : dados.status_medicao;
    if (statusAprovacao !== undefined && statusAprovacao !== null) {
        if (!STATUS_APROVACAO.includes(statusAprovacao)) {
            const erro = new Error("O campo 'status_aprovacao' deve ser 'Pendente', 'Aprovado' ou 'Reprovado'.");
            erro.status = 400;
            throw erro;
        }

        // RF07 & RF08 - Impede aprovação do checklist quando há pendências de infraestrutura (viga, piso, ponto elétrico)
        const temPendenciaInfra =
            dados.viga_ok === false || dados.piso_ok === false || dados.ponto_eletrico_ok === false;
        if (statusAprovacao === "Aprovado" && temPendenciaInfra) {
            const erro = new Error(
                "Não é possível aprovar o checklist de medição com pendências de infraestrutura (viga, piso ou ponto elétrico)."
            );
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.anexo_croqui_url !== undefined && dados.anexo_croqui_url !== null) {
        if (typeof dados.anexo_croqui_url !== "string") {
            const erro = new Error("O campo 'anexo_croqui_url' deve ser uma string.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.anexo_fotos_url !== undefined && dados.anexo_fotos_url !== null) {
        if (typeof dados.anexo_fotos_url !== "string") {
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
    const pedidoId = Number(obterPedidoId(dados));
    const dadosFormatados = {
        ...dados,
        pedido_id: pedidoId,
        id_pedido: pedidoId,
    };

    if (dados.status_medicao && !dadosFormatados.status_aprovacao) {
        dadosFormatados.status_aprovacao = dados.status_medicao;
    }

    delete dadosFormatados.id_medicao;
    delete dadosFormatados.id;
    return checklist_medicaoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarChecklistMedicao(dados, true);
    const dadosFormatados = { ...dados };

    const rawPedidoId = obterPedidoId(dados);
    if (rawPedidoId !== undefined) {
        dadosFormatados.pedido_id = Number(rawPedidoId);
        dadosFormatados.id_pedido = Number(rawPedidoId);
    }
    if (dados.status_medicao && !dadosFormatados.status_aprovacao) {
        dadosFormatados.status_aprovacao = dados.status_medicao;
    }

    delete dadosFormatados.id_medicao;
    delete dadosFormatados.id;
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
    deletar,
};
