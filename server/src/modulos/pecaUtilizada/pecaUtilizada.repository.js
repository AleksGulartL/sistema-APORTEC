const { Op } = require("sequelize");
const { movimentacao_estoque, ordem_servico, item_catalogo } = require("../../database/models");
const movimentacaoEstoqueRepository = require("../movimentacaoEstoque/movimentacaoEstoque.repository");

function obterIncludes() {
    const includes = [];
    if (ordem_servico) {
        includes.push({
            model: ordem_servico,
            as: "ordem_servico",
        });
    }
    if (item_catalogo) {
        includes.push({
            model: item_catalogo,
            as: "item_catalogo",
        });
    }
    return includes;
}

async function listar() {
    return movimentacao_estoque.findAll({
        where: {
            ordem_servico_id: { [Op.ne]: null },
            tipo_movimentacao: "Baixa_OS",
        },
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return movimentacao_estoque.findByPk(id, {
        include: obterIncludes(),
    });
}

async function criar(dados) {
    const osId = Number(dados.id_os);
    let portaId = dados.id_porta ?? null;

    if (!portaId && osId && ordem_servico) {
        const regOs = await ordem_servico.findByPk(osId);
        if (regOs && regOs.porta_id) {
            portaId = regOs.porta_id;
        }
    }

    return movimentacaoEstoqueRepository.criar({
        ...dados,
        ordem_servico_id: osId,
        porta_id: portaId,
        item_id: Number(dados.id_item),
        tipo_movimentacao: "Baixa_OS",
        status_baixa: "Baixado",
        quantidade: Number(dados.quantidade_utilizada ?? 1),
    });
}

async function atualizar(id, dados) {
    const payload = { ...dados };
    if (payload.quantidade_utilizada !== undefined) {
        payload.quantidade = Number(payload.quantidade_utilizada);
    }
    return movimentacaoEstoqueRepository.atualizar(id, payload);
}

async function deletar(id) {
    return movimentacaoEstoqueRepository.deletar(id);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
