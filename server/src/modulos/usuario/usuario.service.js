const bcrypt = require("bcrypt");
const usuarioRepository = require("./usuario.repository");
const { validarGmail } = require("../../utils/validacaoEmail");
const { criarErro } = require("../../utils/criarErro");

const PERFIS_VALIDOS = ["ADM", "TECNICO", "CLIENTE"];
const SALT_ROUNDS = 10;

function normalizarPerfil(perfil) {
    if (!perfil) return "TECNICO";
    const upper = String(perfil)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    if (PERFIS_VALIDOS.includes(upper)) return upper;
    if (upper === "ADMIN" || upper === "ADMINISTRADOR") return "ADM";
    return "TECNICO";
}

function validarUsuario(dados, isUpdate = false) {
    if (!isUpdate || dados.nome_completo !== undefined) {
        if (!dados.nome_completo || typeof dados.nome_completo !== "string" || !dados.nome_completo.trim()) {
            throw criarErro("O campo 'nome_completo' é obrigatório e deve ser um texto válido.");
        }
    }

    if (!isUpdate || dados.email !== undefined) {
        validarGmail(dados.email);
    }

    if (!isUpdate) {
        if (!dados.senha_hash || typeof dados.senha_hash !== "string" || !dados.senha_hash.trim()) {
            throw criarErro("O campo 'senha_hash' é obrigatório.");
        }
    } else if (dados.senha !== undefined && dados.senha !== "") {
        if (typeof dados.senha !== "string" || !dados.senha.trim()) {
            throw criarErro("A 'senha' informada deve ser um texto válido.");
        }
    }

    if (dados.perfil !== undefined && dados.perfil !== null) {
        if (!PERFIS_VALIDOS.includes(String(dados.perfil).trim().toUpperCase())) {
            throw criarErro("O campo 'perfil' deve ser 'ADM', 'TECNICO' ou 'CLIENTE'.");
        }
    }

    if (dados.ativo !== undefined && typeof dados.ativo !== "boolean") {
        throw criarErro("O campo 'ativo' deve ser um booleano.");
    }
}

async function listar() {
    return usuarioRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }
    return usuarioRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarUsuario(dados, false);
    const payload = {
        ...dados,
        email: validarGmail(dados.email),
        perfil: normalizarPerfil(dados.perfil),
    };
    delete payload.id;
    return usuarioRepository.criar(payload);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }

    validarUsuario(dados, true);
    const payload = { ...dados };

    if (payload.email !== undefined) {
        payload.email = validarGmail(payload.email);
    }
    if (payload.perfil) {
        payload.perfil = String(payload.perfil).trim().toUpperCase();
    }
    if (payload.senha && String(payload.senha).trim()) {
        payload.senha_hash = await bcrypt.hash(String(payload.senha), SALT_ROUNDS);
    }
    delete payload.senha;
    delete payload.id;

    return usuarioRepository.atualizar(idNum, payload);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }
    return usuarioRepository.deletar(idNum);
}

async function listarTecnicos() { return usuarioRepository.listarTecnicos(); }

module.exports = {
    listarTecnicos,
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
