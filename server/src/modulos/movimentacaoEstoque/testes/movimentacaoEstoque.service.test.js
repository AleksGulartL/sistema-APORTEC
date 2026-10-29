const movimentacaoEstoqueService = require("../movimentacaoEstoque.service");
const movimentacaoEstoqueRepository = require("../movimentacaoEstoque.repository");

jest.mock("../movimentacaoEstoque.repository");

describe("MovimentacaoEstoqueService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve registrar movimentação de estoque com sucesso sem exigir id_movimentacao", async () => {
        const dadosEntrada = {
            id_item: 1,
            id_usuario: 2,
            tipo_movimentacao: "Entrada",
            quantidade: 50.0,
            fornecedor: "Distribuidora Portas & Motores"
        };
        const mockCriado = { id_movimentacao: 1, ...dadosEntrada };
        movimentacaoEstoqueRepository.criar.mockResolvedValue(mockCriado);

        const resultado = await movimentacaoEstoqueService.criar(dadosEntrada);
        expect(resultado).toEqual(mockCriado);
        expect(movimentacaoEstoqueRepository.criar).toHaveBeenCalledWith(dadosEntrada);
    });

    test("Deve lançar erro 400 se id_item for ausente", async () => {
        await expect(movimentacaoEstoqueService.criar({ id_usuario: 2, tipo_movimentacao: "Entrada", quantidade: 10 }))
            .rejects
            .toMatchObject({ message: "O campo 'id_item' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se tipo_movimentacao for inválido", async () => {
        await expect(movimentacaoEstoqueService.criar({ id_item: 1, id_usuario: 2, tipo_movimentacao: "Invalido", quantidade: 10 }))
            .rejects
            .toMatchObject({ message: "O campo 'tipo_movimentacao' é obrigatório e deve ser 'Entrada', 'Baixa_Producao', 'Baixa_OS' ou 'Ajuste'.", status: 400 });
    });

    test("Deve atualizar movimentação com sucesso", async () => {
        movimentacaoEstoqueRepository.atualizar.mockResolvedValue([1]);

        await movimentacaoEstoqueService.atualizar(1, { quantidade: 30 });
        expect(movimentacaoEstoqueRepository.atualizar).toHaveBeenCalledWith(1, { quantidade: 30 });
    });

    test("Deve deletar movimentação com sucesso", async () => {
        movimentacaoEstoqueRepository.deletar.mockResolvedValue({ id_movimentacao: 1 });

        const resultado = await movimentacaoEstoqueService.deletar(1);
        expect(resultado).toEqual({ id_movimentacao: 1 });
    });
});
