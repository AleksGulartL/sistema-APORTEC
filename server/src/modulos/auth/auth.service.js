const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authRepository = require("./auth.repository");

const SALT_ROUNDS = 10;
// Hash bcrypt fictício para garantir tempo de resposta constante e evitar enumeração de usuários
const HASH_FICTICIO = "$2b$10$wT0vB5pDcfZ2v4VzG0WlzeQk6F.Vb4v9mYgZzM/3vO4JbKgX6f5q6";

const PERFIS_VALIDOS = ["ADM", "COMERCIAL", "TECNICO"];

function normalizarPerfil(cargo) {
    if (!cargo) return "COMERCIAL";
    const upper = String(cargo).trim().toUpperCase();
    if (PERFIS_VALIDOS.includes(upper)) return upper;
    if (upper.includes("ADM") || upper.includes("ADMIN") || upper.includes("ADMINISTRADOR")) return "ADM";
    if (upper.includes("TECNICO")) return "TECNICO";
    return "COMERCIAL";
}

function getJwtSecret() {
    return process.env.JWT_SECRET || "aportec_jwt_secret_key_2026";
}

function getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || "1h";
}

async function hashearSenha(senha) {
    return bcrypt.hash(senha, SALT_ROUNDS);
}

async function verificarSenha(senha, hash) {
    try {
        return await bcrypt.compare(senha, hash);
    } catch {
        return senha === hash;
    }
}

async function autenticarUsuario(id, senha) {
    const loginUser = (id || "").trim();
    const loginPass = senha || "";

    if (!loginUser || !loginPass) {
        return { sucesso: false, mensagem: "E-mail e senha são obrigatórios." };
    }

    const usuarioEncontrado = await authRepository.buscarPorEmail(loginUser);

    // Comparação com tempo constante para mitigar enumeração de contas
    const hashParaComparar = usuarioEncontrado?.senha_hash || HASH_FICTICIO;
    const senhaValida = await verificarSenha(loginPass, hashParaComparar);

    if (!usuarioEncontrado || !senhaValida) {
        return { sucesso: false, mensagem: "Credenciais inválidas." };
    }

    if (usuarioEncontrado.ativo === false) {
        return { sucesso: false, mensagem: "Usuário inativo. Contate o administrador." };
    }

    const idUsuario = usuarioEncontrado.id_usuario;
    const usuarioPayload = { // payload vai ser utilizado para gerar o token
        id_usuario: idUsuario,
        nome_completo: usuarioEncontrado.nome_completo,
        email: usuarioEncontrado.email,
        cargo_funcao: usuarioEncontrado.cargo_funcao || usuarioEncontrado.perfil,
        ativo: usuarioEncontrado.ativo,
    };
    if (usuarioEncontrado.perfil) {
        usuarioPayload.perfil = usuarioEncontrado.perfil;
    }

    return {
        sucesso: true,
        usuario: usuarioPayload,
    };
}

async function criarNovoUsuario(dados) {
    const nome = (dados.nome_completo || dados.nome || "").trim();
    const email = (dados.email || dados.username || "").trim();
    const senha = dados.senha || dados.password || dados.senha_hash || "";
    const cargo_funcao = dados.cargo_funcao || dados.perfil || dados.role || "usuario";
    const perfil = normalizarPerfil(dados.perfil || cargo_funcao);

    if (!nome) {
        const erro = new Error("O campo 'nome_completo' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    if (!email) {
        const erro = new Error("O campo 'email' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    if (!senha) {
        const erro = new Error("O campo 'senha' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    const usuarioExistente = await authRepository.buscarPorEmail(email);
    if (usuarioExistente) {
        const erro = new Error("Já existe um usuário cadastrado com este e-mail.");
        erro.status = 409;
        erro.code = "23505";
        throw erro;
    }

    const senha_hash = await hashearSenha(senha);

    const novoUsuario = await authRepository.criar({
        nome_completo: nome,
        email,
        senha_hash,
        perfil,
        cargo_funcao,
        ativo: true,
    });

    const idCriado = novoUsuario.id_usuario;
    const resposta = {
        id_usuario: idCriado,
        nome_completo: novoUsuario.nome_completo,
        email: novoUsuario.email,
        cargo_funcao: novoUsuario.cargo_funcao,
    };
    if (dados.perfil) {
        resposta.perfil = novoUsuario.perfil;
    }
    return resposta;
}

function gerarToken(usuario) {
    const id = usuario.id_usuario || usuario.id;
    const cargo = usuario.cargo_funcao || usuario.perfil || usuario.role;
    const payload = {
        id,
        id_usuario: id,
        email: usuario.email,
        nome_completo: usuario.nome_completo,
        perfil: usuario.perfil || normalizarPerfil(cargo),
        cargo_funcao: cargo,
        role: cargo,
    };

    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: getJwtExpiresIn(),
    });
}

function verificarToken(token) {
    return jwt.verify(token, getJwtSecret());
}

module.exports = {
    hashearSenha,
    verificarSenha,
    autenticarUsuario,
    criarNovoUsuario,
    gerarToken,
    verificarToken,
    normalizarPerfil,
};
