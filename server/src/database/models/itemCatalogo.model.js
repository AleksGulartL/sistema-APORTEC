const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const itemCatalogo = sequelize.define(
    "item_catalogo",
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
        id_item: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        codigo_referencia: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            field: "codigo_referencia",
        },
        tipo: {
            type: DataTypes.STRING(30),
            allowNull: false,
            field: "tipo",
        },
        categoria: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "GERAL",
            field: "categoria",
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "descricao",
        },
        unidade_medida: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: "unidade_medida",
        },
        valor_unitario_padrao: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "valor_unitario_padrao",
            get() {
                return toNumberOrNull(this.getDataValue("valor_unitario_padrao"));
            },
        },
        quantidade_atual: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "quantidade_atual",
            get() {
                return toNumberOrNull(this.getDataValue("quantidade_atual"));
            },
        },
        quantidade_estoque: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("quantidade_atual"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("quantidade_atual", val);
            },
        },
        estoque_minimo: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "estoque_minimo",
            get() {
                return toNumberOrNull(this.getDataValue("estoque_minimo"));
            },
        },
        abaixo_estoque_minimo: {
            type: DataTypes.VIRTUAL,
            get() {
                const atual = Number(this.getDataValue("quantidade_atual") || 0);
                const minimo = Number(this.getDataValue("estoque_minimo") || 0);
                return atual <= minimo;
            },
        },
    },
    {
        tableName: "item_catalogo",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

itemCatalogo.associate = (models) => {
    if (models.pedido_item) {
        itemCatalogo.hasMany(models.pedido_item, {
            foreignKey: "item_id",
            as: "pedido_itens",
        });
    }
};

module.exports = itemCatalogo;
