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

app.delete("/teste-admin-only", autenticar, autorizar("ADM"), (req, res) => {
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

    describe("POST /auth/login", () => {
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
                email: "errado@gmail.com",
                senha: "123",
            });

            expect(res.status).toBe(401);
            expect(res.body.erro).toBe("Credenciais inválidas.");
        });

        test("Deve retornar 200 e emitir token no login bem-sucedido", async () => {
            authService.autenticarUsuario.mockResolvedValue({
                sucesso: true,
                usuario: { id: 1, nome_completo: "User Teste", email: "teste@gmail.com", perfil: "ADM" },
            });
            authService.gerarToken.mockReturnValue("jwt.token.mockado");

            const res = await request(app).post("/auth/login").send({
                email: "teste@gmail.com",
                senha: "senhaCorreta",
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBe("jwt.token.mockado");
            expect(res.body.usuario.email).toBe("teste@gmail.com");
        });
    });

    describe("POST /auth/registrar", () => {
        test("Deve retornar 201 ao cadastrar novo usuário", async () => {
            const novoUsuario = {
                id: 1,
                nome_completo: "Novo User",
                email: "novo@gmail.com",
                perfil: "TECNICO",
            };
            authService.criarNovoUsuario.mockResolvedValue(novoUsuario);

            const res = await request(app).post("/auth/registrar").send({
                nome_completo: "Novo User",
                email: "novo@gmail.com",
                senha: "123",
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
                id: 7,
                email: "ana@gmail.com",
                perfil: "ADM",
            };
            const validToken = jwt.sign(payload, SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .get("/auth/perfil")
                .set("Authorization", `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(7);
            expect(res.body.email).toBe("ana@gmail.com");
        });
    });

    describe("Middleware autorizar (RBAC)", () => {
        test("Deve retornar 403 se o usuário não possuir o perfil exigido", async () => {
            const payloadTecnico = {
                id: 8,
                perfil: "TECNICO",
            };
            const token = jwt.sign(payloadTecnico, SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .delete("/teste-admin-only")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(403);
        });

        test("Deve retornar 200 se o usuário possuir o perfil exigido", async () => {
            const payloadAdm = {
                id: 1,
                perfil: "ADM",
            };
            const token = jwt.sign(payloadAdm, SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .delete("/teste-admin-only")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });
});
