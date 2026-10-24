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
        tipo: {
            type: DataTypes.ENUM("Insumo", "Porta", "Peca"),
            allowNull: false,
            field: "tipo"
        },
        codigo_referencia: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            field: "codigo_referencia"
        },
        descricao: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "descricao"
        },
        unidade_medida: {
            type: DataTypes.STRING(10),
            allowNull: false,
            field: "unidade_medida"
        },
        valor_unitario_padrao: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "valor_unitario_padrao"
        },
        quantidade_estoque: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
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
    if (models.item_orcamento) {
        itemCatalogo.hasMany(models.item_orcamento, {
            foreignKey: "id_item",
            as: "item_orcamento"
        });
    }

    if (models.composicao_porta) {
        itemCatalogo.hasMany(models.composicao_porta, {
            foreignKey: "id_item_componente",
            as: "composicao_porta"
        });
    }
};

module.exports = itemCatalogo;