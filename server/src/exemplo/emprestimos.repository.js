const { Emprestimo } = require("../database/models");

async function listar() {
    return Emprestimo.findAll({ order: [["dataEmprestimo", "ASC"]] });
}

async function buscarPorId(id) {
    return Emprestimo.findByPk(id);
}

async function criar(dados) {
    return Emprestimo.create(dados);
}

async function atualizar(id, dados) {
    const emprestimo = await Emprestimo.findByPk(id);
    if (!emprestimo) return null;
    return emprestimo.update(dados);
}

async function deletar(id) {
    const emprestimo = await Emprestimo.findByPk(id);
    if (!emprestimo) return null;
    await emprestimo.destroy();
    return emprestimo;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
