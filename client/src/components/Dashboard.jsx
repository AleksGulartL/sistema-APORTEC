import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
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
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    const carregarDados = useCallback(async () => {
        if (!ehFuncionario) {
            setCarregando(false);
            return;
        }

        setCarregando(true);
        setErro("");

        try {
            const requisicoes = [
                api.get("/pedido"),
                api.get("/item_catalogo"),
                api.get("/ordem_servico"),
                api.get("/cliente"),
                ehAdm ? api.get("/item_catalogo/alertas-estoque") : Promise.resolve({ data: [] }),
            ];

            const [resPed, resItens, resOs, resCli, resAlertas] = await Promise.allSettled(requisicoes);

            const falhouTudo = [resPed, resItens, resOs, resCli].every((r) => r.status === "rejected");
            if (falhouTudo) {
                setErro("Não foi possível carregar os dados da Dashboard. Verifique sua conexão com o servidor.");
                return;
            }

            const listaPedidos = resPed.status === "fulfilled" && Array.isArray(resPed.value.data) ? resPed.value.data : [];
            const listaItens = resItens.status === "fulfilled" && Array.isArray(resItens.value.data) ? resItens.value.data : [];
            const listaOs = resOs.status === "fulfilled" && Array.isArray(resOs.value.data) ? resOs.value.data : [];
            const listaCli = resCli.status === "fulfilled" && Array.isArray(resCli.value.data) ? resCli.value.data : [];

            const listaAlertas =
                ehAdm && resAlertas.status === "fulfilled" && Array.isArray(resAlertas.value.data)
                    ? resAlertas.value.data
                    : listaItens.filter((item) => Number(item.quantidade_atual) <= Number(item.estoque_minimo));

            setPedidos(listaPedidos);
            setItensEstoque(listaItens);
            setOrdensServico(listaOs);
            setClientes(listaCli);
            setAlertasEstoque(listaAlertas);
        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
            setErro("Erro inesperado ao montar o levantamento da Dashboard.");
        } finally {
            setCarregando(false);
        }
    }, [ehAdm, ehFuncionario]);

    useEffect(() => {
        carregarDados();
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
    const totalBloqueados = pedidosEmAndamento.filter((p) => p.bloqueio_fabricacao).length;
    const osAbertas = ordensServico.filter((os) => ["Aberta", "Em Andamento"].includes(os.status_os));
    const valorCarteiraAprovada = pedidos
        .filter((p) => p.status_aprovacao === "Aprovado" && p.status !== "Cancelado")
        .reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

    return (
        <Box sx={{ py: 3 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Dashboard Operacional
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Visão consolidada de pedidos em andamento, alertas de estoque e agenda de prazos
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={carregarDados}
                    disabled={carregando}
                >
                    Atualizar Dados
                </Button>
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
                    <DashboardKpis
                        ehAdm={ehAdm}
                        totalPedidosAndamento={pedidosEmAndamento.length}
                        totalBloqueados={totalBloqueados}
                        totalAlertasEstoque={alertasEstoque.length}
                        totalItensCatalogo={itensEstoque.length}
                        totalOsAbertas={osAbertas.length}
                        totalOsTotal={ordensServico.length}
                        valorCarteiraAprovada={valorCarteiraAprovada}
                        totalClientes={clientes.length}
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
