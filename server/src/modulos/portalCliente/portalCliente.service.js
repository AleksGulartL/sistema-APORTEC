const { avaliacaoAprovada } = require("../../utils/fluxoPedido");
const { criarErro } = require("../../utils/criarErro");
const portalClienteRepository = require("./portalCliente.repository");
const ordemServicoRepository = require("../ordemServico/ordemServico.repository");

const TIPOS_SOLICITACAO_CLIENTE = ["Manutencao Corretiva", "Manutencao Preventiva"];

async function obterClienteVinculado(usuarioLogado) {
    const usuarioId = Number(usuarioLogado?.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw criarErro("Usuário não autenticado.", 401);
    }

    const clienteReg = await portalClienteRepository.buscarClientePorUsuarioId(usuarioId);
    if (!clienteReg) {
        throw criarErro("Cadastro de cliente vinculado a este usuário não foi encontrado.", 404);
    }
    return clienteReg;
}

async function obterResumo(usuarioLogado) {
    const clienteReg = await obterClienteVinculado(usuarioLogado);
    const idCliente = clienteReg.usuario_id;
    const [pedidos, ordens_servico] = await Promise.all([
        portalClienteRepository.listarPedidosDoCliente(idCliente),
        portalClienteRepository.listarOrdensServicoDoCliente(idCliente),
    ]);

    return {
        cliente: clienteReg,
        pedidos,
        ordens_servico,
    };
}

// RF05 - Aprovação / Reprovação de orçamento pelo próprio Cliente
async function responderAprovacaoOrcamento(usuarioLogado, pedidoId, dados = {}) {
    const idNum = Number(pedidoId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' do pedido informado é inválido.");
    }

    const decisao = dados.status_aprovacao;
    if (!["Aprovado", "Reprovado"].includes(decisao)) {
        throw criarErro("A decisão deve ser 'Aprovado' ou 'Reprovado'.");
    }

    const clienteReg = await obterClienteVinculado(usuarioLogado);
    const regPedido = await portalClienteRepository.buscarPedidoDoClientePorId(idNum, clienteReg.usuario_id);
    if (!regPedido) {
        throw criarErro("Pedido não encontrado para este cliente.", 404);
    }

    if (regPedido.status_aprovacao !== "Pendente") {
        throw criarErro(`Este orçamento já foi marcado como '${regPedido.status_aprovacao}'.`);
    }

    if (regPedido.orcamento_enviado !== true || ["Cancelado", "Concluido"].includes(regPedido.status)) {
        throw criarErro("O orçamento ainda não foi enviado pelo administrador ou já foi encerrado.");
    }
    const checklistAprovado = avaliacaoAprovada(regPedido);

    const payloadAtualizacao = {
        status_aprovacao: decisao,
    };

    if (decisao === "Aprovado") {
        payloadAtualizacao.data_aprovacao = new Date();
        if (["Rascunho", "Pendente"].includes(regPedido.status)) {
            payloadAtualizacao.status = "Aguardando";
        }
        payloadAtualizacao.bloqueio_fabricacao = !checklistAprovado;
        payloadAtualizacao.motivo_bloqueio = checklistAprovado
            ? null
            : "Orçamento aprovado pelo cliente; aguardando aprovação do checklist técnico de medição.";
    } else {
        payloadAtualizacao.bloqueio_fabricacao = true;
        payloadAtualizacao.motivo_bloqueio = "Orçamento reprovado pelo cliente.";
    }

    return portalClienteRepository.atualizarPedido(regPedido, payloadAtualizacao);
}

// RF14 - Abertura de solicitação de manutenção pelo próprio Cliente
async function abrirSolicitacaoManutencao(usuarioLogado, dados = {}) {
    const cliente = await obterClienteVinculado(usuarioLogado);
    const origem = await portalClienteRepository.buscarPedidoDoClientePorId(Number(dados.pedido_id), cliente.usuario_id);
    if (!origem) throw criarErro("Porta / Pedido selecionado não pertence a este cliente.", 404);
    return criarSolicitacao(usuarioLogado, { ...dados, tipo_servico: dados.tipo_servico || "Manutencao Corretiva",
        pedido_origem_id: origem.id, endereco: dados.endereco || origem.endereco_instalacao || cliente.endereco });
}

// O mesmo registro acompanha a solicitação, o orçamento e a execução.
async function criarSolicitacao(usuarioLogado, dados = {}) {
    const cliente = await obterClienteVinculado(usuarioLogado);
    const tipos = ["Instalacao", ...TIPOS_SOLICITACAO_CLIENTE];
    if (!tipos.includes(dados.tipo_servico)) {
        throw criarErro("Selecione um tipo de serviço válido.");
    }
    const descricao = typeof dados.descricao_problema === "string" ? dados.descricao_problema.trim() : "";
    const endereco = typeof dados.endereco === "string" ? dados.endereco.trim() : "";
    if (!descricao || !endereco) {
        throw criarErro("Informe a descrição do serviço e o endereço de atendimento.");
    }
    let origem = null;
    if (dados.tipo_servico !== "Instalacao" && dados.pedido_origem_id != null && dados.pedido_origem_id !== "") {
        const id = Number(dados.pedido_origem_id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            throw criarErro("Porta / Pedido de origem inválido.");
        }
        origem = await portalClienteRepository.buscarPedidoDoClientePorId(id, cliente.usuario_id);
        if (!origem) throw criarErro("Porta / Pedido selecionado não pertence a este cliente.", 404);
    }
    return portalClienteRepository.criarSolicitacao({
        cliente_id: cliente.usuario_id,
        usuario_criador_id: Number(usuarioLogado.id),
        tipo_pedido: dados.tipo_servico,
        descricao_solicitacao: descricao,
        endereco_instalacao: endereco,
        pedido_origem_id: origem?.id || null,
        status: "Recebida",
        status_aprovacao: "Pendente",
        bloqueio_fabricacao: true,
        motivo_bloqueio: "Solicitação recebida; aguardando avaliação técnica e orçamento.",
    });
}

async function assinarEncerramentoOs(usuarioLogado, osId, dados = {}) {
    const idNum = Number(osId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        throw criarErro("O 'id' da ordem de serviço informado é inválido.");
    }
    const assinatura = typeof dados.assinatura_cliente_digital === "string" ? dados.assinatura_cliente_digital.trim() : "";
    if (!assinatura) {
        throw criarErro("Informe sua assinatura digital para concluir o atendimento.");
    }
    if (assinatura.startsWith("data:image/")) {
        throw criarErro("Utilize a assinatura por texto para confirmar o aceite.");
    }
    const cliente = await obterClienteVinculado(usuarioLogado);
    return ordemServicoRepository.finalizarPeloCliente(idNum, cliente.usuario_id, assinatura);
}

module.exports = {
    criarSolicitacao,
    assinarEncerramentoOs,
    obterResumo,
    responderAprovacaoOrcamento,
    abrirSolicitacaoManutencao,
};
