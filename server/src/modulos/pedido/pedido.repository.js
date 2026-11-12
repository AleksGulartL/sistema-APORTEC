const {
    pedido,
    obra,
    cliente,
    usuario,
    pedido_item,
    item_catalogo,
    checklist_medicao,
    porta_produto,
    movimentacao_estoque,
} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (obra) {
        includes.push({
            model: obra,
            as: "obra",
            include: cliente ? [{ model: cliente, as: "cliente" }] : [],
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario_criador",
        });
        includes.push({
            model: usuario,
            as: "responsavel_producao",
        });
    }
    if (pedido_item) {
        includes.push({
            model: pedido_item,
            as: "itens",
            include: item_catalogo ? [{ model: item_catalogo, as: "item_catalogo" }] : [],
        });
    }
    if (checklist_medicao) {
        includes.push({
            model: checklist_medicao,
            as: "checklist_medicao",
        });
    }
    return includes;
}

async function listar() {
    return pedido.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return pedido.findByPk(id, {
        include: obterIncludes(),
    });
}

// RF06 - Se o pedido está sendo convertido a partir de um orçamento existente na tabela unificada, atualiza o registro
async function criar(dados) {
    const idOrcamento = dados.id_orcamento ? Number(dados.id_orcamento) : null;
    if (idOrcamento && !dados.obra_id) {
        const existente = await pedido.findByPk(idOrcamento);
        if (existente) {
            return existente.update({
                data_conversao: dados.data_conversao || new Date(),
                status: dados.status_fluxo || "Aguardando",
                bloqueio_fabricacao:
                    dados.bloqueio_fabricacao !== undefined ? dados.bloqueio_fabricacao : existente.bloqueio_fabricacao,
                motivo_bloqueio:
                    dados.motivo_bloqueio !== undefined ? dados.motivo_bloqueio : existente.motivo_bloqueio,
            });
        }
    }
    return pedido.create(dados);
}

async function atualizar(id, dados) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    await registro.destroy();
    return registro;
}

// RF12 - Gera checklist de materiais de pré-saída quando o pedido fica "Pronto para Instalacao"
async function gerarChecklistPreSaida(pedidoId) {
    const regPedido = await buscarPorId(pedidoId);
    if (!regPedido) return null;

    const itensPedido = regPedido.itens || [];
    const movimentacoes = movimentacao_estoque
        ? await movimentacao_estoque.findAll({
              where: { pedido_id: pedidoId },
              include: item_catalogo ? [{ model: item_catalogo, as: "item_catalogo" }] : [],
          })
        : [];

    return {
        pedido_id: regPedido.id,
        status: regPedido.status,
        obra: regPedido.obra || null,
        medidas_vao: regPedido.checklist_medicao?.medidas_vao || null,
        modelo_automatizador: regPedido.checklist_medicao?.modelo_automatizador || null,
        itens_conferencia: itensPedido.map((i) => ({
            item_id: i.item_id,
            descricao: i.item_catalogo?.descricao || "Item do pedido",
            unidade_medida: i.item_catalogo?.unidade_medida || "UN",
            quantidade_prevista: Number(i.quantidade),
        })),
        insumos_separados: movimentacoes.map((m) => ({
            movimentacao_id: m.id,
            item_id: m.item_id,
            descricao: m.item_catalogo?.descricao || "Insumo",
            quantidade: Number(m.quantidade),
            status_baixa: m.status_baixa,
        })),
        gerado_em: new Date(),
    };
}

// RF13 - Registra porta instalada ao coletar assinatura digital de aceite
async function registrarPortaInstalada(regPedido, dadosAceite) {
    if (!porta_produto || !regPedido) return null;
    const numeroSerie =
        dadosAceite.numero_serie || `APORTEC-${new Date().getFullYear()}-${String(regPedido.id).padStart(4, "0")}`;
    const modeloAutomatizador =
        dadosAceite.modelo_automatizador ||
        regPedido.checklist_medicao?.modelo_automatizador ||
        "Automatizador Padrão APORTEC";

    const hoje = new Date();
    const dataInstalacao = dadosAceite.data_instalacao || hoje.toISOString().slice(0, 10);

    const umAnoDepois = new Date(hoje);
    umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);
    const garantiaPadrao = umAnoDepois.toISOString().slice(0, 10);

    const [porta] = await porta_produto.findOrCreate({
        where: { numero_serie: numeroSerie },
        defaults: {
            numero_serie: numeroSerie,
            obra_id: regPedido.obra_id,
            pedido_origem_id: regPedido.id,
            modelo_automatizador: modeloAutomatizador,
            data_instalacao: dataInstalacao,
            fim_garantia_motor: dadosAceite.fim_garantia_motor || garantiaPadrao,
            fim_garantia_geral: dadosAceite.fim_garantia_geral || garantiaPadrao,
        },
    });

    return porta;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
    gerarChecklistPreSaida,
    registrarPortaInstalada,
};
