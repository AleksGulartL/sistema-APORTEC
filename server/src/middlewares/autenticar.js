const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
        return res.status(401).json({ erro: "Token de autenticação não fornecido." });
    }

    try {
        const secret = process.env.JWT_SECRET || "aportec_jwt_secret_key_2026";
        const payload = jwt.verify(token, secret);
        req.usuario = payload;
        req.user = payload; // Compatibilidade com convenção do Passport
        return next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ erro: "Token expirado.", expirado: true });
        }
        return res.status(401).json({ erro: "Token inválido." });
    }
}

module.exports = autenticar;
