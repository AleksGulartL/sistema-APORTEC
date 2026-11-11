const ordemProducaoRepository = require("./ordemProducao.repository");

const STATUS_OP = [
    "Aguardando",
    "Planejada",
    "Em Fabricacao",
    "Em fabricação",
    "Concluida",
    "Concluído",
    "Cancelada",
];
const PERFIS_NAO_AUTORIZADOS_OP = ["TECNICO", "TÉCNICO", "CLIENTE"];

function dataEhNoPassado(dataStr) {
    const dataInformada = new Date(dataStr);
    if (isNaN(dataInformada.getTime())) return false;
    const isoInformada = dataInformada.toISOString().slice(0, 10);
    const isoHoje = new Date().toISOString().slice(0, 10);
    return isoInformada < isoHoje;
}

function validarPerfilCriacaoOP(usuarioContexto) {
    if (!usuarioContexto) return;
    const perfil = String(
        usuarioContexto.perfil || usuarioContexto.cargo_funcao || usuarioContexto.role || ""
    )
        .trim()
        .toUpperCase();
    if (PERFIS_NAO_AUTORIZADOS_OP.includes(perfil)) {
        const erro = new Error("Acesso negado. O perfil não tem permissão para esta ação.");
        erro.status = 403;
        throw erro;
    }
}

function obterDataPrevisao(dados) {
    return dados.data_previsao_fim !== undefined
        ? dados.data_previsao_fim
        : dados.data_previsao_termino;
}

function validarOrdemProducao(dados, isUpdate = false) {
    const rawPedidoId = dados.id_pedido !== undefined ? dados.id_pedido : dados.pedido_id;
    const rawResponsavelId =
        dados.id_responsavel_tecnico !== undefined
            ? dados.id_responsavel_tecnico
            : dados.responsavel_producao_id;
    const dataPrevisao = obterDataPrevisao(dados);

    if (!isUpdate) {
        const idPedidoNum = Number(rawPedidoId);
        if (!rawPedidoId || !Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
            const erro = new Error("O campo 'id_pedido' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        // CT01 Cenário 4 - Valida se data_previsao_fim / data_previsao_termino foi deixada em branco quando informada vazia
        if (dataPrevisao === "" || dataPrevisao === null) {
            const erro = new Error("Os campos 'id_responsavel_tecnico' e 'data_previsao_fim' são obrigatórios.");
            erro.status = 400;
            throw erro;
        }

        const idResponsavelTecnicoNum = Number(rawResponsavelId);
        if (!rawResponsavelId || !Number.isInteger(idResponsavelTecnicoNum) || idResponsavelTecnicoNum <= 0) {
            const erro = new Error("O campo 'id_responsavel_tecnico' é obrigatório e deve ser um número inteiro válido.");
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

        if (rawResponsavelId !== undefined) {
            const idResponsavelTecnicoNum = Number(rawResponsavelId);
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

    if (dataPrevisao !== undefined && dataPrevisao !== null) {
        if (isNaN(new Date(dataPrevisao).getTime())) {
            const erro = new Error("A 'data_previsao_fim' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
        // CT01 Cenário 5 - Data de previsão de entrega não pode estar no passado
        if (!isUpdate && dataEhNoPassado(dataPrevisao)) {
            const erro = new Error("A data de previsão de entrega não pode ser anterior à data atual.");
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

// RF08 & CT01 Cenários 2 e 3 - Verifica aprovação comercial (RF05) e checklist de medição sem pendências (RF07)
async function verificarBloqueiosFabricacao(idPedido, dados) {
    let regPedido = null;
    if (typeof ordemProducaoRepository.buscarPedidoComChecklist === "function") {
        regPedido = await ordemProducaoRepository.buscarPedidoComChecklist(idPedido);
    }

    const statusOrcamento = dados.status_aprovacao_orcamento ?? regPedido?.status_aprovacao;
    if (statusOrcamento && statusOrcamento !== "Aprovado") {
        const erro = new Error("Bloqueio de fabricação: o orçamento ainda não foi aprovado pelo cliente.");
        erro.status = 400;
        throw erro;
    }

    const checklist = dados.checklist_medicao ?? regPedido?.checklist_medicao;
    if (checklist) {
        const statusChecklist = checklist.status_aprovacao ?? checklist.status_medicao;
        const pendenciaInfra =
            checklist.viga_ok === false ||
            checklist.piso_ok === false ||
            checklist.ponto_eletrico_ok === false;

        if (statusChecklist !== "Aprovado" || pendenciaInfra) {
            const erro = new Error("Bloqueio de fabricação: pendência técnica identificada no checklist de medição.");
            erro.status = 400;
            throw erro;
        }
    } else if (regPedido && regPedido.bloqueio_fabricacao === true && !dados.ignorar_bloqueio) {
        const erro = new Error(
            regPedido.motivo_bloqueio ||
                "Bloqueio de fabricação: pendência técnica identificada no checklist de medição."
        );
        erro.status = 400;
        throw erro;
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

async function criar(dados, usuarioLogado = null) {
    // CT01 Cenário 6 - Verifica autorização de perfil
    validarPerfilCriacaoOP(usuarioLogado || (dados && dados.usuario_logado));

    validarOrdemProducao(dados);

    const idPedido = Number(dados.id_pedido !== undefined ? dados.id_pedido : dados.pedido_id);
    const idResponsavel = Number(
        dados.id_responsavel_tecnico !== undefined
            ? dados.id_responsavel_tecnico
            : dados.responsavel_producao_id
    );

    // RF08 & CT01 Cenários 2 e 3 - Cruzamento de aprovação do orçamento e checklist de medição
    await verificarBloqueiosFabricacao(idPedido, dados);

    const dadosFormatados = {
        ...dados,
        id_pedido: idPedido,
        pedido_id: idPedido,
        id_responsavel_tecnico: idResponsavel,
        responsavel_producao_id: idResponsavel,
        status_op:
            dados.status_op === "Em fabricação"
                ? "Em Fabricacao"
                : dados.status_op || "Em Fabricacao",
        status: "Em Fabricacao",
        bloqueio_fabricacao: false,
        motivo_bloqueio: null,
    };

    delete dadosFormatados.id_op;
    delete dadosFormatados.id;
    delete dadosFormatados.usuario_logado;
    delete dadosFormatados.status_aprovacao_orcamento;
    delete dadosFormatados.checklist_medicao;

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
        dadosFormatados.responsavel_producao_id = dadosFormatados.id_responsavel_tecnico;
    }
    if (dadosFormatados.status_op === "Em fabricação") {
        dadosFormatados.status_op = "Em Fabricacao";
    }

    delete dadosFormatados.id_op;
    delete dadosFormatados.id;
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

async function concluirOrdemProducao(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    const existente = await ordemProducaoRepository.buscarPorId(idNum);
    if (!existente) return null;
    await ordemProducaoRepository.atualizar(idNum, { status_op: "Concluida" });
    return {
        ...existente,
        status_op: "Concluida",
    };
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
    concluirOrdemProducao,
};
