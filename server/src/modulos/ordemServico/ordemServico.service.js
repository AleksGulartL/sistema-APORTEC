const pedidoRepository = require("../pedido/pedido.repository");
const { exigirLiberacao } = require("../../utils/fluxoPedido");
const { validarTecnico } = require("../../utils/validarTecnico");
const ordemServicoRepository = require("./ordemServico.repository");

const TIPOS_SERVICO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
const ORIGENS_COBERTURA = ["Garantia", "Contrato", "Avulso"];
const CAMPOS_OS = ["pedido_id", "tecnico_responsavel_id", "tipo_servico", "origem_cobertura", "status_os", "descricao_problema", "parecer_tecnico", "assinatura_cliente_digital", "data_agendamento"];
const dadosPermitidos = (dados) => Object.fromEntries(CAMPOS_OS.filter((campo) => dados[campo] !== undefined).map((campo) => [campo, dados[campo]]));
const erroFluxo = (mensagem, status = 400) => Object.assign(new Error(mensagem), { status });

async function validarFluxo(dados, atual = {}) {
    if (atual.status_os === "Finalizada") throw erroFluxo("Esta OS já foi finalizada e não pode ser alterada.", 409);
    const pedido = await pedidoRepository.buscarPorId(dados.pedido_id || atual.pedido_id);
    if (!pedido) throw erroFluxo("Pedido não encontrado.");
    if (["Concluido", "Cancelado"].includes(pedido.status)) throw erroFluxo("O pedido vinculado já está encerrado.", 409);
    if ((dados.tipo_servico || atual.tipo_servico) !== pedido.tipo_pedido) throw erroFluxo("O tipo da OS deve corresponder ao orçamento aprovado.");
    const status = dados.status_os || atual.status_os || "Aberta";
    if (["Em Andamento", "Finalizada"].includes(status)) exigirLiberacao(pedido);
    if (status === "Finalizada") {
        if (atual.status_os === "Cancelada") throw erroFluxo("Uma OS cancelada não pode ser finalizada.", 409);
        if (pedido.tipo_pedido === "Instalacao" && pedido.status !== "Pronto para Instalacao") throw erroFluxo("Conclua a produção antes de finalizar a instalação.");
        for (const campo of ["parecer_tecnico", "assinatura_cliente_digital"]) {
            if (typeof dados[campo] !== "string" || !dados[campo].trim()) throw erroFluxo("Informe o parecer técnico e a assinatura do cliente para finalizar.");
            dados[campo] = dados[campo].trim();
        }
        const tecnico = dados.tecnico_responsavel_id === undefined ? atual.tecnico_responsavel_id : dados.tecnico_responsavel_id;
        if (!tecnico) throw erroFluxo("Atribua um técnico antes de finalizar a OS.");
        await validarTecnico(tecnico);
    }
}

const STATUS_OS = ["Aberta", "Em Andamento", "Finalizada", "Cancelada"];

function validarOrdemServico(dados, isUpdate = false) {
    if (!isUpdate) {
        const idPedidoNum = Number(dados.pedido_id);
        if (!dados.pedido_id || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
            const erro = new Error("O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.tipo_servico || !TIPOS_SERVICO.includes(dados.tipo_servico)) {
            const erro = new Error(
                "O campo 'tipo_servico' é obrigatório e deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'."
            );
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.pedido_id !== undefined) {
            const idPedidoNum = Number(dados.pedido_id);
            if (!Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
                const erro = new Error("O campo 'pedido_id' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.tipo_servico !== undefined && !TIPOS_SERVICO.includes(dados.tipo_servico)) {
            const erro = new Error(
                "O campo 'tipo_servico' deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'."
            );
            erro.status = 400;
            throw erro;
        }
    }

    if (
        dados.tecnico_responsavel_id !== undefined &&
        dados.tecnico_responsavel_id !== null &&
        String(dados.tecnico_responsavel_id).trim() !== ""
    ) {
        const idTecnicoNum = Number(dados.tecnico_responsavel_id);
        if (!Number.isInteger(idTecnicoNum) || idTecnicoNum <= 0) {
            const erro = new Error("O campo 'tecnico_responsavel_id' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.origem_cobertura !== undefined && dados.origem_cobertura !== null) {
        if (!ORIGENS_COBERTURA.includes(dados.origem_cobertura)) {
            const erro = new Error("O campo 'origem_cobertura' deve ser 'Garantia', 'Contrato' ou 'Avulso'.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.status_os !== undefined && dados.status_os !== null) {
        if (!STATUS_OS.includes(dados.status_os)) {
            const erro = new Error("O campo 'status_os' deve ser 'Aberta', 'Em Andamento', 'Finalizada' ou 'Cancelada'.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_agendamento !== undefined && dados.data_agendamento !== null) {
        if (isNaN(new Date(dados.data_agendamento).getTime())) {
            const erro = new Error("A 'data_agendamento' deve ser uma data válida.");
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
}

async function listar() {
    return ordemServicoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return ordemServicoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarOrdemServico(dados, false);
    if (dados.status_os === "Finalizada") throw erroFluxo("Crie a OS aberta ou em andamento e finalize pelo atendimento.");
    await validarTecnico(dados.tecnico_responsavel_id);
    const idTecnicoRaw = dados.tecnico_responsavel_id;
    const idTecnico =
        idTecnicoRaw !== undefined && idTecnicoRaw !== null && String(idTecnicoRaw).trim() !== ""
            ? Number(idTecnicoRaw)
            : null;

    const dadosFormatados = {
        ...dadosPermitidos(dados),
        pedido_id: Number(dados.pedido_id),
        tecnico_responsavel_id: idTecnico,
    };

    delete dadosFormatados.id;
    await validarFluxo(dadosFormatados);
    return ordemServicoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarOrdemServico(dados, true);
    await validarTecnico(dados.tecnico_responsavel_id);
    const dadosFormatados = dadosPermitidos(dados);

    if (dadosFormatados.pedido_id !== undefined) {
        dadosFormatados.pedido_id = Number(dadosFormatados.pedido_id);
    }

    if (dadosFormatados.tecnico_responsavel_id !== undefined) {
        const idTecnicoRaw = dadosFormatados.tecnico_responsavel_id;
        dadosFormatados.tecnico_responsavel_id =
            idTecnicoRaw !== null && String(idTecnicoRaw).trim() !== "" ? Number(idTecnicoRaw) : null;
    }

    delete dadosFormatados.id;
    const atual = await ordemServicoRepository.buscarPorId(idNum);
    if (!atual) return null;
    await validarFluxo(dadosFormatados, atual);
    return ordemServicoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    const atual = await ordemServicoRepository.buscarPorId(idNum);
    if (!atual) return null;
    if (atual.status_os === "Finalizada") throw erroFluxo("Uma OS finalizada não pode ser excluída.", 409);
    return ordemServicoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
