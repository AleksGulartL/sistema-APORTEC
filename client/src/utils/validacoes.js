export const REGEX_EMAIL = /^[^\s@]+@[^\s@.]+\.com$/i;

export const MENSAGEM_ERRO_EMAIL =
    "E-mail inválido: informe um endereço com '@' e '.com' (ex: nome@empresa.com). Ajuste o e-mail para continuar.";

export function emailEhValido(email) {
    return typeof email === "string" && REGEX_EMAIL.test(email.trim());
}

export function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
}

export function obterAjudaEmail(email, mostrarErro) {
    const invalido = Boolean(mostrarErro) && !emailEhValido(email);
    return {
        error: invalido,
        helperText: invalido
            ? MENSAGEM_ERRO_EMAIL
            : "Informe um e-mail com '@' e '.com' (ex: nome@empresa.com).",
    };
}
