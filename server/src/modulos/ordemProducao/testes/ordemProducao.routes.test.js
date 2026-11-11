const request = require("supertest");
const express = require("express");
const ordemProducaoRoutes = require("../ordemProducao.routes");
const ordemProducaoService = require("../ordemProducao.service");
const authService = require("../../auth/auth.service");

jest.mock("../ordemProducao.service");

const app = express();
app.use(express.json());
app.use(ordemProducaoRoutes);

describe("OrdemProducaoRoutes - Testes de Rotas, Status HTTP e RBAC (CT01 Cenário 6)", () => {
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("CT01 Cenário 6: POST /ordem-producao - Deve retornar 403 se o usuário tiver perfil TECNICO ou CLIENTE", async () => {
        const tokenTecnico = authService.gerarToken({
            id_usuario: 9,
            nome_completo: "Técnico de Campo",
            email: "tecnico@aportec.com",
            perfil: "TECNICO",
            cargo_funcao: "TECNICO",
        });

        const res = await request(app)
            .post("/ordem-producao")
            .set("Authorization", `Bearer ${tokenTecnico}`)
            .send({
                id_pedido: 105,
                data_previsao_fim: "2026-11-20",
                id_responsavel_tecnico: 3,
            });

        expect(res.status).toBe(403);
        expect(res.body.erro).toBe("Acesso negado. O perfil não tem permissão para esta ação.");
        expect(ordemProducaoService.criar).not.toHaveBeenCalled();
    });

    test("POST /ordem-producao - Deve retornar 201 para usuário com perfil PRODUCAO ou ADM", async () => {
        const tokenProducao = authService.gerarToken({
            id_usuario: 2,
            nome_completo: "Gestor Produção",
            email: "producao@aportec.com",
            perfil: "PRODUCAO",
            cargo_funcao: "Gestor de Produção",
        });

        const mockOp = {
            id_op: 105,
            id_pedido: 105,
            status_op: "Em Fabricacao",
            data_previsao_fim: "2026-11-20",
            id_responsavel_tecnico: 3,
        };
        ordemProducaoService.criar.mockResolvedValue(mockOp);

        const res = await request(app)
            .post("/ordem-producao")
            .set("Authorization", `Bearer ${tokenProducao}`)
            .send({
                id_pedido: 105,
                data_previsao_fim: "2026-11-20",
                id_responsavel_tecnico: 3,
            });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockOp);
    });

    test("GET /ordem-producao - Deve retornar 200 e listar ordens de produção", async () => {
        ordemProducaoService.listar.mockResolvedValue([]);

        const res = await request(app).get("/ordem-producao");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("POST /ordem-producao/:id/concluir - Deve retornar 200 ao concluir OP", async () => {
        ordemProducaoService.concluirOrdemProducao.mockResolvedValue({
            id_op: 105,
            status_op: "Concluida",
        });

        const res = await request(app).post("/ordem-producao/105/concluir").send({ usuario_id: 1 });

        expect(res.status).toBe(200);
        expect(res.body.ordem_producao.status_op).toBe("Concluida");
    });
});
