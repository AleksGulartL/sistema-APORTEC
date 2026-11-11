function autorizar(...papeisPermitidos) {
    const papeisNormalizados = papeisPermitidos.flat().map((p) => String(p).toUpperCase());

    return (req, res, next) => {
        const usuario = req.usuario || req.user;

        if (!usuario) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const papelAtual = usuario.cargo_funcao || usuario.perfil || usuario.role || "";
        const candidatosUsuario = [
            usuario.perfil,
            usuario.cargo_funcao,
            usuario.role, // serve para verificar se o usuario tem permisão de admin
        ]
            .filter(Boolean) // serve para remover valores vazios
            .map((p) => String(p).toUpperCase()); // serve para converter os valores para maiusculo

        // Mapeamento de equivalência entre cargos descritivos e perfis RBAC (RF01)
        if (candidatosUsuario.includes("ADMIN") || candidatosUsuario.includes("ADMINISTRADOR")) {
            candidatosUsuario.push("ADM");
        }
        if (candidatosUsuario.includes("ADM")) {
            candidatosUsuario.push("ADMIN", "ADMINISTRADOR");
        } 

        const autorizado = candidatosUsuario.some((c) => papeisNormalizados.includes(c)); // .some serve para verificar se algum dos valores do array é true

        if (!autorizado) {
            return res.status(403).json({
                erro: "Permissão insuficiente.",
                mensagem: "Acesso negado. O perfil não tem permissão para esta ação.",
                necessario: papeisPermitidos.flat(), 
                atual: papelAtual,
            });
        }

        return next(); // next() vai permitir que a requisição continue para o próximo middleware
    };
}

module.exports = autorizar;
