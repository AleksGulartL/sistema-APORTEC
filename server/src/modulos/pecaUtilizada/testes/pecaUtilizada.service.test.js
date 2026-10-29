const pecaUtilizadaService = require("../pecaUtilizada.service");
const pecaUtilizadaRepository = require("../pecaUtilizada.repository");

jest.mock("../pecaUtilizada.repository");

describe("PecaUtilizadaService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve registrar peça utilizada com sucesso sem exigir id_peca_os", async () => {
        const dadosEntrada = {
            id_os: 1,
            id_item: 5,
            quantidade_utilizada: 2
        };
        const mockCriado = { id_peca_os: 1, ...dadosEntrada };
        pecaUtilizadaRepository.criar.mockResolvedValue(mockCriado);

        const resultado = await pecaUtilizadaService.criar(dadosEntrada);
        expect(resultado).toEqual(mockCriado);
        expect(pecaUtilizadaRepository.criar).toHaveBeenCalledWith(dadosEntrada);
    });

    test("Deve lançar erro 400 se id_os for ausente", async () => {
        await expect(pecaUtilizadaService.criar({ id_item: 5, quantidade_utilizada: 2 }))
            .rejects
            .toMatchObject({ message: "O campo 'id_os' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve atualizar quantidade de peça utilizada com sucesso", async () => {
        pecaUtilizadaRepository.atualizar.mockResolvedValue([1]);

        await pecaUtilizadaService.atualizar(1, { quantidade_utilizada: 4 });
        expect(pecaUtilizadaRepository.atualizar).toHaveBeenCalledWith(1, { quantidade_utilizada: 4 });
    });

    test("Deve deletar peça utilizada com sucesso", async () => {
        pecaUtilizadaRepository.deletar.mockResolvedValue({ id_peca_os: 1 });

        const resultado = await pecaUtilizadaService.deletar(1);
        expect(resultado).toEqual({ id_peca_os: 1 });
    });
});
