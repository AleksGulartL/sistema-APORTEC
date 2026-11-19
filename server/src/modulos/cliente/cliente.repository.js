const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { cliente, usuario, sequelize } = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario",
            attributes: ["id", "nome_completo", "email", "perfil", "ativo"],
        });
    }
    return includes;
}

function gerarSenhaTemporaria() {
    return `Aportec@${crypto.randomBytes(3).toString("hex")}`;
}

async function listar() {
    return cliente.findAll({
        order: [["usuario_id", "ASC"]],
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
            const senhaDefinida = dados.senha && String(dados.senha).trim() ? String(dados.senha).trim() : null;
            const senhaPlana = senhaDefinida || dados.senha_hash || gerarSenhaTemporaria();
            const senhaHash = String(senhaPlana).startsWith("$2b$")
                ? senhaPlana
                : await bcrypt.hash(String(senhaPlana), 10);

            const novoUsuario = await usuario.create(
                {
                    nome_completo: dados.nome_completo,
                    email: dados.email,
                    senha_hash: senhaHash,
                    perfil: "CLIENTE",
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
        return buscarPorId(novoCliente.usuario_id);
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
        const atualizacaoUsuario = {};
        if (dados.nome_completo !== undefined) atualizacaoUsuario.nome_completo = dados.nome_completo;
        if (dados.email !== undefined) atualizacaoUsuario.email = dados.email;
        if (dados.senha && String(dados.senha).trim()) {
            atualizacaoUsuario.senha_hash = await bcrypt.hash(String(dados.senha).trim(), 10);
        }

        if (registro.usuario && Object.keys(atualizacaoUsuario).length > 0) {
            await registro.usuario.update(
                atualizacaoUsuario,
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
