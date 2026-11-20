// Opt-in: usa PostgreSQL real e cria/remove apenas um banco temporário próprio.
const fs = require("node:fs");
const path = require("node:path");
const request = require("supertest");
require("dotenv").config();
const suite = process.env.TEST_POSTGRES === "1" ? describe : describe.skip;

suite("Encerramento único da OS — PostgreSQL real", () => {
    let admin, setup, db, app, token, criado = false;
    const bancoAnterior = process.env.DB_NAME;
    const banco = `aportec_encerramento_${process.pid}_${Date.now()}`;
    const assinatura = "TESTE - aceite único do cliente";
    const payload = { status_os: "Finalizada", parecer_tecnico: "TESTE - serviço executado", assinatura_cliente_digital: assinatura };

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
        const migracao = fs.readFileSync(path.join(__dirname, "../database/migrations/008_encerramento_unico_os.sql"), "utf8");
        await setup.query(migracao); // A mesma atualização é idempotente em uma instalação nova.
        process.env.DB_NAME = banco;
        db = require("../database/models");
        app = require("../../main");
        const login = await request(app).post("/auth/login").send({ email: "tecnico@gmail.com", senha: "senha123" });
        expect(login.status).toBe(200);
        token = login.body.token;
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
        const pedido = await db.pedido.create({ cliente_id: 4, usuario_criador_id: 1, responsavel_producao_id: 3,
            tipo_pedido: tipo, pedido_origem_id: manutencao ? 1 : null, orcamento_enviado: true,
            status_aprovacao: "Aprovado", bloqueio_fabricacao: false, status: manutencao ? "Em Atendimento" : "Pronto para Instalacao",
            diagnostico_tecnico: manutencao ? "TESTE - revisão técnica" : null });
        if (!manutencao) await db.checklist_medicao.create({ pedido_id: pedido.id, tecnico_id: 3, medidas_vao: "2.40 x 2.20 m",
            status_aprovacao: "Aprovado", viga_ok: true, piso_ok: true, ponto_eletrico_ok: true });
        const res = await request(app).post("/ordem_servico").auth(token, { type: "bearer" }).send({ pedido_id: pedido.id,
            tecnico_responsavel_id: 3, tipo_servico: tipo, status_os: "Aberta" });
        expect(res.status).toBe(201);
        return { pedido, os: res.body };
    }
    const finalizar = (os) => request(app).put(`/ordem_servico/${os.id}`).auth(token, { type: "bearer" }).send(payload);

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

    test("finalização repetida, edição e exclusão não mudam o encerramento nem a garantia", async () => {
        const { pedido, os } = await preparar();
        expect((await finalizar(os)).status).toBe(200);
        const antes = (await db.pedido.findByPk(pedido.id)).toJSON();
        expect((await finalizar(os)).status).toBe(409);
        expect((await request(app).put(`/ordem_servico/${os.id}`).auth(token, { type: "bearer" }).send({ status_os: "Aberta" })).status).toBe(409);
        // A exclusão por SQL também é protegida, além do soft-delete da API.
        await expect(setup.query("DELETE FROM ordem_servico WHERE id = $1", [os.id])).rejects.toMatchObject({ code: "23514" });
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
        const ano = (await setup.query("SELECT to_char(CURRENT_TIMESTAMP, 'YYYY') AS ano")).rows[0].ano;
        const original = await db.pedido.findByPk(1);
        const serieAnterior = original.numero_serie;
        await original.update({ numero_serie: `APORTEC-${ano}-${String(pedido.id).padStart(4, "0")}` });
        try {
            expect((await finalizar(os)).status).toBe(400);
            const ordem = await db.ordem_servico.findByPk(os.id);
            const naoConcluido = await db.pedido.findByPk(pedido.id);
            expect(ordem.status_os).toBe("Aberta");
            expect(ordem.assinatura_cliente_digital).toBeNull();
            expect(ordem.data_conclusao).toBeNull();
            expect(naoConcluido.status).toBe("Pronto para Instalacao");
            expect(naoConcluido.numero_serie).toBeNull();
            expect(naoConcluido.assinatura_cliente_instalacao).toBeNull();
        } finally { await original.update({ numero_serie: serieAnterior }); }
    });

    test("não permite concluir diretamente o pedido nem encerrar por SQL sem assinatura", async () => {
        const { pedido, os } = await preparar();
        expect((await request(app).patch(`/pedido/${pedido.id}/status`).auth(token, { type: "bearer" }).send({ status: "Concluido" })).status).toBe(400);
        expect((await request(app).post(`/pedido/${pedido.id}/aceite-instalacao`).auth(token, { type: "bearer" }).send({ assinatura_cliente_instalacao: assinatura })).status).toBe(410);
        await expect(setup.query("UPDATE pedido SET status = 'Concluido' WHERE id = $1", [pedido.id])).rejects.toMatchObject({ code: "23514" });
        await expect(setup.query("UPDATE ordem_servico SET status_os = 'Finalizada' WHERE id = $1", [os.id])).rejects.toMatchObject({ code: "23514" });
        expect((await db.ordem_servico.findByPk(os.id)).status_os).toBe("Aberta");
    });
});
