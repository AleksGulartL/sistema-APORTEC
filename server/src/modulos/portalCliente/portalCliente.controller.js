const portalClienteService = require("./portalCliente.service");



// O módulo portalCliente separa o acesso externo do cliente das rotas internas da empresa (ADM e TECNICO) por três motivos principais:

// Isolamento de dados: As rotas internas (GET /pedido, GET /ordem_servico, GET /cliente) retornam dados de todos os clientes. No portalCliente.service.js, o sistema identifica o cliente pelo token JWT e filtra tudo pelo cliente_id dele — impedindo acesso a dados de outros clientes.
// Ações restritas ao necessário: Em vez de liberar PUT /pedido/:id (que permitiria alterar valor ou destravar fabricação) ou POST /ordem_servico completo, o portal expõe só o que faz sentido ao cliente: consultar seus dados (GET /portal-cliente/resumo), aprovar/reprovar orçamento pendente (PATCH /portal-cliente/pedidos/:id/aprovacao) e solicitar manutenção (POST /portal-cliente/ordens-servico).
// Código mais limpo e seguro: Mantém permissoes.js bloqueando CLIENTE em 100% das rotas administrativas, evita vários if (perfil === 'CLIENTE') espalhados nos services internos e permite alterar ou desativar o portal sem afetar o funcionamento do sistema interno.

async function obterResumo(req, res) {
    try {
        const resumo = await portalClienteService.obterResumo(req.usuario || req.user);
        return res.status(200).json(resumo);
    } catch (erro) {
        console.error("Erro ao obter dados do portal do cliente:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message });
    }
}

async function responderAprovacao(req, res) {
    try {
        const pedidoAtualizado = await portalClienteService.responderAprovacaoOrcamento(
            req.usuario || req.user,
            req.params.id,
            req.body || {}
        );
        return res.status(200).json(pedidoAtualizado);
    } catch (erro) {
        console.error("Erro ao responder aprovação do orçamento:", erro);
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

async function abrirSolicitacao(req, res) {
    try {
        const os = await portalClienteService.abrirSolicitacaoManutencao(
            req.usuario || req.user,
            req.body || {}
        );
        return res.status(201).json(os);
    } catch (erro) {
        console.error("Erro ao abrir solicitação de manutenção:", erro);
        return res.status(erro.status || 400).json({ erro: erro.message });
    }
}

module.exports = {
    obterResumo,
    responderAprovacao,
    abrirSolicitacao,
};
