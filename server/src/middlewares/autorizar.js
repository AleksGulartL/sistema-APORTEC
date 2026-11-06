function autorizar(...papeisPermitidos) {
    const papeis = papeisPermitidos.flat();

    return (req, res, next) => {
        const usuario = req.usuario || req.user;

        if (!usuario) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const papelUsuario = usuario.cargo_funcao || usuario.role;

        if (!papeis.includes(papelUsuario)) {
            return res.status(403).json({
                erro: "Permissão insuficiente.",
                necessario: papeis,
                atual: papelUsuario,
            });
        }

        return next();
    };
}

module.exports = autorizar;
