const obrasServicosService = require("../obrasServicos.service");
const obrasServicosRepository = require("../obrasServicos.repository");

// Intercepta a camada de repositório de Obras e Serviços
jest.mock("../obrasServicos.repository");

describe("ObrasServicosService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todas as obras/serviços", async () => {
        // MOCK: Simula retorno de obras cadastradas no banco
        const mockObras = [{ id_obra: 1, endereco_instalacao: "Rua A, 100", id_cliente: 1 }];
        obrasServicosRepository.listar.mockResolvedValue(mockObras);

        // AÇÃO: Invoca método do Service
        const resultado = await obrasServicosService.listar();

        // VALIDAÇÃO: Verifica se o array retornado é idêntico ao do repositório
        expect(resultado).toEqual(mockObras);
    });

    test("Deve buscar uma obra/serviço por ID", async () => {
        // MOCK: Retorna objeto do registro
        const mockObra = { id_obra: 1, endereco_instalacao: "Rua A, 100", id_cliente: 1 };
        obrasServicosRepository.buscarPorId.mockResolvedValue(mockObra);

        // AÇÃO: Busca por ID numérico
        const resultado = await obrasServicosService.buscarPorId(1);

        // VALIDAÇÃO: Garante retorno correto do registro
        expect(resultado).toEqual(mockObra);
    });

    test("Deve lançar erro 400 se o ID for inválido", async () => {
        // AÇÃO & VALIDAÇÃO: Rejeita strings e valores não numéricos
        await expect(obrasServicosService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'id_cliente' faltar ou for inválido", async () => {
        // DADOS: Objeto omitindo o id_cliente
        const dadosInvalidos = { endereco_instalacao: "Rua A, 100" };

        // AÇÃO & VALIDAÇÃO: Garante obrigatoriedade do vínculo com o cliente
        await expect(obrasServicosService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'id_cliente' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'endereco_instalacao' faltar ou for vazio", async () => {
        // DADOS: Endereço composto apenas por espaços
        const dadosInvalidos = { id_cliente: 1, endereco_instalacao: "   " };

        // AÇÃO & VALIDAÇÃO: Bloqueia endereços sem texto válido
        await expect(obrasServicosService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'endereco_instalacao' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve criar obra/serviço com sucesso com dados válidos", async () => {
        // DADOS: Payload completo
        const dadosValidos = { 
            id_cliente: 1, 
            endereco_instalacao: "Rua Central, 500", 
            responsavel_local: "Carlos", 
            contato_local: "49988887777" 
        };
        
        // MOCK: Simula a criação no banco de dados com ID gerado
        obrasServicosRepository.criar.mockResolvedValue({ id_obra: 1, ...dadosValidos });

        // AÇÃO: Executa a criação no Service
        const resultado = await obrasServicosService.criar(dadosValidos);

        // VALIDAÇÃO: Confirma id_obra retornado no objeto
        expect(resultado).toHaveProperty("id_obra", 1);
    });
});