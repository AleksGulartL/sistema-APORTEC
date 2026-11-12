const itemCatalogoRepository = require("./itemCatalogo.repository");

const TIPOS_VALIDOS = ["Insumo", "Porta", "Peca", "Material", "Servico", "MATERIAL", "SERVICO"];

function validarItemCatalogo(dados) {
    if (!dados.tipo) {
        const erro = new Error("O campo 'tipo' é obrigatório.");
        erro.status = 400;
        throw erro;
    }

    if (!TIPOS_VALIDOS.includes(dados.tipo)) {
        const erro = new Error("O campo 'tipo' deve ser 'Insumo', 'Porta' ou 'Peca'.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.descricao || typeof dados.descricao !== "string" || !dados.descricao.trim()) {
        const erro = new Error("O campo 'descricao' é obrigatório e deve ser um texto válido.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.unidade_medida || typeof dados.unidade_medida !== "string" || !dados.unidade_medida.trim()) {
        const erro = new Error("O campo 'unidade_medida' é obrigatório e deve ser um texto válido.");
        erro.status = 400;
        throw erro;
    }

    if (dados.valor_unitario_padrao !== undefined && dados.valor_unitario_padrao !== null) {
        if (typeof dados.valor_unitario_padrao !== "number" || dados.valor_unitario_padrao < 0) {
            const erro = new Error("O 'valor_unitario_padrao' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.quantidade_estoque !== undefined && dados.quantidade_estoque !== null) {
        if (typeof dados.quantidade_estoque !== "number" || dados.quantidade_estoque < 0) {
            const erro = new Error("A 'quantidade_estoque' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.estoque_minimo !== undefined && dados.estoque_minimo !== null) {
        if (typeof dados.estoque_minimo !== "number" || dados.estoque_minimo < 0) {
            const erro = new Error("O 'estoque_minimo' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return itemCatalogoRepository.listar();
}

async function listarAlertasEstoqueMinimo() {
    if (typeof itemCatalogoRepository.listarAlertasEstoqueMinimo === "function") {
        const resultado = await itemCatalogoRepository.listarAlertasEstoqueMinimo();
        if (resultado !== undefined) return resultado;
    }
    const todos = await itemCatalogoRepository.listar();
    return (todos || []).filter((item) => {
        const atual = Number(item.quantidade_atual ?? item.quantidade_estoque ?? 0);
        const reservada = Number(item.quantidade_reservada ?? 0);
        const minimo = Number(item.estoque_minimo ?? 0);
        return atual - reservada <= minimo;
    });
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return itemCatalogoRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarItemCatalogo(dados);
    const payload = { ...dados };
    if (payload.quantidade_estoque !== undefined) {
        payload.quantidade_atual = payload.quantidade_estoque;
    }
    return itemCatalogoRepository.criar(payload);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarItemCatalogo(dados);
    const payload = { ...dados };
    if (payload.quantidade_estoque !== undefined) {
        payload.quantidade_atual = payload.quantidade_estoque;
    }
    return itemCatalogoRepository.atualizar(idNum, payload);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return itemCatalogoRepository.deletar(idNum);
}

module.exports = {
    listar,
    listarAlertasEstoqueMinimo,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
