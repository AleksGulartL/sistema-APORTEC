const {
    ehManutencao,
    avaliacaoAprovada,
    exigirLiberacao,
    validarOrcamentoEditavel,
    validarEdicaoPedido,
    gerarNumeroSerie,
    calcularFimGarantia,
    montarDadosConclusaoPedido,
} = require("./fluxoPedido");

describe("fluxoPedido - regras migradas das triggers SQL", () => {
    test("validarOrcamentoEditavel permite editar rascunho e bloqueia orçamento enviado/encerrado", () => {
        expect(() => validarOrcamentoEditavel({ orcamento_enviado: false, status: "Rascunho" })).not.toThrow();
        expect(() => validarOrcamentoEditavel(null)).toThrow("Pedido não encontrado.");
        expect(() => validarOrcamentoEditavel({ orcamento_enviado: true, status: "Pendente" })).toThrow(
            "Reabra o orçamento para revisão antes de alterar seus itens."
        );
        expect(() => validarOrcamentoEditavel({ orcamento_enviado: false, status: "Cancelado" })).toThrow(
            "Reabra o orçamento para revisão antes de alterar seus itens."
        );
        expect(() => validarOrcamentoEditavel({ orcamento_enviado: false, status: "Concluido" })).toThrow(
            "Reabra o orçamento para revisão antes de alterar seus itens."
        );
    });

    test("validarEdicaoPedido protege dados comerciais de orçamento enviado e permite reabrir ou ajustar prazo/técnico", () => {
        const enviado = {
            status: "Pendente",
            orcamento_enviado: true,
            cliente_id: 4,
            tipo_pedido: "Instalacao",
            endereco_instalacao: "Rua A",
            forma_pagamento: "PIX",
            condicoes_pagamento: "À vista",
            percentual_acrescimo: 15,
            diagnostico_tecnico: null,
        };

        expect(() => validarEdicaoPedido(enviado, { responsavel_producao_id: 3, data_previsao_fim: "2026-12-01" })).not.toThrow();
        expect(() => validarEdicaoPedido(enviado, { percentual_acrescimo: "15.00", diagnostico_tecnico: "" })).not.toThrow();
        expect(() => validarEdicaoPedido(enviado, { orcamento_enviado: false, status: "Rascunho" })).not.toThrow();
        expect(() => validarEdicaoPedido(enviado, { percentual_acrescimo: 20 })).toThrow(
            "Reabra o orçamento antes de alterar a proposta enviada ao cliente."
        );
        expect(() => validarEdicaoPedido(enviado, { forma_pagamento: "Boleto" })).toThrow(
            "Reabra o orçamento antes de alterar a proposta enviada ao cliente."
        );
    });

    test("validarEdicaoPedido impede concluir pedido diretamente ou alterar encerramento já registrado", () => {
        expect(() => validarEdicaoPedido({ status: "Pronto para Instalacao", orcamento_enviado: true }, { status: "Concluido" })).toThrow(
            "Finalize a OS com parecer e assinatura para concluir este pedido."
        );

        const concluido = {
            status: "Concluido",
            orcamento_enviado: true,
            assinatura_cliente_instalacao: "Aceite",
            numero_serie: "APORTEC-2026-0001",
            fim_garantia: "2027-11-20",
            data_conclusao: new Date("2026-11-20T12:00:00Z"),
        };

        expect(() => validarEdicaoPedido(concluido, { status: "Aguardando" })).toThrow(
            "O encerramento deste pedido já foi registrado e não pode ser refeito."
        );
        expect(() => validarEdicaoPedido(concluido, { numero_serie: "OUTRO" })).toThrow(
            "O encerramento deste pedido já foi registrado e não pode ser refeito."
        );
    });

    test("montarDadosConclusaoPedido gera série e garantia apenas para instalação e preserva existentes", () => {
        const data = new Date(2026, 10, 20, 15, 30, 0);
        expect(gerarNumeroSerie(7, data)).toBe("APORTEC-2026-0007");
        expect(gerarNumeroSerie(12345, data)).toBe("APORTEC-2026-12345");
        expect(calcularFimGarantia(data)).toBe("2027-11-20");

        const instalacao = montarDadosConclusaoPedido(
            { id: 7, tipo_pedido: "Instalacao", numero_serie: null, fim_garantia: null },
            "Assinatura Cliente",
            data
        );
        expect(instalacao).toEqual({
            status: "Concluido",
            assinatura_cliente_instalacao: "Assinatura Cliente",
            data_conclusao: data,
            numero_serie: "APORTEC-2026-0007",
            fim_garantia: "2027-11-20",
        });

        const instalacaoExistente = montarDadosConclusaoPedido(
            { id: 7, tipo_pedido: "Instalacao", numero_serie: "CUSTOM-01", fim_garantia: "2028-01-01" },
            "Assinatura Cliente",
            data
        );
        expect(instalacaoExistente.numero_serie).toBe("CUSTOM-01");
        expect(instalacaoExistente.fim_garantia).toBe("2028-01-01");

        const manutencao = montarDadosConclusaoPedido(
            { id: 8, tipo_pedido: "Manutencao Corretiva", numero_serie: null, fim_garantia: null },
            "Assinatura Cliente",
            data
        );
        expect(manutencao).toEqual({
            status: "Concluido",
            assinatura_cliente_instalacao: "Assinatura Cliente",
            data_conclusao: data,
        });
    });

    test("ehManutencao, avaliacaoAprovada e exigirLiberacao mantêm comportamento existente", () => {
        expect(ehManutencao({ tipo_pedido: "Manutencao Preventiva" })).toBe(true);
        expect(ehManutencao({ tipo_pedido: "Instalacao" })).toBe(false);
        expect(avaliacaoAprovada({ tipo_pedido: "Manutencao Corretiva", diagnostico_tecnico: "Troca sensor" })).toBe(true);
        expect(() => exigirLiberacao({ status: "Pendente", status_aprovacao: "Pendente" })).toThrow();
    });
});

