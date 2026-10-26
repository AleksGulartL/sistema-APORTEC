const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const pedido = sequelize.define(
    "pedido",
    {
        id_pedido: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_pedido"
        },
        id_orcamento: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_orcamento"
        },
        data_conversao: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "data_conversao"
        },
        status_fluxo: {
            type: DataTypes.ENUM("Aguardando", "Em Fabricacao", "Montagem", "Testes", "Pronto para Instalacao", "Concluido"),
            allowNull: false,
            field: "status_fluxo"
        },
        bloqueio_fabricacao: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            field: "bloqueio_fabricacao"
        },
        motivo_bloqueio: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "motivo_bloqueio"
        }
    },
    {
        timestamps: false,
        tableName: "pedido"
    }
);

pedido.associate = (models) => {
    if (models.orcamento) {
        pedido.belongsTo(models.orcamento, {
            foreignKey: "id_orcamento",
            as: "orcamento"
        });
    }

    if (models.checklist_medicao) {
        pedido.hasOne(models.checklist_medicao, {
            foreignKey: "id_pedido",
            as: "checklist_medicao"
        });
    }

    if (models.ordem_producao) {
        pedido.hasOne(models.ordem_producao, {
            foreignKey: "id_pedido",
            as: "ordem_producao"
        });
    }

};

module.exports = pedido;