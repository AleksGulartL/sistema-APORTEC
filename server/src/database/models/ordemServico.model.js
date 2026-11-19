const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const ordemServico = sequelize.define(
    "ordem_servico",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            field: "id",
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
        },
        pedido_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "pedido_id",
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
        },
        tecnico_responsavel_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "tecnico_responsavel_id",
            get() {
                return toNumberOrNull(this.getDataValue("tecnico_responsavel_id"));
            },
        },
        tipo_servico: {
            type: DataTypes.ENUM("Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"),
            allowNull: false,
            field: "tipo_servico",
        },
        origem_cobertura: {
            type: DataTypes.ENUM("Garantia", "Contrato", "Avulso"),
            allowNull: true,
            field: "origem_cobertura",
        },
        status_os: {
            type: DataTypes.ENUM("Aberta", "Em Andamento", "Finalizada", "Cancelada"),
            allowNull: false,
            defaultValue: "Aberta",
            field: "status_os",
        },
        descricao_problema: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "descricao_problema",
        },
        parecer_tecnico: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "parecer_tecnico",
        },
        assinatura_cliente_digital: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_cliente_digital",
        },
        data_agendamento: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_agendamento",
        },
        data_conclusao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_conclusao",
        },
    },
    {
        tableName: "ordem_servico",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

ordemServico.associate = (models) => {
    if (models.pedido) {
        ordemServico.belongsTo(models.pedido, {
            foreignKey: "pedido_id",
            as: "pedido",
        });
    }

    if (models.usuario) {
        ordemServico.belongsTo(models.usuario, {
            foreignKey: "tecnico_responsavel_id",
            as: "tecnico_responsavel",
        });
    }
};

module.exports = ordemServico;
