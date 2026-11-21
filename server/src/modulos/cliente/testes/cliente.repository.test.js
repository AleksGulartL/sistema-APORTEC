jest.mock("../../../database/models", () => {
    const transaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
    };
    return {
        cliente: {
            findByPk: jest.fn(),
        },
        usuario: {
            findByPk: jest.fn(),
        },
        sequelize: {
            transaction: jest.fn(async () => transaction),
            __mockTx: transaction,
        },
    };
});

const { cliente, usuario, sequelize } = require("../../../database/models");
const clienteRepository = require("../cliente.repository");

describe("ClienteRepository - Exclusão sincronizada de cliente e usuário", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Deve retornar null quando o cliente não existir", async () => {
        cliente.findByPk.mockResolvedValue(null);

        const resultado = await clienteRepository.deletar(999);

        expect(resultado).toBeNull();
        expect(usuario.findByPk).not.toHaveBeenCalled();
    });

    test("Deve desativar e excluir o usuário de perfil CLIENTE vinculado ao remover o cliente", async () => {
        const regCliente = { usuario_id: 7, destroy: jest.fn() };
        const regUsuario = { id: 7, perfil: "CLIENTE", update: jest.fn(), destroy: jest.fn() };

        cliente.findByPk.mockResolvedValue(regCliente);
        usuario.findByPk.mockResolvedValue(regUsuario);

        const resultado = await clienteRepository.deletar(7);

        expect(resultado).toBe(regCliente);
        expect(regCliente.destroy).toHaveBeenCalledWith({ transaction: sequelize.__mockTx });
        expect(regUsuario.update).toHaveBeenCalledWith({ ativo: false }, { transaction: sequelize.__mockTx });
        expect(regUsuario.destroy).toHaveBeenCalledWith({ transaction: sequelize.__mockTx });
        expect(sequelize.__mockTx.commit).toHaveBeenCalledTimes(1);
    });

    test("Não deve excluir usuário vinculado quando seu perfil não for CLIENTE", async () => {
        const regCliente = { usuario_id: 1, destroy: jest.fn() };
        const regUsuario = { id: 1, perfil: "ADM", update: jest.fn(), destroy: jest.fn() };

        cliente.findByPk.mockResolvedValue(regCliente);
        usuario.findByPk.mockResolvedValue(regUsuario);

        await clienteRepository.deletar(1);

        expect(regCliente.destroy).toHaveBeenCalledWith({ transaction: sequelize.__mockTx });
        expect(regUsuario.update).not.toHaveBeenCalled();
        expect(regUsuario.destroy).not.toHaveBeenCalled();
        expect(sequelize.__mockTx.commit).toHaveBeenCalledTimes(1);
    });
});

