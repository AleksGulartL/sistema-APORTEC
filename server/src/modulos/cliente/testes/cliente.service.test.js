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
        const dadosInvalidos = { cnpj_cpf: "123.456.789-00", telefone: "(49) 99999-0101", email: "empresa@gmail.com", endereco: "Rua A" };

        await expect(clienteService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'nome_completo' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o campo 'cnpj_cpf' for omitido", async () => {
        const dadosInvalidos = { nome_completo: "Empresa X", telefone: "(49) 99999-0101", email: "empresa@gmail.com", endereco: "Rua A" };

        await expect(clienteService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'cnpj_cpf' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro HTTP 400 quando o CPF/CNPJ estiver em formato inválido", async () => {
        for (const docInvalido of ["123", "123.456.789", "12.345.678/0001-9", "123abc45678"]) {
            await expect(
                clienteService.criar({
                    nome_completo: "Empresa X",
                    cnpj_cpf: docInvalido,
                    telefone: "(49) 99999-0101",
                    email: "empresa@gmail.com",
                    endereco: "Rua Central, 100",
                })
            )
                .rejects
                .toMatchObject({
                    status: 400,
                    message: expect.stringContaining("000.000.000-00"),
                });
        }

        await expect(clienteService.atualizar(1, { cnpj_cpf: "12345" }))
            .rejects
            .toMatchObject({
                status: 400,
                message: expect.stringContaining("00.000.000/0001-00"),
            });
    });

    test("Deve lançar erro HTTP 400 quando o telefone estiver em formato inválido", async () => {
        for (const telInvalido of ["999", "49-99999-0101", "(49) 9999-01011", "499999999999"]) {
            await expect(
                clienteService.criar({
                    nome_completo: "Empresa X",
                    cnpj_cpf: "123.456.789-00",
                    telefone: telInvalido,
                    email: "empresa@gmail.com",
                    endereco: "Rua Central, 100",
                })
            )
                .rejects
                .toMatchObject({
                    status: 400,
                    message: expect.stringContaining("(00) 00000-0000"),
                });
        }

        await expect(clienteService.atualizar(1, { telefone: "12345" }))
            .rejects
            .toMatchObject({
                status: 400,
                message: expect.stringContaining("(00) 00000-0000"),
            });
    });

    test("Deve lançar erro HTTP 400 quando o e-mail não contiver '@' e '.com'", async () => {
        for (const emailInvalido of ["cliente01@gmail", "contato@empresa.org", "cliente01", "@empresa.com", "cliente@.com"]) {
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
                    message: expect.stringContaining(".com"),
                });
        }

        await expect(clienteService.atualizar(1, { email: "cliente@hotmail" }))
            .rejects
            .toMatchObject({
                status: 400,
                message: expect.stringContaining(".com"),
            });
    });

    test("Deve cadastrar cliente com sucesso e normalizar CPF/CNPJ, telefone e e-mail", async () => {
        const dadosValidos = {
            nome_completo: "Empresa X",
            cnpj_cpf: "12345678000199",
            telefone: "4999999999",
            email: "  Contato@Empresa.COM ",
            endereco: "Rua Central, 100",
        };

        clienteRepository.criar.mockResolvedValue({
            usuario_id: 1,
            ...dadosValidos,
            cnpj_cpf: "12.345.678/0001-99",
            telefone: "(49) 9999-9999",
            email: "contato@empresa.com",
        });

        const resultado = await clienteService.criar(dadosValidos);

        expect(clienteRepository.criar).toHaveBeenCalledWith(
            expect.objectContaining({
                cnpj_cpf: "12.345.678/0001-99",
                telefone: "(49) 9999-9999",
                email: "contato@empresa.com",
            })
        );
        expect(resultado).toHaveProperty("usuario_id", 1);
    });

    test("Deve atualizar apenas os campos enviados sem exigir CPF/CNPJ, telefone ou e-mail omitidos", async () => {
        clienteRepository.atualizar.mockResolvedValue({
            usuario_id: 1,
            endereco: "Rua Nova, 200",
        });

        const resultado = await clienteService.atualizar(1, { endereco: "Rua Nova, 200" });

        expect(clienteRepository.atualizar).toHaveBeenCalledWith(1, { endereco: "Rua Nova, 200" });
        expect(resultado).toHaveProperty("endereco", "Rua Nova, 200");
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
