const usuarioService = require("../usuario.service");
const usuarioRepository = require("../usuario.repository");

// Intercepta o repositório de Usuários
jest.mock("../usuario.repository");

describe("UsuarioService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os usuários", async () => {
        // MOCK: Retorna lista mockada de usuários
        const mockUsuarios = [{ id_usuario: 1, nome_completo: "João Silva", email: "joao@email.com" }];
        usuarioRepository.listar.mockResolvedValue(mockUsuarios);

        // AÇÃO: Chama o Service
        const resultado = await usuarioService.listar();

        // VALIDAÇÃO: Confirma equivalência com o mock
        expect(resultado).toEqual(mockUsuarios);
    });

    test("Deve buscar usuário por ID", async () => {
        const mockUsuario = { id_usuario: 1, nome_completo: "João Silva" };
        usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);

        const resultado = await usuarioService.buscarPorId(1);
        expect(resultado).toEqual(mockUsuario);
    });

    test("Deve lançar erro 400 se ID for inválido", async () => {
        await expect(usuarioService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'nome_completo' for omitido", async () => {
        // DADOS: Payload sem o campo obrigatorio nome_completo
        const dadosInvalidos = { email: "a@gmail.com", senha_hash: "123" };

        // AÇÃO & VALIDAÇÃO: Verifica validação do Service
        await expect(usuarioService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'nome_completo' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'email' for omitido", async () => {
        const dadosInvalidos = { nome_completo: "João Silva", senha_hash: "123" };

        await expect(usuarioService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'email' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se o e-mail não terminar com @gmail.com na criação ou atualização", async () => {
        await expect(
            usuarioService.criar({ nome_completo: "João Silva", email: "joao@gmail", senha_hash: "123" })
        )
            .rejects
            .toMatchObject({ status: 400, message: expect.stringContaining("@gmail.com") });

        await expect(usuarioService.atualizar(2, { email: "joao@outlook.com" }))
            .rejects
            .toMatchObject({ status: 400, message: expect.stringContaining("@gmail.com") });
    });

    test("Deve criar usuário com sucesso quando dados forem válidos e normalizar @gmail.com", async () => {
        // DADOS: Payload do usuário completo
        const dadosValidos = { 
            nome_completo: "João Silva", 
            email: "  Joao.Silva@Gmail.COM ", 
            senha_hash: "hash123", 
            cargo_funcao: "Operador" 
        };
        
        // MOCK: Retorna o usuário cadastrado com a chave primária criada
        usuarioRepository.criar.mockResolvedValue({ id_usuario: 1, ...dadosValidos, email: "joao.silva@gmail.com" });

        // AÇÃO: Executa a criação no Service
        const resultado = await usuarioService.criar(dadosValidos);

        // VALIDAÇÃO: Garante normalização e retorno com a propriedade id_usuario
        expect(usuarioRepository.criar).toHaveBeenCalledWith(
            expect.objectContaining({ email: "joao.silva@gmail.com" })
        );
        expect(resultado).toHaveProperty("id_usuario", 1);
    });

    test("Deve atualizar perfil e status ativo sem exigir senha_hash", async () => {
        usuarioRepository.atualizar.mockResolvedValue({
            id_usuario: 2,
            nome_completo: "Maria Técnica",
            perfil: "TECNICO",
            ativo: true,
        });

        const resultado = await usuarioService.atualizar(2, {
            nome_completo: "Maria Técnica",
            perfil: "TECNICO",
            ativo: true,
        });

        expect(usuarioRepository.atualizar).toHaveBeenCalledWith(2, {
            nome_completo: "Maria Técnica",
            perfil: "TECNICO",
            ativo: true,
        });
        expect(resultado.perfil).toBe("TECNICO");
    });

    test("Deve gerar senha_hash com bcrypt se 'senha' em texto plano for informada na atualização", async () => {
        usuarioRepository.atualizar.mockResolvedValue({ id_usuario: 2, nome_completo: "Maria" });

        await usuarioService.atualizar(2, { nome_completo: "Maria", senha: "novaSenha123" });

        const [, payload] = usuarioRepository.atualizar.mock.calls[0];
        expect(payload.senha).toBeUndefined();
        expect(payload.senha_hash).toBeDefined();
        expect(payload.senha_hash.startsWith("$2b$")).toBe(true);
    });
});