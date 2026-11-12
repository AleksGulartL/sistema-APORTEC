const { Op } = require("sequelize");
const { movimentacao_estoque, pedido, item_catalogo } = require("../../database/models");
const movimentacaoEstoqueRepository = require("../movimentacaoEstoque/movimentacaoEstoque.repository");

function obterIncludes() {
    const includes = [];
    if (pedido) {
        includes.push({
            model: pedido,
            as: "ordem_producao",
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
            pedido_id: { [Op.ne]: null },
            tipo_movimentacao: { [Op.in]: ["Reserva_Producao", "Baixa_Producao"] },
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
    const statusBaixa = dados.status_baixa || "Pendente";
    const tipoMov = statusBaixa === "Baixado" ? "Baixa_Producao" : "Reserva_Producao";
    const qtd =
        statusBaixa === "Baixado"
            ? Number(dados.quantidade_baixada ?? dados.quantidade_planejada ?? 1)
            : Number(dados.quantidade_planejada ?? 1);

    return movimentacaoEstoqueRepository.criar({
        ...dados,
        pedido_id: Number(dados.id_op),
        item_id: Number(dados.id_item),
        tipo_movimentacao: tipoMov,
        status_baixa: statusBaixa,
        quantidade_planejada: Number(dados.quantidade_planejada),
        quantidade: qtd,
    });
}

async function atualizar(id, dados) {
    const payload = { ...dados };
    if (payload.status_baixa === "Baixado") {
        payload.tipo_movimentacao = "Baixa_Producao";
        if (payload.quantidade_baixada !== undefined) {
            payload.quantidade = Number(payload.quantidade_baixada);
        }
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
