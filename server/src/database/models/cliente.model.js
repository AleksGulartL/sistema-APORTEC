const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const cliente = sequelize.define(
    "cliente",
    {
        id_cliente: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_cliente"
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_usuario"
        },
        nome_completo: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "nome_completo"
        },
        cnpj_cpf: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            field: "cnpj_cpf"
        },
        telefone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: "telefone"
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "email"
        },
        endereco: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "endereco"
        }
    },
    {
        timestamps: false,
        tableName: "cliente"
    }
);

cliente.associate = (models) => {
    if (models.usuario) {
        cliente.belongsTo(models.usuario, {
            foreignKey: "id_usuario",
            as: "usuario"
        });
    }

    if (models.obra_servico) {
        cliente.hasMany(models.obra_servico, {
            foreignKey: "id_cliente",
            as: "obra_servico"
        });
    }

    if (models.orcamento) {
        cliente.hasMany(models.orcamento, {
            foreignKey: "id_cliente",
            as: "orcamento"
        });
    }
};

module.exports = cliente;