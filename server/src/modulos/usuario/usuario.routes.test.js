const request = require("supertest");
const express = require("express");
const usuarioRoutes = require("./usuario.routes");
const usuarioService = require("./usuario.service");

jest.mock("./usuario.service");

const app = express();
app.use(express.json());
app.use(usuarioRoutes);

describe("UsuarioRoutes - Testes de Rotas e Status HTTP", () => {
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /usuarios - Deve retornar 200 e a lista", async () => {
        usuarioService.listar.mockResolvedValue([]);
        const res = await request(app).get("/usuarios");
        expect(res.status).toBe(200);
    });

    test("GET /usuarios/:id - Deve retornar 404 se não encontrar", async () => {
        usuarioService.buscarPorId.mockResolvedValue(null);
        const res = await request(app).get("/usuarios/999");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Usuário não encontrado." });
    });

    test("POST /usuarios - Deve retornar 201 ao criar", async () => {
        const novoUsuario = { nome_completo: "João", email: "j@a.com", senha_hash: "123" };
        usuarioService.criar.mockResolvedValue({ id_usuario: 1, ...novoUsuario });

        const res = await request(app).post("/usuarios").send(novoUsuario);
        expect(res.status).toBe(201);
    });

    test("POST /usuarios - Deve retornar 400 em e-mail duplicado (erro 23505)", async () => {
        usuarioService.criar.mockRejectedValue({ code: "23505" });

        const res = await request(app).post("/usuarios").send({ nome_completo: "João", email: "j@a.com" });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Já existe um usuário cadastrado com este e-mail." });
    });

    test("DELETE /usuarios/:id - Deve retornar 200 ao deletar", async () => {
        usuarioService.deletar.mockResolvedValue({ id_usuario: 1 });

        const res = await request(app).delete("/usuarios/1");
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Usuário removido com sucesso.");
    });
});