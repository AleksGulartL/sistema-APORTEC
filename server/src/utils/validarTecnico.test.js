const { validarTecnico } = require("./validarTecnico");
const usuarios = require("../modulos/usuario/usuario.repository");
jest.mock("../modulos/usuario/usuario.repository");
test.each([{ perfil: "ADM", ativo: true }, { perfil: "CLIENTE", ativo: true }, { perfil: "TECNICO", ativo: false }, null])("rejeita responsável inválido: %j", async (usuario) => {
    usuarios.buscarPorId.mockResolvedValue(usuario);
    await expect(validarTecnico(1)).rejects.toMatchObject({ status: 400 });
});
test("aceita técnico ativo e ausência de atribuição", async () => {
    usuarios.buscarPorId.mockResolvedValue({ perfil: "TECNICO", ativo: true });
    await expect(validarTecnico(1)).resolves.toBeUndefined();
    await expect(validarTecnico(null)).resolves.toBeUndefined();
});
