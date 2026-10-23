const { usuario } = require("../database/models");

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
    const usuario = await usuario.findByPk(id);
    if (!usuario) return null;
    return usuario.update(dados);
}

async function deletar(id) {
    const usuario = await usuario.findByPk(id);
    if (!usuario) return null;
    await usuario.destroy();
    return usuario;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
