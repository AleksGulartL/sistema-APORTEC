const obrasServicosService = require("./obrasServicos.service");
const obrasServicosRepository = require("./obrasServicos.repository");

jest.mock("./obrasServicos.repository");

describe("ObrasServicosService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todas as obras/serviços", async () => {
        const mockObras = [{ id_obra: 1, endereco_instalacao: "Rua A, 100", id_cliente: 1 }];
        obrasServicosRepository.listar.mockResolvedValue(mockObras);

        const resultado = await obrasServicosService.listar();
        expect(resultado).toEqual(mockObras);
    });

    test("Deve buscar obra/serviço por ID", async () => {
        const mockObra = { id_obra: 1, endereco_instalacao: "Rua A, 100", id_cliente: 1 };
        obrasServicosRepository.buscarPorId.mockResolvedValue(mockObra);

        const resultado = await obrasServicosService.buscarPorId(1);
        expect(resultado).toEqual(mockObra);
    });

    test("Deve lançar erro 400 se o ID for inválido", async () => {
        await expect(obrasServicosService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'id_cliente' faltar ou for inválido", async () => {
        const dadosInvalidos = { endereco_instalacao: "Rua A, 100" };

        await expect(obrasServicosService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'id_cliente' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'endereco_instalacao' faltar ou for vazio", async () => {
        const dadosInvalidos = { id_cliente: 1, endereco_instalacao: "   " };

        await expect(obrasServicosService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'endereco_instalacao' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve criar obra/serviço com sucesso quando dados forem válidos", async () => {
        const dadosValidos = { id_cliente: 1, endereco_instalacao: "Rua Central, 500", responsavel_local: "Carlos", contato_local: "49988887777" };
        obrasServicosRepository.criar.mockResolvedValue({ id_obra: 1, ...dadosValidos });

        const resultado = await obrasServicosService.criar(dadosValidos);
        expect(resultado).toHaveProperty("id_obra", 1);
    });
});