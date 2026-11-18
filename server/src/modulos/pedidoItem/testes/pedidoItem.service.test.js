const pedidoItemService = require("../pedidoItem.service");
const pedidoItemRepository = require("../pedidoItem.repository");

jest.mock("../pedidoItem.repository");

describe("PedidoItemService - Testes Unitários", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve listar todos os itens de pedido", async () => {
        const mockItens = [{ id: 1, pedido_id: 1, item_id: 2, quantidade: 2 }];
        pedidoItemRepository.listar.mockResolvedValue(mockItens);

        const resultado = await pedidoItemService.listar();
        expect(resultado).toEqual(mockItens);
    });

    test("Deve calcular valor_unitario do catálogo e valor_total automaticamente ao criar item", async () => {
        pedidoItemRepository.buscarItemCatalogo.mockResolvedValue({ id: 5, valor_unitario_padrao: 150 });
        pedidoItemRepository.criar.mockImplementation(async (dados) => ({ id: 10, ...dados }));

        const criado = await pedidoItemService.criar({
            pedido_id: 3,
            item_id: 5,
            quantidade: 4,
        });

        expect(pedidoItemRepository.criar).toHaveBeenCalledWith({
            pedido_id: 3,
            item_id: 5,
            quantidade: 4,
            valor_unitario: 150,
            valor_total: 600,
        });
        expect(criado.id).toBe(10);
    });

    test("Deve aceitar aliases legados id_orcamento e id_item_catalogo", async () => {
        pedidoItemRepository.criar.mockImplementation(async (dados) => ({ id: 11, ...dados }));

        await pedidoItemService.criar({
            id_orcamento: 7,
            id_item_catalogo: 9,
            quantidade: 2,
            valor_unitario: 50,
        });

        expect(pedidoItemRepository.criar).toHaveBeenCalledWith({
            pedido_id: 7,
            item_id: 9,
            quantidade: 2,
            valor_unitario: 50,
            valor_total: 100,
        });
    });

    test("Deve lançar erro 400 se pedido_id for ausente ou inválido", async () => {
        await expect(pedidoItemService.criar({ item_id: 1, quantidade: 1 })).rejects.toMatchObject({
            message: "O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.",
            status: 400,
        });
    });

    test("Deve lançar erro 400 se item_id for ausente ou inválido", async () => {
        await expect(pedidoItemService.criar({ pedido_id: 1, quantidade: 1 })).rejects.toMatchObject({
            message: "O campo 'item_id' é obrigatório e deve ser um número inteiro maior que zero.",
            status: 400,
        });
    });
});
