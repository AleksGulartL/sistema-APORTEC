const { obra_servico, cliente } = require("../../database/models");

async function listar() {
    return obra_servico.findAll({
        order: [["id_obra", "ASC"]],
        include: cliente ? [{ model: cliente, as: "cliente" }] : []
    });
}

async function buscarPorId(id) {
    return obra_servico.findByPk(id, {
        include: cliente ? [{ model: cliente, as: "cliente" }] : []
    });
}

async function criar(dados) {
    return obra_servico.create(dados);
}

async function atualizar(id, dados) {
    const registro = await obra_servico.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await obra_servico.findByPk(id);
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