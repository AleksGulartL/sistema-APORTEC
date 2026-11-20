const { sequelize, ordem_servico, cliente, pedido, usuario } = require("../../database/models");

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

async function buscarPorId(id, options = {}) {
    return ordem_servico.findByPk(id, {
        ...options,
        include: obterIncludes(),
    });
}

async function criar(dados) {
    return ordem_servico.create(dados);
}

async function atualizar(id, dados) {
    return sequelize.transaction(async (transaction) => {
        const registro = await ordem_servico.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!registro) return null;
        if (registro.status_os === "Finalizada") {
            throw Object.assign(new Error("Esta OS já foi finalizada e não pode ser alterada."), { status: 409 });
        }
        // O trigger conclui o pedido na mesma transação desta atualização.
        await registro.update(dados, { transaction });
        return buscarPorId(id, { transaction });
    });
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
