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
        tecnico_responsavel_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
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
        status_os: {
            type: DataTypes.STRING(30),
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
    if (models.cliente) {
        ordemServico.belongsTo(models.cliente, {
            foreignKey: "cliente_id",
            as: "cliente",
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
};

module.exports = ordemServico;
