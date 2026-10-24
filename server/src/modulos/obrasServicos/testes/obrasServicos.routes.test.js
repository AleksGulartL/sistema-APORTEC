const request = require("supertest");
const express = require("express");
const obrasServicosRoutes = require("../obrasServicos.routes");
const obrasServicosService = require("../obrasServicos.service");

// Intercepta a camada de Service
jest.mock("../obrasServicos.service");

const app = express();
app.use(express.json());
app.use(obrasServicosRoutes);

describe("ObrasServicosRoutes - Testes de Rotas e Status HTTP", () => {
    // Silencia o console.error no ambiente de teste
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
        // MOCK: Lista vazia
        obrasServicosService.listar.mockResolvedValue([]);

        // AÇÃO: Requisição GET
        const res = await request(app).get("/obras-servicos");

        // VALIDAÇÃO: Confirma status 200 OK
        expect(res.status).toBe(200);
    });

    test("GET /obras-servicos/:id - Deve retornar 404 se não encontrar o registro", async () => {
        // MOCK: Retorna nulo
        obrasServicosService.buscarPorId.mockResolvedValue(null);

        // AÇÃO: Busca por ID 999
        const res = await request(app).get("/obras-servicos/999");

        // VALIDAÇÃO: Status 404 Not Found e JSON correto
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Obra/Serviço não encontrado." });
    });

    test("POST /obras-servicos - Deve retornar 201 ao cadastrar obra/serviço", async () => {
        const novaObra = { id_cliente: 1, endereco_instalacao: "Rua A, 100" };
        obrasServicosService.criar.mockResolvedValue({ id_obra: 1, ...novaObra });

        // AÇÃO: Requisição POST
        const res = await request(app).post("/obras-servicos").send(novaObra);

        // VALIDAÇÃO: Confirmado com status 201 Created
        expect(res.status).toBe(201);
    });

    test("POST /obras-servicos - Deve retornar 400 se 'id_cliente' não existir no banco (erro 23503)", async () => {
        // MOCK: Simula erro PostgreSQL de violação de Foreign Key (23503)
        obrasServicosService.criar.mockRejectedValue({ code: "23503" });

        // AÇÃO: Tenta associar obra a um cliente inexistente
        const res = await request(app).post("/obras-servicos").send({ id_cliente: 999, endereco_instalacao: "Rua A" });

        // VALIDAÇÃO: Confirma que o erro de FK do banco retorna status 400 com mensagem clara
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "O cliente informado (id_cliente) não existe." });
    });

    test("DELETE /obras-servicos/:id - Deve retornar 200 ao excluir registro", async () => {
        // MOCK: Retorna o objeto deletado
        obrasServicosService.deletar.mockResolvedValue({ id_obra: 1 });

        // AÇÃO: Envia DELETE para o ID 1
        const res = await request(app).delete("/obras-servicos/1");

        // VALIDAÇÃO: Verifica status 200 e mensagem de sucesso
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Obra/Serviço removido com sucesso.");
    });
});