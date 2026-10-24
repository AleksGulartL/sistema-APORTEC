const request = require("supertest");
const express = require("express");
const clienteRoutes = require("../cliente.routes");
const clienteService = require("../cliente.service");

// Intercepta a camada de serviço para simular respostas das regras de negócio
jest.mock("../cliente.service");

// Configuração do ambiente de aplicação Express isolado para os testes de integração das rotas
const app = express();
app.use(express.json());
app.use(clienteRoutes);

describe("ClienteRoutes - Testes de Integracao de Rotas e Status HTTP", () => {
    // Silencia o console.error durante a execução dos testes para manter o terminal limpo
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    // Restaura o comportamento padrão do console.error após a suíte
    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /cliente - Deve responder com status 200 e retornar a lista de clientes", async () => {
        // MOCK: Define o retorno esperado da regra de negócio
        clienteService.listar.mockResolvedValue([]);

        // AÇÃO: Faz requisição GET simulada no endpoint da rota
        const res = await request(app).get("/cliente");

        // VALIDAÇÃO: Verifica o código de status HTTP esperado
        expect(res.status).toBe(200);
    });

    test("GET /cliente/:id - Deve responder com status 404 caso o registro não exista no banco", async () => {
        // MOCK: Simula que o serviço não encontrou o registro
        clienteService.buscarPorId.mockResolvedValue(null);

        // AÇÃO: Faz requisição GET para um ID inexistente
        const res = await request(app).get("/cliente/999");

        // VALIDAÇÃO: Verifica o status 404 e o payload de erro padronizado
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Cliente não encontrado." });
    });

    test("POST /cliente - Deve responder com status 201 ao cadastrar um cliente com sucesso", async () => {
        const novoCliente = { nome_completo: "Empresa X", cnpj_cpf: "123", telefone: "999", email: "a@a.com", endereco: "Rua A" };
        
        // MOCK: Simula retorno do cliente criado com o ID gerado
        clienteService.criar.mockResolvedValue({ id_cliente: 1, ...novoCliente });

        // AÇÃO: Envia o payload via requisição POST
        const res = await request(app).post("/cliente").send(novoCliente);

        // VALIDAÇÃO: Confirma a criação com status HTTP 201 Created
        expect(res.status).toBe(201);
    });

    test("POST /cliente - Deve responder com status 400 em conflito de duplicidade de CNPJ/CPF (erro DB 23505)", async () => {
        // MOCK: Simula exceção de restrição única lançada pelo PostgreSQL (chave duplicada)
        clienteService.criar.mockRejectedValue({ code: "23505" });

        // AÇÃO: Tenta cadastrar cliente com dado duplicado
        const res = await request(app).post("/cliente").send({ nome_completo: "Empresa X" });

        // VALIDAÇÃO: Verifica o tratamento de exceção mapeado para status 400 e a mensagem customizada
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Já existe um cliente cadastrado com este CNPJ/CPF." });
    });

    test("DELETE /cliente/:id - Deve responder com status 200 ao remover o cliente com sucesso", async () => {
        // MOCK: Simula remoção bem-sucedida retornando o registro excluído
        clienteService.deletar.mockResolvedValue({ id_cliente: 1 });

        // AÇÃO: Executa requisição DELETE
        const res = await request(app).delete("/cliente/1");

        // VALIDAÇÃO: Confirma o sucesso da exclusão e o retorno da mensagem informativa
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Cliente removido com sucesso.");
    });
});