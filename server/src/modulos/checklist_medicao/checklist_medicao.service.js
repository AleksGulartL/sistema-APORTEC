const checklist_medicaoRepository = require("./checklist_medicao.repository");
const { criarErro } = require("../../utils/criarErro");

const STATUS_APROVACAO = ["Pendente", "Aprovado", "Reprovado"];

function validarChecklistMedicao(dados, isUpdate = false) {
    if (!isUpdate) {
        const pedidoIdNum = Number(dados.pedido_id);
        if (!dados.pedido_id || !Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
            throw criarErro("O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.");
        }

        if (!dados.medidas_vao || typeof dados.medidas_vao !== "string" || !dados.medidas_vao.trim()) {
            throw criarErro("O campo 'medidas_vao' é obrigatório e deve ser um texto válido.");
        }
    } else {
        if (dados.pedido_id !== undefined) {
            const pedidoIdNum = Number(dados.pedido_id);
            if (!Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
                throw criarErro("O campo 'pedido_id' deve ser um número inteiro válido.");
            }
        }

        if (dados.medidas_vao !== undefined && dados.medidas_vao !== null) {
            if (typeof dados.medidas_vao !== "string" || !dados.medidas_vao.trim()) {
                throw criarErro("O campo 'medidas_vao' deve ser um texto válido.");
            }
        }
    }

    if (dados.tecnico_id !== undefined && dados.tecnico_id !== null && String(dados.tecnico_id).trim() !== "") {
        const tecnicoIdNum = Number(dados.tecnico_id);
        if (!Number.isInteger(tecnicoIdNum) || tecnicoIdNum <= 0) {
            throw criarErro("O campo 'tecnico_id' deve ser um número inteiro válido.");
        }
    }

    if (dados.quantidade_folhas !== undefined && dados.quantidade_folhas !== null) {
        const folhasNum = Number(dados.quantidade_folhas);
        if (!Number.isInteger(folhasNum) || folhasNum <= 0) {
            throw criarErro("O campo 'quantidade_folhas' deve ser um número inteiro maior que zero.");
        }
    }

    if (dados.tipo_vidro !== undefined && dados.tipo_vidro !== null) {
        if (typeof dados.tipo_vidro !== "string") {
            throw criarErro("O campo 'tipo_vidro' deve ser um texto válido.");
        }
    }

    if (dados.modelo_automatizador !== undefined && dados.modelo_automatizador !== null) {
        if (typeof dados.modelo_automatizador !== "string") {
            throw criarErro("O campo 'modelo_automatizador' deve ser um texto válido.");
        }
    }

    if (dados.status_aprovacao !== undefined && dados.status_aprovacao !== null) {
        if (!STATUS_APROVACAO.includes(dados.status_aprovacao)) {
            throw criarErro("O campo 'status_aprovacao' deve ser 'Pendente', 'Aprovado' ou 'Reprovado'.");
        }

        const temPendenciaInfra =
            dados.viga_ok === false || dados.piso_ok === false || dados.ponto_eletrico_ok === false;
        if (dados.status_aprovacao === "Aprovado" && temPendenciaInfra) {
            throw criarErro(
                "Não é possível aprovar o checklist de medição com pendências de infraestrutura (viga, piso ou ponto elétrico)."
            );
        }
    }
}

async function listar() {
    return checklist_medicaoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
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
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
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
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
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
