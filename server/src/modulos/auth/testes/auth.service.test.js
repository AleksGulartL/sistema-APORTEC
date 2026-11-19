const authService = require("../auth.service");
const authRepository = require("../auth.repository");
const bcrypt = require("bcrypt");

jest.mock("../auth.repository");

describe("AuthService - Testes Unitários de Autenticação", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("hashearSenha e verificarSenha", () => {
        test("Deve gerar hash bcrypt válido e validar senha corretamente", async () => {
            const senhaPlana = "minhasenha123";
            const hash = await authService.hashearSenha(senhaPlana);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(senhaPlana);
            expect(hash.startsWith("$2b$")).toBe(true);

            const ehValida = await authService.verificarSenha(senhaPlana, hash);
            expect(ehValida).toBe(true);

            const ehInvalida = await authService.verificarSenha("senhaerrada", hash);
            expect(ehInvalida).toBe(false);
        });
    });

    describe("autenticarUsuario", () => {
        test("Deve falhar se o e-mail não for informado", async () => {
            const res = await authService.autenticarUsuario("", "123456");
            expect(res.sucesso).toBe(false);
            expect(res.mensagem).toBe("E-mail e senha são obrigatórios.");
        });

        test("Deve falhar se a senha não for informada", async () => {
            const res = await authService.autenticarUsuario("user@aportec.com", "");
            expect(res.sucesso).toBe(false);
            expect(res.mensagem).toBe("E-mail e senha são obrigatórios.");
        });

        test("Deve retornar credenciais inválidas se o usuário não for encontrado", async () => {
            authRepository.buscarPorEmail.mockResolvedValue(null);

            const res = await authService.autenticarUsuario("inexistente@aportec.com", "123456");
            expect(res.sucesso).toBe(false);
            expect(res.mensagem).toBe("Credenciais inválidas.");
        });

        test("Deve retornar credenciais inválidas se a senha estiver incorreta", async () => {
            const senhaCorretaHash = await bcrypt.hash("senhaCorreta", 10);
            authRepository.buscarPorEmail.mockResolvedValue({
                id_usuario: 1,
                nome_completo: "Carlos Silva",
                email: "carlos@aportec.com",
                senha_hash: senhaCorretaHash,
                            authRepository.buscarPorEmail.mockResolvedValue({
                id_usuario: 1,
                nome_completo: "Carlos Silva",
                email: "carlos@aportec.com",
                senha_hash: senhaCorretaHash,
                perfil: "ADM",
                ativo: true,
            });,
                ativo: true,
            });

            const res = await authService.autenticarUsuario("carlos@aportec.com", "senhaIncorreta");
            expect(res.sucesso).toBe(false);
            expect(res.mensagem).toBe("Credenciais inválidas.");
        });

        test("Deve falhar se o usuário estiver inativo", async () => {
            const senhaCorretaHash = await bcrypt.hash("senha123", 10);
            authRepository.buscarPorEmail.mockResolvedValue({
                id_usuario: 1,
                nome_completo: "Carlos Silva",
                email: "carlos@aportec.com",
                senha_hash: senhaCorretaHash,
                cargo_funcao: "Operador",
                ativo: false,
            });

            const res = await authService.autenticarUsuario("carlos@aportec.com", "senha123");
            expect(res.sucesso).toBe(false);
            expect(res.mensagem).toBe("Usuário inativo. Contate o administrador.");
        });

        test("Deve autenticar com sucesso quando as credenciais estiverem corretas", async () => {
            const senhaCorretaHash = await bcrypt.hash("senha123", 10);
            authRepository.buscarPorEmail.mockResolvedValue({
                id_usuario: 10,
                nome_completo: "Mariana Souza",
                email: "mariana@aportec.com",
                senha_hash: senhaCorretaHash,
                cargo_funcao: "Gerente",
                ativo: true,
            });

            const res = await authService.autenticarUsuario("mariana@aportec.com", "senha123");
            expect(res.sucesso).toBe(true);
            expect(res.usuario).toEqual({
                id_usuario: 10,
                nome_completo: "Mariana Souza",
                email: "mariana@aportec.com",
                cargo_funcao: "Gerente",
                ativo: true,
            });
        });
    });

    describe("criarNovoUsuario", () => {
        const solicitanteAdm = { id_usuario: 1, perfil: "ADM" };

        test("Deve lançar erro 401 se solicitante não for informado (cadastro público bloqueado)", async () => {
            await expect(
                authService.criarNovoUsuario({
                    nome_completo: "Teste",
                    email: "teste@gmail.com",
                    senha: "123",
                })
            ).rejects.toMatchObject({
                message: "Cadastro público não permitido. É necessário estar autenticado como administrador.",
                status: 401,
            });
        });

        test("Deve lançar erro 403 se solicitante não for administrador", async () => {
            await expect(
                authService.criarNovoUsuario(
                    {
                        nome_completo: "Teste",
                        email: "teste@gmail.com",
                        senha: "123",
                    },
                    { id_usuario: 2, perfil: "TECNICO" }
                )
            ).rejects.toMatchObject({
                message: "Apenas administradores têm permissão para cadastrar novos usuários.",
                status: 403,
            });
        });

        test("Deve lançar erro 400 se nome_completo for omitido", async () => {
            await expect(
                authService.criarNovoUsuario({ email: "teste@gmail.com", senha: "123" }, solicitanteAdm)
            ).rejects.toMatchObject({
                message: "O campo 'nome_completo' é obrigatório.",
                status: 400,
            });
        });

        test("Deve lançar erro 400 se email for omitido", async () => {
            await expect(
                authService.criarNovoUsuario({ nome_completo: "Teste", senha: "123" }, solicitanteAdm)
            ).rejects.toMatchObject({
                message: "O campo 'email' é obrigatório.",
                status: 400,
            });
        });

        test("Deve lançar erro 400 se o e-mail não terminar com @gmail.com", async () => {
            for (const emailInvalido of ["teste@gmail", "teste@aportec.com", "teste@hotmail.com", "usuario"]) {
                await expect(
                    authService.criarNovoUsuario(
                        { nome_completo: "Teste", email: emailInvalido, senha: "123" },
                        solicitanteAdm
                    )
                ).rejects.toMatchObject({
                    status: 400,
                    message: expect.stringContaining("@gmail.com"),
                });
            }
        });

        test("Deve lançar erro 400 se senha for omitida", async () => {
            await expect(
                authService.criarNovoUsuario({ nome_completo: "Teste", email: "teste@gmail.com" }, solicitanteAdm)
            ).rejects.toMatchObject({
                message: "O campo 'senha' é obrigatório.",
                status: 400,
            });
        });

        test("Deve lançar erro 409 se e-mail já estiver cadastrado", async () => {
            authRepository.buscarPorEmail.mockResolvedValue({ id_usuario: 1 });

            await expect(
                authService.criarNovoUsuario(
                    {
                        nome_completo: "Teste",
                        email: "existente@gmail.com",
                        senha: "123",
                    },
                    solicitanteAdm
                )
            ).rejects.toMatchObject({
                message: "Já existe um usuário cadastrado com este e-mail.",
                status: 409,
            });
        });

        test("Deve criar usuário com senha criptografada em senha_hash quando solicitado por ADM", async () => {
            authRepository.buscarPorEmail.mockResolvedValue(null);
            authRepository.criar.mockImplementation(async (dados) => ({
                id_usuario: 5,
                ...dados,
            }));

            const resultado = await authService.criarNovoUsuario(
                {
                    nome_completo: "Ana Paula",
                    email: "  Ana@Gmail.COM ",
                    senha: "senhaSegura123",
                    cargo_funcao: "Engenheira",
                },
                solicitanteAdm
            );

            expect(resultado).toEqual({
                id_usuario: 5,
                nome_completo: "Ana Paula",
                email: "ana@gmail.com",
                cargo_funcao: "Engenheira",
            });

            expect(authRepository.criar).toHaveBeenCalledTimes(1);
            const dadosEnviados = authRepository.criar.mock.calls[0][0];
            expect(dadosEnviados.email).toBe("ana@gmail.com");
            expect(dadosEnviados.senha_hash.startsWith("$2b$")).toBe(true);
            expect(dadosEnviados.senha_hash).not.toBe("senhaSegura123");
        });

        test("Cadastro feito por ADM autenticado deve respeitar o perfil informado", async () => {
            authRepository.buscarPorEmail.mockResolvedValue(null);
            authRepository.criar.mockImplementation(async (dados) => ({ id_usuario: 8, ...dados }));

            await authService.criarNovoUsuario(
                {
                    nome_completo: "Técnico Novo",
                    email: "tecnico.novo@gmail.com",
                    senha: "123456",
                    perfil: "TECNICO",
                },
                solicitanteAdm
            );

            expect(authRepository.criar.mock.calls[0][0].perfil).toBe("TECNICO");
        });

        test("Deve rejeitar com erro 400 se o perfil informado explicitamente for inválido", async () => {
            authRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(
                authService.criarNovoUsuario(
                    {
                        nome_completo: "Invalido",
                        email: "inv@gmail.com",
                        senha: "123",
                        perfil: "SUPER_ROOT",
                    },
                    solicitanteAdm
                )
            ).rejects.toMatchObject({
                message: "O campo 'perfil' deve ser 'ADM', 'TECNICO' ou 'CLIENTE'.",
                status: 400,
            });
        });
    });

    describe("gerarToken e verificarToken", () => {
        test("Deve gerar token JWT e decodificá-lo com sucesso", () => {
            const usuarioMock = {
                id_usuario: 1,
                nome_completo: "Roberto",
                email: "roberto@aportec.com",
                            authRepository.buscarPorEmail.mockResolvedValue({
                id_usuario: 1,
                nome_completo: "Carlos Silva",
                email: "carlos@aportec.com",
                senha_hash: senhaCorretaHash,
                perfil: "ADM",
                ativo: true,
            });,
            };

            const token = authService.gerarToken(usuarioMock);
            expect(typeof token).toBe("string");
            expect(token.split(".").length).toBe(3);

            const decoded = authService.verificarToken(token);
            expect(decoded.id_usuario).toBe(1);
            expect(decoded.email).toBe("roberto@aportec.com");
            expect(decoded.cargo_funcao).toBe("Administrador");
            expect(decoded.role).toBe("Administrador");
        });
    });
});
