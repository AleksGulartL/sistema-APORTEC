const { usuario } = require("../../database/models");

const ATRIBUTOS_SEGUROS = { exclude: ["senha_hash"] };

async function listar() {
    return usuario.findAll({
        attributes: ATRIBUTOS_SEGUROS,
        order: [["id", "ASC"]],
    });
}

async function buscarPorId(id) {
    return usuario.findByPk(id, {
        attributes: ATRIBUTOS_SEGUROS,
    });
}

async function buscarPorEmail(email) {
    return usuario.findOne({ where: { email } });
}

async function criar(dados) {
    const criado = await usuario.create(dados);
    return buscarPorId(criado.id);
}

async function atualizar(id, dados) {
    const registro = await usuario.findByPk(id);
    if (!registro) return null;
    await registro.update(dados);
    return buscarPorId(id);
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
    buscarPorEmail,
    criar,
    atualizar,
    deletar,
};
