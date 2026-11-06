const { usuario } = require("../../database/models");

async function buscarPorEmail(email) {
    return usuario.findOne({ where: { email } });
}

async function buscarPorId(id) {
    return usuario.findByPk(id);
}

async function criar(dados) {
    return usuario.create(dados);
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    criar,
};
