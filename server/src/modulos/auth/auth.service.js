const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authRepository = require("./auth.repository");
const { validarGmail } = require("../../utils/validacaoEmail");
const { criarErro } = require("../../utils/criarErro");

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

function normalizarPerfil(perfil, estrito = false) {
    if (!perfil) {
        if (estrito) {
            throw criarErro("O campo 'perfil' deve ser 'ADM', 'TECNICO' ou 'CLIENTE'.");
        }
        return "TECNICO";
    }
    const upper = limparAcentosUpper(perfil);
    if (PERFIS_VALIDOS.includes(upper)) return upper;
    if (upper === "ADMIN" || upper === "ADMINISTRADOR") return "ADM";

    if (estrito) {
        throw criarErro("O campo 'perfil' deve ser 'ADM', 'TECNICO' ou 'CLIENTE'.");
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
        return false;
    }
}

async function autenticarUsuario(emailInput, senhaInput) {
    const loginEmail = (emailInput || "").trim();
    const loginSenha = senhaInput || "";

    if (!loginEmail || !loginSenha) {
        return { sucesso: false, mensagem: "E-mail e senha são obrigatórios." };
    }

    const usuarioEncontrado = await authRepository.buscarPorEmail(loginEmail);

    const hashParaComparar = usuarioEncontrado?.senha_hash || HASH_FICTICIO;
    const senhaValida = await verificarSenha(loginSenha, hashParaComparar);

    if (!usuarioEncontrado || !senhaValida) {
        return { sucesso: false, mensagem: "Credenciais inválidas." };
    }

    if (usuarioEncontrado.ativo === false) {
        return { sucesso: false, mensagem: "Usuário inativo. Contate o administrador." };
    }

    return {
        sucesso: true,
        usuario: {
            id: usuarioEncontrado.id,
            nome_completo: usuarioEncontrado.nome_completo,
            email: usuarioEncontrado.email,
            perfil: usuarioEncontrado.perfil,
            ativo: usuarioEncontrado.ativo,
        },
    };
}

function solicitanteAdm(solicitante) {
    if (!solicitante) return false;
    const papel = String(solicitante.perfil || "").trim().toUpperCase();
    return papel === "ADM" || papel === "ADMIN" || papel === "ADMINISTRADOR";
}

async function criarNovoUsuario(dados, solicitante = null) {
    if (!solicitante) {
        throw criarErro("Cadastro público não permitido. É necessário estar autenticado como administrador.", 401);
    }

    if (!solicitanteAdm(solicitante)) {
        throw criarErro("Apenas administradores têm permissão para cadastrar novos usuários.", 403);
    }

    const nome = (dados.nome_completo || "").trim();
    const senha = dados.senha || "";
    const perfil = dados.perfil ? normalizarPerfil(dados.perfil, true) : "TECNICO";

    if (!nome) {
        throw criarErro("O campo 'nome_completo' é obrigatório.");
    }

    const email = validarGmail(dados.email, "O campo 'email' é obrigatório.");

    if (!senha) {
        throw criarErro("O campo 'senha' é obrigatório.");
    }

    const usuarioExistente = await authRepository.buscarPorEmail(email);
    if (usuarioExistente) {
        throw criarErro("Já existe um usuário cadastrado com este e-mail.", 409, { code: "23505" });
    }

    const senha_hash = await hashearSenha(senha);

    const novoUsuario = await authRepository.criar({
        nome_completo: nome,
        email,
        senha_hash,
        perfil,
        ativo: true,
    });

    return {
        id: novoUsuario.id,
        nome_completo: novoUsuario.nome_completo,
        email: novoUsuario.email,
        perfil: novoUsuario.perfil,
    };
}

function gerarToken(usuario) {
    const payload = {
        id: usuario.id,
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
        throw criarErro("Informe a senha atual e uma nova senha com pelo menos 4 caracteres.");
    }

    const reg = await authRepository.buscarPorId(usuarioId);
    if (!reg) {
        throw criarErro("Usuário não encontrado.", 404);
    }

    const valida = await verificarSenha(senhaAtual, reg.senha_hash);
    if (!valida) {
        throw criarErro("Senha atual incorreta.");
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
