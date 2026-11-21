export const REGEX_EMAIL = /^[^\s@]+@[^\s@.]+\.com$/i;
export const REGEX_CPF = /^(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;
export const REGEX_CNPJ = /^(?:\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/;
export const REGEX_TELEFONE = /^(?:\(\d{2}\)\s?\d{4,5}-\d{4}|\d{10,11})$/;

export const MENSAGEM_ERRO_EMAIL =
    "E-mail inválido: informe um endereço com '@' e '.com' (ex: nome@empresa.com). Ajuste o e-mail para continuar.";
export const MENSAGEM_ERRO_CPF_CNPJ =
    "CPF ou CNPJ inválido: informe no formato 000.000.000-00 ou 00.000.000/0001-00. Ajuste o documento para continuar.";
export const MENSAGEM_ERRO_TELEFONE =
    "Telefone inválido: informe no formato (00) 00000-0000 ou (00) 0000-0000. Ajuste o telefone para continuar.";

function extrairDigitos(valor, limite) {
    return String(valor || "").replace(/\D/g, "").slice(0, limite);
}

function criarResultadoAjuda(valido, mostrarErro, mensagemErro, mensagemPadrao) {
    const invalido = Boolean(mostrarErro) && !valido;
    return {
        error: invalido,
        helperText: invalido ? mensagemErro : mensagemPadrao,
    };
}

export function emailEhValido(email) {
    return typeof email === "string" && REGEX_EMAIL.test(email.trim());
}

export function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
}

export function obterAjudaEmail(email, mostrarErro) {
    return criarResultadoAjuda(
        emailEhValido(email),
        mostrarErro,
        MENSAGEM_ERRO_EMAIL,
        "Informe um e-mail com '@' e '.com' (ex: nome@empresa.com)."
    );
}

export function formatarCpfCnpj(valor) {
    const digitos = extrairDigitos(valor, 14);
    if (digitos.length <= 11) {
        return digitos
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, "$1-$2");
    }
    return digitos
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
        .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d{1,2})$/, "$1-$2");
}

export function cpfCnpjEhValido(valor) {
    if (typeof valor !== "string") return false;
    const texto = valor.trim();
    return REGEX_CPF.test(texto) || REGEX_CNPJ.test(texto);
}

export function normalizarCpfCnpj(valor) {
    return formatarCpfCnpj(valor);
}

export function obterAjudaCpfCnpj(valor, mostrarErro) {
    return criarResultadoAjuda(
        cpfCnpjEhValido(valor),
        mostrarErro,
        MENSAGEM_ERRO_CPF_CNPJ,
        "Informe um CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00)."
    );
}

export function formatarTelefone(valor) {
    const digitos = extrairDigitos(valor, 11);
    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    const corte = digitos.length === 11 ? 7 : 6;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, corte)}-${digitos.slice(corte)}`;
}

export function telefoneEhValido(valor) {
    if (typeof valor !== "string") return false;
    return REGEX_TELEFONE.test(valor.trim());
}

export function normalizarTelefone(valor) {
    return formatarTelefone(valor);
}

export function obterAjudaTelefone(valor, mostrarErro) {
    return criarResultadoAjuda(
        telefoneEhValido(valor),
        mostrarErro,
        MENSAGEM_ERRO_TELEFONE,
        "Informe o DDD e o número: (00) 00000-0000 ou (00) 0000-0000."
    );
}
