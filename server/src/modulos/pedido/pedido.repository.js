const {
    sequelize,
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
const { validarEdicaoPedido } = require("../../utils/fluxoPedido");
const { criarErro } = require("../../utils/criarErro");

function obterIncludes() {
    const includes = [{ model: pedido, as: "pedido_origem", attributes: ["id", "numero_serie", "fim_garantia", "endereco_instalacao"] }];
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
    return sequelize.transaction(async (transaction) => {
        const registro = await pedido.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!registro) return null;
        validarEdicaoPedido(registro, dados);
        await registro.update(dados, { transaction });
        return pedido.findByPk(id, { transaction, include: obterIncludes() });
    });
}

async function deletar(id) {
    const registro = await pedido.findByPk(id);
    if (!registro) return null;

    const [qtdOs, qtdFilhos] = await Promise.all([
        ordem_servico ? ordem_servico.count({ where: { pedido_id: id } }) : 0,
        pedido.count({ where: { pedido_origem_id: id } }),
    ]);
    if (qtdOs > 0 || qtdFilhos > 0) {
        throw criarErro("Não é possível excluir este pedido pois ele possui Ordens de Serviço ou manutenções vinculadas.", 400);
    }

    await registro.destroy();
    return registro;
}

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
