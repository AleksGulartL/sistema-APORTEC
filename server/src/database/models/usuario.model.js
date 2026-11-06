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
        nome_completo: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "nome_completo"
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: "email"
        },
        senha_hash: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "senha_hash"
        },
        cargo_funcao: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "cargo_funcao"
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "ativo"
        }
    },
    {
        timestamps: false,
        tableName: "usuario"
    }
);

usuario.associate = (models) => {
    if (models.cliente) {
        usuario.hasMany(models.cliente, {
            foreignKey: "id_usuario",
            as: "cliente"
        });
    }

    if (models.orcamento) {
        usuario.hasMany(models.orcamento, {
            foreignKey: "id_usuario_criador",
            as: "orcamento"
        });
    }

    if (models.ordem_producao) {
        usuario.hasMany(models.ordem_producao, {
            foreignKey: "id_responsavel_tecnico",
            as: "ordem_producao"
        });
    }

    if (models.ordem_servico) {
        usuario.hasMany(models.ordem_servico, {
            foreignKey: "id_tecnico_responsavel",
            as: "ordem_servico"
        });
    }
};

module.exports = usuario;