const { ordem_servico, obra_servico, porta_produto, usuario, peca_utilizada } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (obra_servico) {
        includes.push({
            model: obra_servico,
            as: "obra_servico"
        });
    }
    if (porta_produto) {
        includes.push({
            model: porta_produto,
            as: "porta_produto"
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "tecnico_responsavel"
        });
    }
    if (peca_utilizada) {
        includes.push({
            model: peca_utilizada,
            as: "peca_utilizada"
        });
    }
    return includes;
}

async function listar() {
    return ordem_servico.findAll({
        order: [["id_os", "ASC"]],
        include: obterIncludes()
    });
}

async function buscarPorId(id) {
    return ordem_servico.findByPk(id, {
        include: obterIncludes()
    });
}

async function criar(dados) {
    return ordem_servico.create(dados);
}

async function atualizar(id, dados) {
    const registro = await ordem_servico.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await ordem_servico.findByPk(id);
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
