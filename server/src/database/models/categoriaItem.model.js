const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const categoriaItem = sequelize.define(
    "categoria_item",
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
        tableName: "categoria_item",
        timestamps: false,
        underscored: true,
    }
);

categoriaItem.associate = (models) => {
    if (models.item_catalogo) {
        categoriaItem.hasMany(models.item_catalogo, {
            foreignKey: "categoria_id",
            as: "itens",
        });
    }
};

module.exports = categoriaItem;
