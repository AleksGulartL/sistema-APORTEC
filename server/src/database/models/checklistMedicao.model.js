const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const checklistMedicao = sequelize.define(
    "checklist_medicao",
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
        id_medicao: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("id", val);
            },
        },
        pedido_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            field: "pedido_id",
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
        },
        id_pedido: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("pedido_id", val);
            },
        },
        tecnico_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "tecnico_id",
            get() {
                return toNumberOrNull(this.getDataValue("tecnico_id"));
            },
        },
        medidas_vao: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "medidas_vao",
        },
        sentido_abertura: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "sentido_abertura",
        },
        quantidade_folhas: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            field: "quantidade_folhas",
        },
        tipo_vidro: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "tipo_vidro",
        },
        modelo_automatizador: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "modelo_automatizador",
        },
        viga_ok: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "viga_ok",
        },
        piso_ok: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "piso_ok",
        },
        ponto_eletrico_ok: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "ponto_eletrico_ok",
        },
        status_aprovacao: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "Pendente",
            field: "status_aprovacao",
        },
    },
    {
        tableName: "checklist_medicao",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

checklistMedicao.associate = (models) => {
    if (models.pedido) {
        checklistMedicao.belongsTo(models.pedido, {
            foreignKey: "pedido_id",
            as: "pedido",
        });
    }

    if (models.usuario) {
        checklistMedicao.belongsTo(models.usuario, {
            foreignKey: "tecnico_id",
            as: "tecnico",
        });
    }
};

module.exports = checklistMedicao;
