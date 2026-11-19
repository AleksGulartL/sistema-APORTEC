require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./models");

const SALT_ROUNDS = 10;

const USUARIOS_INICIAIS = [
    {
        nome_completo: "Ana Administradora",
        email: "admin@gmail.com",
        senha_plana: "senha123",
        perfil: "ADM",
    },
    {
        nome_completo: "Tiago Técnico",
        email: "tecnico@gmail.com",
        senha_plana: "senha123",
        perfil: "TECNICO",
    },
];

async function executarSeed() {
    for (const u of USUARIOS_INICIAIS) {
        const existente = await db.usuario.findOne({ where: { email: u.email } });
        if (existente) {
            console.log(`Usuário já existe: ${u.email} (perfil: ${existente.perfil})`);
            continue;
        }

        const senha_hash = await bcrypt.hash(u.senha_plana, SALT_ROUNDS);
        await db.usuario.create({
            nome_completo: u.nome_completo,
            email: u.email,
            senha_hash,
            perfil: u.perfil,
            ativo: true,
        });
        console.log(`Usuário criado: ${u.email} (perfil: ${u.perfil})`);
    }
}

executarSeed()
    .then(async () => {
        await db.sequelize.close();
    })
    .catch(async (erro) => {
        console.error("Erro ao executar seed:", erro);
        await db.sequelize.close();
        process.exit(1);
    });
