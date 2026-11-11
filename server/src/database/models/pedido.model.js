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
        id_pedido: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        id_orcamento: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined && !this.getDataValue("id")) this.setDataValue("id", val);
            },
        },
        id_op: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined && !this.getDataValue("id")) this.setDataValue("id", val);
            },
        },
        codigo_proposta: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            field: "codigo_proposta",
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
        usuario_criador_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "usuario_criador_id",
            get() {
                return toNumberOrNull(this.getDataValue("usuario_criador_id"));
            },
        },
        id_usuario_criador: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("usuario_criador_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("usuario_criador_id", val);
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
        id_responsavel_tecnico: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("responsavel_producao_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("responsavel_producao_id", val);
            },
        },
        tipo_pedido: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "Instalacao",
            field: "tipo_pedido",
        },
        tipo_orcamento: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue("tipo_pedido");
            },
            set(val) {
                if (val !== undefined) this.setDataValue("tipo_pedido", val);
            },
        },
        status_aprovacao: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "Pendente",
            field: "status_aprovacao",
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "Aguardando",
            field: "status",
        },
        status_fluxo: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue("status");
            },
            set(val) {
                if (val !== undefined) this.setDataValue("status", val);
            },
        },
        status_op: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "Planejada",
            field: "status_op",
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
            defaultValue: "Aguardando aprovação comercial e checklist técnico de medição.",
            field: "motivo_bloqueio",
        },
        total_mercadorias: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "total_mercadorias",
            get() {
                return toNumberOrNull(this.getDataValue("total_mercadorias"));
            },
        },
        total_servicos: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "total_servicos",
            get() {
                return toNumberOrNull(this.getDataValue("total_servicos"));
            },
        },
        desconto_percentual: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "desconto_percentual",
            get() {
                return toNumberOrNull(this.getDataValue("desconto_percentual"));
            },
        },
        valor_total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "valor_total",
            get() {
                return toNumberOrNull(this.getDataValue("valor_total"));
            },
        },
        condicoes_pagamento: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "condicoes_pagamento",
        },
        data_aprovacao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_aprovacao",
        },
        data_fechamento: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_fechamento",
        },
        data_conversao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_conversao",
        },
        data_inicio_producao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_inicio_producao",
        },
        data_inicio: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue("data_inicio_producao");
            },
            set(val) {
                if (val !== undefined) this.setDataValue("data_inicio_producao", val);
            },
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
        assinatura_cliente_instalacao: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "assinatura_cliente_instalacao",
        },
        data_aceite_instalacao: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "data_aceite_instalacao",
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
    if (models.obra) {
        pedido.belongsTo(models.obra, {
            foreignKey: "obra_id",
            as: "obra",
        });
        pedido.belongsTo(models.obra, {
            foreignKey: "obra_id",
            as: "obra_servico",
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
        pedido.hasMany(models.pedido_item, {
            foreignKey: "pedido_id",
            as: "item_orcamento",
        });
    }

    if (models.checklist_medicao) {
        pedido.hasOne(models.checklist_medicao, {
            foreignKey: "pedido_id",
            as: "checklist_medicao",
        });
    }

    if (models.porta_produto) {
        pedido.hasMany(models.porta_produto, {
            foreignKey: "pedido_origem_id",
            as: "portas",
        });
    }

    if (models.ordem_servico) {
        pedido.hasMany(models.ordem_servico, {
            foreignKey: "pedido_id",
            as: "ordens_servico",
        });
    }

    if (models.movimentacao_estoque) {
        pedido.hasMany(models.movimentacao_estoque, {
            foreignKey: "pedido_id",
            as: "movimentacao_estoque",
        });
        pedido.hasMany(models.movimentacao_estoque, {
            foreignKey: "pedido_id",
            as: "insumo_ordem_producao",
        });
    }
};

module.exports = pedido;
