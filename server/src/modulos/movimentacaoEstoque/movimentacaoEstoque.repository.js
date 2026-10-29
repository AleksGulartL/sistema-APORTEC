const { movimentacao_estoque, item_catalogo, usuario, ordem_producao, ordem_servico } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (item_catalogo) {
        includes.push({
            model: item_catalogo,
            as: "item_catalogo"
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario"
        });
    }
    if (ordem_producao) {
        includes.push({
            model: ordem_producao,
            as: "ordem_producao"
        });
    }
    if (ordem_servico) {
        includes.push({
            model: ordem_servico,
            as: "ordem_servico"
        });
    }
    return includes;
}

async function listar() {
    return movimentacao_estoque.findAll({
        order: [["id_movimentacao", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return movimentacao_estoque.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return movimentacao_estoque.create(dados);
}

async function atualizar(id, dados) {
    const registro = await movimentacao_estoque.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await movimentacao_estoque.findByPk(id);
    if (!registro) return null;
    await registro.destroy();
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};
