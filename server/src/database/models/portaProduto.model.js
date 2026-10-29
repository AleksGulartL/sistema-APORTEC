const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const porta_produto = sequelize.define(
    "porta_produto",
    {
        id_porta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_porta"
        },
        numero_serie: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: "numero_serie"
        },
        id_obra: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_obra"
        },
        id_pedido_origem: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_pedido_origem"
        },
        modelo_automatizador: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "modelo_automatizador"
        },
        data_instalacao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_instalacao"
        },
        fim_garantia_motor: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "fim_garantia_motor"
        },
        fim_garantia_geral: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "fim_garantia_geral"
        }
    },
    {
        timestamps: false,
        tableName: "porta_produto"
    }
);

porta_produto.associate = (models) => {
    if (models.obra_servico) {
        porta_produto.belongsTo(models.obra_servico, {
            foreignKey: "id_obra",
            as: "obra_servico"
        });
    }

    if (models.pedido) {
        porta_produto.belongsTo(models.pedido, {
            foreignKey: "id_pedido_origem",
            as: "pedido_origem"
        });
    }

    if (models.ordem_servico) {
        porta_produto.hasMany(models.ordem_servico, {
            foreignKey: "id_porta",
            as: "ordem_servico"
        });
    }
};

module.exports = porta_produto;
