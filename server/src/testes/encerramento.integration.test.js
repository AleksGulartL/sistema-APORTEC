// Opt-in: usa PostgreSQL real e cria/remove apenas um banco temporário próprio.
const fs = require("node:fs");
const path = require("node:path");
const request = require("supertest");
require("dotenv").config();
const suite = process.env.TEST_POSTGRES === "1" ? describe : describe.skip;

suite("Encerramento único da OS — PostgreSQL real", () => {
    let admin, setup, db, app, token, tokenAdm, tokenCliente, pedidoRepository, ids, criado = false;
    const bancoAnterior = process.env.DB_NAME;
    const banco = `aportec_encerramento_${process.pid}_${Date.now()}`;
    const assinatura = "TESTE - aceite único do cliente";
    const payload = { assinatura_cliente_digital: assinatura };

    beforeAll(async () => {
        const { Client } = require("pg");
        const config = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASS, connectionTimeoutMillis: 3000 };
        admin = new Client({ ...config, database: "postgres" });
        await admin.connect();
        await admin.query(`CREATE DATABASE "${banco}"`);
        criado = true;
        setup = new Client({ ...config, database: banco });
        await setup.connect();
        await setup.query(fs.readFileSync(path.join(__dirname, "../../aportec.sql"), "utf8"));
        process.env.DB_NAME = banco;
        db = require("../database/models");
        pedidoRepository = require("../modulos/pedido/pedido.repository");
        app = require("../../main");
        const login = await request(app).post("/auth/login").send({ email: "tecnico@aportec.com", senha: "senha123" });
        expect(login.status).toBe(200);
        token = login.body.token;
        const loginAdm = await request(app).post("/auth/login").send({ email: "admin@aportec.com", senha: "senha123" });
        expect(loginAdm.status).toBe(200);
        tokenAdm = loginAdm.body.token;
        const loginCli = await request(app).post("/auth/login").send({ email: "clara@aportec.com", senha: "senha123" });
        expect(loginCli.status).toBe(200);
        tokenCliente = loginCli.body.token;
        const [admReg, tecReg, cliReg] = await Promise.all([
            db.usuario.findOne({ where: { email: "admin@aportec.com" } }),
            db.usuario.findOne({ where: { email: "tecnico@aportec.com" } }),
            db.usuario.findOne({ where: { email: "clara@aportec.com" } }),
        ]);
        ids = { adm: admReg.id, tecnico: tecReg.id, cliente: cliReg.id };
    }, 20000);

    afterAll(async () => {
        if (db) await db.sequelize.close();
        if (setup) await setup.end();
        if (criado) {
            await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1", [banco]);
            await admin.query(`DROP DATABASE "${banco}"`);
        }
        if (admin) await admin.end();
        process.env.DB_NAME = bancoAnterior;
    });

    async function preparar(tipo = "Instalacao") {
        const manutencao = tipo !== "Instalacao";
        const pedido = await db.pedido.create({ cliente_id: ids.cliente, usuario_criador_id: ids.adm, responsavel_producao_id: ids.tecnico,
            tipo_pedido: tipo, pedido_origem_id: manutencao ? 1 : null, orcamento_enviado: true,
            status_aprovacao: "Aprovado", bloqueio_fabricacao: false, status: manutencao ? "Em Atendimento" : "Pronto para Instalacao",
            diagnostico_tecnico: manutencao ? "TESTE - revisão técnica" : null });
        if (!manutencao) await db.checklist_medicao.create({ pedido_id: pedido.id, tecnico_id: ids.tecnico, medidas_vao: "2.40 x 2.20 m",
            status_aprovacao: "Aprovado", viga_ok: true, piso_ok: true, ponto_eletrico_ok: true });
        const res = await request(app).post("/ordem_servico").auth(token, { type: "bearer" }).send({ pedido_id: pedido.id,
            tecnico_responsavel_id: ids.tecnico, tipo_servico: tipo, status_os: "Em Andamento", parecer_tecnico: "TESTE - serviço executado" });
        expect(res.status).toBe(201);
        return { pedido, os: res.body };
    }
    const finalizar = (os) => request(app).post(`/portal-cliente/ordens-servico/${os.id}/assinar`).auth(tokenCliente, { type: "bearer" }).send(payload);

    test("uma assinatura finaliza OS e instalação, com série, garantia e mesma data de conclusão", async () => {
        const { pedido, os } = await preparar();
        const res = await finalizar(os);
        expect(res.status).toBe(200);
        const fechado = await db.pedido.findByPk(pedido.id);
        const ordem = await db.ordem_servico.findByPk(os.id);
        expect(fechado.status).toBe("Concluido");
        expect(ordem.status_os).toBe("Finalizada");
        expect(fechado.assinatura_cliente_instalacao).toBe(assinatura);
        expect(fechado.assinatura_cliente_instalacao).toBe(ordem.assinatura_cliente_digital);
        expect(fechado.data_conclusao.toISOString()).toBe(ordem.data_conclusao.toISOString());
        expect(fechado.numero_serie).toMatch(new RegExp(`^APORTEC-\\d{4}-${String(pedido.id).padStart(4, "0")}$`));
        const ano = fechado.data_conclusao.getFullYear() + 1;
        expect(fechado.fim_garantia).toMatch(new RegExp(`^${ano}-`));
        expect(res.body.pedido.status).toBe("Concluido");
    });

    test.each(["Manutencao Corretiva", "Manutencao Preventiva"])("%s conclui apenas seu pedido e preserva a porta original", async (tipo) => {
        const original = (await db.pedido.findByPk(1)).toJSON();
        const { pedido, os } = await preparar(tipo);
        expect((await finalizar(os)).status).toBe(200);
        const fechado = await db.pedido.findByPk(pedido.id);
        expect(fechado.status).toBe("Concluido");
        expect(fechado.assinatura_cliente_instalacao).toBe(assinatura);
        expect(fechado.numero_serie).toBeNull();
        expect(fechado.fim_garantia).toBeNull();
        expect((await db.pedido.findByPk(1)).toJSON()).toEqual(original);
    });

    test("banco criado pelo aportec.sql não possui triggers nem funções PL/pgSQL customizadas", async () => {
        const triggers = await setup.query("SELECT tgname FROM pg_trigger WHERE NOT tgisinternal");
        const funcoes = await setup.query("SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'");
        expect(triggers.rows).toEqual([]);
        expect(funcoes.rows).toEqual([]);
    });

    test("finalização repetida, edição e exclusão não mudam o encerramento nem a garantia", async () => {
        const { pedido, os } = await preparar();
        expect((await finalizar(os)).status).toBe(200);
        const antes = (await db.pedido.findByPk(pedido.id)).toJSON();
        expect((await finalizar(os)).status).toBe(409);
        expect((await request(app).put(`/ordem_servico/${os.id}`).auth(token, { type: "bearer" }).send({ status_os: "Aberta" })).status).toBe(409);
        expect((await request(app).delete(`/ordem_servico/${os.id}`).auth(tokenAdm, { type: "bearer" })).status).toBe(409);
        expect((await db.pedido.findByPk(pedido.id)).toJSON()).toEqual(antes);
    });

    test("duas finalizações concorrentes da mesma OS gravam apenas um encerramento", async () => {
        const { pedido, os } = await preparar();
        const respostas = await Promise.all([finalizar(os), finalizar(os)]);
        expect(respostas.map((r) => r.status).sort()).toEqual([200, 409]);
        expect((await db.pedido.findByPk(pedido.id)).status).toBe("Concluido");
    });

    test("erro ao gerar a série desfaz também a assinatura e a finalização da OS", async () => {
        const { pedido, os } = await preparar();
        const ano = new Date().getFullYear();
        const original = await db.pedido.findByPk(1);
        const serieAnterior = original.numero_serie;
        await original.update({ numero_serie: `APORTEC-${ano}-${String(pedido.id).padStart(4, "0")}` });
        try {
            expect((await finalizar(os)).status).toBe(400);
            const ordem = await db.ordem_servico.findByPk(os.id);
            const naoConcluido = await db.pedido.findByPk(pedido.id);
            expect(ordem.status_os).toBe("Em Andamento");
            expect(ordem.assinatura_cliente_digital).toBeNull();
            expect(ordem.data_conclusao).toBeNull();
            expect(naoConcluido.status).toBe("Pronto para Instalacao");
            expect(naoConcluido.numero_serie).toBeNull();
            expect(naoConcluido.assinatura_cliente_instalacao).toBeNull();
        } finally { await original.update({ numero_serie: serieAnterior }); }
    });

    test("apenas o cliente assina e finaliza; técnico/ADM não podem finalizar nem assinar", async () => {
        const { pedido, os } = await preparar();
        expect((await request(app).patch(`/pedido/${pedido.id}/status`).auth(token, { type: "bearer" }).send({ status: "Concluido" })).status).toBe(400);
        expect((await request(app).post(`/pedido/${pedido.id}/aceite-instalacao`).auth(token, { type: "bearer" }).send({ assinatura_cliente_instalacao: assinatura })).status).toBe(410);
        await expect(pedidoRepository.atualizar(pedido.id, { status: "Concluido" })).rejects.toMatchObject({ status: 400 });
        expect((await request(app).put(`/ordem_servico/${os.id}`).auth(token, { type: "bearer" }).send({ status_os: "Finalizada" })).status).toBe(403);
        expect((await request(app).post(`/portal-cliente/ordens-servico/${os.id}/assinar`).auth(token, { type: "bearer" }).send(payload)).status).toBe(403);
        expect((await request(app).post(`/portal-cliente/ordens-servico/${os.id}/assinar`).auth(tokenCliente, { type: "bearer" }).send({})).status).toBe(400);
        expect((await db.ordem_servico.findByPk(os.id)).status_os).toBe("Em Andamento");
    });

    test("protege itens e dados comerciais de orçamento enviado e bloqueia transferência entre pedidos", async () => {
        // Pedido 2 do seed está enviado e pendente
        const itemExistente = await db.pedido_item.findOne({ where: { pedido_id: 2 } });
        expect((await request(app).post("/pedido_item").auth(tokenAdm, { type: "bearer" }).send({ pedido_id: 2, item_id: 4, quantidade: 1 })).status).toBe(400);
        expect((await request(app).put(`/pedido_item/${itemExistente.id}`).auth(tokenAdm, { type: "bearer" }).send({ quantidade: 9 })).status).toBe(400);
        expect((await request(app).delete(`/pedido_item/${itemExistente.id}`).auth(tokenAdm, { type: "bearer" })).status).toBe(400);
        expect((await request(app).put("/pedido/2").auth(tokenAdm, { type: "bearer" }).send({ percentual_acrescimo: 25 })).status).toBe(400);

        // Reabrindo o orçamento, volta a aceitar edição de itens, mas nunca transferência para outro pedido
        expect((await request(app).patch("/pedido/2/reabrir-orcamento").auth(tokenAdm, { type: "bearer" })).status).toBe(200);
        expect((await request(app).put(`/pedido_item/${itemExistente.id}`).auth(tokenAdm, { type: "bearer" }).send({ pedido_id: 1 })).status).toBe(400);
        const editado = await request(app).put(`/pedido_item/${itemExistente.id}`).auth(tokenAdm, { type: "bearer" }).send({ quantidade: 2 });
        expect(editado.status).toBe(200);
        expect(editado.body.quantidade).toBe(2);
    });
});
