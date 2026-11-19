const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const pedido = sequelize.define(
    "pedido",
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
        codigo_proposta: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            field: "codigo_proposta",
        },
        cliente_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "cliente_id",
            get() {
                return toNumberOrNull(this.getDataValue("cliente_id"));
            },
        },
        usuario_criador_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "usuario_criador_id",
            get() {
                return toNumberOrNull(this.getDataValue("usuario_criador_id"));
            },
        },
        responsavel_producao_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "responsavel_producao_id",
            get() {
                return toNumberOrNull(this.getDataValue("responsavel_producao_id"));
            },
        },
        endereco_instalacao: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "endereco_instalacao",
        },
        tipo_pedido: {
            type: DataTypes.ENUM("Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"),
            allowNull: false,
            defaultValue: "Instalacao",
            field: "tipo_pedido",
        },
        status_aprovacao: {
            type: DataTypes.ENUM("Pendente", "Aprovado", "Reprovado"),
            allowNull: false,
            defaultValue: "Pendente",
            field: "status_aprovacao",
        },
        status: {
            type: DataTypes.ENUM(
                "Rascunho",
                "Pendente",
                "Aguardando",
                "Planejada",
                "Em Fabricacao",
                "Montagem",
                "Testes",
                "Pronto para Instalacao",
                "Concluido",
                "Cancelado"
            ),
            allowNull: false,
            defaultValue: "Rascunho",
            field: "status",
        },
        bloqueio_fabricacao: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "bloqueio_fabricacao",
        },
        motivo_bloqueio: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "motivo_bloqueio",
        },
        custo_total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "custo_total",
            get() {
                return toNumberOrNull(this.getDataValue("custo_total"));
            },
        },
        percentual_acrescimo: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "percentual_acrescimo",
            get() {
                return toNumberOrNull(this.getDataValue("percentual_acrescimo"));
            },
        },
        condicoes_pagamento: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "condicoes_pagamento",
        },
        numero_serie: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            field: "numero_serie",
        },
        fim_garantia: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "fim_garantia",
        },
        assinatura_cliente_instalacao: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_cliente_instalacao",
        },
        data_aprovacao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_aprovacao",
        },
        data_previsao_fim: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "data_previsao_fim",
        },
        data_conclusao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_conclusao",
        },
    },
    {
        tableName: "pedido",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

pedido.associate = (models) => {
    if (models.cliente) {
        pedido.belongsTo(models.cliente, {
            foreignKey: "cliente_id",
            as: "cliente",
        });
    }

    if (models.usuario) {
        pedido.belongsTo(models.usuario, {
            foreignKey: "usuario_criador_id",
            as: "usuario_criador",
        });
        pedido.belongsTo(models.usuario, {
            foreignKey: "usuario_criador_id",
            as: "usuario",
        });
        pedido.belongsTo(models.usuario, {
            foreignKey: "responsavel_producao_id",
            as: "responsavel_producao",
        });
    }

    if (models.pedido_item) {
        pedido.hasMany(models.pedido_item, {
            foreignKey: "pedido_id",
            as: "itens",
        });
    }

    if (models.checklist_medicao) {
        pedido.hasOne(models.checklist_medicao, {
            foreignKey: "pedido_id",
            as: "checklist_medicao",
        });
    }

    if (models.ordem_servico) {
        pedido.hasMany(models.ordem_servico, {
            foreignKey: "pedido_id",
            as: "ordens_servico",
        });
    }
};

module.exports = pedido;
