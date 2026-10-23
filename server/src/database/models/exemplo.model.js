const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Emprestimo = sequelize.define(
    "Emprestimo",

    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "id"
        },
        leitorId: {
            type: DataTypes.INTEGER,
            onDelete: "RESTRICT",
            allowNull: false,
            field: "leitor_id"
        },
        livroId: {
            type: DataTypes.INTEGER,
            onDelete: "RESTRICT",
            allowNull: false,
            field: "livro_id"
        },
        dataEmprestimo: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "data_emprestimo"
        },
        dataPrevista: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "data_prevista"
        },
        dataDevolucao: {
            type: DataTypes.DATE,
            field: "data_devolucao"
        },
    },
    {
        timestamps: false,
        tableName: "emprestimos",
    }
    
)


Emprestimo.associate = (models) => {
    Emprestimo.belongsTo(models.leitores, {
        foreignKey: "leitor_id",
        as: "leitor",
    });

    Emprestimo.belongsTo(models.livros, {
        foreignKey: "livro_id",
        as: "livro",
    });
};

module.exports = Emprestimo;
