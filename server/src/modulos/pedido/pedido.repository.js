const {
    pedido,
    cliente,
    usuario,
    pedido_item,
    item_catalogo,
    tipo_item,
    categoria_item,
    checklist_medicao,
    ordem_servico,
} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (cliente) {
        includes.push({
            model: cliente,
            as: "cliente",
            include: usuario
                ? [{ model: usuario, as: "usuario", attributes: ["id", "nome_completo", "email", "perfil"] }]
                : [],
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario_criador",
            attributes: ["id", "nome_completo", "email", "perfil"],
        });
        includes.push({
            model: usuario,
            as: "responsavel_producao",
            attributes: ["id", "nome_completo", "email", "perfil"],
        });
    }
    if (pedido_item) {
        const itemIncludes = [];
        if (tipo_item) itemIncludes.push({ model: tipo_item, as: "tipo" });
        if (categoria_item) itemIncludes.push({ model: categoria_item, as: "categoria" });

        includes.push({
            model: pedido_item,
            as: "itens",
            include: item_catalogo
                ? [{ model: item_catalogo, as: "item_catalogo", include: itemIncludes }]
                : [],
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
    const criado = await pedido.create(dados);
    return buscarPorId(criado.id);
}

async function atualizar(id, dados) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;
    await registro.update(dados);
    return buscarPorId(id);
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
