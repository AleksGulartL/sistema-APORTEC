const clienteService = require("../cliente.service");
const clienteRepository = require("../cliente.repository");

// Intercepta a camada de repositório para evitar chamadas reais ao banco de dados
jest.mock("../cliente.repository");

describe("ClienteService - Testes Unitários das Regras de Negócio", () => {
    // Limpa o histórico de chamadas de cada mock após a execução de cada teste
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os clientes cadastrados", async () => {
        // MOCK: Simula o retorno de uma lista de clientes vinda do repositório
        const mockClientes = [{ id_cliente: 1, nome_completo: "Empresa X" }];
        clienteRepository.listar.mockResolvedValue(mockClientes);

        // AÇÃO: Executa o método de listagem da camada de serviço
        const resultado = await clienteService.listar();

        // VALIDAÇÃO: Garante que o retorno é idêntico ao valor provido pelo repositório
        expect(resultado).toEqual(mockClientes);
    });

    test("Deve buscar um cliente por ID válido", async () => {
        // MOCK: Simula a busca de um cliente específico no banco
        const mockCliente = { id_cliente: 1, nome_completo: "Empresa X" };
        clienteRepository.buscarPorId.mockResolvedValue(mockCliente);

        // AÇÃO: Executa a busca passando o ID
        const resultado = await clienteService.buscarPorId(1);

        // VALIDAÇÃO: Garante o retorno do objeto correto do cliente
        expect(resultado).toEqual(mockCliente);
    });

    test("Deve lançar erro HTTP 400 se o ID for numérico ou formato inválido", async () => {
        // AÇÃO & VALIDAÇÃO: Garante que o serviço rejeita IDs não numéricos com mensagem clara e status 400
        await expect(clienteService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o campo 'nome_completo' for omitido", async () => {
        // DADOS: Payloads sem o campo obrigatório
        const dadosInvalidos = { cnpj_cpf: "123", telefone: "999", email: "a@a.com", endereco: "Rua A" };

        // AÇÃO & VALIDAÇÃO: Verifica se a regra de validação bloqueia o cadastro sem chamar o banco
        await expect(clienteService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'nome_completo' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o campo 'cnpj_cpf' for omitido", async () => {
        const dadosInvalidos = { nome_completo: "Empresa X", telefone: "999", email: "a@a.com", endereco: "Rua A" };

        await expect(clienteService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve cadastrar cliente com sucesso quando todos os dados obrigatórios forem válidos", async () => {
        // DADOS: Payload completo do cliente
        const dadosValidos = { 
            nome_completo: "Empresa X", 
            cnpj_cpf: "12345678000199", 
            telefone: "4999999999", 
            email: "contato@empresa.com", 
            endereco: "Rua Central, 100" 
        };
        
        // MOCK: Simula a criação bem-sucedida retornando o objeto com o ID gerado pelo banco
        clienteRepository.criar.mockResolvedValue({ id_cliente: 1, ...dadosValidos });

        // AÇÃO: Executa o método de criação
        const resultado = await clienteService.criar(dadosValidos);

        // VALIDAÇÃO: Confirma se o objeto gerado possui a propriedade chave id_cliente
        expect(resultado).toHaveProperty("id_cliente", 1);
    });
});