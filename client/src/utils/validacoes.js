export const REGEX_GMAIL = /^[^\s@]+@gmail\.com$/i;

export const MENSAGEM_ERRO_GMAIL =
    "E-mail inválido: utilize apenas endereços terminados em @gmail.com (ex: nome@gmail.com). Ajuste o e-mail para continuar.";

export function emailEhGmail(email) {
    if (!email || typeof email !== "string") return false;
    return REGEX_GMAIL.test(email.trim());
}

export function normalizarEmailGmail(email) {
    return String(email || "").trim().toLowerCase();
}

export function obterAjudaEmailGmail(email, mostrarErro) {
    const invalido = Boolean(mostrarErro) && !emailEhGmail(email);
    return {
        error: invalido,
        helperText: invalido
            ? MENSAGEM_ERRO_GMAIL
            : "Aceita apenas endereços @gmail.com (ex: nome@gmail.com).",
    };
}
