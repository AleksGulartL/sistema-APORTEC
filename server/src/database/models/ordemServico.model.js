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
        id_os: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        obra_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "obra_id",
            get() {
                return toNumberOrNull(this.getDataValue("obra_id"));
            },
        },
        id_obra: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("obra_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("obra_id", val);
            },
        },
        porta_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "porta_id",
            get() {
                return toNumberOrNull(this.getDataValue("porta_id"));
            },
        },
        id_porta: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("porta_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("porta_id", val);
            },
        },
        pedido_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "pedido_id",
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
        },
        id_pedido: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("pedido_id", val);
            },
        },
        tecnico_responsavel_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "tecnico_responsavel_id",
            get() {
                return toNumberOrNull(this.getDataValue("tecnico_responsavel_id"));
            },
        },
        id_tecnico_responsavel: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("tecnico_responsavel_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("tecnico_responsavel_id", val);
            },
        },
        tipo_servico: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "tipo_servico",
        },
        origem_cobertura: {
            type: DataTypes.STRING(30),
            allowNull: true,
            field: "origem_cobertura",
        },
        descricao_problema: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "descricao_problema",
        },
        analise_especificacao_servico: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "analise_especificacao_servico",
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "observacoes",
        },
        status_os: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "Aberta",
            field: "status_os",
        },
        data_agendamento: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_agendamento",
        },
        data_hora_execucao_inicio: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_hora_execucao_inicio",
        },
        data_hora_execucao_fim: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_hora_execucao_fim",
        },
        assinatura_cliente_digital: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_cliente_digital",
        },
        assinatura_tecnico_digital: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_tecnico_digital",
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
    if (models.obra) {
        ordemServico.belongsTo(models.obra, {
            foreignKey: "obra_id",
            as: "obra",
        });
        ordemServico.belongsTo(models.obra, {
            foreignKey: "obra_id",
            as: "obra_servico",
        });
    }

    if (models.porta_produto) {
        ordemServico.belongsTo(models.porta_produto, {
            foreignKey: "porta_id",
            as: "porta_produto",
        });
    }

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

    if (models.movimentacao_estoque) {
        ordemServico.hasMany(models.movimentacao_estoque, {
            foreignKey: "ordem_servico_id",
            as: "movimentacao_estoque",
        });
        ordemServico.hasMany(models.movimentacao_estoque, {
            foreignKey: "ordem_servico_id",
            as: "peca_utilizada",
        });
    }
};

module.exports = ordemServico;
