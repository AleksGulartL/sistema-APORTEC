const request = require("supertest");
const express = require("express");
const obrasServicosRoutes = require("./obrasServicos.routes");
const obrasServicosService = require("./obrasServicos.service");

jest.mock("./obrasServicos.service");

const app = express();
app.use(express.json());
app.use(obrasServicosRoutes);

describe("ObrasServicosRoutes - Testes de Rotas e Status HTTP", () => {
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /obras-servicos - Deve retornar 200 e a lista", async () => {
        obrasServicosService.listar.mockResolvedValue([]);
        const res = await request(app).get("/obras-servicos");
        expect(res.status).toBe(200);
    });

    test("GET /obras-servicos/:id - Deve retornar 404 se não encontrar", async () => {
        obrasServicosService.buscarPorId.mockResolvedValue(null);
        const res = await request(app).get("/obras-servicos/999");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Obra/Serviço não encontrado." });
    });

    test("POST /obras-servicos - Deve retornar 201 ao criar", async () => {
        const novaObra = { id_cliente: 1, endereco_instalacao: "Rua A, 100" };
        obrasServicosService.criar.mockResolvedValue({ id_obra: 1, ...novaObra });

        const res = await request(app).post("/obras-servicos").send(novaObra);
        expect(res.status).toBe(201);
    });

    test("POST /obras-servicos - Deve retornar 400 em id_cliente inexistente no banco (erro 23503)", async () => {
        obrasServicosService.criar.mockRejectedValue({ code: "23503" });

        const res = await request(app).post("/obras-servicos").send({ id_cliente: 999, endereco_instalacao: "Rua A" });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "O cliente informado (id_cliente) não existe." });
    });

    test("DELETE /obras-servicos/:id - Deve retornar 200 ao deletar", async () => {
        obrasServicosService.deletar.mockResolvedValue({ id_obra: 1 });

        const res = await request(app).delete("/obras-servicos/1");
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Obra/Serviço removido com sucesso.");
    });
});