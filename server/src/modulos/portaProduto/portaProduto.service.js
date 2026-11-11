const portaProdutoRepository = require("./portaProduto.repository");

function obterObraId(dados) {
    return dados.id_obra !== undefined ? dados.id_obra : dados.obra_id;
}

function obterPedidoOrigemId(dados) {
    return dados.id_pedido_origem !== undefined ? dados.id_pedido_origem : dados.pedido_origem_id;
}

function validarPortaProduto(dados, isUpdate = false) {
    const rawObraId = obterObraId(dados);
    const rawPedidoOrigemId = obterPedidoOrigemId(dados);

    if (!isUpdate) {
        if (!dados.numero_serie || typeof dados.numero_serie !== "string" || !dados.numero_serie.trim()) {
            const erro = new Error("O campo 'numero_serie' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }

        const idObraNum = Number(rawObraId);
        if (!rawObraId || !Number.isInteger(idObraNum) || idObraNum <= 0) {
            const erro = new Error("O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }

        if (!dados.modelo_automatizador || typeof dados.modelo_automatizador !== "string" || !dados.modelo_automatizador.trim()) {
            const erro = new Error("O campo 'modelo_automatizador' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    } else {
        if (dados.numero_serie !== undefined) {
            if (typeof dados.numero_serie !== "string" || !dados.numero_serie.trim()) {
                const erro = new Error("O campo 'numero_serie' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (rawObraId !== undefined) {
            const idObraNum = Number(rawObraId);
            if (!Number.isInteger(idObraNum) || idObraNum <= 0) {
                const erro = new Error("O campo 'id_obra' deve ser um número inteiro válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.modelo_automatizador !== undefined) {
            if (typeof dados.modelo_automatizador !== "string" || !dados.modelo_automatizador.trim()) {
                const erro = new Error("O campo 'modelo_automatizador' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (rawPedidoOrigemId !== undefined && rawPedidoOrigemId !== null) {
        const idPedidoNum = Number(rawPedidoOrigemId);
        if (!Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
            const erro = new Error("O campo 'id_pedido_origem' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.data_instalacao !== undefined && dados.data_instalacao !== null) {
        if (isNaN(new Date(dados.data_instalacao).getTime())) {
            const erro = new Error("A 'data_instalacao' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.fim_garantia_motor !== undefined && dados.fim_garantia_motor !== null) {
        if (isNaN(new Date(dados.fim_garantia_motor).getTime())) {
            const erro = new Error("A 'fim_garantia_motor' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.fim_garantia_geral !== undefined && dados.fim_garantia_geral !== null) {
        if (isNaN(new Date(dados.fim_garantia_geral).getTime())) {
            const erro = new Error("A 'fim_garantia_geral' deve ser uma data válida.");
            erro.status = 400;
            throw erro;
        }
    }
}

function formatarProntuario(porta) {
    if (!porta) return null;
    const hojeIso = new Date().toISOString().slice(0, 10);
    const emGarantiaMotor = porta.fim_garantia_motor ? porta.fim_garantia_motor >= hojeIso : false;
    const emGarantiaGeral = porta.fim_garantia_geral ? porta.fim_garantia_geral >= hojeIso : false;

    const componentesOriginais = [
        ...(porta.pedido_origem?.itens || []).map((i) => ({
            origem: "Pedido/Orçamento",
            item_id: i.item_id,
            descricao: i.item_catalogo?.descricao || null,
            quantidade: Number(i.quantidade),
        })),
        ...(porta.pedido_origem?.movimentacao_estoque || []).map((m) => ({
            origem: "Ordem de Produção",
            item_id: m.item_id,
            descricao: m.item_catalogo?.descricao || null,
            quantidade: Number(m.quantidade),
            lote_serie_componente: m.lote_serie_componente || null,
        })),
    ];

    const pecasSubstituidas = [];
    for (const os of porta.ordens_servico || []) {
        for (const peca of os.peca_utilizada || []) {
            pecasSubstituidas.push({
                id_os: os.id,
                data_servico: os.data_hora_execucao_fim || os.created_at,
                item_id: peca.item_id,
                descricao: peca.item_catalogo?.descricao || null,
                quantidade_utilizada: Number(peca.quantidade),
            });
        }
    }

    return {
        id_porta: porta.id,
        numero_serie: porta.numero_serie,
        modelo_automatizador: porta.modelo_automatizador,
        data_instalacao: porta.data_instalacao,
        fim_garantia_motor: porta.fim_garantia_motor,
        fim_garantia_geral: porta.fim_garantia_geral,
        em_garantia_motor: emGarantiaMotor,
        em_garantia_geral: emGarantiaGeral,
        obra: porta.obra || null,
        componentes_originais: componentesOriginais,
        historico_pecas_substituidas: pecasSubstituidas,
        chamados_assistencia: porta.ordens_servico || [],
    };
}

async function listar() {
    return portaProdutoRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return portaProdutoRepository.buscarPorId(idNum);
}

// RF15 - Consulta ao Prontuário da Porta (por ID ou Número de Série)
async function obterProntuarioPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    if (typeof portaProdutoRepository.buscarProntuarioCompleto === "function") {
        const porta = await portaProdutoRepository.buscarProntuarioCompleto({ id: idNum });
        return formatarProntuario(porta);
    }
    return portaProdutoRepository.buscarPorId(idNum);
}

async function obterProntuarioPorNumeroSerie(numeroSerie) {
    if (!numeroSerie || typeof numeroSerie !== "string" || !numeroSerie.trim()) {
        const erro = new Error("O 'numero_serie' é obrigatório.");
        erro.status = 400;
        throw erro;
    }
    if (typeof portaProdutoRepository.buscarProntuarioCompleto === "function") {
        const porta = await portaProdutoRepository.buscarProntuarioCompleto({
            numero_serie: numeroSerie.trim(),
        });
        return formatarProntuario(porta);
    }
    return portaProdutoRepository.buscarPorNumeroSerie(numeroSerie.trim());
}

async function criar(dados) {
    validarPortaProduto(dados);
    const idObra = Number(obterObraId(dados));
    const dadosFormatados = {
        ...dados,
        id_obra: idObra,
    };

    const rawPedidoOrigemId = obterPedidoOrigemId(dados);
    if (rawPedidoOrigemId !== undefined && rawPedidoOrigemId !== null) {
        dadosFormatados.id_pedido_origem = Number(rawPedidoOrigemId);
    }

    delete dadosFormatados.id_porta;
    return portaProdutoRepository.criar(dadosFormatados);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarPortaProduto(dados, true);
    const dadosFormatados = { ...dados };

    if (dadosFormatados.id_obra !== undefined) {
        dadosFormatados.id_obra = Number(dadosFormatados.id_obra);
    }
    if (dadosFormatados.id_pedido_origem !== undefined && dadosFormatados.id_pedido_origem !== null) {
        dadosFormatados.id_pedido_origem = Number(dadosFormatados.id_pedido_origem);
    }

    delete dadosFormatados.id_porta;
    return portaProdutoRepository.atualizar(idNum, dadosFormatados);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return portaProdutoRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    obterProntuarioPorId,
    obterProntuarioPorNumeroSerie,
    criar,
    atualizar,
    deletar,
};
