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
