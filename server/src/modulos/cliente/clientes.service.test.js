const clientesService = require("./clientes.service");
const clientesRepository = require("./clientes.repository");

jest.mock("./clientes.repository");

describe("ClientesService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os clientes", async () => {
        const mockClientes = [{ id_cliente: 1, nome_completo: "Empresa X" }];
        clientesRepository.listar.mockResolvedValue(mockClientes);

        const resultado = await clientesService.listar();
        expect(resultado).toEqual(mockClientes);
    });

    test("Deve buscar cliente por ID", async () => {
        const mockCliente = { id_cliente: 1, nome_completo: "Empresa X" };
        clientesRepository.buscarPorId.mockResolvedValue(mockCliente);

        const resultado = await clientesService.buscarPorId(1);
        expect(resultado).toEqual(mockCliente);
    });

    test("Deve lançar erro 400 se o ID for inválido", async () => {
        await expect(clientesService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'nome_completo' faltar", async () => {
        const dadosInvalidos = { cnpj_cpf: "123", telefone: "999", email: "a@a.com", endereco: "Rua A" };

        await expect(clientesService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'nome_completo' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'cnpj_cpf' faltar", async () => {
        const dadosInvalidos = { nome_completo: "Empresa X", telefone: "999", email: "a@a.com", endereco: "Rua A" };

        await expect(clientesService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve criar cliente com sucesso quando todos os dados forem válidos", async () => {
        const dadosValidos = { nome_completo: "Empresa X", cnpj_cpf: "12345678000199", telefone: "4999999999", email: "contato@empresa.com", endereco: "Rua Central, 100" };
        clientesRepository.criar.mockResolvedValue({ id_cliente: 1, ...dadosValidos });

        const resultado = await clientesService.criar(dadosValidos);
        expect(resultado).toHaveProperty("id_cliente", 1);
    });
});