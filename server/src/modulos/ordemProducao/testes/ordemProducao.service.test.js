const ordemProducaoService = require("../ordemProducao.service");
const ordemProducaoRepository = require("../ordemProducao.repository");

jest.mock("../ordemProducao.repository");

describe("OrdemProducaoService - Testes Unitários (CT01 e RF08/RF09/RF11)", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("CT01 - Criação da Ordem de Produção (RF09 & RF08)", () => {
        test("Cenário 1: Deve criar Ordem de Produção com Orçamento e Medição Aprovados", async () => {
            ordemProducaoRepository.buscarPedidoComChecklist.mockResolvedValue({
                id: 105,
                id_pedido: 105,
                status_aprovacao: "Aprovado",
                bloqueio_fabricacao: false,
                checklist_medicao: {
                    id: 1,
                    pedido_id: 105,
                    viga_ok: true,
                    piso_ok: true,
                    ponto_eletrico_ok: true,
                    status_aprovacao: "Aprovado",
                },
            });
            ordemProducaoRepository.criar.mockImplementation(async (dados) => ({
                id: 105,
                id_op: 105,
                ...dados,
            }));

            const resultado = await ordemProducaoService.criar({
                id_pedido: 105,
                data_previsao_fim: "2026-11-20",
                id_responsavel_tecnico: 3,
                status_op: "Em Fabricacao",
            });

            expect(resultado.id_pedido).toBe(105);
            expect(resultado.status_op).toBe("Em Fabricacao");
            expect(resultado.data_previsao_fim).toBe("2026-11-20");
            expect(resultado.id_responsavel_tecnico).toBe(3);
            expect(ordemProducaoRepository.criar).toHaveBeenCalledTimes(1);
        });

        test("Cenário 2: Deve bloquear criação de OP se o Orçamento estiver Pendente", async () => {
            ordemProducaoRepository.buscarPedidoComChecklist.mockResolvedValue({
                id: 106,
                id_pedido: 106,
                status_aprovacao: "Pendente",
                bloqueio_fabricacao: true,
            });

            await expect(
                ordemProducaoService.criar({
                    id_pedido: 106,
                    data_previsao_fim: "2026-11-20",
                    id_responsavel_tecnico: 3,
                })
            ).rejects.toMatchObject({
                message: "Bloqueio de fabricação: o orçamento ainda não foi aprovado pelo cliente.",
                status: 400,
            });

            expect(ordemProducaoRepository.criar).not.toHaveBeenCalled();
        });

        test("Cenário 3: Deve bloquear criação de OP se houver Pendência Técnica no Checklist de Medição (RF08)", async () => {
            ordemProducaoRepository.buscarPedidoComChecklist.mockResolvedValue({
                id: 107,
                id_pedido: 107,
                status_aprovacao: "Aprovado",
                bloqueio_fabricacao: true,
                checklist_medicao: {
                    id: 2,
                    pedido_id: 107,
                    viga_ok: false,
                    piso_ok: true,
                    ponto_eletrico_ok: true,
                    status_aprovacao: "Reprovado",
                },
            });

            await expect(
                ordemProducaoService.criar({
                    id_pedido: 107,
                    data_previsao_fim: "2026-11-20",
                    id_responsavel_tecnico: 3,
                })
            ).rejects.toMatchObject({
                message: "Bloqueio de fabricação: pendência técnica identificada no checklist de medição.",
                status: 400,
            });

            expect(ordemProducaoRepository.criar).not.toHaveBeenCalled();
        });

        test("Cenário 4: Deve retornar erro 400 quando campos obrigatórios (data_previsao_fim ou id_responsavel_tecnico) estiverem em branco", async () => {
            await expect(
                ordemProducaoService.criar({
                    id_pedido: 105,
                    data_previsao_fim: "",
                    id_responsavel_tecnico: "",
                })
            ).rejects.toMatchObject({
                message: "Os campos 'id_responsavel_tecnico' e 'data_previsao_fim' são obrigatórios.",
                status: 400,
            });

            await expect(
                ordemProducaoService.criar({
                    id_pedido: 105,
                    data_previsao_fim: "2026-11-20",
                })
            ).rejects.toMatchObject({
                message: "O campo 'id_responsavel_tecnico' é obrigatório e deve ser um número inteiro válido.",
                status: 400,
            });
        });

        test("Cenário 5: Deve impedir criação de OP com data de previsão de entrega no passado (01/10/2026)", async () => {
            await expect(
                ordemProducaoService.criar({
                    id_pedido: 105,
                    data_previsao_fim: "2026-10-01",
                    id_responsavel_tecnico: 3,
                })
            ).rejects.toMatchObject({
                message: "A data de previsão de entrega não pode ser anterior à data atual.",
                status: 400,
            });

            expect(ordemProducaoRepository.criar).not.toHaveBeenCalled();
        });

        test("Cenário 6 (Service): Deve bloquear criação de OP se usuário tiver perfil TECNICO ou CLIENTE", async () => {
            await expect(
                ordemProducaoService.criar(
                    {
                        id_pedido: 105,
                        data_previsao_fim: "2026-11-20",
                        id_responsavel_tecnico: 3,
                    },
                    { id_usuario: 9, perfil: "TECNICO" }
                )
            ).rejects.toMatchObject({
                message: "Acesso negado. O perfil não tem permissão para esta ação.",
                status: 403,
            });
        });
    });

    describe("concluirOrdemProducao - Conclusão da OP (RF11)", () => {
        test("Deve concluir OP e atualizar status_op para 'Concluida'", async () => {
            ordemProducaoRepository.buscarPorId.mockResolvedValue({
                id: 105,
                id_op: 105,
            });
            ordemProducaoRepository.atualizar.mockResolvedValue({ id: 105, status_op: "Concluida" });

            const opConcluida = await ordemProducaoService.concluirOrdemProducao(105);
            expect(ordemProducaoRepository.atualizar).toHaveBeenCalledWith(105, { status_op: "Concluida" });
            expect(opConcluida.status_op).toBe("Concluida");
        });
    });
});
