const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const movimentacaoEstoque = sequelize.define(
    "movimentacao_estoque",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            field: "id",
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
        },
        id_movimentacao: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        id_insumo_op: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined && !this.getDataValue("id")) this.setDataValue("id", val);
            },
        },
        id_peca_os: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined && !this.getDataValue("id")) this.setDataValue("id", val);
            },
        },
        item_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "item_id",
            get() {
                return toNumberOrNull(this.getDataValue("item_id"));
            },
        },
        id_item: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("item_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("item_id", val);
            },
        },
        usuario_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "usuario_id",
            get() {
                return toNumberOrNull(this.getDataValue("usuario_id"));
            },
        },
        id_usuario: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("usuario_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("usuario_id", val);
            },
        },
        pedido_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "pedido_id",
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
        },
        id_op: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("pedido_id", val);
            },
        },
        id_pedido: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("pedido_id", val);
            },
        },
        ordem_servico_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "ordem_servico_id",
            get() {
                return toNumberOrNull(this.getDataValue("ordem_servico_id"));
            },
        },
        id_ordem_servico: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("ordem_servico_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("ordem_servico_id", val);
            },
        },
        id_os: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("ordem_servico_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("ordem_servico_id", val);
            },
        },
        porta_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "porta_id",
            get() {
                return toNumberOrNull(this.getDataValue("porta_id"));
            },
        },
        id_porta: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("porta_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("porta_id", val);
            },
        },
        tipo_movimentacao: {
            type: DataTypes.STRING(40),
            allowNull: false,
            field: "tipo_movimentacao",
        },
        status_baixa: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "Baixado",
            field: "status_baixa",
        },
        quantidade_planejada: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            field: "quantidade_planejada",
            get() {
                return toNumberOrNull(this.getDataValue("quantidade_planejada"));
            },
        },
        quantidade: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 1.0,
            field: "quantidade",
            get() {
                return toNumberOrNull(this.getDataValue("quantidade"));
            },
        },
        quantidade_baixada: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("quantidade"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("quantidade", val);
            },
        },
        quantidade_utilizada: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("quantidade"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("quantidade", val);
            },
        },
        lote_serie_componente: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "lote_serie_componente",
        },
        fornecedor: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "fornecedor",
        },
        data_hora: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "data_hora",
        },
    },
    {
        tableName: "movimentacao_estoque",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

movimentacaoEstoque.associate = (models) => {
    if (models.item_catalogo) {
        movimentacaoEstoque.belongsTo(models.item_catalogo, {
            foreignKey: "item_id",
            as: "item_catalogo",
        });
    }

    if (models.usuario) {
        movimentacaoEstoque.belongsTo(models.usuario, {
            foreignKey: "usuario_id",
            as: "usuario",
        });
    }

    if (models.pedido) {
        movimentacaoEstoque.belongsTo(models.pedido, {
            foreignKey: "pedido_id",
            as: "pedido",
        });
        movimentacaoEstoque.belongsTo(models.pedido, {
            foreignKey: "pedido_id",
            as: "ordem_producao",
        });
    }

    if (models.ordem_servico) {
        movimentacaoEstoque.belongsTo(models.ordem_servico, {
            foreignKey: "ordem_servico_id",
            as: "ordem_servico",
        });
    }

    if (models.porta_produto) {
        movimentacaoEstoque.belongsTo(models.porta_produto, {
            foreignKey: "porta_id",
            as: "porta_produto",
        });
    }
};

module.exports = movimentacaoEstoque;
