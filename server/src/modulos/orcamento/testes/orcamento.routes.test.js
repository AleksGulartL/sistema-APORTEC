const request = require("supertest");
const express = require("express");
const orcamentoRoutes = require("../orcamento.routes");
const orcamentoService = require("../orcamento.service");

// Intercepta a camada de Service
jest.mock("../orcamento.service");

const app = express();
app.use(express.json());
app.use(orcamentoRoutes);

describe("OrcamentoRoutes - Testes de Rotas e Status HTTP", () => {
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /orcamento - Deve retornar 200 e a lista de orçamentos", async () => {
        orcamentoService.listar.mockResolvedValue([]);

        const res = await request(app).get("/orcamento");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("GET /orcamento/:id - Deve retornar 404 se não encontrar o registro", async () => {
        orcamentoService.buscarPorId.mockResolvedValue(null);

        const res = await request(app).get("/orcamento/999");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Orçamento não encontrado." });
    });

    test("GET /orcamento/:id - Deve retornar 200 se encontrar o orçamento", async () => {
        const mockOrcamento = { id_orcamento: 1, id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao" };
        orcamentoService.buscarPorId.mockResolvedValue(mockOrcamento);

        const res = await request(app).get("/orcamento/1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockOrcamento);
    });

    test("POST /orcamento - Deve retornar 201 ao cadastrar orçamento com sucesso", async () => {
        const novoOrcamento = {
            id_cliente: 1,
            id_obra: 1,
            id_usuario_criador: 1,
            tipo_orcamento: "Instalacao",
            valor_total: 1000
        };
        orcamentoService.criar.mockResolvedValue({ id_orcamento: 1, ...novoOrcamento });

        const res = await request(app).post("/orcamento").send(novoOrcamento);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id_orcamento", 1);
    });

    test("POST /orcamento - Deve retornar 400 se foreign key violada (erro 23503)", async () => {
        orcamentoService.criar.mockRejectedValue({ code: "23503" });

        const res = await request(app).post("/orcamento").send({
            id_cliente: 999,
            id_obra: 1,
            id_usuario_criador: 1,
            tipo_orcamento: "Instalacao"
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Cliente, obra ou usuário informado não existe." });
    });

    test("PUT /orcamento/:id - Deve retornar 404 se tentar atualizar registro inexistente", async () => {
        orcamentoService.atualizar.mockResolvedValue(null);

        const res = await request(app).put("/orcamento/999").send({
            id_cliente: 1,
            id_obra: 1,
            id_usuario_criador: 1,
            tipo_orcamento: "Instalacao"
        });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Orçamento não encontrado." });
    });

    test("PUT /orcamento/:id - Deve retornar 200 ao atualizar com sucesso", async () => {
        const dadosAtualizados = {
            id_cliente: 1,
            id_obra: 1,
            id_usuario_criador: 1,
            tipo_orcamento: "Manutencao Preventiva"
        };
        orcamentoService.atualizar.mockResolvedValue({ id_orcamento: 1, ...dadosAtualizados });

        const res = await request(app).put("/orcamento/1").send(dadosAtualizados);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("tipo_orcamento", "Manutencao Preventiva");
    });

    test("DELETE /orcamento/:id - Deve retornar 200 ao excluir orçamento com sucesso", async () => {
        orcamentoService.deletar.mockResolvedValue({ id_orcamento: 1 });

        const res = await request(app).delete("/orcamento/1");

        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Orçamento removido com sucesso.");
    });

    test("DELETE /orcamento/:id - Deve retornar 404 ao tentar excluir orçamento inexistente", async () => {
        orcamentoService.deletar.mockResolvedValue(null);

        const res = await request(app).delete("/orcamento/999");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Orçamento não encontrado." });
    });
});
