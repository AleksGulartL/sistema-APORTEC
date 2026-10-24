const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const obraServico = sequelize.define(
    "obra_servico",
    {
        id_obra: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_obra"
        },
        id_cliente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_cliente"
        },
        endereco_instalacao: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "endereco_instalacao"
        },
        responsavel_local: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "responsavel_local"
        },
        contato_local: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "contato_local"
        }
    },
    {
        timestamps: false,
        tableName: "obra_servico"
    }
);

obraServico.associate = (models) => {
    if (models.cliente) {
        obraServico.belongsTo(models.cliente, {
            foreignKey: "id_cliente",
            as: "cliente"
        });
    }

    if (models.orcamento) {
        obraServico.hasMany(models.orcamento, {
            foreignKey: "id_obra",
            as: "orcamento"
        });
    }

    if (models.porta_produto) {
        obraServico.hasMany(models.porta_produto, {
            foreignKey: "id_obra",
            as: "porta_produto"
        });
    }

    if (models.ordem_servico) {
        obraServico.hasMany(models.ordem_servico, {
            foreignKey: "id_obra",
            as: "ordem_servico"
        });
    }
};

module.exports = obraServico;