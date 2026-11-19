import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import api from "../services/api";
import {
    calcularSituacaoGarantia,
    calcularSubtotalItem,
    calcularValorTotalPedido,
    formatarDataBr,
    formatarDataHoraBr,
    formatarMoedaBr,
    obterPerfilUsuario,
    usuarioEhFuncionario,
} from "../utils/permissoes";
import { VisualizarAssinatura } from "./comum/AssinaturaDigital";

function CampoFicha({ label, valor }) {
    return (
        <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
                {valor || "-"}
            </Typography>
        </Grid>
    );
}

export default function ProntuarioPorta({
    usuario,
    buscaInicial = "",
    onLimparContexto,
    onAbrirPedido,
    onAbrirOs,
}) {
    const ehFuncionario = usuarioEhFuncionario(usuario);

    const [pedidos, setPedidos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [ordensServico, setOrdensServico] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [busca, setBusca] = useState(buscaInicial || "");
    const [clienteIdFiltro, setClienteIdFiltro] = useState("TODOS");
    const [somenteComSerie, setSomenteComSerie] = useState(false);
    const [portaSelecionadaId, setPortaSelecionadaId] = useState(null);

    const carregarDados = useCallback(async () => {
        if (!ehFuncionario) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro("");
        try {
            const [resPed, resCli, resOs] = await Promise.allSettled([
                api.get("/pedido"),
                api.get("/cliente"),
                api.get("/ordem_servico"),
            ]);

            if (resPed.status === "rejected") {
                setErro(resPed.reason?.response?.data?.erro || "Erro ao carregar prontuários de portas.");
                return;
            }

            const listaPedidos = Array.isArray(resPed.value.data) ? resPed.value.data : [];
            setPedidos(listaPedidos);
            setClientes(resCli.status === "fulfilled" && Array.isArray(resCli.value.data) ? resCli.value.data : []);
            setOrdensServico(
                resOs.status === "fulfilled" && Array.isArray(resOs.value.data) ? resOs.value.data : []
            );

            if (listaPedidos.some((p) => Boolean(p.numero_serie)) && !buscaInicial) {
                setSomenteComSerie(true);
            }
        } catch (err) {
            console.error("Erro ao carregar prontuários:", err);
            setErro("Erro inesperado ao carregar prontuários.");
        } finally {
            setCarregando(false);
        }
    }, [ehFuncionario, buscaInicial]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    useEffect(() => {
        if (!buscaInicial) return;
        setBusca(buscaInicial);
        setSomenteComSerie(false);
        const encontrada = pedidos.find(
            (p) =>
                String(p.numero_serie || "").toLowerCase() === String(buscaInicial).trim().toLowerCase()
        );
        if (encontrada) {
            setPortaSelecionadaId(encontrada.id);
        }
    }, [buscaInicial, pedidos]);

    const totalComSerie = useMemo(
        () => pedidos.filter((p) => Boolean(p.numero_serie)).length,
        [pedidos]
    );

    const portasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return pedidos.filter((p) => {
            if (somenteComSerie && !p.numero_serie) return false;
            if (clienteIdFiltro !== "TODOS" && Number(p.cliente_id) !== Number(clienteIdFiltro)) return false;
            if (!termo) return true;
            const nomeCli = String(p.cliente?.usuario?.nome_completo || "").toLowerCase();
            const cnpjCli = String(p.cliente?.cnpj_cpf || "").toLowerCase();
            return (
                String(p.numero_serie || "").toLowerCase().includes(termo) ||
                nomeCli.includes(termo) ||
                cnpjCli.includes(termo) ||
                String(p.id) === termo
            );
        });
    }, [pedidos, busca, clienteIdFiltro, somenteComSerie]);

    const portaSelecionada = useMemo(
        () => pedidos.find((p) => Number(p.id) === Number(portaSelecionadaId)) || null,
        [pedidos, portaSelecionadaId]
    );

    const historicoOsPorta = useMemo(() => {
        if (!portaSelecionada) return [];
        return ordensServico
            .filter((os) => Number(os.pedido_id) === Number(portaSelecionada.id))
            .sort((a, b) => new Date(b.created_at || b.data_agendamento || 0) - new Date(a.created_at || a.data_agendamento || 0));
    }, [ordensServico, portaSelecionada]);

    const outrasOsCliente = useMemo(() => {
        if (!portaSelecionada) return [];
        return ordensServico.filter(
            (os) =>
                Number(os.pedido?.cliente_id) === Number(portaSelecionada.cliente_id) &&
                Number(os.pedido_id || 0) !== Number(portaSelecionada.id)
        );
    }, [ordensServico, portaSelecionada]);

    if (!ehFuncionario) {
        return (
            <Box sx={{ py: 4 }}>
                <Alert severity="info">
                    Acesso restrito a colaboradores (ADM ou TECNICO). Perfil atual:{" "}
                    <strong>{obterPerfilUsuario(usuario) || "CLIENTE"}</strong>.
                </Alert>
            </Box>
        );
    }

    if (portaSelecionada) {
        const garantia = calcularSituacaoGarantia(portaSelecionada.fim_garantia);
        const checklist = portaSelecionada.checklist_medicao;
        const itens = portaSelecionada.itens || [];
        const nomeCliente =
            portaSelecionada.cliente?.usuario?.nome_completo || `Cliente #${portaSelecionada.cliente_id}`;

        return (
            <Box sx={{ py: 3 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={2}
                    sx={{ mb: 2.5 }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => {
                                setPortaSelecionadaId(null);
                                onLimparContexto?.();
                            }}
                        >
                            Voltar para Busca
                        </Button>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Prontuário: {portaSelecionada.numero_serie || `Pedido #${portaSelecionada.id}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Cliente: {nomeCliente} • Pedido #{portaSelecionada.id}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {onAbrirPedido && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => onAbrirPedido(portaSelecionada.id)}
                            >
                                Ver Pedido
                            </Button>
                        )}
                        {onAbrirOs && (
                            <Button
                                size="small"
                                variant="contained"
                                color="secondary"
                                startIcon={<BuildIcon />}
                                onClick={() => onAbrirOs(portaSelecionada)}
                            >
                                Abrir OS para esta Porta
                            </Button>
                        )}
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                        >
                            Imprimir
                        </Button>
                    </Stack>
                </Stack>

                <Alert
                    severity={!garantia.possui ? "info" : garantia.vigente ? "success" : "error"}
                    icon={!garantia.possui ? <QrCode2Icon /> : garantia.vigente ? <VerifiedUserIcon /> : <WarningAmberIcon />}
                    sx={{ mb: 3 }}
                >
                    <strong>Vigência da Garantia:</strong> {garantia.label}
                </Alert>

                <Stack spacing={3}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                1. Dados da Instalação e Cliente
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <CampoFicha
                                    label="Nº de Série da Porta"
                                    valor={portaSelecionada.numero_serie || "Ainda não emitido"}
                                />
                                <CampoFicha
                                    label="Pedido"
                                    valor={`#${portaSelecionada.id} (${portaSelecionada.status})`}
                                />
                                <CampoFicha label="Tipo do Pedido" valor={portaSelecionada.tipo_pedido} />
                                <CampoFicha label="Cliente" valor={nomeCliente} />
                                <CampoFicha label="CNPJ / CPF" valor={portaSelecionada.cliente?.cnpj_cpf} />
                                <CampoFicha label="Telefone" valor={portaSelecionada.cliente?.telefone} />
                                <CampoFicha label="E-mail" valor={portaSelecionada.cliente?.usuario?.email} />
                                <CampoFicha
                                    label="Endereço de Instalação"
                                    valor={portaSelecionada.endereco_instalacao || portaSelecionada.cliente?.endereco}
                                />
                                <CampoFicha
                                    label="Responsável pela Produção"
                                    valor={portaSelecionada.responsavel_producao?.nome_completo}
                                />
                                <CampoFicha
                                    label="Data de Aprovação"
                                    valor={formatarDataHoraBr(portaSelecionada.data_aprovacao)}
                                />
                                <CampoFicha
                                    label="Data de Conclusão / Entrega"
                                    valor={formatarDataHoraBr(portaSelecionada.data_conclusao)}
                                />
                                <CampoFicha
                                    label="Fim da Garantia"
                                    valor={formatarDataBr(portaSelecionada.fim_garantia)}
                                />
                            </Grid>

                            {portaSelecionada.assinatura_cliente_instalacao && (
                                <Box sx={{ mt: 2 }}>
                                    <VisualizarAssinatura
                                        valor={portaSelecionada.assinatura_cliente_instalacao}
                                        titulo="Assinatura Digital de Aceite da Instalação"
                                    />
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    2. Medidas Originais e Especificações (Checklist de Medição)
                                </Typography>
                                {checklist && (
                                    <Chip
                                        size="small"
                                        color={
                                            checklist.status_aprovacao === "Aprovado"
                                                ? "success"
                                                : checklist.status_aprovacao === "Reprovado"
                                                  ? "error"
                                                  : "warning"
                                        }
                                        label={`Medição: ${checklist.status_aprovacao}`}
                                    />
                                )}
                            </Stack>
                            <Divider sx={{ mb: 2 }} />

                            {!checklist ? (
                                <Typography variant="body2" color="text.secondary">
                                    Nenhum checklist de medição registrado para este pedido.
                                </Typography>
                            ) : (
                                <>
                                    <Grid container spacing={2}>
                                        <CampoFicha label="Medidas do Vão" valor={checklist.medidas_vao} />
                                        <CampoFicha label="Sentido de Abertura" valor={checklist.sentido_abertura} />
                                        <CampoFicha
                                            label="Quantidade de Folhas"
                                            valor={String(checklist.quantidade_folhas)}
                                        />
                                        <CampoFicha label="Tipo de Vidro" valor={checklist.tipo_vidro} />
                                        <CampoFicha
                                            label="Modelo do Automatizador"
                                            valor={checklist.modelo_automatizador}
                                        />
                                    </Grid>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                                        <Chip
                                            size="small"
                                            icon={checklist.viga_ok ? <CheckCircleIcon /> : <WarningAmberIcon />}
                                            color={checklist.viga_ok ? "success" : "error"}
                                            variant="outlined"
                                            label={checklist.viga_ok ? "Viga OK" : "Pendência de Viga"}
                                        />
                                        <Chip
                                            size="small"
                                            icon={checklist.piso_ok ? <CheckCircleIcon /> : <WarningAmberIcon />}
                                            color={checklist.piso_ok ? "success" : "error"}
                                            variant="outlined"
                                            label={checklist.piso_ok ? "Piso OK" : "Pendência de Piso"}
                                        />
                                        <Chip
                                            size="small"
                                            icon={
                                                checklist.ponto_eletrico_ok ? (
                                                    <CheckCircleIcon />
                                                ) : (
                                                    <WarningAmberIcon />
                                                )
                                            }
                                            color={checklist.ponto_eletrico_ok ? "success" : "error"}
                                            variant="outlined"
                                            label={
                                                checklist.ponto_eletrico_ok
                                                    ? "Ponto Elétrico OK"
                                                    : "Pendência Ponto Elétrico"
                                            }
                                        />
                                    </Stack>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    3. Peças, Equipamentos e Insumos Utilizados ({itens.length})
                                </Typography>
                                <Chip
                                    size="small"
                                    color="primary"
                                    label={`Total: ${formatarMoedaBr(calcularValorTotalPedido(portaSelecionada))}`}
                                />
                            </Stack>
                            <Divider sx={{ mb: 2 }} />

                            {itens.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    Nenhuma peça ou item registrado neste pedido.
                                </Typography>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: "grey.100" }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: "bold" }}>Código</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }}>Descrição</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }}>Tipo / Categoria</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }}>Quantidade</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }}>Valor Unit.</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }}>Subtotal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {itens.map((it) => (
                                                <TableRow key={it.id}>
                                                    <TableCell>{it.item_catalogo?.codigo_referencia || "-"}</TableCell>
                                                    <TableCell sx={{ fontWeight: "medium" }}>
                                                        {it.item_catalogo?.descricao || `Item #${it.item_id}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        {it.item_catalogo?.tipo?.nome || "-"} /{" "}
                                                        {it.item_catalogo?.categoria?.nome || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {it.quantidade} {it.item_catalogo?.unidade_medida || ""}
                                                    </TableCell>
                                                    <TableCell>{formatarMoedaBr(it.valor_unitario)}</TableCell>
                                                    <TableCell sx={{ fontWeight: "bold" }}>
                                                        {formatarMoedaBr(calcularSubtotalItem(it))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                4. Histórico de Ordens de Serviço desta Porta ({historicoOsPorta.length})
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {historicoOsPorta.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    Nenhuma Ordem de Serviço vinculada diretamente a esta porta até o momento.
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {historicoOsPorta.map((os) => (
                                        <Paper key={os.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                justifyContent="space-between"
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                                spacing={1}
                                                sx={{ mb: 1 }}
                                            >
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    OS #{os.id} — {os.tipo_servico}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    {os.origem_cobertura && (
                                                        <Chip size="small" variant="outlined" label={os.origem_cobertura} />
                                                    )}
                                                    <Chip
                                                        size="small"
                                                        color={
                                                            os.status_os === "Finalizada"
                                                                ? "success"
                                                                : os.status_os === "Cancelada"
                                                                  ? "error"
                                                                  : "warning"
                                                        }
                                                        label={os.status_os}
                                                    />
                                                </Stack>
                                            </Stack>

                                            <Grid container spacing={1.5}>
                                                <CampoFicha
                                                    label="Técnico Responsável"
                                                    valor={
                                                        os.tecnico_responsavel?.nome_completo ||
                                                        (os.tecnico_responsavel_id
                                                            ? `Técnico #${os.tecnico_responsavel_id}`
                                                            : "Aguardando atribuição")
                                                    }
                                                />
                                                <CampoFicha
                                                    label="Agendamento"
                                                    valor={formatarDataHoraBr(os.data_agendamento)}
                                                />
                                                <CampoFicha
                                                    label="Conclusão"
                                                    valor={formatarDataHoraBr(os.data_conclusao)}
                                                />
                                            </Grid>

                                            {os.descricao_problema && (
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    <strong>Problema / Escopo:</strong> {os.descricao_problema}
                                                </Typography>
                                            )}
                                            {os.parecer_tecnico && (
                                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                    <strong>Parecer Técnico:</strong> {os.parecer_tecnico}
                                                </Typography>
                                            )}
                                            {os.assinatura_cliente_digital && (
                                                <Box sx={{ mt: 1.5 }}>
                                                    <VisualizarAssinatura
                                                        valor={os.assinatura_cliente_digital}
                                                        titulo="Assinatura do Cliente na OS"
                                                    />
                                                </Box>
                                            )}
                                        </Paper>
                                    ))}
                                </Stack>
                            )}

                            {outrasOsCliente.length > 0 && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Este cliente possui outras <strong>{outrasOsCliente.length}</strong> OS registrada(s)
                                    em outros pedidos.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        );
    }

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
                        Prontuário da Porta
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Consulta consolidada por nº de série ou cliente: garantia, medidas, peças e histórico de OS (RF15)
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={carregarDados}
                    disabled={carregando}
                >
                    Atualizar
                </Button>
            </Stack>

            {erro && (
                <Alert severity="error" onClose={() => setErro("")} sx={{ mb: 2 }}>
                    {erro}
                </Alert>
            )}

            <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar por Nº de Série (ex: APORTEC-2026-0001), #pedido ou cliente..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="pront-cliente-label">Filtrar por Cliente</InputLabel>
                            <Select
                                labelId="pront-cliente-label"
                                label="Filtrar por Cliente"
                                value={clienteIdFiltro}
                                onChange={(e) => setClienteIdFiltro(e.target.value)}
                            >
                                <MenuItem value="TODOS">Todos os Clientes</MenuItem>
                                {clientes.map((c) => (
                                    <MenuItem key={c.usuario_id} value={String(c.usuario_id)}>
                                        {c.usuario?.nome_completo || `Cliente #${c.usuario_id}`} ({c.cnpj_cpf})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                                size="small"
                                icon={<QrCode2Icon />}
                                label={`Com Nº Série (${totalComSerie})`}
                                color={somenteComSerie ? "primary" : "default"}
                                variant={somenteComSerie ? "filled" : "outlined"}
                                onClick={() => setSomenteComSerie(true)}
                            />
                            <Chip
                                size="small"
                                label={`Todos (${pedidos.length})`}
                                color={!somenteComSerie ? "primary" : "default"}
                                variant={!somenteComSerie ? "filled" : "outlined"}
                                onClick={() => setSomenteComSerie(false)}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </Card>

            {carregando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : portasFiltradas.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Nenhuma porta encontrada para os filtros aplicados.
                    </Typography>
                    {somenteComSerie && pedidos.length > 0 && (
                        <Button sx={{ mt: 1.5 }} variant="text" onClick={() => setSomenteComSerie(false)}>
                            Exibir também pedidos sem Nº de Série emitido ({pedidos.length})
                        </Button>
                    )}
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {portasFiltradas.map((p) => {
                        const nomeCli = p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`;
                        const gar = calcularSituacaoGarantia(p.fim_garantia);
                        const qtdOs = ordensServico.filter((os) => Number(os.pedido_id) === Number(p.id)).length;
                        const qtdItens = (p.itens || []).length;

                        return (
                            <Grid item xs={12} sm={6} md={4} key={p.id}>
                                <Card
                                    elevation={2}
                                    sx={{
                                        borderRadius: 2,
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        borderTop: 4,
                                        borderColor: p.numero_serie
                                            ? gar.vigente
                                                ? "success.main"
                                                : "error.main"
                                            : "grey.400",
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Chip
                                                size="small"
                                                icon={<QrCode2Icon />}
                                                color={p.numero_serie ? "primary" : "default"}
                                                label={p.numero_serie || "Série Pendente"}
                                            />
                                            <Chip size="small" variant="outlined" label={p.status} />
                                        </Stack>

                                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1.5 }} noWrap>
                                            {nomeCli}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Pedido #{p.id} • {p.endereco_instalacao || p.cliente?.endereco || "-"}
                                        </Typography>

                                        <Divider sx={{ my: 1.5 }} />

                                        <Stack spacing={0.5}>
                                            <Typography variant="caption">
                                                <strong>Garantia:</strong>{" "}
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        color: !gar.possui
                                                            ? "text.secondary"
                                                            : gar.vigente
                                                              ? "success.main"
                                                              : "error.main",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {gar.label}
                                                </Box>
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                <strong>Medição:</strong>{" "}
                                                {p.checklist_medicao?.medidas_vao || "Não registrada"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                <strong>Itens:</strong> {qtdItens} • <strong>Histórico OS:</strong>{" "}
                                                {qtdOs}
                                            </Typography>
                                        </Stack>
                                    </CardContent>

                                    <Box sx={{ px: 2, pb: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={() => setPortaSelecionadaId(p.id)}
                                        >
                                            Abrir Ficha Completa
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}
