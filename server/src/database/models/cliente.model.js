const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const cliente = sequelize.define(
    "cliente",
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
        id_cliente: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        nome_completo: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "nome_completo",
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
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "email",
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
    if (models.obra) {
        cliente.hasMany(models.obra, {
            foreignKey: "cliente_id",
            as: "obras",
        });
    }
};

module.exports = cliente;
