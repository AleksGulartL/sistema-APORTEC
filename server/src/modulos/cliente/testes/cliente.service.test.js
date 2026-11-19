const clienteService = require("../cliente.service");
const clienteRepository = require("../cliente.repository");

jest.mock("../cliente.repository");

describe("ClienteService - Testes Unitários das Regras de Negócio", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os clientes cadastrados", async () => {
        const mockClientes = [{ usuario_id: 1, cnpj_cpf: "12345678000199" }];
        clienteRepository.listar.mockResolvedValue(mockClientes);

        const resultado = await clienteService.listar();
        expect(resultado).toEqual(mockClientes);
    });

    test("Deve buscar um cliente por ID válido", async () => {
        const mockCliente = { usuario_id: 1, cnpj_cpf: "12345678000199" };
        clienteRepository.buscarPorId.mockResolvedValue(mockCliente);

        const resultado = await clienteService.buscarPorId(1);
        expect(resultado).toEqual(mockCliente);
    });

    test("Deve lançar erro HTTP 400 se o ID for formato inválido", async () => {
        await expect(clienteService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o campo 'nome_completo' for omitido", async () => {
        const dadosInvalidos = { cnpj_cpf: "123", telefone: "999", email: "empresa@gmail.com", endereco: "Rua A" };

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
        const dadosValidos = {
            nome_completo: "Empresa X",
            cnpj_cpf: "12345678000199",
            telefone: "4999999999",
            email: "  Contato@Gmail.COM ",
            endereco: "Rua Central, 100",
        };

        clienteRepository.criar.mockResolvedValue({ usuario_id: 1, ...dadosValidos, email: "contato@gmail.com" });

        const resultado = await clienteService.criar(dadosValidos);

        expect(clienteRepository.criar).toHaveBeenCalledWith(
            expect.objectContaining({ email: "contato@gmail.com" })
        );
        expect(resultado).toHaveProperty("usuario_id", 1);
    });

    test("Deve cadastrar cliente vinculado a um usuario_id existente sem exigir repetição de nome_completo e email", async () => {
        const dadosEspecializacao = {
            usuario_id: 10,
            cnpj_cpf: "98765432000188",
            telefone: "49988887777",
            endereco: "Av. Getúlio Vargas, 500",
        };

        clienteRepository.criar.mockResolvedValue({
            usuario_id: 10,
            ...dadosEspecializacao,
            usuario: {
                id: 10,
                nome_completo: "Construtora Alfa",
                email: "construtoraalfa@gmail.com",
                perfil: "CLIENTE",
            },
        });

        const resultado = await clienteService.criar(dadosEspecializacao);

        expect(resultado).toHaveProperty("usuario_id", 10);
        expect(resultado.usuario.nome_completo).toBe("Construtora Alfa");
    });
});
