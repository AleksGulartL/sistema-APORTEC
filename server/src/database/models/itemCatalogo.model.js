const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const itemCatalogo = sequelize.define(
    "item_catalogo",
    {
        id_item: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_item"
        },
        codigo_referencia: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            field: "codigo_referencia"
        },
        tipo: {
            type: DataTypes.ENUM("Insumo", "Porta", "Peca"),
            allowNull: false,
            field: "tipo"
        },
        descricao: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "descricao"
        },
        unidade_medida: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "unidade_medida"
        },
        valor_unitario_padrao: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: "valor_unitario_padrao"
        },
        quantidade_estoque: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "quantidade_estoque"
        }
    },
    {
        timestamps: false,
        tableName: "item_catalogo"
    }
);

itemCatalogo.associate = (models) => {
    itemCatalogo.hasMany(models.item_orcamento, {
        foreignKey: "id_item",
        as: "item_orcamento"
    });

    itemCatalogo.hasMany(models.insumo_ordem_producao, {
        foreignKey: "id_item",
        as: "insumo_ordem_producao"
    });

    itemCatalogo.hasMany(models.movimentacao_estoque, {
        foreignKey: "id_item",
        as: "movimentacao_estoque"
    });
};

module.exports = itemCatalogo;