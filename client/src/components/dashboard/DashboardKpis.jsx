import { Card, CardContent, Chip, Grid, Paper, Stack, Typography, Box } from "@mui/material";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BuildIcon from "@mui/icons-material/Build";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StorageIcon from "@mui/icons-material/Storage";

function CardKpi({ titulo, valor, subtitulo, subtituloCor = "text.secondary", icone, corValor = "text.primary" }) {
    return (
        <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {titulo}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={corValor}>
                            {valor}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {icone}
                    </Box>
                </Stack>
                <Typography variant="caption" color={subtituloCor} sx={{ mt: 1, display: "block" }}>
                    {subtitulo}
                </Typography>
            </CardContent>
        </Card>
    );
}

export default function DashboardKpis({
    totalPedidosAndamento = 0,
    totalPedidosTotal = 0,
    totalPedidosConcluidos = 0,
    totalBloqueados = 0,
    totalAlertasEstoque = 0,
    totalItensCatalogo = 0,
    totalOsAbertas = 0,
    totalOsTotal = 0,
    totalClientes = 0,
    totalUsuariosAtivos = 0,
    totalUsuariosTabela = 0,
    totalChecklists = 0,
    totalItensPedidos = 0,
}) {
    const contagensTabelas = [
        { tabela: "Usuários (usuario)", total: totalUsuariosTabela, detalhe: `${totalUsuariosAtivos} ativo(s)` },
        { tabela: "Clientes (cliente)", total: totalClientes, detalhe: "cadastros ativos" },
        { tabela: "Catálogo (item_catalogo)", total: totalItensCatalogo, detalhe: `${totalAlertasEstoque} em alerta` },
        { tabela: "Pedidos (pedido)", total: totalPedidosTotal, detalhe: `${totalPedidosConcluidos} concluído(s)` },
        { tabela: "Itens de Pedido (pedido_item)", total: totalItensPedidos, detalhe: "vínculos N:M" },
        { tabela: "Medições (checklist_medicao)", total: totalChecklists, detalhe: "levantamentos" },
        { tabela: "Ordens de Serviço (ordem_servico)", total: totalOsTotal, detalhe: `${totalOsAbertas} aberta(s)` },
    ];

    return (
        <Stack spacing={2} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <CardKpi
                        titulo="Pedidos em Andamento"
                        valor={totalPedidosAndamento}
                        subtitulo={
                            totalBloqueados > 0
                                ? `${totalBloqueados} bloqueado(s) (RF08) • ${totalPedidosConcluidos} concluído(s)`
                                : `${totalPedidosTotal} pedido(s) no total (${totalPedidosConcluidos} concluído(s))`
                        }
                        subtituloCor={totalBloqueados > 0 ? "error.main" : "success.main"}
                        icone={<PrecisionManufacturingIcon color="primary" />}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <CardKpi
                        titulo="Alertas de Estoque Mínimo"
                        valor={totalAlertasEstoque}
                        corValor={totalAlertasEstoque > 0 ? "error.main" : "text.primary"}
                        subtitulo={`${totalItensCatalogo} itens registrados no catálogo`}
                        subtituloCor={totalAlertasEstoque > 0 ? "error.main" : "text.secondary"}
                        icone={<Inventory2Icon color={totalAlertasEstoque > 0 ? "error" : "success"} />}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <CardKpi
                        titulo="Ordens de Serviço Ativas"
                        valor={totalOsAbertas}
                        subtitulo={`${totalOsTotal} chamado(s) registrado(s) no total`}
                        icone={<BuildIcon color="warning" />}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <CardKpi
                        titulo="Clientes & Usuários Ativos"
                        valor={totalClientes}
                        subtitulo={`${totalUsuariosAtivos} usuário(s) ativo(s) no sistema`}
                        icone={<PeopleAltIcon color="primary" />}
                    />
                </Grid>
            </Grid>

            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                    sx={{ mb: 1.5 }}
                >
                    <Stack direction="row" spacing={1} alignItems="center">
                        <StorageIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="bold">
                            Resumo Analítico — Quantidade de Registros por Tabela
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        Contagem em tempo real das entidades persistidas no PostgreSQL
                    </Typography>
                </Stack>

                <Grid container spacing={1.25}>
                    {contagensTabelas.map((item) => (
                        <Grid item xs={6} sm={4} md={12 / 7} key={item.tabela}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.25,
                                    borderRadius: 1.5,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                    {item.tabela}
                                </Typography>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="baseline"
                                    sx={{ mt: 0.5 }}
                                >
                                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                                        {item.total}
                                    </Typography>
                                    <Chip size="small" label={item.detalhe} sx={{ height: 18, fontSize: "0.65rem" }} />
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Stack>
    );
}
