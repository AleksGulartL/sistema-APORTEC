const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authRepository = require("./auth.repository");
const { validarGmail } = require("../../utils/validacaoEmail");

const SALT_ROUNDS = 10;
// Hash bcrypt fictício para garantir tempo de resposta constante e evitar enumeração de usuários
const HASH_FICTICIO = "$2b$10$wT0vB5pDcfZ2v4VzG0WlzeQk6F.Vb4v9mYgZzM/3vO4JbKgX6f5q6";

const PERFIS_VALIDOS = ["ADM", "TECNICO", "CLIENTE"];

function limparAcentosUpper(texto) {
    return String(texto)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarPerfil(cargo, estrito = false) {
    if (!cargo) {
        if (estrito) {
            const erro = new Error("O campo 'perfil' deve ser 'ADM', 'TECNICO' ou 'CLIENTE'.");
            erro.status = 400;
            throw erro;
        }
        return "TECNICO";
    }
    const upper = limparAcentosUpper(cargo);
    if (PERFIS_VALIDOS.includes(upper)) return upper;
    if (upper.includes("ADM") || upper.includes("ADMIN") || upper.includes("ADMINISTRADOR") || upper.includes("GERENTE")) {
        return "ADM";
    }
    if (upper.includes("TECNIC")) return "TECNICO";
    if (upper.includes("CLIENT")) return "CLIENTE";

    if (estrito) {
        const erro = new Error("O campo 'perfil' deve ser 'ADM', 'TECNICO' ou 'CLIENTE'.");
        erro.status = 400;
        throw erro;
    }
    return "TECNICO";
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

    const idUsuario = usuarioEncontrado.id_usuario || usuarioEncontrado.id;
    const usuarioPayload = {
        id_usuario: idUsuario,
        nome_completo: usuarioEncontrado.nome_completo,
        email: usuarioEncontrado.email,
        perfil: usuarioEncontrado.perfil,
        ativo: usuarioEncontrado.ativo,
    };

    return {
        sucesso: true,
        usuario: usuarioPayload,
    };
}

function solicitanteAdm(solicitante) {
    if (!solicitante) return false;
    // Apenas verifica o campo `perfil`
    const papel = String(solicitante.perfil || "").trim().toUpperCase();
    return papel === "ADM" || papel === "ADMIN" || papel === "ADMINISTRADOR";
}

async function criarNovoUsuario(dados, solicitante = null) {
    if (!solicitante) {
        const erro = new Error("Cadastro público não permitido. É necessário estar autenticado como administrador.");
        erro.status = 401;
        throw erro;
    }

    if (!solicitanteAdm(solicitante)) {
        const erro = new Error("Apenas administradores têm permissão para cadastrar novos usuários.");
        erro.status = 403;
        throw erro;
    }

    const nome = (dados.nome_completo || dados.nome || "").trim();
    const emailBruto = dados.email || dados.username || "";
    const senha = dados.senha || dados.password || dados.senha_hash || "";
    const perfil = normalizarPerfil(dados.perfil || dados.role, true);

    if (!nome) {
        const erro = new Error("O campo 'nome_completo' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    const email = validarGmail(emailBruto, "O campo 'email' é obrigatório.");

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
        ativo: true,
    });

    const idCriado = novoUsuario.id_usuario || novoUsuario.id;
    return {
        id_usuario: idCriado,
        nome_completo: novoUsuario.nome_completo,
        email: novoUsuario.email,
        perfil: novoUsuario.perfil,
    };
}

function gerarToken(usuario) {
    const id = usuario.id_usuario || usuario.id;
    const payload = {
        id,
        id_usuario: id,
        email: usuario.email,
        nome_completo: usuario.nome_completo,
        perfil: usuario.perfil || "CLIENTE",
    };

    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: getJwtExpiresIn(),
    });
}

function verificarToken(token) {
    return jwt.verify(token, getJwtSecret());
}

async function alterarSenhaUsuario(usuarioId, dados = {}) {
    const senhaAtual = dados.senha_atual || "";
    const novaSenha = dados.nova_senha || "";

    if (!senhaAtual || !novaSenha || String(novaSenha).trim().length < 4) {
        const erro = new Error("Informe a senha atual e uma nova senha com pelo menos 4 caracteres.");
        erro.status = 400;
        throw erro;
    }

    const reg = await authRepository.buscarPorId(usuarioId);
    if (!reg) {
        const erro = new Error("Usuário não encontrado.");
        erro.status = 404;
        throw erro;
    }

    const valida = await verificarSenha(senhaAtual, reg.senha_hash);
    if (!valida) {
        const erro = new Error("Senha atual incorreta.");
        erro.status = 400;
        throw erro;
    }

    const novoHash = await hashearSenha(String(novaSenha).trim());
    await authRepository.atualizarSenha(reg.id, novoHash);
    return { mensagem: "Senha atualizada com sucesso." };
}

module.exports = {
    hashearSenha,
    verificarSenha,
    autenticarUsuario,
    criarNovoUsuario,
    gerarToken,
    verificarToken,
    normalizarPerfil,
    alterarSenhaUsuario,
};
