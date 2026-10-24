const obrasServicosService = require("./obrasServicos.service");

async function listar(req, res) {
    try {
        const obras = await obrasServicosService.listar();
        return res.status(200).json(obras);
    } catch (erro) {
        console.error("Erro ao buscar obras/serviços:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const registro = await obrasServicosService.buscarPorId(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Obra/Serviço não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao buscar obra/serviço:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const registro = await obrasServicosService.criar(req.body);
        return res.status(201).json(registro);
    } catch (erro) {
        console.error("Erro ao criar obra/serviço:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "O cliente informado (id_cliente) não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const registro = await obrasServicosService.atualizar(req.params.id, req.body);
        if (!registro) {
            return res.status(404).json({ erro: "Obra/Serviço não encontrado." });
        }
        return res.status(200).json(registro);
    } catch (erro) {
        console.error("Erro ao atualizar obra/serviço:", erro);
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "O cliente informado (id_cliente) não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const registro = await obrasServicosService.deletar(req.params.id);
        if (!registro) {
            return res.status(404).json({ erro: "Obra/Serviço não encontrado." });
        }
        return res.status(200).json({ mensagem: "Obra/Serviço removido com sucesso.", obra_servico: registro });
    } catch (erro) {
        console.error("Erro ao excluir obra/serviço:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar
};