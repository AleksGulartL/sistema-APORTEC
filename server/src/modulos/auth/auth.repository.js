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

async function atualizarSenha(id, senhaHash) {
    const registro = await usuario.findByPk(id);
    if (!registro) return null;
    await registro.update({ senha_hash: senhaHash });
    return registro;
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    criar,
    atualizarSenha,
};
