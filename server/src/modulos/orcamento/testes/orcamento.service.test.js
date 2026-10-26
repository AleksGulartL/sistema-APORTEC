const orcamentoService = require("../orcamento.service");
const orcamentoRepository = require("../orcamento.repository");

// Intercepta a camada de repositório de Orçamento
jest.mock("../orcamento.repository");

describe("OrcamentoService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os orçamentos", async () => {
        const mockOrcamentos = [
            { id_orcamento: 1, id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao", valor_total: 1500 }
        ];
        orcamentoRepository.listar.mockResolvedValue(mockOrcamentos);

        const resultado = await orcamentoService.listar();

        expect(resultado).toEqual(mockOrcamentos);
    });

    test("Deve buscar um orçamento por ID válido", async () => {
        const mockOrcamento = { id_orcamento: 1, id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao", valor_total: 1500 };
        orcamentoRepository.buscarPorId.mockResolvedValue(mockOrcamento);

        const resultado = await orcamentoService.buscarPorId(1);

        expect(resultado).toEqual(mockOrcamento);
    });

    test("Deve lançar erro 400 se o ID for inválido", async () => {
        await expect(orcamentoService.buscarPorId("abc"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'id_cliente' faltar ou for inválido", async () => {
        const dadosInvalidos = { id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao" };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'id_cliente' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'id_obra' faltar ou for inválido", async () => {
        const dadosInvalidos = { id_cliente: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao" };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'id_obra' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'id_usuario_criador' faltar ou for inválido", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, tipo_orcamento: "Instalacao" };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'id_usuario_criador' é obrigatório e deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve lançar erro 400 se 'tipo_orcamento' for omitido", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, id_usuario_criador: 1 };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'tipo_orcamento' é obrigatório.", status: 400 });
    });

    test("Deve lançar erro 400 se 'tipo_orcamento' tiver valor fora do ENUM", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "TipoInvalido" };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'tipo_orcamento' deve ser 'Instalacao', 'Manutencao Preventiva' ou 'Manutencao Corretiva'.", status: 400 });
    });

    test("Deve lançar erro 400 se 'valor_total' for negativo", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao", valor_total: -100 };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O 'valor_total' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve lançar erro 400 se 'total_mercadorias' for negativo", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao", total_mercadorias: -50 };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O 'total_mercadorias' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve lançar erro 400 se 'total_servicos' for negativo", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao", total_servicos: -20 };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O 'total_servicos' deve ser um número maior ou igual a zero.", status: 400 });
    });

    test("Deve lançar erro 400 se 'status_aprovacao' for inválido", async () => {
        const dadosInvalidos = { id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao", status_aprovacao: "Invalido" };

        await expect(orcamentoService.criar(dadosInvalidos))
            .rejects
            .toMatchObject({ message: "O campo 'status_aprovacao' deve ser 'Pendente', 'Aprovado' ou 'Reprovado'.", status: 400 });
    });

    test("Deve criar orçamento com sucesso quando os dados forem válidos", async () => {
        const dadosValidos = {
            id_cliente: 1,
            id_obra: 2,
            id_usuario_criador: 3,
            tipo_orcamento: "Instalacao",
            total_mercadorias: 1000.50,
            total_servicos: 500.00,
            valor_total: 1500.50,
            status_aprovacao: "Pendente"
        };

        orcamentoRepository.criar.mockResolvedValue({ id_orcamento: 1, ...dadosValidos });

        const resultado = await orcamentoService.criar(dadosValidos);

        expect(resultado).toHaveProperty("id_orcamento", 1);
        expect(orcamentoRepository.criar).toHaveBeenCalledWith(expect.objectContaining({
            id_cliente: 1,
            id_obra: 2,
            id_usuario_criador: 3,
            tipo_orcamento: "Instalacao"
        }));
    });

    test("Deve atualizar orçamento com sucesso", async () => {
        const dadosAtualizacao = {
            id_cliente: 1,
            id_obra: 2,
            id_usuario_criador: 3,
            tipo_orcamento: "Manutencao Corretiva",
            valor_total: 2000
        };

        orcamentoRepository.atualizar.mockResolvedValue({ id_orcamento: 1, ...dadosAtualizacao });

        const resultado = await orcamentoService.atualizar(1, dadosAtualizacao);

        expect(resultado).toHaveProperty("id_orcamento", 1);
        expect(orcamentoRepository.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({
            tipo_orcamento: "Manutencao Corretiva",
            valor_total: 2000
        }));
    });

    test("Deve lançar erro 400 ao atualizar com ID inválido", async () => {
        await expect(orcamentoService.atualizar(0, { id_cliente: 1, id_obra: 1, id_usuario_criador: 1, tipo_orcamento: "Instalacao" }))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });

    test("Deve deletar orçamento por ID", async () => {
        orcamentoRepository.deletar.mockResolvedValue({ id_orcamento: 1 });

        const resultado = await orcamentoService.deletar(1);

        expect(resultado).toEqual({ id_orcamento: 1 });
        expect(orcamentoRepository.deletar).toHaveBeenCalledWith(1);
    });

    test("Deve lançar erro 400 ao deletar com ID inválido", async () => {
        await expect(orcamentoService.deletar("xyz"))
            .rejects
            .toMatchObject({ message: "O 'id' informado deve ser um número inteiro válido.", status: 400 });
    });
});
