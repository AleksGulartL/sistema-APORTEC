const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const cliente = sequelize.define(
    "cliente",
    {
        usuario_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            field: "usuario_id",
            get() {
                return toNumberOrNull(this.getDataValue("usuario_id"));
            },
        },
        cnpj_cpf: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            field: "cnpj_cpf",
        },
        telefone: {
            type: DataTypes.STRING(25),
            allowNull: false,
            field: "telefone",
        },
        endereco: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "endereco",
        },
    },
    {
        tableName: "cliente",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

cliente.associate = (models) => {
    if (models.usuario) {
        cliente.belongsTo(models.usuario, {
            foreignKey: "usuario_id",
            as: "usuario",
        });
    }

    if (models.pedido) {
        cliente.hasMany(models.pedido, {
            foreignKey: "cliente_id",
            as: "pedidos",
        });
    }
};

module.exports = cliente;
