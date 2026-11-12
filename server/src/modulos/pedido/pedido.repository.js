const {
    pedido,
    cliente,
    usuario,
    pedido_item,
    item_catalogo,
    checklist_medicao,
    ordem_servico,
} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (cliente) {
        includes.push({
            model: cliente,
            as: "cliente",
            include: usuario ? [{ model: usuario, as: "usuario", attributes: ["id", "nome_completo", "email", "perfil"] }] : [],
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
    if (ordem_servico) {
        includes.push({
            model: ordem_servico,
            as: "ordens_servico",
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

async function criar(dados) {
    const idOrcamento = dados.id_orcamento ? Number(dados.id_orcamento) : null;
    if (idOrcamento && !dados.cliente_id) {
        const existente = await pedido.findByPk(idOrcamento);
        if (existente) {
            return existente.update({
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

// RF12 - Gera checklist de materiais de pré-saída usando diretamente pedido_item
async function gerarChecklistPreSaida(pedidoId) {
    const regPedido = await buscarPorId(pedidoId);
    if (!regPedido) return null;

    const itensPedido = regPedido.itens || [];

    return {
        pedido_id: regPedido.id,
        status: regPedido.status,
        cliente: regPedido.cliente || null,
        endereco_instalacao: regPedido.endereco_instalacao || regPedido.cliente?.endereco || null,
        medidas_vao: regPedido.checklist_medicao?.medidas_vao || null,
        modelo_automatizador: regPedido.checklist_medicao?.modelo_automatizador || null,
        itens_conferencia: itensPedido.map((i) => ({
            item_id: i.item_id,
            descricao: i.item_catalogo?.descricao || "Item do pedido",
            unidade_medida: i.item_catalogo?.unidade_medida || "UN",
            quantidade_prevista: Number(i.quantidade),
        })),
        gerado_em: new Date(),
    };
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
    gerarChecklistPreSaida,
};
