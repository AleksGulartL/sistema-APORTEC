const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const ordem_servico = sequelize.define(
    "ordem_servico",
    {
        id_os: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_os"
        },
        id_obra: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_obra"
        },
        id_porta: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_porta"
        },
        id_tecnico_responsavel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id_tecnico_responsavel"
        },
        tipo_servico: {
            type: DataTypes.ENUM("Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"),
            allowNull: false,
            field: "tipo_servico"
        },
        origem_cobertura: {
            type: DataTypes.ENUM("Garantia", "Contrato", "Avulso"),
            allowNull: true,
            field: "origem_cobertura"
        },
        descricao_problema: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "descricao_problema"
        },
        analise_especificacao_servico: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "analise_especificacao_servico"
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "observacoes"
        },
        status_os: {
            type: DataTypes.ENUM("Aberta", "Em Andamento", "Finalizada", "Cancelada"),
            allowNull: false,
            defaultValue: "Aberta",
            field: "status_os"
        },
        data_agendamento: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_agendamento"
        },
        data_hora_execucao_inicio: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_hora_execucao_inicio"
        },
        data_hora_execucao_fim: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_hora_execucao_fim"
        },
        assinatura_cliente_digital: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_cliente_digital"
        },
        assinatura_tecnico_digital: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_tecnico_digital"
        }
    },
    {
        timestamps: false,
        tableName: "ordem_servico"
    }
);

ordem_servico.associate = (models) => {
    if (models.obra_servico) {
        ordem_servico.belongsTo(models.obra_servico, {
            foreignKey: "id_obra",
            as: "obra_servico"
        });
    }

    if (models.porta_produto) {
        ordem_servico.belongsTo(models.porta_produto, {
            foreignKey: "id_porta",
            as: "porta_produto"
        });
    }

    if (models.usuario) {
        ordem_servico.belongsTo(models.usuario, {
            foreignKey: "id_tecnico_responsavel",
            as: "tecnico_responsavel"
        });
    }

    if (models.peca_utilizada) {
        ordem_servico.hasMany(models.peca_utilizada, {
            foreignKey: "id_os",
            as: "peca_utilizada"
        });
    }

    if (models.movimentacao_estoque) {
        ordem_servico.hasMany(models.movimentacao_estoque, {
            foreignKey: "id_ordem_servico",
            as: "movimentacao_estoque"
        });
    }
};

module.exports = ordem_servico;
