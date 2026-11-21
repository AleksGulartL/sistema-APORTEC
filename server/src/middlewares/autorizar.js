function normalizarPapel(papel) {
    const valor = String(papel)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); 

    if (valor === "ADMIN" || valor === "ADMINISTRADOR") return "ADM";
    return valor;
}

function obterPapelUsuario(usuario) {
    const papel = usuario.perfil || "";
    return papel ? normalizarPapel(papel) : "";
}

function autorizar(...papeisPermitidos) {
    const papeisNormalizados = papeisPermitidos.flat().map(normalizarPapel);

    return function autorizarPerfil(req, res, next) {
        const usuario = req.usuario || req.user;

        if (!usuario) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const papelAtual = obterPapelUsuario(usuario);
        const autorizado = papelAtual !== "" && papeisNormalizados.includes(papelAtual);

        if (!autorizado) {
            return res.status(403).json({
                erro: "Permissão insuficiente.",
                mensagem: "Acesso negado. O perfil não tem permissão para esta ação.",
                necessario: papeisPermitidos.flat(),
                atual: usuario.perfil,
            });
        }

        return next();
    };
}

module.exports = autorizar;
module.exports.normalizarPapel = normalizarPapel;
module.exports.obterPapelUsuario = obterPapelUsuario;