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
        const dadosInvalidos = { cnpj_cpf: "123", telefone: "999", email: "empresa@gmail.com", endereco: "Rua A" };

        // AÇÃO & VALIDAÇÃO: Verifica se a regra de validação bloqueia o cadastro sem chamar o banco
        await expect(clienteService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'nome_completo' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o campo 'cnpj_cpf' for omitido", async () => {
        const dadosInvalidos = { nome_completo: "Empresa X", telefone: "999", email: "empresa@gmail.com", endereco: "Rua A" };

        await expect(clienteService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o e-mail não terminar com @gmail.com", async () => {
        for (const emailInvalido of ["cliente01@gmail", "contato@empresa.com", "cliente01", "@gmail.com"]) {
            await expect(
                clienteService.criar({
                    nome_completo: "Empresa X",
                    cnpj_cpf: "12345678000199",
                    telefone: "4999999999",
                    email: emailInvalido,
                    endereco: "Rua Central, 100",
                })
            )
                .rejects
                .toMatchObject({
                    status: 400,
                    message: expect.stringContaining("@gmail.com"),
                });
        }

        await expect(clienteService.atualizar(1, { email: "cliente@hotmail.com" }))
            .rejects
            .toMatchObject({
                status: 400,
                message: expect.stringContaining("@gmail.com"),
            });
    });

    test("Deve cadastrar cliente com sucesso quando todos os dados obrigatórios forem válidos e normalizar @gmail.com", async () => {
        // DADOS: Payload completo do cliente
        const dadosValidos = { 
            nome_completo: "Empresa X", 
            cnpj_cpf: "12345678000199", 
            telefone: "4999999999", 
            email: "  Contato@Gmail.COM ", 
            endereco: "Rua Central, 100" 
        };
        
        // MOCK: Simula a criação bem-sucedida retornando o objeto com o ID gerado pelo banco
        clienteRepository.criar.mockResolvedValue({ id_cliente: 1, ...dadosValidos, email: "contato@gmail.com" });

        // AÇÃO: Executa o método de criação
        const resultado = await clienteService.criar(dadosValidos);

        // VALIDAÇÃO: Confirma normalização e propriedade chave id_cliente
        expect(clienteRepository.criar).toHaveBeenCalledWith(
            expect.objectContaining({ email: "contato@gmail.com" })
        );
        expect(resultado).toHaveProperty("id_cliente", 1);
    });

    test("Deve cadastrar cliente vinculado a um usuario_id existente sem exigir repetição de nome_completo e email (Alternativa A)", async () => {
        const dadosEspecializacao = {
            usuario_id: 10,
            cnpj_cpf: "98765432000188",
            telefone: "49988887777",
            endereco: "Av. Getúlio Vargas, 500",
        };

        clienteRepository.criar.mockResolvedValue({
            id: 2,
            id_cliente: 2,
            ...dadosEspecializacao,
            usuario: {
                id: 10,
                nome_completo: "Construtora Alfa",
                email: "contato@construtoraalfa.com",
                perfil: "CLIENTE",
            },
        });

        const resultado = await clienteService.criar(dadosEspecializacao);

        expect(resultado).toHaveProperty("id_cliente", 2);
        expect(resultado).toHaveProperty("usuario_id", 10);
        expect(resultado.usuario.nome_completo).toBe("Construtora Alfa");
    });
});