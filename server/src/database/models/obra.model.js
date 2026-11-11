const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const obra = sequelize.define(
    "obra",
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
        id_obra: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
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
        endereco_instalacao: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "endereco_instalacao",
        },
        responsavel_local: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "responsavel_local",
        },
        contato_local: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "contato_local",
        },
    },
    {
        tableName: "obra",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

obra.associate = (models) => {
    if (models.cliente) {
        obra.belongsTo(models.cliente, {
            foreignKey: "cliente_id",
            as: "cliente",
        });
    }

    if (models.pedido) {
        obra.hasMany(models.pedido, {
            foreignKey: "obra_id",
            as: "pedidos",
        });
    }

    if (models.porta_produto) {
        obra.hasMany(models.porta_produto, {
            foreignKey: "obra_id",
            as: "portas",
        });
    }

    if (models.ordem_servico) {
        obra.hasMany(models.ordem_servico, {
            foreignKey: "obra_id",
            as: "ordens_servico",
        });
    }
};

module.exports = obra;
