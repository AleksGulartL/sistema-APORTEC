const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const orcamento = sequelize.define(
    "orcamento",
    {
        id_orcamento: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_orcamento"
        },
        id_cliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_cliente"
        },
        id_obra: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_obra"
        },
        id_usuario_criador: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_usuario_criador"
        },
        tipo_orcamento: {
            type: DataTypes.ENUM("Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"),
            allowNull: false,
            field: "tipo_orcamento"
        },
        total_mercadorias: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
            field: "total_mercadorias"
        },
        total_servicos: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
            field: "total_servicos"
        },
        valor_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: "valor_total"
        },
        status_aprovacao: {
            type: DataTypes.ENUM("Pendente", "Aprovado", "Reprovado"),
            allowNull: true,
            defaultValue: "Pendente",
            field: "status_aprovacao"
        },
        data_criacao: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: "data_criacao"
        },
        data_atualizacao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_atualizacao"
        },
        data_aprovacao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_aprovacao"
        },
        data_fechamento: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_fechamento"
        }
    },
    {
        timestamps: false,
        tableName: "orcamento"
    }
);

orcamento.associate = (models) => {
    if (models.cliente) {
        orcamento.belongsTo(models.cliente, {
            foreignKey: "id_cliente",
            as: "cliente"
        });
    }

    
    if (models.obra_servico) {
        orcamento.belongsTo(models.obra_servico, {
            foreignKey: "id_obra",
            as: "obra_servico"
        });
    }

    if (models.usuario) {
        orcamento.belongsTo(models.usuario, {
            foreignKey: "id_usuario_criador",
            as: "usuario"
        });
    }

    if (models.item_orcamento) {
        orcamento.hasMany(models.item_orcamento, {
            foreignKey: "id_orcamento",
            as: "item_orcamento"
        });
    }

    if (models.pedido) {
        orcamento.hasOne(models.pedido, {
            foreignKey: "id_orcamento",
            as: "pedido"
        });
    }


    
};

module.exports = orcamento;
