const pedidoService = require("../pedido.service");
const pedidoRepository = require("../pedido.repository");

jest.mock("../pedido.repository");

describe("PedidoService - Testes Unitários (RF04, RF08, RF12, RF13, RF15)", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("RF12: Deve gerar automaticamente o checklist de pré-saída ao avançar status para 'Pronto para Instalacao'", async () => {
        pedidoRepository.buscarPorId.mockResolvedValue({
            id: 10,
            status: "Testes",
            status_aprovacao: "Aprovado",
            bloqueio_fabricacao: false,
            orcamento_enviado: true, checklist_medicao: { status_aprovacao: "Aprovado", viga_ok: true, piso_ok: true, ponto_eletrico_ok: true },
        });
        pedidoRepository.atualizar.mockResolvedValue({
            id: 10,
            status: "Pronto para Instalacao",
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
        });

        const resultado = await pedidoService.atualizarStatusEtapa(10, {
            status: "Pronto para Instalacao",
        });

        expect(pedidoRepository.atualizar).toHaveBeenCalledWith(10, {
            status: "Pronto para Instalacao",
        });
        expect(pedidoRepository.gerarChecklistPreSaida).toHaveBeenCalledWith(10);
        expect(resultado.checklist_pre_saida).toBeDefined();
        expect(resultado.checklist_pre_saida.itens_conferencia).toHaveLength(1);
    });

    test("RF08: Deve bloquear avanço para etapa de fabricação se bloqueio_fabricacao for true", async () => {
        pedidoRepository.buscarPorId.mockResolvedValue({
            id: 12,
            status: "Aguardando",
            status_aprovacao: "Aprovado",
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

    test("o endpoint antigo de aceite não conclui o pedido separadamente", async () => {
        pedidoRepository.atualizar.mockClear();
        await expect(pedidoService.coletarAssinaturaAceite(10, { assinatura_cliente_instalacao: "assinatura" })).rejects.toMatchObject({ status: 410 });
        expect(pedidoRepository.atualizar).not.toHaveBeenCalled();
    });

    test("não conclui o pedido por mudança direta de etapa", async () => {
        await expect(pedidoService.atualizarStatusEtapa(10, { status: "Concluido" })).rejects.toMatchObject({ status: 400 });
    });

    test("não reabre pedido já concluído por mudança de etapa", async () => {
        pedidoRepository.buscarPorId.mockResolvedValue({ status: "Concluido" });
        await expect(pedidoService.atualizarStatusEtapa(10, { status: "Aguardando" })).rejects.toMatchObject({ status: 409 });
    });

});

test("novo orçamento sempre começa em rascunho, sem aprovação nem custo arbitrário", async () => {
    await pedidoService.criar({ cliente_id: 3, usuario_criador_id: 1, status_aprovacao: "Aprovado", custo_total: 999 });
    expect(pedidoRepository.criar).toHaveBeenCalledWith(expect.objectContaining({
        status: "Rascunho", status_aprovacao: "Pendente", custo_total: 0, bloqueio_fabricacao: true,
    }));
});

test("não permite escolher uma etapa operacional na criação", async () => {
    await expect(pedidoService.criar({ cliente_id: 3, status: "Concluido" })).rejects.toMatchObject({ status: 400 });
});

test("aceita formas e condições personalizadas e rejeita valores que não são texto", async () => {
    await pedidoService.criar({ cliente_id: 3, forma_pagamento: "Pagamento combinado", condicoes_pagamento: "30% agora e restante em 45 dias" });
    expect(pedidoRepository.criar).toHaveBeenCalledWith(expect.objectContaining({
        forma_pagamento: "Pagamento combinado", condicoes_pagamento: "30% agora e restante em 45 dias",
    }));
    await expect(pedidoService.criar({ cliente_id: 3, forma_pagamento: 123 })).rejects.toMatchObject({ status: 400 });
});
