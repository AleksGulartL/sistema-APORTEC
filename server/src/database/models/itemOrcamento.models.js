const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const item_orcamento = sequelize.define(
    "item_orcamento",
    {
        id_item_orcamento: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_item_orcamento"
        },
        id_orcamento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_orcamento"
        },
        id_item_catalogo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_item_catalogo"
        },
        quantidade: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 1.00,
            field: "quantidade"
        },
        valor_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: "valor_total"
        }
    },
    {
        timestamps: false,
        tableName: "item_orcamento"
    }
);

item_orcamento.associate = (models) => {
    if (models.orcamento) {
        item_orcamento.belongsTo(models.orcamento, {
            foreignKey: "id_orcamento",
            as: "orcamento"
        });
    }

    
    if (models.item_catalogo) {
        item_orcamento.belongsTo(models.item_catalogo, {
            foreignKey: "id_item_catalogo",
            as: "item_catalogo"
        });
    }
    
};

module.exports = item_orcamento;
