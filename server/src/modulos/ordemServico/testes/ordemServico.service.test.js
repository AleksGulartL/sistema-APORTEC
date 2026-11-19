const ordemServicoService = require("../ordemServico.service");
const ordemServicoRepository = require("../ordemServico.repository");

jest.mock("../ordemServico.repository");

describe("OrdemServicoService - Testes Unitários", () => {
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

    test("Deve atualizar ordem de serviço com sucesso", async () => {
        ordemServicoRepository.atualizar.mockResolvedValue([1]);

        await ordemServicoService.atualizar(1, { status_os: "Finalizada" });
        expect(ordemServicoRepository.atualizar).toHaveBeenCalledWith(1, { status_os: "Finalizada" });
    });

    test("Deve deletar ordem de serviço com sucesso", async () => {
        ordemServicoRepository.deletar.mockResolvedValue({ id: 1 });

        const resultado = await ordemServicoService.deletar(1);
        expect(resultado).toEqual({ id: 1 });
    });
});
