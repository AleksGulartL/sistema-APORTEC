const usuarioRepository = require("../modulos/usuario/usuario.repository");

async function validarTecnico(id) {
    if (id === undefined || id === null || id === "") return;
    const numero = Number(id);
    const tecnico = Number.isSafeInteger(numero) && numero > 0 ? await usuarioRepository.buscarPorId(numero) : null;
    if (!tecnico || tecnico.perfil !== "TECNICO" || tecnico.ativo !== true) {
        throw Object.assign(new Error("O responsável deve ser um técnico ativo."), { status: 400 });
    }
}
module.exports = { validarTecnico };
