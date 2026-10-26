const { orcamento, cliente, obra_servico, usuario } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (cliente) includes.push({
        model: cliente,
        as: "cliente"
    });
    if (obra_servico) includes.push({
        model: obra_servico,
        as: "obra_servico"
    });
    if (usuario) includes.push({
        model: usuario,
        as: "usuario" 
    });
    return includes;
}

async function listar() {
    return orcamento.findAll({
        order: [["id_orcamento", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return orcamento.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return orcamento.create(dados);
}

async function atualizar(id, dados) {
    const registro = await orcamento.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await orcamento.findByPk(id);
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
