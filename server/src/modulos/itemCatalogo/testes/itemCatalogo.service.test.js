const itemCatalogoService = require("../itemCatalogo.service");
const itemCatalogoRepository = require("../itemCatalogo.repository");

// Intercepta a camada de acesso ao banco de dados para isolar a regra de negócio
jest.mock("../itemCatalogo.repository");

describe("ItemCatalogoService - Testes Unitários", () => {
    // Limpa os mocks após cada execução de teste para evitar vazamento de estado
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os itens do catálogo", async () => {
        // MOCK: Simula o retorno de uma lista de itens do repositório
        const mockItens = [{ id_item: 1, descricao: "Motor 2HP", tipo: "Insumo" }];
        itemCatalogoRepository.listar.mockResolvedValue(mockItens);

        // AÇÃO: Executa o método de listagem no Service
        const resultado = await itemCatalogoService.listar();

        // VALIDAÇÃO: Confirma se o resultado corresponde ao mock do repositório
        expect(resultado).toEqual(mockItens);
    });

    test("Deve buscar um item por ID válido", async () => {
        // MOCK: Simula a busca de um item específico por ID
        const mockItem = { id_item: 1, descricao: "Motor 2HP", tipo: "Insumo" };
        itemCatalogoRepository.buscarPorId.mockResolvedValue(mockItem);

        // AÇÃO: Executa a busca passando um ID numérico
        const resultado = await itemCatalogoService.buscarPorId(1);

        // VALIDAÇÃO: Confirma se o item correto foi retornado
        expect(resultado).toEqual(mockItem);
    });

    test("Deve lançar erro 400 se o ID for inválido", async () => {
        // AÇÃO & VALIDAÇÃO: Bloqueia IDs que não sejam números inteiros positivos
        await expect(itemCatalogoService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se o campo 'tipo' for omitido", async () => {
        // DADOS: Payload sem o tipo
        const dadosInvalidos = { descricao: "Perfil de Alumínio", unidade_medida: "M" };

        // AÇÃO & VALIDAÇÃO: Garante a obrigatoriedade do campo tipo
        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'tipo' é obrigatório.", status: 400 });
    });

    test("Deve lançar erro 400 se o campo 'tipo' tiver valor fora do ENUM (Insumo, Porta, Peca)", async () => {
        // DADOS: Tipo com valor não permitido pelo banco
        const dadosInvalidos = { tipo: "Invalido", descricao: "Perfil de Alumínio", unidade_medida: "M" };

        // AÇÃO & VALIDAÇÃO: Valida o tipo antes de estourar erro de restrição no banco
        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'tipo' deve ser 'Insumo', 'Porta' ou 'Peca'.", status: 400 });
    });

    test("Deve lançar erro 400 se 'descricao' for omitida ou for apenas espaço em branco", async () => {
        // DADOS: Descrição vazia ou composta por espaços
        const dadosInvalidos = { tipo: "Insumo", descricao: "   ", unidade_medida: "M" };

        // AÇÃO & VALIDAÇÃO: Impede descrições sem conteúdo útil
        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'descricao' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'unidade_medida' for omitida", async () => {
        const dadosInvalidos = { tipo: "Insumo", descricao: "Perfil de Alumínio", unidade_medida: "" };

        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'unidade_medida' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'valor_unitario_padrao' for negativo", async () => {
        // DADOS: Valor numérico negativo
        const dadosInvalidos = { tipo: "Insumo", descricao: "Perfil", unidade_medida: "M", valor_unitario_padrao: -10 };

        // AÇÃO & VALIDAÇÃO: Impede cadastro de valores negativos
        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O 'valor_unitario_padrao' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve lançar erro 400 se 'quantidade_estoque' for negativa", async () => {
        // DADOS: Estoque negativo
        const dadosInvalidos = { tipo: "Insumo", descricao: "Perfil", unidade_medida: "M", quantidade_estoque: -5 };

        // AÇÃO & VALIDAÇÃO: Bloqueia contagem negativa de estoque no cadastro
        await expect(itemCatalogoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "A 'quantidade_estoque' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve criar item do catálogo com sucesso quando os dados forem válidos", async () => {
        // DADOS: Payload completo e válido
        const dadosValidos = { 
            tipo: "Insumo", 
            descricao: "Perfil de Alumínio 50mm", 
            unidade_medida: "M", 
            valor_unitario_padrao: 25.5, 
            quantidade_estoque: 50 
        };
        
        // MOCK: Simula o salvamento e retorno com a PK gerada
        itemCatalogoRepository.criar.mockResolvedValue({ id_item: 1, ...dadosValidos });

        // AÇÃO: Executa a criação no Service
        const resultado = await itemCatalogoService.criar(dadosValidos);

        // VALIDAÇÃO: Confirma a presença do id_item gerado no objeto retornado
        expect(resultado).toHaveProperty("id_item", 1);
    });

    test("RF10: Deve listar itens com alerta de estoque mínimo atingido", async () => {
        const mockAlertas = [
            {
                id_item: 4,
                codigo_referencia: "SENS-01",
                descricao: "Sensor de Presença",
                tipo: "Peca",
                quantidade_estoque: 2,
                quantidade_reservada: 1,
                estoque_minimo: 5,
            },
        ];
        itemCatalogoRepository.listarAlertasEstoqueMinimo.mockResolvedValue(mockAlertas);

        const resultado = await itemCatalogoService.listarAlertasEstoqueMinimo();

        expect(resultado).toEqual(mockAlertas);
        expect(itemCatalogoRepository.listarAlertasEstoqueMinimo).toHaveBeenCalledTimes(1);
    });
});