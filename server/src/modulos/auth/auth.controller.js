const authService = require("./auth.service");

async function login(req, res) {
    try {
        const { email, username, senha, password } = req.body || {};
        const loginUser = email || username;
        const loginSenha = senha || password;

        if (!loginUser || !loginSenha) {
            return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
        }

        const resultado = await authService.autenticarUsuario(loginUser, loginSenha);

        if (!resultado.sucesso) {
            return res.status(401).json({ erro: resultado.mensagem });
        }

        const token = authService.gerarToken(resultado.usuario);

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            message: "Login successful",
            token,
            usuario: resultado.usuario,
        });
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);
        return res.status(500).json({ erro: erro.message });
    }
}

async function registrar(req, res) {
    try {
        const usuarioCriado = await authService.criarNovoUsuario(req.body || {}, req.usuario || null);
        return res.status(201).json(usuarioCriado);
    } catch (erro) {
        console.error("Erro ao registrar usuário:", erro);
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function logout(req, res) {
    if (typeof req.logout === "function") {
        return req.logout((err) => {
            if (err) return res.status(500).json({ erro: err.message });
            return res.status(200).json({
                mensagem: "Logout realizado com sucesso.",
                message: "Logout successful",
            });
        });
    }

    return res.status(200).json({
        mensagem: "Logout realizado com sucesso.",
        message: "Logout successful",
    });
}


async function perfil(req, res) {
    try {
        const usuario = req.usuario || req.user;
        if (!usuario) {
            return res.status(401).json({ erro: "Usuário não autenticado." });
        }
        return res.status(200).json(usuario);
    } catch (erro) {
        console.error("Erro ao obter perfil:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function alterarSenha(req, res) {
    try {
        const usuario = req.usuario || req.user;
        if (!usuario) {
            return res.status(401).json({ erro: "Usuário não autenticado." });
        }
        const idUsuario = usuario.id_usuario ?? usuario.id;
        const resultado = await authService.alterarSenhaUsuario(idUsuario, req.body || {});
        return res.status(200).json(resultado);
    } catch (erro) {
        console.error("Erro ao alterar senha:", erro);
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

module.exports = {
    login,
    registrar,
    logout,
    perfil,
    alterarSenha,
};
