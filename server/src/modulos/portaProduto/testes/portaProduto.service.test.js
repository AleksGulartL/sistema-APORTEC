const portaProdutoService = require("../portaProduto.service");
const portaProdutoRepository = require("../portaProduto.repository");

jest.mock("../portaProduto.repository");

describe("PortaProdutoService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve criar porta/produto com sucesso sem exigir id_porta", async () => {
        const dadosEntrada = {
            numero_serie: "PORTA-2026-001",
            id_obra: 3,
            modelo_automatizador: "Pivotante Dupla Master",
            data_instalacao: "2026-11-01"
        };
        const mockCriado = { id_porta: 1, ...dadosEntrada };
        portaProdutoRepository.criar.mockResolvedValue(mockCriado);

        const resultado = await portaProdutoService.criar(dadosEntrada);
        expect(resultado).toEqual(mockCriado);
        expect(portaProdutoRepository.criar).toHaveBeenCalledWith(dadosEntrada);
    });

    test("Deve lançar erro 400 se numero_serie for ausente", async () => {
        await expect(portaProdutoService.criar({ id_obra: 3, modelo_automatizador: "Pivotante" }))
            .rejects
            .toMatchObject({ message: "O campo 'numero_serie' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se id_obra for inválido", async () => {
        await expect(portaProdutoService.criar({ numero_serie: "SN123", id_obra: "abc", modelo_automatizador: "Pivotante" }))
            .rejects
            .toMatchObject({ message: "O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve atualizar porta/produto com sucesso", async () => {
        portaProdutoRepository.atualizar.mockResolvedValue([1]);

        await portaProdutoService.atualizar(1, { modelo_automatizador: "Deslizante Mega" });
        expect(portaProdutoRepository.atualizar).toHaveBeenCalledWith(1, { modelo_automatizador: "Deslizante Mega" });
    });

    test("Deve deletar porta/produto com sucesso", async () => {
        portaProdutoRepository.deletar.mockResolvedValue({ id_porta: 1 });

        const resultado = await portaProdutoService.deletar(1);
        expect(resultado).toEqual({ id_porta: 1 });
    });
});
