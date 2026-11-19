const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const usuario = sequelize.define(
    "usuario",
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
        nome_completo: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "nome_completo",
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            field: "email",
        },
        senha_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "senha_hash",
        },
        perfil: {
            type: DataTypes.ENUM("ADM", "TECNICO", "CLIENTE"),
            allowNull: false,
            defaultValue: "TECNICO",
            field: "perfil",
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "ativo",
        },
    },
    {
        tableName: "usuario",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

usuario.associate = (models) => {
    if (models.cliente) {
        usuario.hasOne(models.cliente, {
            foreignKey: "usuario_id",
            as: "cliente",
        });
    }

    if (models.pedido) {
        usuario.hasMany(models.pedido, {
            foreignKey: "usuario_criador_id",
            as: "pedidos_criados",
        });
        usuario.hasMany(models.pedido, {
            foreignKey: "responsavel_producao_id",
            as: "ordens_producao",
        });
    }

    if (models.ordem_servico) {
        usuario.hasMany(models.ordem_servico, {
            foreignKey: "tecnico_responsavel_id",
            as: "ordens_servico",
        });
    }

    if (models.checklist_medicao) {
        usuario.hasMany(models.checklist_medicao, {
            foreignKey: "tecnico_id",
            as: "checklists_medicao",
        });
    }
};

module.exports = usuario;
