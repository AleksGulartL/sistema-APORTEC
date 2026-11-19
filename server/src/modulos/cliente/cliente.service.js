const clienteRepository = require("./cliente.repository");
const { validarGmail } = require("../../utils/validacaoEmail");

function validarCliente(dados, isUpdate = false) {
    const temUsuarioId =
        dados.usuario_id !== undefined && dados.usuario_id !== null && String(dados.usuario_id).trim() !== "";

    if (temUsuarioId) {
        const idUsuarioNum = Number(dados.usuario_id);
        if (!Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
            const erro = new Error("O campo 'usuario_id' deve ser um número inteiro válido.");
            erro.status = 400;
            throw erro;
        }
    } else if (!isUpdate || dados.nome_completo !== undefined || dados.email !== undefined) {
        if (!isUpdate || dados.nome_completo !== undefined) {
            if (!dados.nome_completo || typeof dados.nome_completo !== "string" || !dados.nome_completo.trim()) {
                const erro = new Error("O campo 'nome_completo' é obrigatório e deve ser um texto válido.");
                erro.status = 400;
                throw erro;
            }
        }

        if (!isUpdate || dados.email !== undefined) {
            validarGmail(dados.email);
        }
    }

    if (!isUpdate || dados.cnpj_cpf !== undefined) {
        if (!dados.cnpj_cpf || typeof dados.cnpj_cpf !== "string" || !dados.cnpj_cpf.trim()) {
            const erro = new Error("O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (!isUpdate || dados.telefone !== undefined) {
        if (!dados.telefone || typeof dados.telefone !== "string" || !dados.telefone.trim()) {
            const erro = new Error("O campo 'telefone' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (!isUpdate || dados.endereco !== undefined) {
        if (!dados.endereco || typeof dados.endereco !== "string" || !dados.endereco.trim()) {
            const erro = new Error("O campo 'endereco' é obrigatório e deve ser um texto válido.");
            erro.status = 400;
            throw erro;
        }
    }

    if (dados.senha !== undefined && dados.senha !== null && String(dados.senha).trim() !== "") {
        if (typeof dados.senha !== "string" || dados.senha.trim().length < 4) {
            const erro = new Error("A senha do cliente deve ter pelo menos 4 caracteres.");
            erro.status = 400;
            throw erro;
        }
    }
}

async function listar() {
    return clienteRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return clienteRepository.buscarPorId(idNum);
}

async function criar(dados) {
    validarCliente(dados, false);
    const payload = dados.email !== undefined ? { ...dados, email: validarGmail(dados.email) } : dados;
    return clienteRepository.criar(payload);
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }

    validarCliente(dados, true);
    const payload = dados.email !== undefined ? { ...dados, email: validarGmail(dados.email) } : dados;
    return clienteRepository.atualizar(idNum, payload);
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        const erro = new Error("O 'id' informado deve ser um número inteiro válido.");
        erro.status = 400;
        throw erro;
    }
    return clienteRepository.deletar(idNum);
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
