const { Op } = require("sequelize");
const { usuario, pedido, checklist_medicao, ordem_servico } = require("../../database/models");
const { criarErro } = require("../../utils/criarErro");

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

    const vinculos = await Promise.all([
        pedido ? pedido.count({ where: { [Op.or]: [{ usuario_criador_id: id }, { responsavel_producao_id: id }] } }) : 0,
        checklist_medicao ? checklist_medicao.count({ where: { tecnico_id: id } }) : 0,
        ordem_servico ? ordem_servico.count({ where: { tecnico_responsavel_id: id } }) : 0,
    ]);
    if (vinculos.some((qtd) => qtd > 0)) {
        throw criarErro("Não é possível excluir este usuário pois existem pedidos ou ordens de serviço vinculados a ele.", 400);
    }

    await registro.update({ ativo: false });
    await registro.destroy();
    return registro;
}

async function listarTecnicos() {
    return usuario.findAll({
        where: {
            perfil: "TECNICO", ativo: true
        },
        attributes: ["id", "nome_completo", "perfil", "ativo"],
        order: [["nome_completo", "ASC"]]
    });
}

module.exports = {
    listarTecnicos,
    listar,
    buscarPorId,
    buscarPorEmail,
    criar,
    atualizar,
    deletar,
};
