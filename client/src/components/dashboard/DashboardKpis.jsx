import { Card, CardContent, Grid, Stack, Typography, Box } from "@mui/material";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BuildIcon from "@mui/icons-material/Build";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

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
}) {
    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <CardKpi
                    titulo="Pedidos em Andamento"
                    valor={totalPedidosAndamento}
                    subtitulo={
                        totalBloqueados > 0
                            ? `${totalBloqueados} bloqueado(s) • ${totalPedidosConcluidos} concluído(s)`
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
    );
}
