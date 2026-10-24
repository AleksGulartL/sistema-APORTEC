const request = require("supertest");
const express = require("express");
const itemCatalogoRoutes = require("./itemCatalogo.routes");
const itemCatalogoService = require("./itemCatalogo.service");

jest.mock("./itemCatalogo.service");

const app = express();
app.use(express.json());
app.use(itemCatalogoRoutes);

describe("ItemCatalogoRoutes - Testes de Rotas e Status HTTP", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /itens-catalogo - Deve retornar 200 e a lista", async () => {
        itemCatalogoService.listar.mockResolvedValue([]);
        const res = await request(app).get("/itens-catalogo");
        expect(res.status).toBe(200);
    });

    test("GET /itens-catalogo/:id - Deve retornar 404 se não encontrar", async () => {
        itemCatalogoService.buscarPorId.mockResolvedValue(null);
        const res = await request(app).get("/itens-catalogo/999");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Item do catálogo não encontrado." });
    });

    test("POST /itens-catalogo - Deve retornar 201 ao criar", async () => {
        const novoItem = { tipo: "Insumo", descricao: "Motor", unidade_medida: "UN" };
        itemCatalogoService.criar.mockResolvedValue({ id_item: 1, ...novoItem });

        const res = await request(app).post("/itens-catalogo").send(novoItem);
        expect(res.status).toBe(201);
    });

    test("POST /itens-catalogo - Deve retornar 400 em duplicidade de codigo_referencia (erro 23505)", async () => {
        itemCatalogoService.criar.mockRejectedValue({ code: "23505" });

        const res = await request(app).post("/itens-catalogo").send({ tipo: "Insumo", descricao: "A", unidade_medida: "UN" });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Já existe um item com este código de referência." });
    });

    test("PUT /itens-catalogo/:id - Deve retornar 404 se tentar atualizar item inexistente", async () => {
        itemCatalogoService.atualizar.mockResolvedValue(null);

        const res = await request(app).put("/itens-catalogo/999").send({ tipo: "Insumo", descricao: "A", unidade_medida: "UN" });
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Item do catálogo não encontrado." });
    });

    test("DELETE /itens-catalogo/:id - Deve retornar 200 ao deletar", async () => {
        itemCatalogoService.deletar.mockResolvedValue({ id_item: 1 });

        const res = await request(app).delete("/itens-catalogo/1");
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Item do catálogo removido com sucesso.");
    });
});