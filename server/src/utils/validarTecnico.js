const usuarioRepository = require("../modulos/usuario/usuario.repository");
const { criarErro } = require("./criarErro");

async function validarTecnico(id) {
    if (id === undefined || id === null || id === "") return;
    const numero = Number(id);
    const tecnico = Number.isSafeInteger(numero) && numero > 0 ? await usuarioRepository.buscarPorId(numero) : null;
    if (!tecnico || tecnico.perfil !== "TECNICO" || tecnico.ativo !== true) {
        throw criarErro("O responsável deve ser um técnico ativo.");
    }
}
module.exports = { validarTecnico };
