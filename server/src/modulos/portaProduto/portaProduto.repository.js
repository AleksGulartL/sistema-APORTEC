const { porta_produto, obra_servico, pedido } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (obra_servico) {
        includes.push({
            model: obra_servico,
            as: "obra_servico"
        });
    }
    if (pedido) {
        includes.push({
            model: pedido,
            as: "pedido_origem"
        });
    }
    return includes;
}

async function listar() {
    return porta_produto.findAll({
        order: [["id_porta", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return porta_produto.findByPk(id, {
        include: obterIncludes()
    });
}

async function buscarPorNumeroSerie(numeroSerie) {
    return porta_produto.findOne({
        where: { numero_serie: numeroSerie },
        include: obterIncludes()
    });
}

async function criar(dados) {
    return porta_produto.create(dados);
}

async function atualizar(id, dados) {
    const registro = await porta_produto.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await porta_produto.findByPk(id);
    if (!registro) return null;
    await registro.destroy();
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    buscarPorNumeroSerie,
    criar,
    atualizar,
    deletar
};
