const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const ordem_producao = sequelize.define(
    "ordem_producao",
    {
        id_op: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_op"
        },
        id_pedido: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_pedido"
        },
        id_responsavel_tecnico: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_responsavel_tecnico"
        },
        data_inicio: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_inicio"
        },
        data_previsao_fim: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_previsao_fim"
        },
        data_conclusao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_conclusao"
        },
        status_op: {
            type: DataTypes.ENUM("Pendente", "Em Andamento", "Concluído", "Cancelado"),
            allowNull: false,
            field: "status_op"
        }
    },
    {
        timestamps: false,
        tableName: "ordem_producao"
    }
);

ordem_producao.associate = (models) => {
    if (models.pedido) {
        ordem_producao.belongsTo(models.pedido, {
            foreignKey: "id_pedido",
            as: "pedido"
        });
    }

    if (models.usuario) {
        ordem_producao.belongsTo(models.usuario, {
            foreignKey: "id_responsavel_tecnico",
            as: "usuario"
        });
    }
    if (models.insumo_ordem_producao) {
        ordem_producao.hasMany(models.insumo_ordem_producao, {
            foreignKey: "id_op",
            as: "insumo_ordem_producao"
        });
    }
    if (models.movimentacao_estoque) {
        ordem_producao.hasMany(models.movimentacao_estoque, {
            foreignKey: "id_op",
            as: "movimentacao_estoque"
        });
    }

};


module.exports = ordem_producao;