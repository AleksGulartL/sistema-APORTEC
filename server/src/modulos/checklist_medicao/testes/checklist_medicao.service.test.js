const checklistMedicaoService = require("../checklist_medicao.service");
const checklistMedicaoRepository = require("../checklist_medicao.repository");

jest.mock("../checklist_medicao.repository");

describe("ChecklistMedicaoService - Testes Unitários (RF07 e RF08)", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("RF07 & RF08: Deve criar checklist aprovado quando viga_ok, piso_ok e ponto_eletrico_ok forem true", async () => {
        checklistMedicaoRepository.criar.mockImplementation(async (dados) => ({
            id: 1,
            ...dados,
        }));

        const resultado = await checklistMedicaoService.criar({
            pedido_id: 105,
            medidas_vao: "2400x2100mm",
            quantidade_folhas: 2,
            tipo_vidro: "Temperado 10mm",
            modelo_automatizador: "Pivotante Dupla",
            viga_ok: true,
            piso_ok: true,
            ponto_eletrico_ok: true,
            status_aprovacao: "Aprovado",
        });

        expect(resultado.status_aprovacao).toBe("Aprovado");
        expect(resultado.pedido_id).toBe(105);
        expect(checklistMedicaoRepository.criar).toHaveBeenCalledTimes(1);
    });

    test("RF08: Deve impedir aprovação do checklist quando houver pendência de infraestrutura (viga, piso ou ponto elétrico)", async () => {
        await expect(
            checklistMedicaoService.criar({
                pedido_id: 107,
                medidas_vao: "3000x2200mm",
                viga_ok: false,
                piso_ok: true,
                ponto_eletrico_ok: true,
                status_aprovacao: "Aprovado",
            })
        ).rejects.toMatchObject({
            message:
                "Não é possível aprovar o checklist de medição com pendências de infraestrutura (viga, piso ou ponto elétrico).",
            status: 400,
        });

        expect(checklistMedicaoRepository.criar).not.toHaveBeenCalled();
    });

    test("Deve lançar erro 400 se pedido_id não for informado", async () => {
        await expect(
            checklistMedicaoService.criar({ medidas_vao: "2000x2100mm" })
        ).rejects.toMatchObject({
            message: "O campo 'pedido_id' é obrigatório e deve ser um número inteiro válido.",
            status: 400,
        });
    });

    test("Deve bloquear aprovação em PUT parcial quando o checklist existente tiver pendência de infraestrutura", async () => {
        checklistMedicaoRepository.buscarPorId.mockResolvedValue({
            id: 5,
            viga_ok: false,
            piso_ok: true,
            ponto_eletrico_ok: true,
            status_aprovacao: "Reprovado",
        });

        await expect(
            checklistMedicaoService.atualizar(5, { status_aprovacao: "Aprovado" })
        ).rejects.toMatchObject({
            message:
                "Não é possível aprovar o checklist de medição com pendências de infraestrutura (viga, piso ou ponto elétrico).",
            status: 400,
        });

        expect(checklistMedicaoRepository.atualizar).not.toHaveBeenCalled();
    });
});
