const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authRepository = require("./auth.repository");

const SALT_ROUNDS = 10;
// Hash bcrypt fictício para garantir tempo de resposta constante e evitar enumeração de usuários
const HASH_FICTICIO = "$2b$10$wT0vB5pDcfZ2v4VzG0WlzeQk6F.Vb4v9mYgZzM/3vO4JbKgX6f5q6";

function getJwtSecret() {
    return process.env.JWT_SECRET || "aportec_jwt_secret_key_2026";
}

// getJwtSecret e getJwtExpiresIn são funções que retornam o segredo e o tempo de expiração do token
// são usadas para evitar que o segredo e o tempo de expiração sejam hardcoded no código
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

    return {
        sucesso: true,
        usuario: {
            id_usuario: usuarioEncontrado.id_usuario,
            nome_completo: usuarioEncontrado.nome_completo,
            email: usuarioEncontrado.email,
            cargo_funcao: usuarioEncontrado.cargo_funcao,
            ativo: usuarioEncontrado.ativo,
        },
    };
}

async function criarNovoUsuario(dados) {
    const nome = (dados.nome_completo || dados.nome || "").trim();
    const email = (dados.email || dados.username || "").trim();
    const senha = dados.senha || dados.password || dados.senha_hash || "";
    const cargo_funcao = dados.cargo_funcao || dados.role || "usuario";

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
        cargo_funcao,
        ativo: true,
    });

    return {
        id_usuario: novoUsuario.id_usuario,
        nome_completo: novoUsuario.nome_completo,
        email: novoUsuario.email,
        cargo_funcao: novoUsuario.cargo_funcao,
    };
}

function gerarToken(usuario) {
    const payload = {
        id: usuario.id_usuario || usuario.id,
        id_usuario: usuario.id_usuario || usuario.id,
        email: usuario.email,
        nome_completo: usuario.nome_completo,
        cargo_funcao: usuario.cargo_funcao || usuario.role,
        role: usuario.cargo_funcao || usuario.role,
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
};
