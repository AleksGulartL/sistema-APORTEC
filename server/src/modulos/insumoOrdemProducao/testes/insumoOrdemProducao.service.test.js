const insumoOrdemProducaoService = require("../insumoOrdemProducao.service");
const insumoOrdemProducaoRepository = require("../insumoOrdemProducao.repository");

jest.mock("../insumoOrdemProducao.repository");

describe("InsumoOrdemProducaoService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve criar insumo de ordem de produção com sucesso sem exigir id_insumo_op", async () => {
        const dadosEntrada = {
            id_op: 1,
            id_item: 2,
            quantidade_planejada: 10.5,
            status_baixa: "Pendente"
        };
        const mockCriado = { id_insumo_op: 1, ...dadosEntrada };
        insumoOrdemProducaoRepository.criar.mockResolvedValue(mockCriado);

        const resultado = await insumoOrdemProducaoService.criar(dadosEntrada);
        expect(resultado).toEqual(mockCriado);
        expect(insumoOrdemProducaoRepository.criar).toHaveBeenCalledWith(dadosEntrada);
    });

    test("Deve lançar erro 400 se id_op for ausente na criação", async () => {
        await expect(insumoOrdemProducaoService.criar({ id_item: 2, quantidade_planejada: 5 }))
            .rejects
            .toMatchObject({ message: "O campo 'id_op' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se quantidade_planejada for menor ou igual a zero", async () => {
        await expect(insumoOrdemProducaoService.criar({ id_op: 1, id_item: 2, quantidade_planejada: 0 }))
            .rejects
            .toMatchObject({ message: "O campo 'quantidade_planejada' é obrigatório e deve ser um número maior que zero.", status: 400 });
    });

    test("Deve atualizar insumo da OP com sucesso", async () => {
        insumoOrdemProducaoRepository.atualizar.mockResolvedValue([1]);

        await insumoOrdemProducaoService.atualizar(1, { status_baixa: "Baixado", quantidade_baixada: 10.5 });
        expect(insumoOrdemProducaoRepository.atualizar).toHaveBeenCalledWith(1, {
            status_baixa: "Baixado",
            quantidade_baixada: 10.5
        });
    });

    test("Deve deletar insumo da OP com sucesso", async () => {
        insumoOrdemProducaoRepository.deletar.mockResolvedValue({ id_insumo_op: 1 });

        const resultado = await insumoOrdemProducaoService.deletar(1);
        expect(resultado).toEqual({ id_insumo_op: 1 });
    });
});
