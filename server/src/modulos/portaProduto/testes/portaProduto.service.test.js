const portaProdutoService = require("../portaProduto.service");
const portaProdutoRepository = require("../portaProduto.repository");

jest.mock("../portaProduto.repository");

describe("PortaProdutoService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve criar porta/produto com sucesso sem exigir id_porta", async () => {
        const dadosEntrada = {
            numero_serie: "PORTA-2026-001",
            id_obra: 3,
            modelo_automatizador: "Pivotante Dupla Master",
            data_instalacao: "2026-11-01"
        };
        const mockCriado = { id_porta: 1, ...dadosEntrada };
        portaProdutoRepository.criar.mockResolvedValue(mockCriado);

        const resultado = await portaProdutoService.criar(dadosEntrada);
        expect(resultado).toEqual(mockCriado);
        expect(portaProdutoRepository.criar).toHaveBeenCalledWith(dadosEntrada);
    });

    test("Deve lançar erro 400 se numero_serie for ausente", async () => {
        await expect(portaProdutoService.criar({ id_obra: 3, modelo_automatizador: "Pivotante" }))
            .rejects
            .toMatchObject({ message: "O campo 'numero_serie' é obrigatório e deve ser um texto válido.", status: 400 });
    });

    test("Deve lançar erro 400 se id_obra for inválido", async () => {
        await expect(portaProdutoService.criar({ numero_serie: "SN123", id_obra: "abc", modelo_automatizador: "Pivotante" }))
            .rejects
            .toMatchObject({ message: "O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve atualizar porta/produto com sucesso", async () => {
        portaProdutoRepository.atualizar.mockResolvedValue([1]);

        await portaProdutoService.atualizar(1, { modelo_automatizador: "Deslizante Mega" });
        expect(portaProdutoRepository.atualizar).toHaveBeenCalledWith(1, { modelo_automatizador: "Deslizante Mega" });
    });

    test("Deve deletar porta/produto com sucesso", async () => {
        portaProdutoRepository.deletar.mockResolvedValue({ id_porta: 1 });

        const resultado = await portaProdutoService.deletar(1);
        expect(resultado).toEqual({ id_porta: 1 });
    });

    test("RF15: Deve retornar o Prontuário da Porta consolidando garantias, origem, obra e assistências técnicas", async () => {
        portaProdutoRepository.buscarProntuarioCompleto.mockResolvedValue({
            id: 1,
            numero_serie: "PORTA-2026-001",
            modelo_automatizador: "Pivotante Dupla Master",
            data_instalacao: "2026-01-10",
            fim_garantia_motor: "2028-01-10",
            fim_garantia_geral: "2027-01-10",
            obra: {
                id: 3,
                endereco_instalacao: "Av. Industrial, 500",
                cliente: { id: 2, nome_completo: "Shopping Center Sul" },
            },
            pedido_origem: {
                id: 105,
                status: "Concluido",
                itens: [
                    {
                        item_id: 2,
                        quantidade: 1,
                        item_catalogo: { descricao: "Motor Pivotante Duplo" },
                    },
                ],
                movimentacao_estoque: [],
            },
            ordens_servico: [
                {
                    id: 11,
                    status_os: "Concluida",
                    data_hora_execucao_fim: "2026-06-15T14:00:00Z",
                    peca_utilizada: [
                        {
                            item_id: 8,
                            quantidade: 1,
                            item_catalogo: { descricao: "Sensor Óptico" },
                        },
                    ],
                },
            ],
        });

        const prontuario = await portaProdutoService.obterProntuarioPorId(1);

        expect(prontuario.numero_serie).toBe("PORTA-2026-001");
        expect(prontuario.em_garantia_motor).toBe(true);
        expect(prontuario.em_garantia_geral).toBe(true);
        expect(prontuario.componentes_originais).toHaveLength(1);
        expect(prontuario.historico_pecas_substituidas).toHaveLength(1);
        expect(prontuario.chamados_assistencia).toHaveLength(1);
    });
});
