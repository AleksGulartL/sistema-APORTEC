const { cliente, obra } = require("../../database/models");

async function listar() {
    return cliente.findAll({
        order: [["id", "ASC"]],
        include: obra ? [{ model: obra, as: "obras" }] : [],
    });
}

async function buscarPorId(id) {
    return cliente.findByPk(id, {
        include: obra ? [{ model: obra, as: "obras" }] : [],
    });
}

async function criar(dados) {
    return cliente.create(dados);
}

async function atualizar(id, dados) {
    const registro = await cliente.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await cliente.findByPk(id);
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
