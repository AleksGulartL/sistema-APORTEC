const emprestimosService = require("./emprestimos.service");

async function listar(req, res) {
    try {
        const emprestimos = await emprestimosService.listar();
        return res.status(200).json(emprestimos);
    } catch (erro) {
        console.error("Erro ao buscar empréstimos:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function buscarPorId(req, res) {
    try {
        const emprestimo = await emprestimosService.buscarPorId(req.params.id);
        if (!emprestimo) {
            return res.status(404).json({ erro: "Empréstimo não encontrado." });
        }
        return res.status(200).json(emprestimo);
    } catch (erro) {
        console.error("Erro ao buscar empréstimo:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const emprestimo = await emprestimosService.criar(req.body);
        return res.status(201).json(emprestimo);
    } catch (erro) {
        console.error("Erro ao criar empréstimo:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Este livro já possui um empréstimo em aberto não devolvido." });
        }
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "O leitor ou o livro informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const emprestimo = await emprestimosService.atualizar(req.params.id, req.body);
        if (!emprestimo) {
            return res.status(404).json({ erro: "Empréstimo não encontrado." });
        }
        return res.status(200).json(emprestimo);
    } catch (erro) {
        console.error("Erro ao atualizar empréstimo:", erro);
        if (erro.code === "23505") {
            return res.status(400).json({ erro: "Este livro já possui um empréstimo em aberto não devolvido." });
        }
        if (erro.code === "23503") {
            return res.status(400).json({ erro: "O leitor ou o livro informado não existe." });
        }
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function deletar(req, res) {
    try {
        const emprestimo = await emprestimosService.deletar(req.params.id);
        if (!emprestimo) {
            return res.status(404).json({ erro: "Empréstimo não encontrado." });
        }
        return res.status(200).json({ mensagem: "Empréstimo removido com sucesso.", emprestimo });
    } catch (erro) {
        console.error("Erro ao excluir empréstimo:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    deletar,
};
