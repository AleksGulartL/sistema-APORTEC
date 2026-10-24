const request = require("supertest");
const express = require("express");
const clientesRoutes = require("./clientes.routes");
const clientesService = require("./clientes.service");

jest.mock("./clientes.service");

const app = express();
app.use(express.json());
app.use(clientesRoutes);

describe("ClientesRoutes - Testes de Rotas e Status HTTP", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /clientes - Deve retornar 200 e a lista", async () => {
        clientesService.listar.mockResolvedValue([]);
        const res = await request(app).get("/clientes");
        expect(res.status).toBe(200);
    });

    test("GET /clientes/:id - Deve retornar 404 se não encontrar cliente", async () => {
        clientesService.buscarPorId.mockResolvedValue(null);
        const res = await request(app).get("/clientes/999");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Cliente não encontrado." });
    });

    test("POST /clientes - Deve retornar 201 ao criar cliente", async () => {
        const novoCliente = { nome_completo: "Empresa X", cnpj_cpf: "123", telefone: "999", email: "a@a.com", endereco: "Rua A" };
        clientesService.criar.mockResolvedValue({ id_cliente: 1, ...novoCliente });

        const res = await request(app).post("/clientes").send(novoCliente);
        expect(res.status).toBe(201);
    });

    test("POST /clientes - Deve retornar 400 em duplicidade de CNPJ/CPF (erro 23505)", async () => {
        clientesService.criar.mockRejectedValue({ code: "23505" });

        const res = await request(app).post("/clientes").send({ nome_completo: "Empresa X" });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Já existe um cliente cadastrado com este CNPJ/CPF." });
    });

    test("DELETE /clientes/:id - Deve retornar 200 ao deletar", async () => {
        clientesService.deletar.mockResolvedValue({ id_cliente: 1 });

        const res = await request(app).delete("/clientes/1");
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Cliente removido com sucesso.");
    });
});