const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const usuario = sequelize.define(
    "usuario",

    {
        id_usuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_usuario"
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "nome"
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "email"
        },
        tipo_perfil: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "tipo_perfil"
        },
        senha: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "senha"
        },
        data_criacao: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "data_criacao"
        },
    },
    {
        timestamps: false,
        tableName: "usuario",
    }
    
)


usuario.associate = (models) => {
    usuario.hasMany(models.cliente, {
        foreignKey: "id_usuario",
        as: "cliente",
    });

    usuario.hasMany(models.ordem_producao, {
        foreignKey: "id_usuario",
        as: "ordem_producao",
    });
    usuario.hasMany(models.orcamento, {
        foreignKey: "id_usuario",
        as: "orcamento",
    });

    usuario.hasMany(models.servico_os, {
        foreignKey: "id_usuario",
        as: "servico_os",
    });

};

module.exports = usuario;
