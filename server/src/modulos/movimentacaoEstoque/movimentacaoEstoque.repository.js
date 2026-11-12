const {
    movimentacao_estoque,
    item_catalogo,
    usuario,
    pedido,
    ordem_servico,
    porta_produto,
    sequelize,
} = require("../../database/models");

function obterIncludes() {
    const includes = [];
    if (item_catalogo) {
        includes.push({
            model: item_catalogo,
            as: "item_catalogo",
        });
    }
    if (usuario) {
        includes.push({
            model: usuario,
            as: "usuario",
        });
    }
    if (pedido) {
        includes.push({
            model: pedido,
            as: "ordem_producao",
        });
    }
    if (ordem_servico) {
        includes.push({
            model: ordem_servico,
            as: "ordem_servico",
        });
    }
    if (porta_produto) {
        includes.push({
            model: porta_produto,
            as: "porta_produto",
        });
    }
    return includes;
}

// RF10 & RF11 - Atualiza atomicamente o saldo de estoque (quantidade_atual e quantidade_reservada) no catálogo
async function processarImpactoEstoque(dados, transaction) {
    if (!item_catalogo) return null;
    const itemId = Number(dados.id_item);
    if (!itemId) return null;

    const item = await item_catalogo.findByPk(itemId, { transaction });
    if (!item) return null;

    const tipo = dados.tipo_movimentacao;
    const qtd = Number(dados.quantidade ?? 0);
    const statusBaixa = dados.status_baixa || "Baixado";

    let atual = Number(item.quantidade_atual || 0);
    let reservada = Number(item.quantidade_reservada || 0);

    if (tipo === "Entrada" || tipo === "Estorno") {
        atual = Number((atual + qtd).toFixed(2));
    } else if (tipo === "Reserva_Producao" || statusBaixa === "Pendente" || statusBaixa === "Reservado") {
        const qtdReservar = Number(dados.quantidade_planejada ?? qtd);
        reservada = Number((reservada + qtdReservar).toFixed(2));
    } else if (tipo === "Baixa_Producao" || tipo === "Baixa_OS") {
        if (atual - qtd < 0) {
            const erro = new Error(
                `Saldo de estoque insuficiente para o item '${item.descricao}' (Disponível: ${atual}, Solicitado: ${qtd}).`
            );
            erro.status = 400;
            throw erro;
        }
        atual = Number((atual - qtd).toFixed(2));
        if (tipo === "Baixa_Producao" && reservada > 0) {
            reservada = Math.max(0, Number((reservada - qtd).toFixed(2)));
        }
    } else if (tipo === "Ajuste") {
        atual = Number(qtd.toFixed(2));
    }

    await item.update(
        {
            quantidade_atual: atual,
            quantidade_reservada: reservada,
        },
        { transaction }
    );

    return item;
}

async function listar(filtro = {}) {
    return movimentacao_estoque.findAll({
        where: filtro,
        order: [["id", "ASC"]],
        include: obterIncludes(),
    });
}

async function buscarPorId(id) {
    return movimentacao_estoque.findByPk(id, {
        include: obterIncludes(),
    });
}

async function criar(dados) {
    if (sequelize && typeof sequelize.transaction === "function") {
        return sequelize.transaction(async (t) => {
            await processarImpactoEstoque(dados, t);
            return movimentacao_estoque.create(dados, { transaction: t });
        });
    }
    return movimentacao_estoque.create(dados);
}

async function atualizar(id, dados) {
    const registro = await movimentacao_estoque.findByPk(id);
    if (!registro) return null;

    // Se um insumo planejado/reservado passa para "Baixado", efetiva a baixa no estoque
    if (
        registro.status_baixa !== "Baixado" &&
        dados.status_baixa === "Baixado" &&
        item_catalogo
    ) {
        const item = await item_catalogo.findByPk(registro.item_id);
        if (item) {
            const qtdBaixa = Number(
                dados.quantidade ?? registro.quantidade_planejada ?? registro.quantidade ?? 0
            );
            const novoAtual = Math.max(0, Number((Number(item.quantidade_atual || 0) - qtdBaixa).toFixed(2)));
            const novoReservado = Math.max(
                0,
                Number((Number(item.quantidade_reservada || 0) - Number(registro.quantidade_planejada || qtdBaixa)).toFixed(2))
            );
            await item.update({
                quantidade_atual: novoAtual,
                quantidade_reservada: novoReservado,
            });
        }
    }

    return registro.update(dados);
}

async function deletar(id) {
    const registro = await movimentacao_estoque.findByPk(id);
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
