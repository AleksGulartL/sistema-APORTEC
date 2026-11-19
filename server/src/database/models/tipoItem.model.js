const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const tipoItem = sequelize.define(
    "tipo_item",
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
        nome: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: "nome",
        },
    },
    {
        tableName: "tipo_item",
        timestamps: false,
        underscored: true,
    }
);

tipoItem.associate = (models) => {
    if (models.item_catalogo) {
        tipoItem.hasMany(models.item_catalogo, {
            foreignKey: "tipo_id",
            as: "itens",
        });
    }
};

module.exports = tipoItem;
