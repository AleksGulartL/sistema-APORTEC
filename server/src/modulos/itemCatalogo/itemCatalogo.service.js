const itemCatalogoRepository = require("./itemCatalogo.repository");

function validarItemCatalogo(dados, isUpdate = false) {
    const tipoId = dados.tipo_id;
    const categoriaId = dados.categoria_id;

    if (!isUpdate) {
        const tipoIdNum = Number(tipoId);
        if (!tipoId || !Number.isInteger(tipoIdNum) || tipoIdNum <= 0) {
            const erro = new Error("O campo 'tipo_id' é obrigatório e deve ser um ID válido.");
            erro.status = 400;
            throw erro;
        }

        const categoriaIdNum = Number(categoriaId);
        if (!categoriaId || !Number.isInteger(categoriaIdNum) || categoriaIdNum <= 0) {
            const erro = new Error("O campo 'categoria_id' é obrigatório e deve ser um ID válido.");
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
    } else {
        if (tipoId !== undefined) {
            const tipoIdNum = Number(tipoId);
            if (!Number.isInteger(tipoIdNum) || tipoIdNum <= 0) {
                const erro = new Error("O campo 'tipo_id' deve ser um ID válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (categoriaId !== undefined) {
            const categoriaIdNum = Number(categoriaId);
            if (!Number.isInteger(categoriaIdNum) || categoriaIdNum <= 0) {
                const erro = new Error("O campo 'categoria_id' deve ser um ID válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.descricao !== undefined) {
            if (!dados.descricao || typeof dados.descricao !== "string" || !dados.descricao.trim()) {
                const erro = new Error("O campo 'descricao' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (dados.unidade_medida !== undefined) {
            if (!dados.unidade_medida || typeof dados.unidade_medida !== "string" || !dados.unidade_medida.trim()) {
                const erro = new Error("O campo 'unidade_medida' deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }
    }

    if (dados.valor_unitario_padrao !== undefined && dados.valor_unitario_padrao !== null) {
        const valNum = Number(dados.valor_unitario_padrao);
        if (isNaN(valNum) || valNum < 0) {
            const erro = new Error("O 'valor_unitario_padrao' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    const qtdAtual = dados.quantidade_atual ?? dados.quantidade_estoque;
    if (qtdAtual !== undefined && qtdAtual !== null) {
        const qtdNum = Number(qtdAtual);
        if (isNaN(qtdNum) || qtdNum < 0) {
            const erro = new Error("A 'quantidade_atual' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.estoque_minimo !== undefined && dados.estoque_minimo !== null) {
        const minNum = Number(dados.estoque_minimo);
        if (isNaN(minNum) || minNum < 0) {
            const erro = new Error("O 'estoque_minimo' deve ser um número maior ou igual a zero.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return itemCatalogoRepository.listar();
}

async function listarTipos() {
    return itemCatalogoRepository.listarTipos();
}

async function listarCategorias() {
    return itemCatalogoRepository.listarCategorias();
}

async function listarAlertasEstoqueMinimo() {
    if (typeof itemCatalogoRepository.listarAlertasEstoqueMinimo === "function") {
        const resultado = await itemCatalogoRepository.listarAlertasEstoqueMinimo();
        if (resultado !== undefined) return resultado;
    }
    const todos = await itemCatalogoRepository.listar();
    return (todos || []).filter((item) => {
        const atual = Number(item.quantidade_atual ?? 0);
        const minimo = Number(item.estoque_minimo ?? 0);
        return atual <= minimo;
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
    validarItemCatalogo(dados, false);
    const payload = { ...dados };
    if (payload.quantidade_estoque !== undefined && payload.quantidade_atual === undefined) {
        payload.quantidade_atual = payload.quantidade_estoque;
    }
    delete payload.quantidade_estoque;
    return itemCatalogoRepository.criar(payload);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarItemCatalogo(dados, true);
    const payload = { ...dados };
    if (payload.quantidade_estoque !== undefined && payload.quantidade_atual === undefined) {
        payload.quantidade_atual = payload.quantidade_estoque;
    }
    delete payload.quantidade_estoque;
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
    listarTipos,
    listarCategorias,
    listarAlertasEstoqueMinimo,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
