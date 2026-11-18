// O módulo validarGmail.js centraliza a lógica de validação de endereços de e-mail no formato @gmail.com.
// Isso garante que todos os locais do sistema que precisam validar e-mail usem a mesma regra, evitando inconsistências.

const REGEX_GMAIL = /^[^\s@]+@gmail\.com$/i;

const MENSAGEM_ERRO_GMAIL =
    "O e-mail deve ser válido e terminar com @gmail.com (ex: nome@gmail.com). Corrija o e-mail para continuar.";

function validarGmail(
    email,
    mensagemObrigatorio = "O campo 'email' é obrigatório e deve ser um texto válido."
) {
    if (!email || typeof email !== "string" || !email.trim()) {
        const erro = new Error(mensagemObrigatorio);
        erro.status = 400;
        throw erro;
    }

    const emailNormalizado = email.trim().toLowerCase();
    if (!REGEX_GMAIL.test(emailNormalizado)) {
        const erro = new Error(MENSAGEM_ERRO_GMAIL);
        erro.status = 400;
        throw erro;
    }

    return emailNormalizado;
}

module.exports = {
    REGEX_GMAIL,
    MENSAGEM_ERRO_GMAIL,
    validarGmail,
};
