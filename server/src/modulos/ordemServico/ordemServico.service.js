const ordemServicoRepository = require("./ordemServico.repository");

const TIPOS_SERVICO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
const ORIGENS_COBERTURA = ["Garantia", "Contrato", "Avulso"];
const STATUS_OS = ["Aberta", "Em Andamento", "Finalizada", "Cancelada"];

function validarOrdemServico(dados, isUpdate = false) {
    const idPedido = dados.pedido_id ?? dados.id_pedido;
    const idTecnico = dados.tecnico_responsavel_id ?? dados.id_tecnico_responsavel;

    if (!isUpdate) {
        const idPedidoNum = Number(idPedido);
        if (!idPedido || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
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
        if (idPedido !== undefined) {
            const idPedidoNum = Number(idPedido);
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

    if (idTecnico !== undefined && idTecnico !== null && String(idTecnico).trim() !== "") {
        const idTecnicoNum = Number(idTecnico);
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
    validarOrdemServico(dados);
    const idPedido = Number(dados.pedido_id ?? dados.id_pedido);
    const idTecnicoRaw = dados.tecnico_responsavel_id ?? dados.id_tecnico_responsavel;
    const idTecnico = idTecnicoRaw !== undefined && idTecnicoRaw !== null && String(idTecnicoRaw).trim() !== ""
        ? Number(idTecnicoRaw)
        : null;

    const dadosFormatados = {
        ...dados,
        pedido_id: idPedido,
        tecnico_responsavel_id: idTecnico,
    };

    delete dadosFormatados.id_os;
    delete dadosFormatados.id;
    delete dadosFormatados.id_pedido;
    delete dadosFormatados.id_tecnico_responsavel;
    delete dadosFormatados.cliente_id;
    delete dadosFormatados.id_cliente;

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
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_pedido !== undefined || dadosFormatados.pedido_id !== undefined) {
        const idPedido = Number(dadosFormatados.pedido_id ?? dadosFormatados.id_pedido);
        dadosFormatados.pedido_id = idPedido;
    }

    if (dadosFormatados.id_tecnico_responsavel !== undefined || dadosFormatados.tecnico_responsavel_id !== undefined) {
        const idTecnicoRaw = dadosFormatados.tecnico_responsavel_id ?? dadosFormatados.id_tecnico_responsavel;
        dadosFormatados.tecnico_responsavel_id =
            idTecnicoRaw !== undefined && idTecnicoRaw !== null && String(idTecnicoRaw).trim() !== ""
                ? Number(idTecnicoRaw)
                : null;
    }

    delete dadosFormatados.id_os;
    delete dadosFormatados.id;
    delete dadosFormatados.id_pedido;
    delete dadosFormatados.id_tecnico_responsavel;
    delete dadosFormatados.cliente_id;
    delete dadosFormatados.id_cliente;

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
