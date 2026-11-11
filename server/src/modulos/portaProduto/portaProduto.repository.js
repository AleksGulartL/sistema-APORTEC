const {
    porta_produto,
    obra,
    cliente,
    pedido,
    pedido_item,
    checklist_medicao,
    ordem_servico,
    usuario,
    movimentacao_estoque,
    item_catalogo,
} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (obra) {
        includes.push({
            model: obra,
            as: "obra_servico",
            include: cliente ? [{ model: cliente, as: "cliente" }] : [],
        });
    }
    if (pedido) {
        includes.push({
            model: pedido,
            as: "pedido_origem",
        });
    }
    return includes;
}

async function listar() {
    return porta_produto.findAll({
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return porta_produto.findByPk(id, {
        include: obterIncludes(),
    });
}

async function buscarPorNumeroSerie(numeroSerie) {
    return porta_produto.findOne({
        where: { numero_serie: numeroSerie },
        include: obterIncludes(),
    });
}

// RF15 - Consulta Consolidada ao Prontuário da Porta (Histórico Completo por ID ou Número de Série)
async function buscarProntuarioCompleto(filtro) {
    const includesProntuario = [
        ...(obra
            ? [
                  {
                      model: obra,
                      as: "obra",
                      include: cliente ? [{ model: cliente, as: "cliente" }] : [],
                  },
              ]
            : []),
        ...(pedido
            ? [
                  {
                      model: pedido,
                      as: "pedido_origem",
                      include: [
                          ...(checklist_medicao
                              ? [{ model: checklist_medicao, as: "checklist_medicao" }]
                              : []),
                          ...(pedido_item
                              ? [
                                    {
                                        model: pedido_item,
                                        as: "itens",
                                        include: item_catalogo
                                            ? [{ model: item_catalogo, as: "item_catalogo" }]
                                            : [],
                                    },
                                ]
                              : []),
                          ...(movimentacao_estoque
                              ? [
                                    {
                                        model: movimentacao_estoque,
                                        as: "movimentacao_estoque",
                                        include: item_catalogo
                                            ? [{ model: item_catalogo, as: "item_catalogo" }]
                                            : [],
                                    },
                                ]
                              : []),
                      ],
                  },
              ]
            : []),
        ...(ordem_servico
            ? [
                  {
                      model: ordem_servico,
                      as: "ordens_servico",
                      include: [
                          ...(usuario ? [{ model: usuario, as: "tecnico_responsavel" }] : []),
                          ...(movimentacao_estoque
                              ? [
                                    {
                                        model: movimentacao_estoque,
                                        as: "peca_utilizada",
                                        include: item_catalogo
                                            ? [{ model: item_catalogo, as: "item_catalogo" }]
                                            : [],
                                    },
                                ]
                              : []),
                      ],
                  },
              ]
            : []),
        ...(movimentacao_estoque
            ? [
                  {
                      model: movimentacao_estoque,
                      as: "movimentacoes_estoque",
                      include: item_catalogo ? [{ model: item_catalogo, as: "item_catalogo" }] : [],
                  },
              ]
            : []),
    ];

    return porta_produto.findOne({
        where: filtro,
        include: includesProntuario,
    });
}

async function criar(dados) {
    return porta_produto.create(dados);
}

async function atualizar(id, dados) {
    const registro = await porta_produto.findByPk(id);
    if (!registro) return null;
    return registro.update(dados);
}

async function deletar(id) {
    const registro = await porta_produto.findByPk(id);
    if (!registro) return null;
    await registro.destroy();
    return registro;
}

module.exports = {
    listar,
    buscarPorId,
    buscarPorNumeroSerie,
    buscarProntuarioCompleto,
    criar,
    atualizar,
    deletar,
};
