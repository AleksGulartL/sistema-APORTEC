export function obterPerfilUsuario(usuario) {
    if (!usuario) return "";
    const bruto = String(usuario.perfil || usuario.cargo_funcao || usuario.role || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (["ADM", "ADMIN", "ADMINISTRADOR"].includes(bruto)) return "ADM";
    if (bruto.includes("TECNIC")) return "TECNICO";
    if (bruto.includes("CLIENT")) return "CLIENTE";
    return bruto;
}

export function usuarioEhAdm(usuario) {
    return obterPerfilUsuario(usuario) === "ADM";
}

export function usuarioEhFuncionario(usuario) {
    const perfil = obterPerfilUsuario(usuario);
    return perfil === "ADM" || perfil === "TECNICO";
}

// Converte DATEONLY ("YYYY-MM-DD") ou TIMESTAMPTZ em chave local "YYYY-MM-DD" sem deslocamento de fuso
export function extrairChaveDataLocal(valor) {
    if (!valor) return null;
    const texto = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }
    const data = new Date(texto);
    if (isNaN(data.getTime())) return null;
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

export function hojeChaveLocal() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

export function formatarDataBr(valor) {
    const chave = extrairChaveDataLocal(valor);
    if (!chave) return "-";
    return chave.split("-").reverse().join("/");
}

export function formatarHoraBr(valor) {
    if (!valor || /^\d{4}-\d{2}-\d{2}$/.test(String(valor).trim())) return null;
    const data = new Date(valor);
    if (isNaN(data.getTime())) return null;
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatarMoedaBr(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}
