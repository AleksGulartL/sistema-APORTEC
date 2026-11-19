const itemCatalogoService = require("../itemCatalogo.service");
const itemCatalogoRepository = require("../itemCatalogo.repository");

jest.mock("../itemCatalogo.repository");

describe("ItemCatalogoService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os itens do catálogo", async () => {
        const mockItens = [{ id: 1, descricao: "Motor 2HP", tipo_id: 1, categoria_id: 1 }];
        itemCatalogoRepository.listar.mockResolvedValue(mockItens);

        const resultado = await itemCatalogoService.listar();
        expect(resultado).toEqual(mockItens);
    });

    test("Deve listar tipos e categorias do catálogo", async () => {
        itemCatalogoRepository.listarTipos.mockResolvedValue([{ id: 1, nome: "Kit" }]);
        itemCatalogoRepository.listarCategorias.mockResolvedValue([{ id: 1, nome: "Automatizadores" }]);

        await expect(itemCatalogoService.listarTipos()).resolves.toEqual([{ id: 1, nome: "Kit" }]);
        await expect(itemCatalogoService.listarCategorias()).resolves.toEqual([{ id: 1, nome: "Automatizadores" }]);
    });

    test("Deve buscar um item por ID válido", async () => {
        const mockItem = { id: 1, descricao: "Motor 2HP", tipo_id: 1, categoria_id: 1 };
        itemCatalogoRepository.buscarPorId.mockResolvedValue(mockItem);

        const resultado = await itemCatalogoService.buscarPorId(1);
        expect(resultado).toEqual(mockItem);
    });

    test("Deve lançar erro 400 se o ID for inválido", async () => {
        await expect(itemCatalogoService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se o campo 'tipo_id' for omitido ou inválido", async () => {
        await expect(
            itemCatalogoService.criar({ categoria_id: 1, descricao: "Perfil de Alumínio", unidade_medida: "M" })
        )
            .rejects
            .toMatchObject({ message: "O campo 'tipo_id' é obrigatório e deve ser um ID válido.", status: 400 });
    });

    test("Deve lançar erro 400 se o campo 'categoria_id' for omitido ou inválido", async () => {
        await expect(
            itemCatalogoService.criar({ tipo_id: 1, descricao: "Perfil de Alumínio", unidade_medida: "M" })
        )
            .rejects
            .toMatchObject({ message: "O campo 'categoria_id' é obrigatório e deve ser um ID válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'descricao' for omitida ou for apenas espaço em branco", async () => {
        const dadosInvalidos = { tipo_id: 1, categoria_id: 1, descricao: "   ", unidade_medida: "M" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'descricao' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'unidade_medida' for omitida", async () => {
        const dadosInvalidos = { tipo_id: 1, categoria_id: 1, descricao: "Perfil de Alumínio", unidade_medida: "" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'unidade_medida' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'valor_unitario_padrao' for negativo", async () => {
        const dadosInvalidos = {
            tipo_id: 1,
            categoria_id: 1,
            descricao: "Perfil",
            unidade_medida: "M",
            valor_unitario_padrao: -10,
        };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O 'valor_unitario_padrao' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve lançar erro 400 se 'quantidade_atual' for negativa", async () => {
        const dadosInvalidos = {
            tipo_id: 1,
            categoria_id: 1,
            descricao: "Perfil",
            unidade_medida: "M",
            quantidade_atual: -5,
        };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "A 'quantidade_atual' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve criar item do catálogo com sucesso quando os dados forem válidos", async () => {
        const dadosValidos = {
            tipo_id: 1,
            categoria_id: 2,
            descricao: "Perfil de Alumínio 50mm",
            unidade_medida: "M",
            valor_unitario_padrao: 25.5,
            quantidade_atual: 50,
            estoque_minimo: 10,
        };

        itemCatalogoRepository.criar.mockResolvedValue({ id: 1, ...dadosValidos });

        const resultado = await itemCatalogoService.criar(dadosValidos);
        expect(resultado).toHaveProperty("id", 1);
    });

    test("RF10: Deve listar itens com alerta de estoque mínimo atingido", async () => {
        const mockAlertas = [
            {
                id: 4,
                codigo_referencia: "SENS-01",
                descricao: "Sensor de Presença",
                tipo_id: 3,
                categoria_id: 7,
                quantidade_atual: 2,
                estoque_minimo: 5,
            },
        ];
        itemCatalogoRepository.listarAlertasEstoqueMinimo.mockResolvedValue(mockAlertas);

        const resultado = await itemCatalogoService.listarAlertasEstoqueMinimo();

        expect(resultado).toEqual(mockAlertas);
        expect(itemCatalogoRepository.listarAlertasEstoqueMinimo).toHaveBeenCalledTimes(1);
    });
});
