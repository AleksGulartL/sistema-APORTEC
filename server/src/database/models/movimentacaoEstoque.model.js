const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const movimentacao_estoque = sequelize.define(
    "movimentacao_estoque",
    {
        id_movimentacao: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_movimentacao"
        },
        id_item: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_item"
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_usuario"
        },
        id_op: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_op"
        },
        id_ordem_servico: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_ordem_servico"
        },
        tipo_movimentacao: {
            type: DataTypes.ENUM("Entrada", "Baixa_Producao", "Baixa_OS", "Ajuste"),
            allowNull: false,
            field: "tipo_movimentacao"
        },
        quantidade: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: "quantidade"
        },
        data_hora: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_hora"
        },
        fornecedor: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "fornecedor"
        }
    },
    {
        timestamps: false,
        tableName: "movimentacao_estoque"
    }
);

movimentacao_estoque.associate = (models) => {
    if (models.item_catalogo) {
        movimentacao_estoque.belongsTo(models.item_catalogo, {
            foreignKey: "id_item",
            as: "item_catalogo"
        });
    }

    if (models.usuario) {
        movimentacao_estoque.belongsTo(models.usuario, {
            foreignKey: "id_usuario",
            as: "usuario"
        });
    }

    if (models.ordem_producao) {
        movimentacao_estoque.belongsTo(models.ordem_producao, {
            foreignKey: "id_op",
            as: "ordem_producao"
        });
    }

    if (models.ordem_servico) {
        movimentacao_estoque.belongsTo(models.ordem_servico, {
            foreignKey: "id_ordem_servico",
            as: "ordem_servico"
        });
    }
};

module.exports = movimentacao_estoque;
