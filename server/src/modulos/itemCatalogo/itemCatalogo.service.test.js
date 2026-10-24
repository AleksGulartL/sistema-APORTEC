const itemCatalogoService = require("./itemCatalogo.service");
const itemCatalogoRepository = require("./itemCatalogo.repository");

jest.mock("./itemCatalogo.repository");

describe("ItemCatalogoService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os itens do catálogo", async () => {
        const mockItens = [{ id_item: 1, descricao: "Motor", tipo: "Insumo" }];
        itemCatalogoRepository.listar.mockResolvedValue(mockItens);

        const resultado = await itemCatalogoService.listar();
        expect(resultado).toEqual(mockItens);
    });

    test("Deve buscar item por ID com sucesso", async () => {
        const mockItem = { id_item: 1, descricao: "Motor", tipo: "Insumo" };
        itemCatalogoRepository.buscarPorId.mockResolvedValue(mockItem);

        const resultado = await itemCatalogoService.buscarPorId(1);
        expect(resultado).toEqual(mockItem);
    });

    test("Deve lançar erro 400 se ID for inválido", async () => {
        await expect(itemCatalogoService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se o campo 'tipo' faltar", async () => {
        const dadosInvalidos = { descricao: "Perfil", unidade_medida: "M" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'tipo' é obrigatório.", status: 400 });
    });

    test("Deve lançar erro 400 se o campo 'tipo' for inválido", async () => {
        const dadosInvalidos = { tipo: "Invalido", descricao: "Perfil", unidade_medida: "M" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'tipo' deve ser 'Insumo', 'Porta' ou 'Peca'.", status: 400 });
    });

    test("Deve lançar erro 400 se 'descricao' faltar ou for vazia", async () => {
        const dadosInvalidos = { tipo: "Insumo", descricao: "   ", unidade_medida: "M" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'descricao' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'unidade_medida' faltar ou for vazia", async () => {
        const dadosInvalidos = { tipo: "Insumo", descricao: "Perfil", unidade_medida: "" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'unidade_medida' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'valor_unitario_padrao' for negativo", async () => {
        const dadosInvalidos = { tipo: "Insumo", descricao: "Perfil", unidade_medida: "M", valor_unitario_padrao: -10 };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O 'valor_unitario_padrao' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve lançar erro 400 se 'quantidade_estoque' for negativa", async () => {
        const dadosInvalidos = { tipo: "Insumo", descricao: "Perfil", unidade_medida: "M", quantidade_estoque: -5 };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "A 'quantidade_estoque' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve criar item com sucesso quando todos os dados forem válidos", async () => {
        const dadosValidos = { tipo: "Insumo", descricao: "Perfil", unidade_medida: "M", valor_unitario_padrao: 15.5, quantidade_estoque: 100 };
        itemCatalogoRepository.criar.mockResolvedValue({ id_item: 1, ...dadosValidos });

        const resultado = await itemCatalogoService.criar(dadosValidos);
        expect(resultado).toHaveProperty("id_item", 1);
    });
});