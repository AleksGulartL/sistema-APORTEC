const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const peca_utilizada = sequelize.define(
    "peca_utilizada",
    {
        id_peca_os: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_peca_os"
        },
        id_os: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_os"
        },
        id_item: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_item"
        },
        quantidade_utilizada: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 1.00,
            field: "quantidade_utilizada"
        }
    },
    {
        timestamps: false,
        tableName: "peca_utilizada"
    }
);

peca_utilizada.associate = (models) => {
    if (models.ordem_servico) {
        peca_utilizada.belongsTo(models.ordem_servico, {
            foreignKey: "id_os",
            as: "ordem_servico"
        });
    }

    if (models.item_catalogo) {
        peca_utilizada.belongsTo(models.item_catalogo, {
            foreignKey: "id_item",
            as: "item_catalogo"
        });
    }
};

module.exports = peca_utilizada;
