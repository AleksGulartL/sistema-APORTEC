const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const insumo_ordem_producao = sequelize.define(
    "insumo_ordem_producao",
    {
        id_insumo_op: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_insumo_op"
        },
        id_op: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_op"
        },
        id_item: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_item"
        },
        quantidade_planejada: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: "quantidade_planejada"
        },
        quantidade_baixada: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
            field: "quantidade_baixada"
        },
        status_baixa: {
            type: DataTypes.ENUM("Pendente", "Baixado"),
            allowNull: false,
            defaultValue: "Pendente",
            field: "status_baixa"
        }
    },
    {
        timestamps: false,
        tableName: "insumo_ordem_producao"
    }
);

insumo_ordem_producao.associate = (models) => {
    if (models.ordem_producao) {
        insumo_ordem_producao.belongsTo(models.ordem_producao, {
            foreignKey: "id_op",
            as: "ordem_producao"
        });
    }

    if (models.item_catalogo) {
        insumo_ordem_producao.belongsTo(models.item_catalogo, {
            foreignKey: "id_item",
            as: "item_catalogo"
        });
    }
};

module.exports = insumo_ordem_producao;
