const request = require("supertest");
const express = require("express");
const itemCatalogoRoutes = require("../itemCatalogo.routes");
const itemCatalogoService = require("../itemCatalogo.service");

// Intercepta a camada de Service para mockar o comportamento das regras
jest.mock("../itemCatalogo.service");

// Inicializa a aplicação Express para testes isolados de rotas
const app = express();
app.use(express.json());
app.use(itemCatalogoRoutes);

describe("ItemCatalogoRoutes - Testes de Rotas e Status HTTP", () => {
    // Desativa a saída de erros no console para manter o terminal limpo
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    // Restaura o console.error ao final da suíte
    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /itens-catalogo - Deve retornar 200 e a lista de itens", async () => {
        // MOCK: Define retorno da listagem
        itemCatalogoService.listar.mockResolvedValue([]);

        // AÇÃO: Faz requisição GET
        const res = await request(app).get("/itens-catalogo");

        // VALIDAÇÃO: Verifica o status HTTP 200 OK
        expect(res.status).toBe(200);
    });

    test("GET /itens-catalogo/:id - Deve retornar 404 se não encontrar o item", async () => {
        // MOCK: Retorna nulo para simular registro não encontrado
        itemCatalogoService.buscarPorId.mockResolvedValue(null);

        // AÇÃO: Busca por um ID inexistente
        const res = await request(app).get("/itens-catalogo/999");

        // VALIDAÇÃO: Confirma status 404 e payload da mensagem de erro
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Item do catálogo não encontrado." });
    });

    test("POST /itens-catalogo - Deve retornar 201 ao criar item com sucesso", async () => {
        // DADOS: Payload do item
        const novoItem = { tipo: "Insumo", descricao: "Motor 2HP", unidade_medida: "UN" };
        itemCatalogoService.criar.mockResolvedValue({ id_item: 1, ...novoItem });

        // AÇÃO: Envia requisição POST
        const res = await request(app).post("/itens-catalogo").send(novoItem);

        // VALIDAÇÃO: Confirma status 201 Created
        expect(res.status).toBe(201);
    });

    test("POST /itens-catalogo - Deve retornar 400 em duplicidade de codigo_referencia (erro 23505)", async () => {
        // MOCK: Simula erro PostgreSQL de violação de chave única (23505)
        itemCatalogoService.criar.mockRejectedValue({ code: "23505" });

        // AÇÃO: Tenta cadastrar item duplicado
        const res = await request(app).post("/itens-catalogo").send({ tipo: "Insumo", descricao: "A", unidade_medida: "UN" });

        // VALIDAÇÃO: Confirma o tratamento do erro de banco resultando em 400 Bad Request
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Já existe um item com este código de referência." });
    });

    test("PUT /itens-catalogo/:id - Deve retornar 404 se tentar atualizar registro inexistente", async () => {
        // MOCK: Retorna nulo no serviço ao tentar atualizar ID inexistente
        itemCatalogoService.atualizar.mockResolvedValue(null);

        // AÇÃO: Envia atualização para o ID 999
        const res = await request(app).put("/itens-catalogo/999").send({ tipo: "Insumo", descricao: "A", unidade_medida: "UN" });

        // VALIDAÇÃO: Confirma status 404
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Item do catálogo não encontrado." });
    });

    test("DELETE /itens-catalogo/:id - Deve retornar 200 ao excluir item", async () => {
        // MOCK: Simula remoção bem-sucedida do registro
        itemCatalogoService.deletar.mockResolvedValue({ id_item: 1 });

        // AÇÃO: Faz a requisição DELETE
        const res = await request(app).delete("/itens-catalogo/1");

        // VALIDAÇÃO: Confirma retorno de sucesso e mensagem de confirmação
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Item do catálogo removido com sucesso.");
    });
});