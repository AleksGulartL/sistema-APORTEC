const { obra, cliente } = require("../../database/models");

async function listar() {
    return obra.findAll({
        order: [["id", "ASC"]],
        include: cliente ? [{ model: cliente, as: "cliente" }] : [],
    });
}

async function buscarPorId(id) {
    return obra.findByPk(id, {
        include: cliente ? [{ model: cliente, as: "cliente" }] : [],
    });
}

async function criar(dados) {
    return obra.create(dados);
}

async function atualizar(id, dados) {
    const registro = await obra.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await obra.findByPk(id);
    if (!registro) return null;
    await registro.destroy();
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
