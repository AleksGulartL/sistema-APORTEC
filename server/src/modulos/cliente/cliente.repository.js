const bcrypt = require("bcrypt");
const { cliente, usuario, sequelize } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario",
            attributes: ["id", "nome_completo", "email", "perfil", "cargo_funcao", "ativo"],
        });
    }
    return includes;
}

async function listar() {
    return cliente.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return cliente.findByPk(id, {
        include: obterIncludes(),
    });
}

async function criar(dados) {
    const transaction = sequelize?.transaction ? await sequelize.transaction() : null;
    try {
        let usuarioId = dados.usuario_id || dados.id_usuario;

        if (!usuarioId && usuario) {
            const senhaPlana = dados.senha || dados.senha_hash || "aportec123";
            const senhaHash = senhaPlana.startsWith("$2b$") ? senhaPlana : await bcrypt.hash(senhaPlana, 10);

            const novoUsuario = await usuario.create(
                {
                    nome_completo: dados.nome_completo,
                    email: dados.email,
                    senha_hash: senhaHash,
                    perfil: "CLIENTE",
                    cargo_funcao: "Cliente",
                    ativo: true,
                },
                transaction ? { transaction } : undefined
            );
            usuarioId = novoUsuario.id;
        }

        const novoCliente = await cliente.create(
            {
                usuario_id: usuarioId,
                cnpj_cpf: dados.cnpj_cpf,
                telefone: dados.telefone,
                endereco: dados.endereco,
            },
            transaction ? { transaction } : undefined
        );

        if (transaction) await transaction.commit();
        return buscarPorId(novoCliente.id);
    } catch (erro) {
        if (transaction) await transaction.rollback();
        throw erro;
    }
}

async function atualizar(id, dados) {
    const registro = await cliente.findByPk(id, {
        include: obterIncludes(),
    });
    if (!registro) return null;

    const transaction = sequelize?.transaction ? await sequelize.transaction() : null;
    try {
        if (registro.usuario && (dados.nome_completo !== undefined || dados.email !== undefined)) {
            await registro.usuario.update(
                {
                    ...(dados.nome_completo !== undefined ? { nome_completo: dados.nome_completo } : {}),
                    ...(dados.email !== undefined ? { email: dados.email } : {}),
                },
                transaction ? { transaction } : undefined
            );
        }

        await registro.update(
            {
                ...(dados.usuario_id !== undefined ? { usuario_id: dados.usuario_id } : {}),
                ...(dados.cnpj_cpf !== undefined ? { cnpj_cpf: dados.cnpj_cpf } : {}),
                ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
                ...(dados.endereco !== undefined ? { endereco: dados.endereco } : {}),
            },
            transaction ? { transaction } : undefined
        );

        if (transaction) await transaction.commit();
        return buscarPorId(id);
    } catch (erro) {
        if (transaction) await transaction.rollback();
        throw erro;
    }
}

async function deletar(id) {
    const registro = await cliente.findByPk(id);
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
