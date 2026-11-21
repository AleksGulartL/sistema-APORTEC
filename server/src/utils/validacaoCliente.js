const { criarErro } = require("./criarErro");

const REGEX_CPF = /^(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;
const REGEX_CNPJ = /^(?:\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/;
const REGEX_TELEFONE = /^(?:\([1-9]{2}\)\s?\d{4,5}-\d{4}|[1-9]{2}\d{8,9})$/;

const MENSAGEM_ERRO_CPF_CNPJ =
    "O CPF ou CNPJ deve estar em um formato válido (ex: 000.000.000-00 ou 00.000.000/0001-00). Corrija o documento para continuar.";

const MENSAGEM_ERRO_TELEFONE =
    "O telefone deve estar em um formato válido com DDD (ex: (00) 00000-0000 ou (00) 0000-0000). Corrija o telefone para continuar.";

function exigirTextoNaoVazio(valor, mensagemObrigatorio) {
    if (typeof valor !== "string" || !valor.trim()) {
        throw criarErro(mensagemObrigatorio);
    }
    return valor.trim();
}

function todosDigitosIguais(digitos) {
    return /^(\d)\1+$/.test(digitos);
}

function formatarCpfCnpj(digitos) {
    if (digitos.length === 11) {
        return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    }
    return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatarTelefone(digitos) {
    if (digitos.length === 11) {
        return digitos.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return digitos.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
}

function validarCpfCnpj(
    valor,
    mensagemObrigatorio = "O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido."
) {
    const texto = exigirTextoNaoVazio(valor, mensagemObrigatorio);
    if (!REGEX_CPF.test(texto) && !REGEX_CNPJ.test(texto)) {
        throw criarErro(MENSAGEM_ERRO_CPF_CNPJ);
    }

    const digitos = texto.replace(/\D/g, "");
    if (todosDigitosIguais(digitos)) {
        throw criarErro(MENSAGEM_ERRO_CPF_CNPJ);
    }

    return formatarCpfCnpj(digitos);
}

function validarTelefone(
    valor,
    mensagemObrigatorio = "O campo 'telefone' é obrigatório e deve ser um texto válido."
) {
    const texto = exigirTextoNaoVazio(valor, mensagemObrigatorio);
    if (!REGEX_TELEFONE.test(texto)) {
        throw criarErro(MENSAGEM_ERRO_TELEFONE);
    }

    const digitos = texto.replace(/\D/g, "");
    if (todosDigitosIguais(digitos)) {
        throw criarErro(MENSAGEM_ERRO_TELEFONE);
    }

    return formatarTelefone(digitos);
}

module.exports = {
    REGEX_CPF,
    REGEX_CNPJ,
    REGEX_TELEFONE,
    MENSAGEM_ERRO_CPF_CNPJ,
    MENSAGEM_ERRO_TELEFONE,
    validarCpfCnpj,
    validarTelefone,
};

