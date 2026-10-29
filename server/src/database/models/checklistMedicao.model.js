const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const checklistMedicao = sequelize.define(
    "checklist_medicao",
    {
        id_medicao: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id_medicao"
        },
        id_pedido: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "id_pedido"
        },
        medidas_vao: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "medidas_vao"
        },
        tipo_vidro: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "tipo_vidro"
        },
        modelo_automatizador: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "modelo_automatizador"
        },
        status_aprovacao: {
            type: DataTypes.ENUM("Pendente", "Aprovado", "Reprovado"),
            allowNull: false,
            field: "status_aprovacao"
        },
        anexo_croqui_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "anexo_croqui_url"
        },
        anexo_fotos_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "anexo_fotos_url"
        }
    },
    {
        timestamps: false,
        tableName: "checklist_medicao"
    }
);

checklistMedicao.associate = (models) => {
    if (models.pedido) {
        checklistMedicao.belongsTo(models.pedido, {
            foreignKey: "id_pedido",
            as: "pedido"
        });
    }
};

module.exports = checklistMedicao;