const ordemServicoRepository = require("./ordemServico.repository");

const TIPOS_SERVICO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
const ORIGENS_COBERTURA = ["Garantia", "Contrato", "Avulso"];
const STATUS_OS = ["Aberta", "Em Andamento", "Finalizada", "Cancelada"];

function validarOrdemServico(dados, isUpdate = false) {
    if (!isUpdate) {
        const idObraNum = Number(dados.id_obra);
        if (!dados.id_obra || !Number.isInteger(idObraNum) || idObraNum <= 0) {
            const erro = new Error("O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        const idTecnicoNum = Number(dados.id_tecnico_responsavel);
        if (!dados.id_tecnico_responsavel || !Number.isInteger(idTecnicoNum) || idTecnicoNum <= 0) {
            const erro = new Error("O campo 'id_tecnico_responsavel' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.tipo_servico || !TIPOS_SERVICO.includes(dados.tipo_servico)) {
            const erro = new Error("O campo 'tipo_servico' é obrigatório e deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.id_obra !== undefined) {
            const idObraNum = Number(dados.id_obra);
            if (!Number.isInteger(idObraNum) || idObraNum <= 0) {
                const erro = new Error("O campo 'id_obra' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.id_tecnico_responsavel !== undefined) {
            const idTecnicoNum = Number(dados.id_tecnico_responsavel);
            if (!Number.isInteger(idTecnicoNum) || idTecnicoNum <= 0) {
                const erro = new Error("O campo 'id_tecnico_responsavel' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.tipo_servico !== undefined && !TIPOS_SERVICO.includes(dados.tipo_servico)) {
            const erro = new Error("O campo 'tipo_servico' deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.id_porta !== undefined && dados.id_porta !== null) {
        const idPortaNum = Number(dados.id_porta);
        if (!Number.isInteger(idPortaNum) || idPortaNum <= 0) {
            const erro = new Error("O campo 'id_porta' deve ser um número inteiro válido.");
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

    if (dados.data_hora_execucao_inicio !== undefined && dados.data_hora_execucao_inicio !== null) {
        if (isNaN(new Date(dados.data_hora_execucao_inicio).getTime())) {
            const erro = new Error("A 'data_hora_execucao_inicio' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_hora_execucao_fim !== undefined && dados.data_hora_execucao_fim !== null) {
        if (isNaN(new Date(dados.data_hora_execucao_fim).getTime())) {
            const erro = new Error("A 'data_hora_execucao_fim' deve ser uma data válida.");
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
    const dadosFormatados = {
        ...dados,
        id_obra: Number(dados.id_obra),
        id_tecnico_responsavel: Number(dados.id_tecnico_responsavel),
    };

    if (dadosFormatados.id_porta !== undefined && dadosFormatados.id_porta !== null) {
        dadosFormatados.id_porta = Number(dadosFormatados.id_porta);
    }

    delete dadosFormatados.id_os;
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

    if (dadosFormatados.id_obra !== undefined) {
        dadosFormatados.id_obra = Number(dadosFormatados.id_obra);
    }
    if (dadosFormatados.id_tecnico_responsavel !== undefined) {
        dadosFormatados.id_tecnico_responsavel = Number(dadosFormatados.id_tecnico_responsavel);
    }
    if (dadosFormatados.id_porta !== undefined && dadosFormatados.id_porta !== null) {
        dadosFormatados.id_porta = Number(dadosFormatados.id_porta);
    }

    delete dadosFormatados.id_os;
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
    deletar
};
