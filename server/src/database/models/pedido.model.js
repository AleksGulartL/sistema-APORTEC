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
        id_cliente: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("cliente_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("cliente_id", val);
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
        endereco_instalacao: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "endereco_instalacao",
        },
        tipo_pedido: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "Instalacao",
            field: "tipo_pedido",
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
        numero_serie_porta: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            field: "numero_serie_porta",
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

    if (models.ordem_servico) {
        pedido.hasMany(models.ordem_servico, {
            foreignKey: "pedido_id",
            as: "ordens_servico",
        });
    }
};

module.exports = pedido;
