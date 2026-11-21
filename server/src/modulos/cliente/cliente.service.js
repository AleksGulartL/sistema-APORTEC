const clienteRepository = require("./cliente.repository");
const { validarEmail } = require("../../utils/validacaoEmail");
const { validarCpfCnpj, validarTelefone } = require("../../utils/validacaoCliente");
const { criarErro } = require("../../utils/criarErro");

function validarCliente(dados, isUpdate = false) {
    const camposNormalizados = {};
    const temUsuarioId =
        dados.usuario_id !== undefined && dados.usuario_id !== null && String(dados.usuario_id).trim() !== "";

    if (temUsuarioId) {
        const idUsuarioNum = Number(dados.usuario_id);
        if (!Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
            throw criarErro("O campo 'usuario_id' deve ser um número inteiro válido.");
        }
        if (dados.email !== undefined) {
            camposNormalizados.email = validarEmail(dados.email);
        }
    } else if (!isUpdate || dados.nome_completo !== undefined || dados.email !== undefined) {
        if (!isUpdate || dados.nome_completo !== undefined) {
            if (!dados.nome_completo || typeof dados.nome_completo !== "string" || !dados.nome_completo.trim()) {
                throw criarErro("O campo 'nome_completo' é obrigatório e deve ser um texto válido.");
            }
        }

        if (!isUpdate || dados.email !== undefined) {
            camposNormalizados.email = validarEmail(dados.email);
        }
    }

    if (!isUpdate || dados.cnpj_cpf !== undefined) {
        camposNormalizados.cnpj_cpf = validarCpfCnpj(dados.cnpj_cpf);
    }

    if (!isUpdate || dados.telefone !== undefined) {
        camposNormalizados.telefone = validarTelefone(dados.telefone);
    }

    if (!isUpdate || dados.endereco !== undefined) {
        if (!dados.endereco || typeof dados.endereco !== "string" || !dados.endereco.trim()) {
            throw criarErro("O campo 'endereco' é obrigatório e deve ser um texto válido.");
        }
    }

    if (dados.senha !== undefined && dados.senha !== null && String(dados.senha).trim() !== "") {
        if (typeof dados.senha !== "string" || dados.senha.trim().length < 4) {
            throw criarErro("A senha do cliente deve ter pelo menos 4 caracteres.");
        }
    }

    return camposNormalizados;
}

async function listar() {
    return clienteRepository.listar();
}

async function buscarPorId(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }
    return clienteRepository.buscarPorId(idNum);
}

async function criar(dados) {
    const camposNormalizados = validarCliente(dados, false);
    return clienteRepository.criar({ ...dados, ...camposNormalizados });
}

async function atualizar(id, dados) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
    }

    const camposNormalizados = validarCliente(dados, true);
    return clienteRepository.atualizar(idNum, { ...dados, ...camposNormalizados });
}

async function deletar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' informado deve ser um número inteiro válido.");
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
