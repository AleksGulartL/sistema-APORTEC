const authService = require("./auth.service");
const { responderErroController } = require("../../utils/tratarErroController");

async function login(req, res) {
    try {
        const { email, senha } = req.body || {};

        if (!email || !senha) {
            return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
        }

        const resultado = await authService.autenticarUsuario(email, senha);

        if (!resultado.sucesso) {
            return res.status(401).json({ erro: resultado.mensagem });
        }

        const token = authService.gerarToken(resultado.usuario);

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: resultado.usuario,
        });
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);
        return responderErroController(res, erro);
    }
}

async function registrar(req, res) {
    try {
        const usuarioCriado = await authService.criarNovoUsuario(req.body || {}, req.usuario || null);
        return res.status(201).json(usuarioCriado);
    } catch (erro) {
        console.error("Erro ao registrar usuário:", erro);
        return responderErroController(res, erro, {
            statusPadrao: 400,
            mensagemDuplicado: "Já existe um usuário cadastrado com este e-mail.",
        });
    }
}

async function logout(req, res) {
    return res.status(200).json({
        mensagem: "Logout realizado com sucesso.",
    });
}

async function perfil(req, res) {
    try {
        const usuario = req.usuario;
        if (!usuario) {
            return res.status(401).json({ erro: "Usuário não autenticado." });
        }
        return res.status(200).json(usuario);
    } catch (erro) {
        console.error("Erro ao obter perfil:", erro);
        return responderErroController(res, erro);
    }
}

async function alterarSenha(req, res) {
    try {
        const usuario = req.usuario;
        if (!usuario) {
            return res.status(401).json({ erro: "Usuário não autenticado." });
        }
        const resultado = await authService.alterarSenhaUsuario(usuario.id, req.body || {});
        return res.status(200).json(resultado);
    } catch (erro) {
        console.error("Erro ao alterar senha:", erro);
        return responderErroController(res, erro, { statusPadrao: 400 });
    }
}

module.exports = {
    login,
    registrar,
    logout,
    perfil,
    alterarSenha,
};
