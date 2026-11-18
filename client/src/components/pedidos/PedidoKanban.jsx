import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatarDataBr, formatarMoedaBr } from "../../utils/permissoes";

const COLUNAS_KANBAN = [
    {
        id: "ORCAMENTO",
        titulo: "Orçamento",
        statuses: ["Rascunho", "Pendente"],
        statusDestino: "Pendente",
        proximoStatus: "Aguardando",
        cor: "default",
    },
    {
        id: "PLANEJAMENTO",
        titulo: "Aguardando / Planejada",
        statuses: ["Aguardando", "Planejada"],
        statusDestino: "Aguardando",
        proximoStatus: "Em Fabricacao",
        cor: "info",
    },
    {
        id: "FABRICACAO",
        titulo: "Em Fabricação",
        statuses: ["Em Fabricacao"],
        statusDestino: "Em Fabricacao",
        proximoStatus: "Montagem",
        cor: "warning",
    },
    {
        id: "MONTAGEM",
        titulo: "Montagem",
        statuses: ["Montagem"],
        statusDestino: "Montagem",
        proximoStatus: "Testes",
        cor: "warning",
    },
    {
        id: "TESTES",
        titulo: "Testes",
        statuses: ["Testes"],
        statusDestino: "Testes",
        proximoStatus: "Pronto para Instalacao",
        cor: "secondary",
    },
    {
        id: "PRONTO",
        titulo: "Pronto p/ Instalação",
        statuses: ["Pronto para Instalacao"],
        statusDestino: "Pronto para Instalacao",
        proximoStatus: "Concluido",
        cor: "primary",
    },
    {
        id: "CONCLUIDO",
        titulo: "Concluído",
        statuses: ["Concluido"],
        statusDestino: "Concluido",
        proximoStatus: null,
        cor: "success",
    },
];

export default function PedidoKanban({
    pedidos = [],
    onSelecionarPedido,
    onMudarEtapa,
    incluirCancelados = false,
}) {
    const [arrastandoId, setArrastandoId] = useState(null);
    const [colunaAlvo, setColunaAlvo] = useState(null);

    const colunas = incluirCancelados
        ? [
              ...COLUNAS_KANBAN,
              {
                  id: "CANCELADO",
                  titulo: "Cancelado",
                  statuses: ["Cancelado"],
                  statusDestino: "Cancelado",
                  proximoStatus: null,
                  cor: "error",
              },
          ]
        : COLUNAS_KANBAN;

    function handleDrop(coluna) {
        setColunaAlvo(null);
        if (!arrastandoId) return;
        const pedido = pedidos.find((p) => Number(p.id) === Number(arrastandoId));
        setArrastandoId(null);
        if (!pedido) return;
        if (coluna.statuses.includes(pedido.status)) return;
        onMudarEtapa?.(pedido, coluna.statusDestino);
    }

    return (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                pb: 2,
                alignItems: "flex-start",
            }}
        >
            {colunas.map((col) => {
                const cards = pedidos.filter((p) => col.statuses.includes(p.status));
                const destacada = colunaAlvo === col.id;

                return (
                    <Paper
                        key={col.id}
                        elevation={destacada ? 4 : 2}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setColunaAlvo(col.id);
                        }}
                        onDragLeave={() => setColunaAlvo(null)}
                        onDrop={() => handleDrop(col)}
                        sx={{
                            minWidth: 270,
                            maxWidth: 290,
                            flex: "0 0 275px",
                            borderRadius: 2,
                            bgcolor: destacada ? "rgba(15, 52, 96, 0.06)" : "grey.100",
                            border: destacada ? "2px dashed #0f3460" : "1px solid",
                            borderColor: destacada ? "primary.main" : "divider",
                            p: 1.5,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                {col.titulo}
                            </Typography>
                            <Chip size="small" label={cards.length} color={col.cor} />
                        </Stack>

                        <Stack spacing={1.25} sx={{ minHeight: 120 }}>
                            {cards.length === 0 ? (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    align="center"
                                    sx={{ py: 4, display: "block" }}
                                >
                                    Arraste um pedido para esta etapa
                                </Typography>
                            ) : (
                                cards.map((p) => {
                                    const nomeCliente =
                                        p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`;
                                    const checklistStatus = p.checklist_medicao?.status_aprovacao || "Sem medição";

                                    return (
                                        <Card
                                            key={p.id}
                                            draggable
                                            onDragStart={() => setArrastandoId(p.id)}
                                            onDragEnd={() => {
                                                setArrastandoId(null);
                                                setColunaAlvo(null);
                                            }}
                                            elevation={1}
                                            sx={{
                                                borderRadius: 1.5,
                                                cursor: "grab",
                                                borderLeft: 4,
                                                borderColor: p.bloqueio_fabricacao ? "error.main" : "primary.main",
                                                "&:hover": { boxShadow: 3 },
                                            }}
                                        >
                                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="flex-start"
                                                    spacing={0.5}
                                                >
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        #{p.codigo_proposta || p.id}
                                                    </Typography>
                                                    <Tooltip
                                                        title={
                                                            p.bloqueio_fabricacao
                                                                ? p.motivo_bloqueio || "Bloqueado para fabricação"
                                                                : "Liberado para fabricação"
                                                        }
                                                    >
                                                        <Chip
                                                            size="small"
                                                            icon={p.bloqueio_fabricacao ? <LockIcon /> : <LockOpenIcon />}
                                                            color={p.bloqueio_fabricacao ? "error" : "success"}
                                                            label={p.bloqueio_fabricacao ? "Travado" : "Liberado"}
                                                            sx={{ height: 22 }}
                                                        />
                                                    </Tooltip>
                                                </Stack>

                                                <Typography
                                                    variant="body2"
                                                    fontWeight="medium"
                                                    sx={{ mt: 0.5 }}
                                                    noWrap
                                                >
                                                    {nomeCliente}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {p.tipo_pedido} • {p.status}
                                                </Typography>

                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            p.status_aprovacao === "Aprovado"
                                                                ? "success"
                                                                : p.status_aprovacao === "Reprovado"
                                                                  ? "error"
                                                                  : "warning"
                                                        }
                                                        label={`Comercial: ${p.status_aprovacao}`}
                                                        sx={{ height: 20, fontSize: "0.68rem" }}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            checklistStatus === "Aprovado"
                                                                ? "success"
                                                                : checklistStatus === "Reprovado"
                                                                  ? "error"
                                                                  : "default"
                                                        }
                                                        label={`Medição: ${checklistStatus}`}
                                                        sx={{ height: 20, fontSize: "0.68rem" }}
                                                    />
                                                </Stack>

                                                <Divider sx={{ my: 1 }} />

                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Box>
                                                        <Typography variant="caption" fontWeight="bold" display="block">
                                                            {formatarMoedaBr(p.valor_total)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Prev.: {formatarDataBr(p.data_previsao_fim)}
                                                        </Typography>
                                                    </Box>

                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title="Abrir Detalhes">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => onSelecionarPedido?.(p)}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {col.proximoStatus && (
                                                            <Tooltip title={`Avançar para ${col.proximoStatus}`}>
                                                                <IconButton
                                                                    size="small"
                                                                    color="secondary"
                                                                    onClick={() =>
                                                                        onMudarEtapa?.(p, col.proximoStatus)
                                                                    }
                                                                >
                                                                    {col.proximoStatus === "Concluido" ? (
                                                                        <CheckCircleIcon fontSize="small" />
                                                                    ) : (
                                                                        <ArrowForwardIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </Stack>
                    </Paper>
                );
            })}
        </Box>
    );
}
