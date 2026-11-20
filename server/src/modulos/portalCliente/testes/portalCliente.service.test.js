const portalClienteService = require("../portalCliente.service");
const portalClienteRepository = require("../portalCliente.repository");

jest.mock("../portalCliente.repository");

describe("PortalClienteService - Testes Unitários", () => {
    const tokenCliente = { id: 15, perfil: "CLIENTE" };
    const clienteMock = { usuario_id: 15 };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve retornar resumo apenas do cliente vinculado ao usuário autenticado", async () => {
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue(clienteMock);
        portalClienteRepository.listarPedidosDoCliente.mockResolvedValue([{ id: 1, cliente_id: 15 }]);
        portalClienteRepository.listarOrdensServicoDoCliente.mockResolvedValue([{ id: 2, pedido_id: 1 }]);

        const res = await portalClienteService.obterResumo(tokenCliente);

        expect(portalClienteRepository.buscarClientePorUsuarioId).toHaveBeenCalledWith(15);
        expect(portalClienteRepository.listarPedidosDoCliente).toHaveBeenCalledWith(15);
        expect(portalClienteRepository.listarOrdensServicoDoCliente).toHaveBeenCalledWith(15);
        expect(res.pedidos).toHaveLength(1);
        expect(res.ordens_servico).toHaveLength(1);
    });

    test("RF05: Deve permitir ao cliente aprovar orçamento pendente e manter trava se medição não aprovada", async () => {
        const regPedido = {
            id: 20,
            cliente_id: 15,
            status: "Pendente",
            orcamento_enviado: true,
            status_aprovacao: "Pendente",
            checklist_medicao: null,
        };
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue(clienteMock);
        portalClienteRepository.buscarPedidoDoClientePorId.mockResolvedValue(regPedido);
        portalClienteRepository.atualizarPedido.mockImplementation(async (_reg, dados) => dados);

        const atualizado = await portalClienteService.responderAprovacaoOrcamento(tokenCliente, 20, {
            status_aprovacao: "Aprovado",
        });

        expect(atualizado.status_aprovacao).toBe("Aprovado");
        expect(atualizado.status).toBe("Aguardando");
        expect(atualizado.bloqueio_fabricacao).toBe(true);
    });

    test("RF14: assistência em porta existente também entra na fila de solicitações", async () => {
        const anoFuturo = `${new Date().getFullYear() + 1}-12-31`;
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue(clienteMock);
        portalClienteRepository.buscarPedidoDoClientePorId.mockResolvedValue({
            id: 25,
            cliente_id: 15,
            fim_garantia: anoFuturo,
            endereco_instalacao: "Rua A, 10",
        });
        portalClienteRepository.criarSolicitacao.mockImplementation(async (dados) => ({ id: 9, ...dados }));

        const os = await portalClienteService.abrirSolicitacaoManutencao(tokenCliente, {
            pedido_id: 25,
            tipo_servico: "Manutencao Corretiva",
            descricao_problema: "Sensor parou de detectar abertura.",
        });

        expect(os.pedido_origem_id).toBe(25);
        expect(os.tipo_pedido).toBe("Manutencao Corretiva");
        expect(os.status).toBe("Recebida");
        expect(os.bloqueio_fabricacao).toBe(true);
    });

    test("Deve impedir abertura de OS em pedido que não pertence ao cliente", async () => {
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue(clienteMock);
        portalClienteRepository.buscarPedidoDoClientePorId.mockResolvedValue(null);

        await expect(
            portalClienteService.abrirSolicitacaoManutencao(tokenCliente, {
                pedido_id: 999,
                descricao_problema: "Teste indevido",
            })
        ).rejects.toMatchObject({
            message: "Porta / Pedido selecionado não pertence a este cliente.",
            status: 404,
        });
    });
});

describe("Solicitações de novos serviços", () => {
    beforeEach(() => jest.clearAllMocks());
    test("cria instalação sem pedido anterior e ignora campos de aprovação enviados pelo cliente", async () => {
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue({ usuario_id: 15 });
        portalClienteRepository.criarSolicitacao.mockImplementation(async (dados) => dados);
        const result = await portalClienteService.criarSolicitacao({ id: 15 }, {
            tipo_servico: "Instalacao", descricao_problema: "Porta nova", endereco: "Rua A, 10",
            cliente_id: 99, status: "Concluido", status_aprovacao: "Aprovado", custo_total: 1,
        });
        expect(result).toMatchObject({ cliente_id: 15, usuario_criador_id: 15, status: "Recebida",
            status_aprovacao: "Pendente", pedido_origem_id: null, bloqueio_fabricacao: true });
        expect(result.custo_total).toBeUndefined();
    });
    test("não permite vincular a porta de outro cliente", async () => {
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue({ usuario_id: 15 });
        portalClienteRepository.buscarPedidoDoClientePorId.mockResolvedValue(null);
        await expect(portalClienteService.criarSolicitacao({ id: 15 }, {
            tipo_servico: "Manutencao Corretiva", descricao_problema: "Sensor", endereco: "Rua A", pedido_origem_id: 99,
        })).rejects.toMatchObject({ status: 404 });
        expect(portalClienteRepository.criarSolicitacao).not.toHaveBeenCalled();
    });
    test("exige descrição e endereço", async () => {
        portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue({ usuario_id: 15 });
        await expect(portalClienteService.criarSolicitacao({ id: 15 }, { tipo_servico: "Instalacao" }))
            .rejects.toMatchObject({ status: 400 });
    });
});

test("nova instalação descarta vínculo residual sem consultar pedidos anteriores", async () => {
    jest.clearAllMocks();
    portalClienteRepository.buscarClientePorUsuarioId.mockResolvedValue({ usuario_id: 15 });
    portalClienteRepository.criarSolicitacao.mockImplementation(async (dados) => dados);
    const solicitacao = await portalClienteService.criarSolicitacao({ id: 15 }, {
        tipo_servico: "Instalacao", pedido_origem_id: 99,
        descricao_problema: "Nova porta", endereco: "Rua A, 10",
    });
    expect(solicitacao.pedido_origem_id).toBeNull();
    expect(portalClienteRepository.buscarPedidoDoClientePorId).not.toHaveBeenCalled();
});
