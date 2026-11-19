const { ordem_servico, cliente, pedido, usuario } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (pedido) {
        includes.push({
            model: pedido,
            as: "pedido",
            include: cliente
                ? [
                      {
                          model: cliente,
                          as: "cliente",
                          include: usuario
                              ? [{ model: usuario, as: "usuario", attributes: ["id", "nome_completo", "email", "perfil"] }]
                              : [],
                      },
                  ]
                : [],
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "tecnico_responsavel",
            attributes: ["id", "nome_completo", "email", "perfil"],
        });
    }
    return includes;
}

async function listar() {
    return ordem_servico.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return ordem_servico.findByPk(id, {
        include: obterIncludes(),
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
    deletar,
};
