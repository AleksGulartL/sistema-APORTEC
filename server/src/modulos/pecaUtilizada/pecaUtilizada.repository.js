const { peca_utilizada, ordem_servico, item_catalogo } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (ordem_servico) {
        includes.push({
            model: ordem_servico,
            as: "ordem_servico"
        });
    }
    if (item_catalogo) {
        includes.push({
            model: item_catalogo,
            as: "item_catalogo"
        });
    }
    return includes;
}

async function listar() {
    return peca_utilizada.findAll({
        order: [["id_peca_os", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return peca_utilizada.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return peca_utilizada.create(dados);
}

async function atualizar(id, dados) {
    const registro = await peca_utilizada.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await peca_utilizada.findByPk(id);
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
