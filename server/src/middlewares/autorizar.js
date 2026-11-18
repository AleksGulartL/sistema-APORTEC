// Normaliza o papel: maiúsculas, sem acentos e com sinônimos de administrador unificados em "ADM"
function normalizarPapel(papel) {
    const valor = String(papel)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // remove acentos (ex.: TÉCNICO -> TECNICO)

    if (valor === "ADMIN" || valor === "ADMINISTRADOR") return "ADM";
    return valor;
}

// Obtém o papel RBAC do usuário autenticado.
// O campo `perfil` (gravado no token pelo auth.service) é a fonte oficial de permissão.
// `cargo_funcao` é um texto livre descritivo e só é considerado em tokens legados sem `perfil`.
function obterPapelUsuario(usuario) {
    const papel = usuario.perfil || usuario.cargo_funcao || usuario.role || "";
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
                atual: usuario.perfil || usuario.cargo_funcao || usuario.role || "",
            });
        }

        return next(); // next() permite que a requisição continue para o controller
    };
}

module.exports = autorizar;
module.exports.normalizarPapel = normalizarPapel;
module.exports.obterPapelUsuario = obterPapelUsuario;
