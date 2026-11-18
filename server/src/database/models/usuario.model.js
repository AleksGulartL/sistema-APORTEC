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
        id_usuario: {
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
        nome: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue("nome_completo");
            },
            set(val) {
                if (val !== undefined) this.setDataValue("nome_completo", val);
            },
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
        senha: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue("senha_hash");
            },
            set(val) {
                if (val !== undefined) this.setDataValue("senha_hash", val);
            },
        },
        perfil: {
            type: DataTypes.ENUM("ADM", "TECNICO", "CLIENTE"),
            allowNull: false,
            defaultValue: "TECNICO",
            field: "perfil",
        },
        tipo_perfil: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue("perfil");
            },
            set(val) {
                if (val !== undefined) this.setDataValue("perfil", val);
            },
        },
        cargo_funcao: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "cargo_funcao",
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "ativo",
        },
        data_criacao: {
            type: DataTypes.VIRTUAL, // virtual o que é: não é um campo do banco de dados, é um campo virtual que é criado pelo get 
            get() {
                return this.getDataValue("createdAt") || this.getDataValue("created_at");
            },
        },
    },
    {
        tableName: "usuario",
        timestamps: true,
        paranoid: true, // serve para fazer o delete no banco de dados, ou seja, quando deletar um usuario ele não será deletado do banco de dados, mas sim marcado como deletado
        underscored: true, // serve para que o sequelize converta os nomes das colunas do banco de dados para o formato snake_case
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
