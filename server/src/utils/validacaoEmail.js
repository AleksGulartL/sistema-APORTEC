// Centraliza a validação e normalização de e-mails exigindo '@' e '.com' (ex: nome@empresa.com).
const { criarErro } = require("./criarErro");

const REGEX_EMAIL = /^[^\s@]+@[^\s@.]+\.com$/i;

const MENSAGEM_ERRO_EMAIL =
    "O e-mail deve ser válido e conter '@' e '.com' (ex: nome@empresa.com). Corrija o e-mail para continuar.";

function validarEmail(
    email,
    mensagemObrigatorio = "O campo 'email' é obrigatório e deve ser um texto válido."
) {
    if (typeof email !== "string" || !email.trim()) {
        throw criarErro(mensagemObrigatorio);
    }

    const emailNormalizado = email.trim().toLowerCase();
    if (!REGEX_EMAIL.test(emailNormalizado)) {
        throw criarErro(MENSAGEM_ERRO_EMAIL);
    }

    return emailNormalizado;
}

module.exports = {
    REGEX_EMAIL,
    MENSAGEM_ERRO_EMAIL,
    validarEmail,
};
