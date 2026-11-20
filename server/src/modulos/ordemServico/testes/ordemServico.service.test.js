const ordemServicoService = require("../ordemServico.service");
const ordemServicoRepository = require("../ordemServico.repository");

jest.mock("../ordemServico.repository");
jest.mock("../../pedido/pedido.repository");
jest.mock("../../../utils/validarTecnico", () => ({ validarTecnico: jest.fn().mockResolvedValue(undefined) }));

describe("OrdemServicoService - Testes Unitários", () => {
    beforeEach(() => {
        require("../../pedido/pedido.repository").buscarPorId.mockResolvedValue({
            id: 10, tipo_pedido: "Instalacao", status: "Pronto para Instalacao", status_aprovacao: "Aprovado", orcamento_enviado: true,
            bloqueio_fabricacao: false, checklist_medicao: { status_aprovacao: "Aprovado", viga_ok: true, piso_ok: true, ponto_eletrico_ok: true },
        });
        ordemServicoRepository.buscarPorId.mockResolvedValue({ id: 1, pedido_id: 10, tipo_servico: "Instalacao", tecnico_responsavel_id: 2, status_os: "Aberta" });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve criar ordem de serviço com sucesso vinculada ao pedido", async () => {
        const dadosEntrada = {
            pedido_id: 10,
            tecnico_responsavel_id: 2,
            tipo_servico: "Instalacao",
            origem_cobertura: "Garantia",
            status_os: "Aberta",
        };
        const mockCriado = { id: 1, ...dadosEntrada };
        ordemServicoRepository.criar.mockResolvedValue(mockCriado);

        const resultado = await ordemServicoService.criar(dadosEntrada);
        expect(resultado).toEqual(mockCriado);
        expect(ordemServicoRepository.criar).toHaveBeenCalledWith(
            expect.objectContaining({
                pedido_id: 10,
                tecnico_responsavel_id: 2,
                tipo_servico: "Instalacao",
            })
        );
    });

    test("Deve lançar erro 400 se pedido_id for ausente", async () => {
        await expect(
            ordemServicoService.criar({ tecnico_responsavel_id: 2, tipo_servico: "Instalacao" })
        ).rejects.toMatchObject({
            message: "O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.",
            status: 400,
        });
    });

    test("Deve lançar erro 400 se tipo_servico for inválido", async () => {
        await expect(
            ordemServicoService.criar({ pedido_id: 10, tecnico_responsavel_id: 2, tipo_servico: "Invalido" })
        ).rejects.toMatchObject({
            message:
                "O campo 'tipo_servico' é obrigatório e deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'.",
            status: 400,
        });
    });

    test("finaliza com parecer e assinatura, sem aceitar uma data de conclusão arbitrária", async () => {
        const dados = { status_os: "Finalizada", parecer_tecnico: "Porta instalada", assinatura_cliente_digital: "TESTE - aceite" };
        await ordemServicoService.atualizar(1, { ...dados, data_conclusao: "2000-01-01" });
        expect(ordemServicoRepository.atualizar).toHaveBeenCalledWith(1, dados);
    });

    test.each([
        { parecer_tecnico: "", assinatura_cliente_digital: "aceite" },
        { parecer_tecnico: "Instalado", assinatura_cliente_digital: " " },
    ])("não finaliza sem parecer e assinatura: %j", async (dados) => {
        await expect(ordemServicoService.atualizar(1, { status_os: "Finalizada", ...dados })).rejects.toMatchObject({ status: 400 });
        expect(ordemServicoRepository.atualizar).not.toHaveBeenCalled();
    });

    test("não finaliza instalação antes de concluir a produção", async () => {
        require("../../pedido/pedido.repository").buscarPorId.mockResolvedValue({ tipo_pedido: "Instalacao", status: "Montagem", status_aprovacao: "Aprovado", orcamento_enviado: true,
            bloqueio_fabricacao: false, checklist_medicao: { status_aprovacao: "Aprovado" } });
        await expect(ordemServicoService.atualizar(1, { status_os: "Finalizada", parecer_tecnico: "Instalado", assinatura_cliente_digital: "aceite" })).rejects.toMatchObject({ status: 400 });
    });

    test("não cria uma OS diretamente finalizada", async () => {
        await expect(ordemServicoService.criar({ pedido_id: 10, tipo_servico: "Instalacao", status_os: "Finalizada" })).rejects.toMatchObject({ status: 400 });
    });

    test("não permite refazer, editar ou excluir uma OS finalizada", async () => {
        ordemServicoRepository.buscarPorId.mockResolvedValue({ status_os: "Finalizada", pedido_id: 10, tipo_servico: "Instalacao" });
        await expect(ordemServicoService.atualizar(1, { status_os: "Finalizada" })).rejects.toMatchObject({ status: 409 });
        await expect(ordemServicoService.atualizar(1, { descricao_problema: "alterado" })).rejects.toMatchObject({ status: 409 });
        await expect(ordemServicoService.deletar(1)).rejects.toMatchObject({ status: 409 });
        expect(ordemServicoRepository.atualizar).not.toHaveBeenCalled();
        expect(ordemServicoRepository.deletar).not.toHaveBeenCalled();
    });

    test("Deve deletar ordem de serviço com sucesso", async () => {
        ordemServicoRepository.deletar.mockResolvedValue({ id: 1 });

        const resultado = await ordemServicoService.deletar(1);
        expect(resultado).toEqual({ id: 1 });
    });
});
