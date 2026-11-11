const pedidoService = require("../pedido.service");
const pedidoRepository = require("../pedido.repository");

jest.mock("../pedido.repository");

describe("PedidoService - Testes Unitários (RF04, RF08, RF12, RF13)", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("RF12: Deve gerar automaticamente o checklist de pré-saída ao avançar status para 'Pronto para Instalacao'", async () => {
        pedidoRepository.buscarPorId.mockResolvedValue({
            id: 10,
            id_pedido: 10,
            status: "Testes",
            bloqueio_fabricacao: false,
        });
        pedidoRepository.atualizar.mockResolvedValue({
            id: 10,
            status: "Pronto para Instalacao",
            status_fluxo: "Pronto para Instalacao",
        });
        pedidoRepository.gerarChecklistPreSaida.mockResolvedValue({
            pedido_id: 10,
            status: "Pronto para Instalacao",
            itens_conferencia: [
                {
                    item_id: 5,
                    descricao: "Motor Pivotante",
                    unidade_medida: "UN",
                    quantidade_prevista: 2,
                },
            ],
            insumos_separados: [],
        });

        const resultado = await pedidoService.atualizarStatusEtapa(10, {
            status_fluxo: "Pronto para Instalacao",
        });

        expect(pedidoRepository.atualizar).toHaveBeenCalledWith(10, {
            status: "Pronto para Instalacao",
            status_fluxo: "Pronto para Instalacao",
        });
        expect(pedidoRepository.gerarChecklistPreSaida).toHaveBeenCalledWith(10);
        expect(resultado.checklist_pre_saida).toBeDefined();
        expect(resultado.checklist_pre_saida.itens_conferencia).toHaveLength(1);
    });

    test("RF08: Deve bloquear avanço para etapa de fabricação se bloqueio_fabricacao for true", async () => {
        pedidoRepository.buscarPorId.mockResolvedValue({
            id: 12,
            id_pedido: 12,
            status: "Aguardando",
            bloqueio_fabricacao: true,
            motivo_bloqueio: "Bloqueado: pendência de viga.",
        });

        await expect(
            pedidoService.atualizarStatusEtapa(12, { status: "Em Fabricacao" })
        ).rejects.toMatchObject({
            message: "Bloqueado: pendência de viga.",
            status: 400,
        });

        expect(pedidoRepository.atualizar).not.toHaveBeenCalled();
    });

    test("RF13: Deve coletar assinatura digital de aceite da instalação, concluir o pedido e registrar porta instalada", async () => {
        pedidoRepository.buscarPorId.mockResolvedValue({
            id: 10,
            id_pedido: 10,
            obra_id: 3,
            status: "Pronto para Instalacao",
        });
        pedidoRepository.atualizar.mockResolvedValue({
            id: 10,
            status: "Concluido",
            assinatura_cliente_instalacao: "ASSINATURA_DIGITAL_BASE64_CLIENTE",
        });
        pedidoRepository.registrarPortaInstalada.mockResolvedValue({
            id: 1,
            numero_serie: "APORTEC-2026-0010",
            pedido_origem_id: 10,
        });

        const resultado = await pedidoService.coletarAssinaturaAceite(10, {
            assinatura_cliente_instalacao: "ASSINATURA_DIGITAL_BASE64_CLIENTE",
        });

        expect(pedidoRepository.atualizar).toHaveBeenCalledWith(
            10,
            expect.objectContaining({
                assinatura_cliente_instalacao: "ASSINATURA_DIGITAL_BASE64_CLIENTE",
                status: "Concluido",
                status_op: "Concluida",
            })
        );
        expect(resultado.porta_instalada).toMatchObject({
            numero_serie: "APORTEC-2026-0010",
        });
    });

    test("RF13: Deve lançar erro 400 se assinatura digital não for informada no aceite", async () => {
        await expect(
            pedidoService.coletarAssinaturaAceite(10, { assinatura_cliente_instalacao: "   " })
        ).rejects.toMatchObject({
            message: "A assinatura digital do cliente é obrigatória para formalizar o aceite da instalação.",
            status: 400,
        });
    });
});
