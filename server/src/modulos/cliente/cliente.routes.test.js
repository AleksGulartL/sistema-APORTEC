const request = require("supertest");
const express = require("express");
const clienteRoutes = require("./cliente.routes");
const clienteService = require("./cliente.service");

jest.mock("./cliente.service");

const app = express();
app.use(express.json());
app.use(clienteRoutes);

describe("clienteRoutes - Testes de Rotas e Status HTTP", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /cliente - Deve retornar 200 e a lista", async () => {
        clienteService.listar.mockResolvedValue([]);
        const res = await request(app).get("/cliente");
        expect(res.status).toBe(200);
    });

    test("GET /cliente/:id - Deve retornar 404 se não encontrar cliente", async () => {
        clienteService.buscarPorId.mockResolvedValue(null);
        const res = await request(app).get("/cliente/999");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Cliente não encontrado." });
    });

    test("POST /cliente - Deve retornar 201 ao criar cliente", async () => {
        const novoCliente = { nome_completo: "Empresa X", cnpj_cpf: "123", telefone: "999", email: "a@a.com", endereco: "Rua A" };
        clienteService.criar.mockResolvedValue({ id_cliente: 1, ...novoCliente });

        const res = await request(app).post("/cliente").send(novoCliente);
        expect(res.status).toBe(201);
    });

    test("POST /cliente - Deve retornar 400 em duplicidade de CNPJ/CPF (erro 23505)", async () => {
        clienteService.criar.mockRejectedValue({ code: "23505" });

        const res = await request(app).post("/cliente").send({ nome_completo: "Empresa X" });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Já existe um cliente cadastrado com este CNPJ/CPF." });
    });

    test("DELETE /cliente/:id - Deve retornar 200 ao deletar", async () => {
        clienteService.deletar.mockResolvedValue({ id_cliente: 1 });

        const res = await request(app).delete("/cliente/1");
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Cliente removido com sucesso.");
    });
});