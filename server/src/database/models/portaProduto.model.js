const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const portaProduto = sequelize.define(
    "porta_produto",
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
        id_porta: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        numero_serie: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: "numero_serie",
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
        pedido_origem_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "pedido_origem_id",
            get() {
                return toNumberOrNull(this.getDataValue("pedido_origem_id"));
            },
        },
        id_pedido_origem: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("pedido_origem_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("pedido_origem_id", val);
            },
        },
        modelo_automatizador: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "modelo_automatizador",
        },
        data_instalacao: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "data_instalacao",
        },
        fim_garantia_motor: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "fim_garantia_motor",
        },
        fim_garantia_geral: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "fim_garantia_geral",
        },
    },
    {
        tableName: "porta_produto",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

portaProduto.associate = (models) => {
    if (models.obra) {
        portaProduto.belongsTo(models.obra, {
            foreignKey: "obra_id",
            as: "obra",
        });
        portaProduto.belongsTo(models.obra, {
            foreignKey: "obra_id",
            as: "obra_servico",
        });
    }

    if (models.pedido) {
        portaProduto.belongsTo(models.pedido, {
            foreignKey: "pedido_origem_id",
            as: "pedido_origem",
        });
    }

    if (models.ordem_servico) {
        portaProduto.hasMany(models.ordem_servico, {
            foreignKey: "porta_id",
            as: "ordem_servico",
        });
        portaProduto.hasMany(models.ordem_servico, {
            foreignKey: "porta_id",
            as: "ordens_servico",
        });
    }

    if (models.movimentacao_estoque) {
        portaProduto.hasMany(models.movimentacao_estoque, {
            foreignKey: "porta_id",
            as: "movimentacoes_estoque",
        });
    }
};

module.exports = portaProduto;
