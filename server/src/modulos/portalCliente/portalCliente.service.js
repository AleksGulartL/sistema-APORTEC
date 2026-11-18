const portalClienteRepository = require("./portalCliente.repository");

const TIPOS_SOLICITACAO_CLIENTE = ["Manutencao Corretiva", "Manutencao Preventiva"];

async function obterClienteVinculado(usuarioLogado) {
    const usuarioId = Number(usuarioLogado?.id_usuario ?? usuarioLogado?.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) { 
        const erro = new Error("Usuário não autenticado.");
        erro.status = 401;
        throw erro;
    }

    const clienteReg = await portalClienteRepository.buscarClientePorUsuarioId(usuarioId);
    if (!clienteReg) {
        const erro = new Error("Cadastro de cliente vinculado a este usuário não foi encontrado.");
        erro.status = 404;
        throw erro;
    }
    return clienteReg;
}

async function obterResumo(usuarioLogado) {
    const clienteReg = await obterClienteVinculado(usuarioLogado);
    const [pedidos, ordens_servico] = await Promise.all([
        portalClienteRepository.listarPedidosDoCliente(clienteReg.id),
        portalClienteRepository.listarOrdensServicoDoCliente(clienteReg.id),
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
        const erro = new Error("O 'id' do pedido informado é inválido.");
        erro.status = 400;
        throw erro;
    }

    const decisao = dados.status_aprovacao;
    if (!["Aprovado", "Reprovado"].includes(decisao)) {
        const erro = new Error("A decisão deve ser 'Aprovado' ou 'Reprovado'.");
        erro.status = 400;
        throw erro;
    }

    const clienteReg = await obterClienteVinculado(usuarioLogado);
    const regPedido = await portalClienteRepository.buscarPedidoDoClientePorId(idNum, clienteReg.id);
    if (!regPedido) {
        const erro = new Error("Pedido não encontrado para este cliente.");
        erro.status = 404;
        throw erro;
    }

    if (regPedido.status_aprovacao !== "Pendente") {
        const erro = new Error(`Este orçamento já foi marcado como '${regPedido.status_aprovacao}'.`);
        erro.status = 400;
        throw erro;
    }

    const checklist = regPedido.checklist_medicao;
    const checklistAprovado =
        checklist &&
        checklist.status_aprovacao === "Aprovado" &&
        checklist.viga_ok !== false &&
        checklist.piso_ok !== false &&
        checklist.ponto_eletrico_ok !== false;

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
    const tipoServico = dados.tipo_servico || "Manutencao Corretiva";
    if (!TIPOS_SOLICITACAO_CLIENTE.includes(tipoServico)) {
        const erro = new Error("Clientes podem solicitar apenas 'Manutencao Corretiva' ou 'Manutencao Preventiva'.");
        erro.status = 400;
        throw erro;
    }

    if (!dados.descricao_problema || typeof dados.descricao_problema !== "string" || !dados.descricao_problema.trim()) {
        const erro = new Error("Descreva o problema ou serviço desejado para abrir o chamado.");
        erro.status = 400;
        throw erro;
    }

    const clienteReg = await obterClienteVinculado(usuarioLogado);

    let pedidoId = null;
    let origemCobertura = "Avulso";

    if (dados.pedido_id !== undefined && dados.pedido_id !== null && String(dados.pedido_id).trim() !== "") {
        const pedidoIdNum = Number(dados.pedido_id);
        if (!Number.isInteger(pedidoIdNum) || pedidoIdNum <= 0) {
            const erro = new Error("O 'pedido_id' informado é inválido.");
            erro.status = 400;
            throw erro;
        }
        const regPedido = await portalClienteRepository.buscarPedidoDoClientePorId(pedidoIdNum, clienteReg.id);
        if (!regPedido) {
            const erro = new Error("Porta / Pedido selecionado não pertence a este cliente.");
            erro.status = 404;
            throw erro;
        }
        pedidoId = regPedido.id;
        if (regPedido.fim_garantia) {
            const hojeIso = new Date().toISOString().slice(0, 10);
            if (String(regPedido.fim_garantia).slice(0, 10) >= hojeIso) {
                origemCobertura = "Garantia";
            }
        }
    }

    return portalClienteRepository.criarOrdemServicoCliente({
        cliente_id: clienteReg.id,
        pedido_id: pedidoId,
        tecnico_responsavel_id: null,
        tipo_servico: tipoServico,
        origem_cobertura: origemCobertura,
        status_os: "Aberta",
        descricao_problema: dados.descricao_problema.trim(),
        data_agendamento: dados.data_agendamento || null,
    });
}

module.exports = {
    obterResumo,
    responderAprovacaoOrcamento,
    abrirSolicitacaoManutencao,
};
