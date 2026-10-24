const { usuario } = require("../../database/models");

async function listar() {
    return usuario.findAll({ order: [["id_usuario", "ASC"]] });
}

async function buscarPorId(id) {
    return usuario.findByPk(id);
}

async function criar(dados) {
    return usuario.create(dados);
}

async function atualizar(id, dados) {
    const registro = await usuario.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await usuario.findByPk(id);
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