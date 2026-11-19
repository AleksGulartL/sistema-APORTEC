const checklist_medicaoRepository = require("./checklist_medicao.repository");

const STATUS_APROVACAO = ["Pendente", "Aprovado", "Reprovado"];

function validarChecklistMedicao(dados, isUpdate = false) {
    if (!isUpdate) {
        const pedidoIdNum = Number(dados.pedido_id);
        if (!dados.pedido_id || !Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
            const erro = new Error("O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.medidas_vao || typeof dados.medidas_vao !== "string" || !dados.medidas_vao.trim()) {
            const erro = new Error("O campo 'medidas_vao' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.pedido_id !== undefined) {
            const pedidoIdNum = Number(dados.pedido_id);
            if (!Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
                const erro = new Error("O campo 'pedido_id' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.medidas_vao !== undefined && dados.medidas_vao !== null) {
            if (typeof dados.medidas_vao !== "string" || !dados.medidas_vao.trim()) {
                const erro = new Error("O campo 'medidas_vao' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.tecnico_id !== undefined && dados.tecnico_id !== null && String(dados.tecnico_id).trim() !== "") {
        const tecnicoIdNum = Number(dados.tecnico_id);
        if (!Number.isInteger(tecnicoIdNum) || tecnicoIdNum <= 0) {
            const erro = new Error("O campo 'tecnico_id' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
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
            const erro = new Error("O campo 'tipo_vidro' deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.modelo_automatizador !== undefined && dados.modelo_automatizador !== null) {
        if (typeof dados.modelo_automatizador !== "string") {
            const erro = new Error("O campo 'modelo_automatizador' deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status_aprovacao !== undefined && dados.status_aprovacao !== null) {
        if (!STATUS_APROVACAO.includes(dados.status_aprovacao)) {
            const erro = new Error("O campo 'status_aprovacao' deve ser 'Pendente', 'Aprovado' ou 'Reprovado'.");
            erro.status = 400;
            throw erro;
        }

        // RF07 & RF08 - Impede aprovação do checklist quando há pendências de infraestrutura
        const temPendenciaInfra =
            dados.viga_ok === false || dados.piso_ok === false || dados.ponto_eletrico_ok === false;
        if (dados.status_aprovacao === "Aprovado" && temPendenciaInfra) {
            const erro = new Error(
                "Não é possível aprovar o checklist de medição com pendências de infraestrutura (viga, piso ou ponto elétrico)."
            );
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
    validarChecklistMedicao(dados, false);
    const dadosFormatados = {
        ...dados,
        pedido_id: Number(dados.pedido_id),
        tecnico_id:
            dados.tecnico_id !== undefined && dados.tecnico_id !== null && String(dados.tecnico_id).trim() !== ""
                ? Number(dados.tecnico_id)
                : null,
    };

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

    if (dados.pedido_id !== undefined) {
        dadosFormatados.pedido_id = Number(dados.pedido_id);
    }
    if (dados.tecnico_id !== undefined) {
        dadosFormatados.tecnico_id =
            dados.tecnico_id !== null && String(dados.tecnico_id).trim() !== "" ? Number(dados.tecnico_id) : null;
    }

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
