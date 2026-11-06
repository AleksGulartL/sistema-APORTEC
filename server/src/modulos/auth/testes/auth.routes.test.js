const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const authRoutes = require("../auth.routes");
const authService = require("../auth.service");
const autenticar = require("../../../middlewares/autenticar");
const autorizar = require("../../../middlewares/autorizar");

jest.mock("../auth.service");

const app = express();
app.use(express.json());
app.use(authRoutes);

// Rota de teste para validação de autorização RBAC
app.delete("/teste-admin-only", autenticar, autorizar("admin", "gerente"), (req, res) => {
    res.status(200).json({ ok: true, usuario: req.usuario });
});

describe("AuthRoutes - Testes de Rotas e Status HTTP", () => {
    const SECRET = process.env.JWT_SECRET || "aportec_jwt_secret_key_2026";

    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /auth/login e POST /login", () => {
        test("Deve retornar 400 se email ou senha forem omitidos", async () => {
            const res = await request(app).post("/auth/login").send({});
            expect(res.status).toBe(400);
            expect(res.body.erro).toBe("E-mail e senha são obrigatórios.");
        });

        test("Deve retornar 401 se autenticação falhar", async () => {
            authService.autenticarUsuario.mockResolvedValue({
                sucesso: false,
                mensagem: "Credenciais inválidas.",
            });

            const res = await request(app).post("/auth/login").send({
                email: "errado@aportec.com",
                senha: "123",
            });

            expect(res.status).toBe(401);
            expect(res.body.erro).toBe("Credenciais inválidas.");
        });

        test("Deve retornar 200 e emitir token no login bem-sucedido", async () => {
            authService.autenticarUsuario.mockResolvedValue({
                sucesso: true,
                usuario: { id_usuario: 1, nome_completo: "User Teste", email: "teste@aportec.com" },
            });
            authService.gerarToken.mockReturnValue("jwt.token.mockado");

            const res = await request(app).post("/auth/login").send({
                email: "teste@aportec.com",
                senha: "senhaCorreta",
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBe("jwt.token.mockado");
            expect(res.body.usuario.email).toBe("teste@aportec.com");
        });

        test("Deve aceitar username/password na rota de compatibilidade /login", async () => {
            authService.autenticarUsuario.mockResolvedValue({
                sucesso: true,
                usuario: { id_usuario: 1, nome_completo: "User", email: "user@aportec.com" },
            });
            authService.gerarToken.mockReturnValue("token123");

            const res = await request(app).post("/login").send({
                username: "user@aportec.com",
                password: "123",
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBe("token123");
        });
    });

    describe("POST /auth/registrar e POST /novoUsuario", () => {
        test("Deve retornar 201 ao cadastrar novo usuário", async () => {
            const novoUsuario = {
                id_usuario: 1,
                nome_completo: "Novo User",
                email: "novo@aportec.com",
                cargo_funcao: "Operador",
            };
            authService.criarNovoUsuario.mockResolvedValue(novoUsuario);

            const res = await request(app).post("/auth/registrar").send({
                nome_completo: "Novo User",
                email: "novo@aportec.com",
                senha: "123",
            });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(novoUsuario);
        });

        test("Deve aceitar requisição na rota /novoUsuario", async () => {
            const novoUsuario = { id_usuario: 2, nome_completo: "User", email: "u@aportec.com" };
            authService.criarNovoUsuario.mockResolvedValue(novoUsuario);

            const res = await request(app).post("/novoUsuario").send({
                nome: "User",
                username: "u@aportec.com",
                passwd: "123",
            });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(novoUsuario);
        });
    });

    describe("GET /auth/perfil e Middleware autenticar", () => {
        test("Deve retornar 401 se nenhum token for fornecido", async () => {
            const res = await request(app).get("/auth/perfil");
            expect(res.status).toBe(401);
            expect(res.body.erro).toBe("Token de autenticação não fornecido.");
        });

        test("Deve retornar 401 se o token for inválido", async () => {
            const res = await request(app)
                .get("/auth/perfil")
                .set("Authorization", "Bearer token-invalido");

            expect(res.status).toBe(401);
            expect(res.body.erro).toBe("Token inválido.");
        });

        test("Deve retornar 200 com payload se token for válido", async () => {
            const payload = {
                id_usuario: 7,
                email: "ana@aportec.com",
                cargo_funcao: "admin",
            };
            const validToken = jwt.sign(payload, SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .get("/auth/perfil")
                .set("Authorization", `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id_usuario).toBe(7);
            expect(res.body.email).toBe("ana@aportec.com");
        });
    });

    describe("Middleware autorizar (RBAC)", () => {
        test("Deve retornar 403 se o usuário não possuir o cargo/role exigido", async () => {
            const payloadOperador = {
                id_usuario: 8,
                cargo_funcao: "operador",
            };
            const token = jwt.sign(payloadOperador, SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .delete("/teste-admin-only")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.erro).toBe("Permissão insuficiente.");
            expect(res.body.atual).toBe("operador");
        });

        test("Deve retornar 200 se o usuário possuir o cargo exigido", async () => {
            const payloadAdmin = {
                id_usuario: 9,
                cargo_funcao: "admin",
            };
            const token = jwt.sign(payloadAdmin, SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .delete("/teste-admin-only")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    describe("POST /auth/logout", () => {
        test("Deve retornar 200 ao fazer logout", async () => {
            const res = await request(app).post("/auth/logout");
            expect(res.status).toBe(200);
            expect(res.body.mensagem).toBe("Logout realizado com sucesso.");
        });
    });
});
