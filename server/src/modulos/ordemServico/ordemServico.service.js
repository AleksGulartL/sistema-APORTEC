const pedidoRepository = require("../pedido/pedido.repository");
const { exigirLiberacao } = require("../../utils/fluxoPedido");
const { validarTecnico } = require("../../utils/validarTecnico");
const ordemServicoRepository = require("./ordemServico.repository");

const TIPOS_SERVICO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
const ORIGENS_COBERTURA = ["Garantia", "Contrato", "Avulso"];
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
    await validarTecnico(dados.tecnico_responsavel_id);
    const idTecnicoRaw = dados.tecnico_responsavel_id;
    const idTecnico =
        idTecnicoRaw !== undefined && idTecnicoRaw !== null && String(idTecnicoRaw).trim() !== ""
            ? Number(idTecnicoRaw)
            : null;

    const dadosFormatados = {
        ...dados,
        pedido_id: Number(dados.pedido_id),
        tecnico_responsavel_id: idTecnico,
    };

    delete dadosFormatados.id;
    if (["Em Andamento", "Finalizada"].includes(dadosFormatados.status_os)) {
        exigirLiberacao(await pedidoRepository.buscarPorId(dadosFormatados.pedido_id));
    }
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
    const dadosFormatados = { ...dados };

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
    if (["Em Andamento", "Finalizada"].includes(dadosFormatados.status_os || atual.status_os)) {
        const pedido = await pedidoRepository.buscarPorId(dadosFormatados.pedido_id || atual.pedido_id);
        exigirLiberacao(pedido);
        if ((dadosFormatados.tipo_servico || atual.tipo_servico) !== pedido.tipo_pedido) {
            throw Object.assign(new Error("O tipo da OS deve corresponder ao orçamento aprovado."), { status: 400 });
        }
    }
    return ordemServicoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return ordemServicoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
