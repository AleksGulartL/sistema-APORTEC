export function obterPerfilUsuario(usuario) {
    if (!usuario) return "";
    const bruto = String(usuario.perfil || "")
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

export function usuarioEhCliente(usuario) {
    return obterPerfilUsuario(usuario) === "CLIENTE";
}

export function calcularSubtotalItem(item) {
    return Number((Number(item?.quantidade || 0) * Number(item?.valor_unitario || 0)).toFixed(2));
}

export function calcularValorTotalPedido(pedido) {
    const custo = Number(pedido?.custo_total || 0);
    const acrescimo = Number(pedido?.percentual_acrescimo || 0);
    return Number((custo * (1 + acrescimo / 100)).toFixed(2));
}

export function ordenarLista(lista = [], campo, direcao = "asc", extratores = {}) {
    if (!Array.isArray(lista) || !campo) return lista;
    const extrair = extratores[campo] || ((item) => item?.[campo]);
    const fator = direcao === "desc" ? -1 : 1;

    return [...lista].sort((a, b) => {
        const valA = extrair(a);
        const valB = extrair(b);

        if (valA === null || valA === undefined || valA === "") return 1;
        if (valB === null || valB === undefined || valB === "") return -1;

        if (typeof valA === "number" && typeof valB === "number") {
            return (valA - valB) * fator;
        }

        return (
            String(valA).localeCompare(String(valB), "pt-BR", {
                numeric: true,
                sensitivity: "base",
            }) * fator
        );
    });
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

export function formatarDataHoraBr(valor) {
    if (!valor) return "-";
    const data = formatarDataBr(valor);
    const hora = formatarHoraBr(valor);
    return hora ? `${data} às ${hora}` : data;
}

export function formatarParaInputDateTimeLocal(valor) {
    if (!valor) return "";
    const data = new Date(valor);
    if (isNaN(data.getTime())) return "";
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    const hora = String(data.getHours()).padStart(2, "0");
    const min = String(data.getMinutes()).padStart(2, "0");
    return `${ano}-${mes}-${dia}T${hora}:${min}`;
}

export function calcularSituacaoGarantia(fimGarantia) {
    const chave = extrairChaveDataLocal(fimGarantia);
    if (!chave) {
        return { possui: false, vigente: false, label: "Sem garantia registrada", diasRestantes: null };
    }
    const hoje = hojeChaveLocal();
    const [a1, m1, d1] = hoje.split("-").map(Number);
    const [a2, m2, d2] = chave.split("-").map(Number);
    const dtHoje = new Date(a1, m1 - 1, d1);
    const dtFim = new Date(a2, m2 - 1, d2);
    const dias = Math.round((dtFim.getTime() - dtHoje.getTime()) / (1000 * 60 * 60 * 24));
    const vigente = dias >= 0;
    return {
        possui: true,
        vigente,
        diasRestantes: dias,
        dataBr: formatarDataBr(chave),
        label: vigente
            ? `Vigente até ${formatarDataBr(chave)} (${dias === 0 ? "vence hoje" : `${dias} dia(s)`})`
            : `Vencida em ${formatarDataBr(chave)}`,
    };
}
