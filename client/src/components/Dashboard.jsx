import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../services/api";
import { obterPerfilUsuario, usuarioEhAdm, usuarioEhFuncionario } from "../utils/permissoes";
import DashboardKpis from "./dashboard/DashboardKpis";
import AgendaCalendario from "./dashboard/AgendaCalendario";
import LevantamentoOperacional from "./dashboard/LevantamentoOperacional";
import DetalheEventoDialog from "./dashboard/DetalheEventoDialog";

export default function Dashboard({ usuario, onAbrirPedido }) {
    const ehAdm = usuarioEhAdm(usuario);
    const ehFuncionario = usuarioEhFuncionario(usuario);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pedidos, setPedidos] = useState([]);
    const [itensEstoque, setItensEstoque] = useState([]);
    const [alertasEstoque, setAlertasEstoque] = useState([]);
    const [ordensServico, setOrdensServico] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    const carregarDados = useCallback(
        async (silencioso = false) => {
            if (!ehFuncionario) {
                setCarregando(false);
                return;
            }

            if (!silencioso) setCarregando(true);
            setErro("");

            try {
                const requisicoes = [
                    api.get("/pedido"),
                    api.get("/item_catalogo"),
                    api.get("/ordem_servico"),
                    api.get("/cliente"),
                    ehAdm ? api.get("/usuarios") : Promise.resolve({ data: [] }),
                    ehAdm ? api.get("/item_catalogo/alertas-estoque") : Promise.resolve({ data: [] }),
                ];

                const [resPed, resItens, resOs, resCli, resUsu, resAlertas] =
                    await Promise.allSettled(requisicoes);

                const falhouTudo = [resPed, resItens, resOs, resCli].every((r) => r.status === "rejected");
                if (falhouTudo) {
                    setErro("Não foi possível carregar os dados da Dashboard. Verifique sua conexão com o servidor.");
                    return;
                }

                const listaPedidos =
                    resPed.status === "fulfilled" && Array.isArray(resPed.value.data) ? resPed.value.data : [];
                const listaItens =
                    resItens.status === "fulfilled" && Array.isArray(resItens.value.data) ? resItens.value.data : [];
                const listaOs =
                    resOs.status === "fulfilled" && Array.isArray(resOs.value.data) ? resOs.value.data : [];
                const listaCli =
                    resCli.status === "fulfilled" && Array.isArray(resCli.value.data) ? resCli.value.data : [];
                const listaUsu =
                    resUsu.status === "fulfilled" && Array.isArray(resUsu.value.data) ? resUsu.value.data : [];

                const listaAlertas =
                    ehAdm && resAlertas.status === "fulfilled" && Array.isArray(resAlertas.value.data)
                        ? resAlertas.value.data
                        : listaItens.filter((item) => Number(item.quantidade_atual) <= Number(item.estoque_minimo));

                setPedidos(listaPedidos);
                setItensEstoque(listaItens);
                setOrdensServico(listaOs);
                setClientes(listaCli);
                setUsuarios(listaUsu);
                setAlertasEstoque(listaAlertas);
            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
                setErro("Erro inesperado ao montar o levantamento da Dashboard.");
            } finally {
                setCarregando(false);
            }
        },
        [ehAdm, ehFuncionario]
    );

    useEffect(() => {
        carregarDados(false);
    }, [carregarDados]);

    if (!ehFuncionario) {
        return (
            <Box sx={{ py: 4 }}>
                <Alert severity="info">
                    Sua conta está registrada com o perfil <strong>{obterPerfilUsuario(usuario) || "CLIENTE"}</strong>.
                    Solicite ao administrador a atribuição de um perfil operacional (ADM ou TECNICO) para visualizar o painel interno.
                </Alert>
            </Box>
        );
    }

    const pedidosEmAndamento = pedidos.filter((p) => !["Concluido", "Cancelado"].includes(p.status));
    const pedidosConcluidos = pedidos.filter((p) => p.status === "Concluido").length;
    const totalBloqueados = pedidosEmAndamento.filter((p) => p.bloqueio_fabricacao).length;
    const osAbertas = ordensServico.filter((os) => ["Aberta", "Em Andamento"].includes(os.status_os));
    const totalUsuariosAtivos = ehAdm
        ? usuarios.filter((u) => u.ativo !== false).length
        : clientes.filter((c) => c.usuario?.ativo !== false).length + 1;

    return (
        <Box sx={{ py: 3 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Dashboard Operacional e Analítica
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Indicadores consolidados, alertas de estoque e agenda
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => carregarDados(false)}
                        disabled={carregando}
                    >
                        Atualizar Dados
                    </Button>
                </Stack>
            </Stack>

            {erro && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {erro}
                </Alert>
            )}

            {carregando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {pedidos.some((p) => ["Recebida", "Em Avaliacao"].includes(p.status)) && (
                        <Stack spacing={1} sx={{ mb: 3 }}>
                            <Typography variant="h6">Solicitações de serviço</Typography>
                            {pedidos.filter((p) => ["Recebida", "Em Avaliacao"].includes(p.status)).map((p) => (
                                <Alert key={p.id} severity={p.responsavel_producao_id ? "info" : "warning"}
                                    action={<Button onClick={() => onAbrirPedido?.(p.id)}>Ver solicitação</Button>}>
                                    #{p.id} — {p.cliente?.usuario?.nome_completo} — {p.tipo_pedido}: {p.descricao_solicitacao || "Sem descrição"}
                                    {p.responsavel_producao_id ? ` • Técnico: ${p.responsavel_producao?.nome_completo}` : " • Aguardando atribuição de técnico"}
                                </Alert>
                            ))}
                        </Stack>
                    )}
                    <DashboardKpis
                        totalPedidosAndamento={pedidosEmAndamento.length}
                        totalPedidosTotal={pedidos.length}
                        totalPedidosConcluidos={pedidosConcluidos}
                        totalBloqueados={totalBloqueados}
                        totalAlertasEstoque={alertasEstoque.length}
                        totalItensCatalogo={itensEstoque.length}
                        totalOsAbertas={osAbertas.length}
                        totalOsTotal={ordensServico.length}
                        totalClientes={clientes.length}
                        totalUsuariosAtivos={totalUsuariosAtivos}
                    />

                    <AgendaCalendario
                        pedidos={pedidos}
                        ordensServico={ordensServico}
                        onSelecionarEvento={(tipo, registro) => setEventoSelecionado({ tipo, registro })}
                    />

                    <LevantamentoOperacional
                        pedidos={pedidos}
                        itensEstoque={itensEstoque}
                        alertasEstoque={alertasEstoque}
                        ordensServico={ordensServico}
                        onSelecionarEvento={(tipo, registro) => setEventoSelecionado({ tipo, registro })}
                    />

                    <DetalheEventoDialog
                        selecionado={eventoSelecionado}
                        onClose={() => setEventoSelecionado(null)}
                        onAbrirPedido={onAbrirPedido}
                    />
                </>
            )}
        </Box>
    );
}
