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
        usuario_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            field: "usuario_id",
            get() {
                return toNumberOrNull(this.getDataValue("usuario_id"));
            },
        },
        id_usuario: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("usuario_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("usuario_id", val);
            },
        },
        nome_completo: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.usuario?.nome_completo || this.getDataValue("nome_completo") || null;
            },
            set(val) {
                this.setDataValue("nome_completo", val);
            },
        },
        nome: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.usuario?.nome_completo || this.getDataValue("nome_completo") || null;
            },
            set(val) {
                this.setDataValue("nome_completo", val);
            },
        },
        email: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.usuario?.email || this.getDataValue("email") || null;
            },
            set(val) {
                this.setDataValue("email", val);
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

    if (models.ordem_servico) {
        cliente.hasMany(models.ordem_servico, {
            foreignKey: "cliente_id",
            as: "ordens_servico",
        });
    }
};

module.exports = cliente;
