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
        const dadosInvalidos = { email: "a@a.com", senha_hash: "123" };

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

    test("Deve criar usuário com sucesso quando dados forem válidos", async () => {
        // DADOS: Payload do usuário completo
        const dadosValidos = { 
            nome_completo: "João Silva", 
            email: "joao@email.com", 
            senha_hash: "hash123", 
            cargo_funcao: "Operador" 
        };
        
        // MOCK: Retorna o usuário cadastrado com a chave primária criada
        usuarioRepository.criar.mockResolvedValue({ id_usuario: 1, ...dadosValidos });

        // AÇÃO: Executa a criação no Service
        const resultado = await usuarioService.criar(dadosValidos);

        // VALIDAÇÃO: Garante retorno com a propriedade id_usuario
        expect(resultado).toHaveProperty("id_usuario", 1);
    });
});