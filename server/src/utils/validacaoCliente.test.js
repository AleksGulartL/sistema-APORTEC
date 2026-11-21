const {
    MENSAGEM_ERRO_CPF_CNPJ,
    MENSAGEM_ERRO_TELEFONE,
    validarCpfCnpj,
    validarTelefone,
} = require("./validacaoCliente");

describe("validacaoCliente - Validação e formatação de CPF/CNPJ e Telefone", () => {
    describe("validarCpfCnpj", () => {
        test("Deve aceitar e formatar CPF com 11 dígitos ou já mascarado, inclusive com números iguais", () => {
            expect(validarCpfCnpj("12345678900")).toBe("123.456.789-00");
            expect(validarCpfCnpj(" 123.456.789-00 ")).toBe("123.456.789-00");
            expect(validarCpfCnpj("11111111111")).toBe("111.111.111-11");
            expect(validarCpfCnpj("000.000.000-00")).toBe("000.000.000-00");
        });

        test("Deve aceitar e formatar CNPJ com 14 dígitos ou já mascarado, inclusive com números iguais", () => {
            expect(validarCpfCnpj("12345678000199")).toBe("12.345.678/0001-99");
            expect(validarCpfCnpj(" 12.345.678/0001-99 ")).toBe("12.345.678/0001-99");
            expect(validarCpfCnpj("00.000.000/0000-00")).toBe("00.000.000/0000-00");
            expect(validarCpfCnpj("99999999999999")).toBe("99.999.999/9999-99");
        });

        test("Deve rejeitar valores ausentes, curtos, longos, com letras ou máscara incorreta", () => {
            expect(() => validarCpfCnpj("")).toThrow("O campo 'cnpj_cpf' é obrigatório");
            expect(() => validarCpfCnpj(null)).toThrow("O campo 'cnpj_cpf' é obrigatório");

            const invalidos = [
                "123",
                "1234567890",
                "123456789012",
                "123456789012345",
                "123.456.789",
                "123.456789-00",
                "12.345.678/0001",
                "12.345.678-0001/99",
                "123.456.789-ab",
            ];

            for (const doc of invalidos) {
                try {
                    validarCpfCnpj(doc);
                    throw new Error(`Deveria falhar para '${doc}'`);
                } catch (erro) {
                    expect(erro.status).toBe(400);
                    expect(erro.message).toBe(MENSAGEM_ERRO_CPF_CNPJ);
                }
            }
        });
    });

    describe("validarTelefone", () => {
        test("Deve aceitar e formatar telefones com 10 ou 11 dígitos, inclusive com números iguais", () => {
            expect(validarTelefone("4933221100")).toBe("(49) 3322-1100");
            expect(validarTelefone("(49)3322-1100")).toBe("(49) 3322-1100");
            expect(validarTelefone("49999990101")).toBe("(49) 99999-0101");
            expect(validarTelefone(" (49) 99999-0101 ")).toBe("(49) 99999-0101");
            expect(validarTelefone("(11) 11111-1111")).toBe("(11) 11111-1111");
            expect(validarTelefone("(00) 00000-0000")).toBe("(00) 00000-0000");
            expect(validarTelefone("9999999999")).toBe("(99) 9999-9999");
        });

        test("Deve rejeitar telefones ausentes, tamanho errado, letras ou máscara incorreta", () => {
            expect(() => validarTelefone("   ")).toThrow("O campo 'telefone' é obrigatório");
            expect(() => validarTelefone(undefined)).toThrow("O campo 'telefone' é obrigatório");

            const invalidos = [
                "999",
                "499999999",
                "499999999999",
                "49-99999-0101",
                "(49) 9999-01011",
                "(49) 99999-abcd",
                "(49) 999-9999",
            ];

            for (const tel of invalidos) {
                try {
                    validarTelefone(tel);
                    throw new Error(`Deveria falhar para '${tel}'`);
                } catch (erro) {
                    expect(erro.status).toBe(400);
                    expect(erro.message).toBe(MENSAGEM_ERRO_TELEFONE);
                }
            }
        });
    });
});

