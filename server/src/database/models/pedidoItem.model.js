const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const toNumberOrNull = (val) => (val !== undefined && val !== null ? Number(val) : val);

const pedidoItem = sequelize.define(
    "pedido_item",
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
        id_item_orcamento: {
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
            field: "pedido_id",
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
        },
        id_orcamento: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("pedido_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("pedido_id", val);
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
        item_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            field: "item_id",
            get() {
                return toNumberOrNull(this.getDataValue("item_id"));
            },
        },
        id_item_catalogo: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("item_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("item_id", val);
            },
        },
        id_item: {
            type: DataTypes.VIRTUAL,
            get() {
                return toNumberOrNull(this.getDataValue("item_id"));
            },
            set(val) {
                if (val !== undefined) this.setDataValue("item_id", val);
            },
        },
        quantidade: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 1.0,
            field: "quantidade",
            get() {
                return toNumberOrNull(this.getDataValue("quantidade"));
            },
        },
        valor_unitario: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "valor_unitario",
            get() {
                return toNumberOrNull(this.getDataValue("valor_unitario"));
            },
        },
        valor_total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            field: "valor_total",
            get() {
                return toNumberOrNull(this.getDataValue("valor_total"));
            },
        },
    },
    {
        tableName: "pedido_item",
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);

pedidoItem.associate = (models) => {
    if (models.pedido) {
        pedidoItem.belongsTo(models.pedido, {
            foreignKey: "pedido_id",
            as: "pedido",
        });
        pedidoItem.belongsTo(models.pedido, {
            foreignKey: "pedido_id",
            as: "orcamento",
        });
    }

    if (models.item_catalogo) {
        pedidoItem.belongsTo(models.item_catalogo, {
            foreignKey: "item_id",
            as: "item_catalogo",
        });
    }
};

module.exports = pedidoItem;
