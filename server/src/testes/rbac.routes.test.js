const request = require("supertest");
const express = require("express");
const { PERFIS, PERMISSOES } = require("../middlewares/permissoes");
const { cabecalhoPara } = require("./authHelper");

function mockStubController(funcoes) {
    const stub = {};
    for (const nome of funcoes) {
        stub[nome] = (req, res) => res.status(200).json({ ok: true, acao: nome });
    }
    return stub;
}

const mockCRUD = ["listar", "buscarPorId", "criar", "atualizar", "deletar"];

jest.mock("../modulos/usuario/usuario.controller", () => mockStubController(mockCRUD));
jest.mock("../modulos/cliente/cliente.controller", () => mockStubController(mockCRUD));
jest.mock("../modulos/itemCatalogo/itemCatalogo.controller", () =>
    mockStubController([...mockCRUD, "listarTipos", "listarCategorias", "listarAlertasEstoqueMinimo"])
);
jest.mock("../modulos/pedidoItem/pedidoItem.controller", () => mockStubController(mockCRUD));
jest.mock("../modulos/checklist_medicao/checklist_medicao.controller", () => mockStubController(mockCRUD));
jest.mock("../modulos/ordemServico/ordemServico.controller", () => mockStubController(mockCRUD));
jest.mock("../modulos/pedido/pedido.controller", () =>
    mockStubController([...mockCRUD, "atualizarStatusEtapa", "coletarAssinaturaAceite"])
);
jest.mock("../modulos/portalCliente/portalCliente.controller", () =>
    mockStubController(["obterResumo", "responderAprovacao", "abrirSolicitacao", "criarSolicitacao"])
);

const app = express();
app.use(express.json());
app.use(require("../modulos/usuario/usuario.routes"));
app.use(require("../modulos/cliente/cliente.routes"));
app.use(require("../modulos/itemCatalogo/itemCatalogo.routes"));
app.use(require("../modulos/pedidoItem/pedidoItem.routes"));
app.use(require("../modulos/checklist_medicao/checklist_medicao.routes"));
app.use(require("../modulos/ordemServico/ordemServico.routes"));
app.use(require("../modulos/pedido/pedido.routes"));
app.use(require("../modulos/portalCliente/portalCliente.routes"));

const ROTAS = [
    ["post", "/portal-cliente/solicitacoes", "portalCliente", "criarSolicitacao"],
    ["get", "/usuarios", "usuario", "listar"],
    ["get", "/usuarios/1", "usuario", "buscarPorId"],
    ["post", "/usuarios", "usuario", "criar"],
    ["put", "/usuarios/1", "usuario", "atualizar"],
    ["delete", "/usuarios/1", "usuario", "deletar"],

    ["get", "/cliente", "cliente", "listar"],
    ["get", "/cliente/1", "cliente", "buscarPorId"],
    ["post", "/cliente", "cliente", "criar"],
    ["put", "/cliente/1", "cliente", "atualizar"],
    ["delete", "/cliente/1", "cliente", "deletar"],

    ["get", "/item_catalogo/tipos", "itemCatalogo", "listarTipos"],
    ["get", "/item_catalogo/categorias", "itemCatalogo", "listarCategorias"],
    ["get", "/itens-catalogo/alertas-estoque", "itemCatalogo", "listarAlertasEstoqueMinimo"],
    ["get", "/itens-catalogo", "itemCatalogo", "listar"],
    ["get", "/itens-catalogo/1", "itemCatalogo", "buscarPorId"],
    ["post", "/itens-catalogo", "itemCatalogo", "criar"],
    ["put", "/itens-catalogo/1", "itemCatalogo", "atualizar"],
    ["delete", "/itens-catalogo/1", "itemCatalogo", "deletar"],

    ["get", "/pedido-itens", "pedidoItem", "listar"],
    ["get", "/pedido-itens/1", "pedidoItem", "buscarPorId"],
    ["post", "/pedido-itens", "pedidoItem", "criar"],
    ["put", "/pedido-itens/1", "pedidoItem", "atualizar"],
    ["delete", "/pedido-itens/1", "pedidoItem", "deletar"],

    ["get", "/checklist-medicao", "checklistMedicao", "listar"],
    ["get", "/checklist-medicao/1", "checklistMedicao", "buscarPorId"],
    ["post", "/checklist-medicao", "checklistMedicao", "criar"],
    ["put", "/checklist-medicao/1", "checklistMedicao", "atualizar"],
    ["delete", "/checklist-medicao/1", "checklistMedicao", "deletar"],

    ["get", "/ordem_servico", "ordemServico", "listar"],
    ["get", "/ordem_servico/1", "ordemServico", "buscarPorId"],
    ["post", "/ordem_servico", "ordemServico", "criar"],
    ["put", "/ordem_servico/1", "ordemServico", "atualizar"],
    ["delete", "/ordem_servico/1", "ordemServico", "deletar"],

    ["get", "/pedido", "pedido", "listar"],
    ["get", "/pedido/1", "pedido", "buscarPorId"],
    ["post", "/pedido", "pedido", "criar"],
    ["put", "/pedido/1", "pedido", "atualizar"],
    ["patch", "/pedido/1/status", "pedido", "atualizarStatusEtapa"],
    ["post", "/pedido/1/aceite-instalacao", "pedido", "coletarAssinaturaAceite"],
    ["delete", "/pedido/1", "pedido", "deletar"],

    ["get", "/portal-cliente/resumo", "portalCliente", "obterResumo"],
    ["patch", "/portal-cliente/pedidos/1/aprovacao", "portalCliente", "responderAprovacao"],
    ["post", "/portal-cliente/ordens-servico", "portalCliente", "abrirSolicitacao"],
];

const TODOS_PERFIS = Object.values(PERFIS);

describe("Segurança das rotas (RBAC - RF01 / CT01 Cenário 6)", () => {
    test("Toda ação definida em permissoes.js possui uma rota coberta por este teste", () => {
        const cobertas = new Set(ROTAS.map(([, , modulo, acao]) => `${modulo}.${acao}`));
        for (const [modulo, acoes] of Object.entries(PERMISSOES)) {
            for (const acao of Object.keys(acoes)) {
                expect(cobertas).toContain(`${modulo}.${acao}`);
            }
        }
    });

    test("Nenhuma rota administrativa é acessível pelo perfil CLIENTE", () => {
        for (const [modulo, acoes] of Object.entries(PERMISSOES)) {
            if (modulo === "portalCliente") continue;
            for (const perfis of Object.values(acoes)) {
                expect(perfis).not.toContain(PERFIS.CLIENTE);
            }
        }
    });

    describe.each(ROTAS)("%s %s (%s.%s)", (metodo, caminho, modulo, acao) => {
        const permitidos = PERMISSOES[modulo][acao];

        test("retorna 401 sem token", async () => {
            const res = await request(app)[metodo](caminho);
            expect(res.status).toBe(401);
        });

        test("retorna 401 com token inválido", async () => {
            const res = await request(app)[metodo](caminho).set("Authorization", "Bearer token.invalido");
            expect(res.status).toBe(401);
        });

        test.each(TODOS_PERFIS)("perfil %s", async (perfil) => {
            const res = await request(app)[metodo](caminho).set(cabecalhoPara(perfil));

            if (permitidos.includes(perfil)) {
                expect(res.status).toBe(200);
                expect(res.body.acao).toBe(acao);
            } else {
                expect(res.status).toBe(403);
                expect(res.body.mensagem).toBe("Acesso negado. O perfil não tem permissão para esta ação.");
            }
        });
    });
});
