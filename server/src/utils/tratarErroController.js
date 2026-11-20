/**
 * Padroniza o retorno HTTP de erros nos controllers (Critério 5 - Tratamento de Erros e Segurança):
 * - Mapeia restrições de unicidade (23505) e chave estrangeira (23503) do PostgreSQL/Sequelize para HTTP 400.
 * - Preserva mensagens de validação de regra de negócio (status 4xx).
 * - Oculta mensagens técnicas internas em falhas inesperadas (status 500).
 */
function responderErroController(res, erro, opcoes = {}) {
    const {
        statusPadrao = 500,
        mensagemDuplicado = "Já existe um registro cadastrado com os dados informados.",
        mensagemVinculo = "Operação não permitida: o registro referenciado não existe ou possui vínculos ativos que impedem a alteração/exclusão.",
        mensagemInterna = "Erro interno no servidor ao processar a solicitação.",
    } = opcoes;

    const codigoPg = erro?.code || erro?.parent?.code || erro?.original?.code;

    if (codigoPg === "23505" || erro?.name === "SequelizeUniqueConstraintError") {
        const msg =
            typeof mensagemDuplicado === "function" ? mensagemDuplicado(erro) : mensagemDuplicado;
        return res.status(400).json({ erro: msg });
    }

    if (codigoPg === "23503" || erro?.name === "SequelizeForeignKeyConstraintError") {
        const msg =
            typeof mensagemVinculo === "function" ? mensagemVinculo(erro) : mensagemVinculo;
        return res.status(400).json({ erro: msg });
    }

    if (codigoPg === "23514") {
        return res.status(400).json({ erro: erro?.parent?.message || erro?.original?.message || erro.message });
    }
    const status = erro?.status || statusPadrao;
    if (status >= 500) {
        return res.status(status).json({ erro: mensagemInterna });
    }

    return res.status(status).json({ erro: erro?.message || "Dados inválidos para a operação." });
}

module.exports = {
    responderErroController,
};
