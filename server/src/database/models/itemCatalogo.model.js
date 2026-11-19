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
        codigo_referencia: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            field: "codigo_referencia",
        },
        tipo_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "tipo_id",
            get() {
                return toNumberOrNull(this.getDataValue("tipo_id"));
            },
        },
        categoria_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "categoria_id",
            get() {
                return toNumberOrNull(this.getDataValue("categoria_id"));
            },
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
        estoque_minimo: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "estoque_minimo",
            get() {
                return toNumberOrNull(this.getDataValue("estoque_minimo"));
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
    if (models.tipo_item) {
        itemCatalogo.belongsTo(models.tipo_item, {
            foreignKey: "tipo_id",
            as: "tipo",
        });
    }

    if (models.categoria_item) {
        itemCatalogo.belongsTo(models.categoria_item, {
            foreignKey: "categoria_id",
            as: "categoria",
        });
    }

    if (models.pedido_item) {
        itemCatalogo.hasMany(models.pedido_item, {
            foreignKey: "item_id",
            as: "pedido_itens",
        });
    }
};

module.exports = itemCatalogo;
