import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SaveIcon from "@mui/icons-material/Save";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import PagamentoFields from "../comum/PagamentoFields";
import api from "../../services/api";
import {
    calcularSubtotalItem,
    calcularValorTotalPedido,
    extrairChaveDataLocal,
    formatarDataBr,
    formatarDataHoraBr,
    formatarMoedaBr,
} from "../../utils/permissoes";
import AssinaturaDigital, { VisualizarAssinatura } from "../comum/AssinaturaDigital";

const TIPOS_PEDIDO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];

const ETAPAS_STEPPER = [
    "Pendente",
    "Aguardando",
    "Planejada",
    "Em Fabricacao",
    "Montagem",
    "Testes",
    "Pronto para Instalacao",
    "Concluido",
];

const ETAPAS_FABRICACAO = [
    "Em Fabricacao",
    "Montagem",
    "Testes",
    "Pronto para Instalacao",
    "Concluido",
];

const SENTIDOS_ABERTURA = [
    "Bipartida (Central)",
    "Lateral Direita",
    "Lateral Esquerda",
    "Telescópica",
    "Pivotante",
    "Outro",
];

function calcularEstadoBloqueio(statusAprovacaoComercial, checklist) {
    const pendencias = [];
    if (statusAprovacaoComercial !== "Aprovado") {
        pendencias.push("orçamento pendente de aprovação pelo cliente");
    }
    if (!checklist) {
        pendencias.push("checklist técnico de medição não cadastrado");
    } else {
        if (checklist.viga_ok === false) pendencias.push("pendência de viga");
        if (checklist.piso_ok === false) pendencias.push("pendência de nivelamento de piso");
        if (checklist.ponto_eletrico_ok === false) pendencias.push("ponto elétrico ausente ou inadequado");
        if (checklist.status_aprovacao !== "Aprovado") {
            pendencias.push(`checklist de medição com status '${checklist.status_aprovacao}'`);
        }
    }
    const bloqueado = pendencias.length > 0;
    return {
        bloqueado,
        motivo: bloqueado ? `Bloqueado: ${pendencias.join("; ")}.` : null,
    };
}

export default function PedidoDetalhe({
    pedido,
    clientes = [],
    itensCatalogo = [],
    tecnicos = [],
    usuario,
    ehAdm,
    onVoltar,
    onPedidoAtualizado,
    onAbrirProntuario,
    onAbrirOs,
}) {
    const [aba, setAba] = useState(0);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [formComercial, setFormComercial] = useState({});
    const [itemSelecionadoId, setItemSelecionadoId] = useState("");
    const [qtdItem, setQtdItem] = useState("1");
    const [valorUnitItem, setValorUnitItem] = useState("0");
    const [itemEdicao, setItemEdicao] = useState(null);
    const [qtdEdicao, setQtdEdicao] = useState("1");
    const [valorUnitEdicao, setValorUnitEdicao] = useState("0");
    const [formMedicao, setFormMedicao] = useState({});
    const [checklistPreSaida, setChecklistPreSaida] = useState(null);
    const [assinaturaAceite, setAssinaturaAceite] = useState("");
    const [numeroSerieInput, setNumeroSerieInput] = useState("");
    const [fimGarantiaInput, setFimGarantiaInput] = useState("");

    useEffect(() => {
        if (!pedido) return;
        setFormComercial({
            cliente_id: pedido.cliente_id ? String(pedido.cliente_id) : "",
            responsavel_producao_id: pedido.responsavel_producao_id ? String(pedido.responsavel_producao_id) : "",
            tipo_pedido: pedido.tipo_pedido || "Instalacao",
            status_aprovacao: pedido.status_aprovacao || "Pendente",
            percentual_acrescimo: String(pedido.percentual_acrescimo ?? 0),
            endereco_instalacao: pedido.endereco_instalacao || "",
            forma_pagamento: pedido.forma_pagamento || "",
            condicoes_pagamento: pedido.condicoes_pagamento || "",
            data_previsao_fim: extrairChaveDataLocal(pedido.data_previsao_fim) || "",
        });

        const cm = pedido.checklist_medicao;
        setFormMedicao({
            id: cm?.id || null,
            tecnico_id: cm?.tecnico_id ? String(cm.tecnico_id) : (usuario?.perfil === "TECNICO" ? String(usuario.id) : ""),
            medidas_vao: cm?.medidas_vao || "",
            sentido_abertura: cm?.sentido_abertura || "Bipartida (Central)",
            quantidade_folhas: cm?.quantidade_folhas ? String(cm.quantidade_folhas) : "2",
            tipo_vidro: cm?.tipo_vidro || "",
            modelo_automatizador: cm?.modelo_automatizador || "",
            viga_ok: cm ? cm.viga_ok !== false : true,
            piso_ok: cm ? cm.piso_ok !== false : true,
            ponto_eletrico_ok: cm ? cm.ponto_eletrico_ok !== false : true,
            status_aprovacao: cm?.status_aprovacao || "Pendente",
        });

        setAssinaturaAceite(pedido.assinatura_cliente_instalacao || "");
        setNumeroSerieInput(pedido.numero_serie || "");
        setFimGarantiaInput(extrairChaveDataLocal(pedido.fim_garantia) || "");
    }, [pedido, usuario]);

    const itensPedido = pedido?.itens || [];
    const checklist = pedido?.checklist_medicao || null;
    const nomeCliente = pedido?.cliente?.usuario?.nome_completo || `Cliente #${pedido?.cliente_id}`;
    const valorFinalPedido = calcularValorTotalPedido(pedido);

    const itensCatalogoMap = useMemo(() => {
        const mapa = {};
        for (const it of itensCatalogo) {
            mapa[Number(it.id)] = it;
        }
        return mapa;
    }, [itensCatalogo]);

    const indiceEtapaAtual = useMemo(() => {
        const idx = ETAPAS_STEPPER.indexOf(pedido?.status);
        return idx >= 0 ? idx : 0;
    }, [pedido?.status]);

    async function salvarDadosComerciais(event, overrideStatusAprovacao = null) {
        if (event) event.preventDefault();
        setErro("");
        setSucesso("");

        const percNum = Number(formComercial.percentual_acrescimo ?? 0);
        if (isNaN(percNum) || percNum < 0) {
            setErro("O percentual de acréscimo deve ser maior ou igual a zero.");
            return;
        }

        setSalvando(true);

        const novoStatusAprovacao = overrideStatusAprovacao || formComercial.status_aprovacao;
        const { bloqueado, motivo } = calcularEstadoBloqueio(novoStatusAprovacao, checklist);

        const payload = {
            cliente_id: Number(formComercial.cliente_id),
            responsavel_producao_id: formComercial.responsavel_producao_id
                ? Number(formComercial.responsavel_producao_id)
                : null,
            tipo_pedido: formComercial.tipo_pedido,
            status_aprovacao: novoStatusAprovacao,
            percentual_acrescimo: percNum,
            endereco_instalacao: formComercial.endereco_instalacao.trim() || null,
            forma_pagamento: formComercial.forma_pagamento.trim() || null,
            condicoes_pagamento: formComercial.condicoes_pagamento.trim() || null,
            data_previsao_fim: formComercial.data_previsao_fim || null,
            bloqueio_fabricacao: bloqueado,
            motivo_bloqueio: motivo,
        };

        if (novoStatusAprovacao === "Aprovado" && !pedido.data_aprovacao) {
            payload.data_aprovacao = new Date().toISOString();
        }

        try {
            await api.put(`/pedido/${pedido.id}`, payload);
            setSucesso(
                overrideStatusAprovacao
                    ? `Orçamento marcado como '${overrideStatusAprovacao}'.`
                    : "Dados comerciais do pedido atualizados com sucesso!"
            );
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao atualizar pedido:", err);
            setErro(err.response?.data?.erro || "Erro ao salvar dados comerciais do pedido.");
        } finally {
            setSalvando(false);
        }
    }

    async function adicionarItemPedido(event) {
        event.preventDefault();
        setErro("");
        setSucesso("");

        const itemIdNum = Number(itemSelecionadoId);
        const qtdNum = Number(qtdItem);
        const valorUnitNum = Number(valorUnitItem);

        if (!itemIdNum) {
            setErro("Selecione um item do catálogo.");
            return;
        }
        if (isNaN(qtdNum) || qtdNum <= 0) {
            setErro("A quantidade do item deve ser maior que zero.");
            return;
        }
        if (isNaN(valorUnitNum) || valorUnitNum < 0) {
            setErro("O valor unitário deve ser maior ou igual a zero.");
            return;
        }

        const jaExiste = itensPedido.find((i) => Number(i.item_id) === itemIdNum);
        if (jaExiste) {
            setErro(
                "Este item já está adicionado ao pedido. Utilize o botão de editar na lista abaixo para alterar a quantidade."
            );
            return;
        }

        setSalvando(true);
        try {
            await api.post("/pedido_item", {
                pedido_id: pedido.id,
                item_id: itemIdNum,
                quantidade: qtdNum,
                valor_unitario: valorUnitNum,
            });
            setItemSelecionadoId("");
            setQtdItem("1");
            setValorUnitItem("0");
            setSucesso("Item adicionado ao pedido e custo recalculado!");
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao adicionar item:", err);
            setErro(
                err.response?.data?.erro ||
                    "Não foi possível adicionar este item ao pedido."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function salvarEdicaoItem(event) {
        event.preventDefault();
        if (!itemEdicao) return;
        setErro("");
        setSucesso("");

        const qtdNum = Number(qtdEdicao);
        const valorUnitNum = Number(valorUnitEdicao);
        if (isNaN(qtdNum) || qtdNum <= 0 || isNaN(valorUnitNum) || valorUnitNum < 0) {
            setErro("Quantidade (> 0) e valor unitário (>= 0) inválidos.");
            return;
        }

        setSalvando(true);
        try {
            await api.put(`/pedido_item/${itemEdicao.id}`, {
                quantidade: qtdNum,
                valor_unitario: valorUnitNum,
            });
            setItemEdicao(null);
            setSucesso("Item do pedido atualizado com sucesso!");
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao editar item:", err);
            setErro(err.response?.data?.erro || "Erro ao editar item do pedido.");
        } finally {
            setSalvando(false);
        }
    }

    async function removerItemPedido(itemPedido) {
        setErro("");
        setSucesso("");
        setSalvando(true);
        try {
            await api.delete(`/pedido_item/${itemPedido.id}`);
            setSucesso("Item removido do pedido e custo atualizado.");
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao remover item:", err);
            setErro(err.response?.data?.erro || "Erro ao remover item do pedido.");
        } finally {
            setSalvando(false);
        }
    }

    async function salvarChecklistMedicao(event) {
        event.preventDefault();
        setErro("");
        setSucesso("");

        if (!formMedicao.medidas_vao.trim()) {
            setErro("Informe as medidas do vão para registrar o checklist.");
            return;
        }

        const folhasNum = Number(formMedicao.quantidade_folhas);
        if (!Number.isInteger(folhasNum) || folhasNum <= 0) {
            setErro("A quantidade de folhas deve ser um número inteiro maior que zero.");
            return;
        }

        const temPendenciaInfra =
            !formMedicao.viga_ok || !formMedicao.piso_ok || !formMedicao.ponto_eletrico_ok;
        if (formMedicao.status_aprovacao === "Aprovado" && temPendenciaInfra) {
            setErro(
                "Não é possível aprovar o checklist de medição com pendências de infraestrutura (viga, piso ou ponto elétrico)."
            );
            return;
        }

        const payload = {
            pedido_id: pedido.id,
            tecnico_id: formMedicao.tecnico_id ? Number(formMedicao.tecnico_id) : null,
            medidas_vao: formMedicao.medidas_vao.trim(),
            sentido_abertura: formMedicao.sentido_abertura || null,
            quantidade_folhas: folhasNum,
            tipo_vidro: formMedicao.tipo_vidro.trim() || null,
            modelo_automatizador: formMedicao.modelo_automatizador.trim() || null,
            viga_ok: Boolean(formMedicao.viga_ok),
            piso_ok: Boolean(formMedicao.piso_ok),
            ponto_eletrico_ok: Boolean(formMedicao.ponto_eletrico_ok),
            status_aprovacao: formMedicao.status_aprovacao,
        };

        setSalvando(true);
        try {
            if (formMedicao.id) {
                await api.put(`/checklist_medicao/${formMedicao.id}`, payload);
            } else {
                await api.post("/checklist_medicao", payload);
            }
            setSucesso("Checklist técnico de medição salvo e trava de fabricação sincronizada!");
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao salvar checklist de medição:", err);
            setErro(err.response?.data?.erro || "Erro ao salvar checklist de medição.");
        } finally {
            setSalvando(false);
        }
    }

    async function alterarEtapaProducao(novoStatus) {
        setErro("");
        setSucesso("");
        setSalvando(true);
        try {
            const res = await api.patch(`/pedido/${pedido.id}/status`, { status: novoStatus });
            if (res.data?.checklist_pre_saida) {
                setChecklistPreSaida(res.data.checklist_pre_saida);
            }
            setSucesso(`Etapa atualizada para '${novoStatus}'!`);
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao alterar etapa do pedido:", err);
            setErro(err.response?.data?.erro || "Erro ao atualizar etapa de produção.");
        } finally {
            setSalvando(false);
        }
    }

    async function registrarAceiteInstalacao(event) {
        event.preventDefault();
        setErro("");
        setSucesso("");

        if (!assinaturaAceite || !assinaturaAceite.trim()) {
            setErro("Colete a assinatura digital do cliente antes de concluir a instalação.");
            return;
        }

        const payload = {
            assinatura_cliente_instalacao: assinaturaAceite.trim(),
        };
        if (numeroSerieInput.trim()) {
            payload.numero_serie = numeroSerieInput.trim();
        }
        if (fimGarantiaInput) {
            payload.fim_garantia = fimGarantiaInput;
        }

        setSalvando(true);
        try {
            const res = await api.post(`/pedido/${pedido.id}/aceite-instalacao`, payload);
            const pedAtual = res.data?.pedido;
            setSucesso(
                `Aceite registrado! Nº de Série: ${pedAtual?.numero_serie || "gerado"} • Garantia até ${formatarDataBr(
                    pedAtual?.fim_garantia
                )}.`
            );
            await onPedidoAtualizado?.(pedido.id);
        } catch (err) {
            console.error("Erro ao registrar aceite da instalação:", err);
            setErro(err.response?.data?.erro || "Erro ao coletar assinatura de aceite.");
        } finally {
            setSalvando(false);
        }
    }

    const infraComPendencia = !formMedicao.viga_ok || !formMedicao.piso_ok || !formMedicao.ponto_eletrico_ok;

    return (
        <Box>
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                sx={{ mb: 2.5 }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onVoltar}>
                        Voltar para Pedidos
                    </Button>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Pedido #{pedido.id} — {nomeCliente}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Custo Itens: {formatarMoedaBr(pedido.custo_total)} • Acréscimo:{" "}
                            {Number(pedido.percentual_acrescimo || 0)}% • Total: {formatarMoedaBr(valorFinalPedido)} •
                            Criado em {formatarDataBr(pedido.created_at)}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                        color={pedido.bloqueio_fabricacao ? "error" : "success"}
                        icon={pedido.bloqueio_fabricacao ? <LockIcon /> : <LockOpenIcon />}
                        label={pedido.bloqueio_fabricacao ? "Fabricação Bloqueada" : "Fabricação Liberada"}
                    />
                    <Chip color="primary" variant="outlined" label={`Etapa: ${pedido.status}`} />
                    {pedido.numero_serie && onAbrirProntuario && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<QrCode2Icon />}
                            onClick={() => onAbrirProntuario(pedido.numero_serie)}
                        >
                            Prontuário ({pedido.numero_serie})
                        </Button>
                    )}
                    {onAbrirOs && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            startIcon={<BuildIcon />}
                            onClick={() => onAbrirOs(pedido)}
                        >
                            Abrir OS
                        </Button>
                    )}
                </Stack>
            </Stack>

            <Alert
                severity={pedido.bloqueio_fabricacao ? "warning" : "success"}
                icon={pedido.bloqueio_fabricacao ? <LockIcon /> : <LockOpenIcon />}
                sx={{ mb: 2 }}
            >
                {pedido.bloqueio_fabricacao ? (
                    <>
                        <strong>Trava Técnica Ativa (RF08):</strong>{" "}
                        {pedido.motivo_bloqueio ||
                            "A fabricação permanece bloqueada até a aprovação comercial e aprovação do checklist técnico de medição."}
                    </>
                ) : (
                    <>
                        <strong>Produção Desbloqueada (RF08):</strong> Orçamento aprovado e checklist técnico de
                        medição aprovado com infraestrutura validada.
                    </>
                )}
            </Alert>

            {erro && (
                <Alert severity="error" onClose={() => setErro("")} sx={{ mb: 2 }}>
                    {erro}
                </Alert>
            )}
            {sucesso && (
                <Alert severity="success" onClose={() => setSucesso("")} sx={{ mb: 2 }}>
                    {sucesso}
                </Alert>
            )}

            <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Tabs
                    value={aba}
                    onChange={(_, v) => setAba(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}
                >
                    <Tab label="1. Proposta & Comercial" />
                    <Tab label={`2. Itens do Pedido (${itensPedido.length})`} />
                    <Tab
                        label={`3. Medição (${checklist ? checklist.status_aprovacao : "Pendente"})`}
                        icon={<FactCheckIcon fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab label="4. Produção, Pré-Saída & Aceite" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {pedido.descricao_solicitacao && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Solicitação: {pedido.descricao_solicitacao}
                    {pedido.pedido_origem_id && ` • Referente ao pedido #${pedido.pedido_origem_id}`}
                </Alert>
            )}
            {aba === 0 && (
                        <form onSubmit={salvarDadosComerciais}>
                            <Stack spacing={2.5}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    spacing={1}
                                >
                                    <Typography variant="h6" fontWeight="bold">
                                        Proposta Comercial e Prazos (RF03, RF05, RF06)
                                    </Typography>
                                    {ehAdm && (
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                startIcon={<ThumbUpIcon />}
                                                disabled={salvando || pedido.status_aprovacao === "Aprovado"}
                                                onClick={() => salvarDadosComerciais(null, "Aprovado")}
                                            >
                                                Aprovar Orçamento
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<ThumbDownIcon />}
                                                disabled={salvando || pedido.status_aprovacao === "Reprovado"}
                                                onClick={() => salvarDadosComerciais(null, "Reprovado")}
                                            >
                                                Reprovar
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth disabled={!ehAdm}>
                                            <InputLabel id="det-cliente-label">Cliente</InputLabel>
                                            <Select
                                                labelId="det-cliente-label"
                                                label="Cliente"
                                                value={formComercial.cliente_id || ""}
                                                onChange={(e) =>
                                                    setFormComercial({ ...formComercial, cliente_id: e.target.value })
                                                }
                                            >
                                                {clientes.map((c) => (
                                                    <MenuItem key={c.usuario_id} value={String(c.usuario_id)}>
                                                        {c.usuario?.nome_completo || `Cliente #${c.usuario_id}`} (
                                                        {c.cnpj_cpf})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth disabled={!ehAdm}>
                                            <InputLabel id="det-tipo-label">Tipo do Pedido</InputLabel>
                                            <Select
                                                labelId="det-tipo-label"
                                                label="Tipo do Pedido"
                                                value={formComercial.tipo_pedido || "Instalacao"}
                                                onChange={(e) =>
                                                    setFormComercial({ ...formComercial, tipo_pedido: e.target.value })
                                                }
                                            >
                                                {TIPOS_PEDIDO.map((tp) => (
                                                    <MenuItem key={tp} value={tp}>
                                                        {tp}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            inputProps={{ min: 0, step: "0.01" }}
                                            label="Acréscimo Comercial (%)"
                                            disabled={!ehAdm}
                                            value={formComercial.percentual_acrescimo ?? "0"}
                                            onChange={(e) =>
                                                setFormComercial({
                                                    ...formComercial,
                                                    percentual_acrescimo: e.target.value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth disabled={!ehAdm}>
                                            <InputLabel id="det-aprovacao-label">Aprovação Comercial</InputLabel>
                                            <Select
                                                labelId="det-aprovacao-label"
                                                label="Aprovação Comercial"
                                                value={formComercial.status_aprovacao || "Pendente"}
                                                onChange={(e) =>
                                                    setFormComercial({
                                                        ...formComercial,
                                                        status_aprovacao: e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="Pendente">Pendente</MenuItem>
                                                <MenuItem value="Aprovado">Aprovado</MenuItem>
                                                <MenuItem value="Reprovado">Reprovado</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth disabled={!ehAdm}>
                                            <InputLabel id="det-resp-label">Responsável pela Produção</InputLabel>
                                            <Select
                                                labelId="det-resp-label"
                                                label="Responsável pela Produção"
                                                value={formComercial.responsavel_producao_id || ""}
                                                onChange={(e) =>
                                                    setFormComercial({
                                                        ...formComercial,
                                                        responsavel_producao_id: e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="">Não atribuído</MenuItem>
                                                {tecnicos.map((t) => (
                                                    <MenuItem key={t.id} value={String(t.id)}>
                                                        {t.nome_completo} ({t.perfil})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Previsão de Entrega"
                                            InputLabelProps={{ shrink: true }}
                                            disabled={!ehAdm}
                                            value={formComercial.data_previsao_fim || ""}
                                            onChange={(e) =>
                                                setFormComercial({
                                                    ...formComercial,
                                                    data_previsao_fim: e.target.value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Endereço de Instalação"
                                            disabled={!ehAdm}
                                            value={formComercial.endereco_instalacao || ""}
                                            onChange={(e) =>
                                                setFormComercial({
                                                    ...formComercial,
                                                    endereco_instalacao: e.target.value,
                                                })
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <PagamentoFields forma={formComercial.forma_pagamento || ""} condicoes={formComercial.condicoes_pagamento || ""}
                                disabled={!ehAdm}
                                onForma={(value) => setFormComercial((form) => ({ ...form, forma_pagamento: value }))}
                                onCondicoes={(value) => setFormComercial((form) => ({ ...form, condicoes_pagamento: value }))} />
                                    </Grid>
                                </Grid>

                                <Divider />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">
                                            Custo dos Materiais / Valor Final (+{Number(pedido.percentual_acrescimo || 0)}%)
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                                            {formatarMoedaBr(pedido.custo_total)} → {formatarMoedaBr(valorFinalPedido)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">
                                            Data da Aprovação Comercial
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatarDataHoraBr(pedido.data_aprovacao)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" color="text.secondary">
                                            Data de Conclusão
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatarDataHoraBr(pedido.data_conclusao)}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {ehAdm && (
                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            disabled={salvando}
                                        >
                                            {salvando ? "Salvando..." : "Salvar Dados Comerciais"}
                                        </Button>
                                    </Box>
                                )}
                            </Stack>
                        </form>
                    )}

                    {aba === 1 && (
                        <Stack spacing={3}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                <Typography variant="h6" fontWeight="bold">
                                    Itens e Materiais do Pedido (RF04, RF06, RF11)
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Chip
                                        variant="outlined"
                                        label={`Custo Itens: ${formatarMoedaBr(pedido.custo_total)}`}
                                    />
                                    <Chip
                                        color="primary"
                                        label={`Total c/ Acréscimo: ${formatarMoedaBr(valorFinalPedido)}`}
                                    />
                                </Stack>
                            </Stack>

                            {ehAdm && (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                                    <form onSubmit={adicionarItemPedido}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                                            Adicionar Item do Catálogo
                                        </Typography>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} md={5}>
                                                <FormControl fullWidth size="small" required>
                                                    <InputLabel id="add-item-cat-label">Item do Catálogo</InputLabel>
                                                    <Select
                                                        labelId="add-item-cat-label"
                                                        label="Item do Catálogo"
                                                        value={itemSelecionadoId}
                                                        onChange={(e) => {
                                                            const idEscolhido = e.target.value;
                                                            setItemSelecionadoId(idEscolhido);
                                                            const encontrado = itensCatalogoMap[Number(idEscolhido)];
                                                            if (encontrado) {
                                                                setValorUnitItem(
                                                                    String(encontrado.valor_unitario_padrao ?? 0)
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {itensCatalogo.map((it) => (
                                                            <MenuItem key={it.id} value={String(it.id)}>
                                                                {it.codigo_referencia ? `[${it.codigo_referencia}] ` : ""}
                                                                {it.descricao} (Saldo: {it.quantidade_atual}{" "}
                                                                {it.unidade_medida})
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0.01, step: "0.01" }}
                                                    label="Quantidade"
                                                    value={qtdItem}
                                                    onChange={(e) => setQtdItem(e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0, step: "0.01" }}
                                                    label="Valor Unitário (R$)"
                                                    value={valorUnitItem}
                                                    onChange={(e) => setValorUnitItem(e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Button
                                                    type="submit"
                                                    fullWidth
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    disabled={salvando}
                                                >
                                                    Adicionar
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </form>
                                </Paper>
                            )}

                            {itensPedido.length === 0 ? (
                                <Alert severity="info">
                                    Nenhum item adicionado a este pedido até o momento.
                                </Alert>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: "primary.main" }}>
                                            <TableRow>
                                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Código</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Descrição</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estoque Atual</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Qtd.</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Valor Unit.</TableCell>
                                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Subtotal</TableCell>
                                                {ehAdm && (
                                                    <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                                        Ações
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {itensPedido.map((it) => {
                                                const cat = it.item_catalogo || itensCatalogoMap[Number(it.item_id)];
                                                const saldoCat = Number(cat?.quantidade_atual ?? 0);
                                                const saldoInsuficiente = saldoCat < Number(it.quantidade);
                                                return (
                                                    <TableRow key={it.id} hover>
                                                        <TableCell>{cat?.codigo_referencia || "-"}</TableCell>
                                                        <TableCell sx={{ fontWeight: "medium" }}>
                                                            {cat?.descricao || `Item #${it.item_id}`}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                size="small"
                                                                color={saldoInsuficiente ? "warning" : "default"}
                                                                label={`${saldoCat} ${cat?.unidade_medida || "UN"}`}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {it.quantidade} {cat?.unidade_medida || ""}
                                                        </TableCell>
                                                        <TableCell>{formatarMoedaBr(it.valor_unitario)}</TableCell>
                                                        <TableCell sx={{ fontWeight: "bold" }}>
                                                            {formatarMoedaBr(calcularSubtotalItem(it))}
                                                        </TableCell>
                                                        {ehAdm && (
                                                            <TableCell align="center">
                                                                <Tooltip title="Editar Quantidade / Valor">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => {
                                                                            setItemEdicao(it);
                                                                            setQtdEdicao(String(it.quantidade));
                                                                            setValorUnitEdicao(String(it.valor_unitario));
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Remover Item">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => removerItemPedido(it)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Stack>
                    )}

                    {aba === 2 && (
                        <form onSubmit={salvarChecklistMedicao}>
                            <Stack spacing={2.5}>
                                <Typography variant="h6" fontWeight="bold">
                                    Checklist Técnico de Medição em Obra (RF07, RF08)
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Medidas do Vão (Largura x Altura)"
                                            placeholder="Ex: 2.80m x 2.20m"
                                            value={formMedicao.medidas_vao || ""}
                                            onChange={(e) =>
                                                setFormMedicao({ ...formMedicao, medidas_vao: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <FormControl fullWidth>
                                            <InputLabel id="med-sentido-label">Sentido de Abertura</InputLabel>
                                            <Select
                                                labelId="med-sentido-label"
                                                label="Sentido de Abertura"
                                                value={
                                                    SENTIDOS_ABERTURA.includes(formMedicao.sentido_abertura)
                                                        ? formMedicao.sentido_abertura
                                                        : "Outro"
                                                }
                                                onChange={(e) =>
                                                    setFormMedicao({ ...formMedicao, sentido_abertura: e.target.value })
                                                }
                                            >
                                                {SENTIDOS_ABERTURA.map((s) => (
                                                    <MenuItem key={s} value={s}>
                                                        {s}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            required
                                            fullWidth
                                            type="number"
                                            inputProps={{ min: 1, step: 1 }}
                                            label="Quantidade de Folhas"
                                            value={formMedicao.quantidade_folhas || "1"}
                                            onChange={(e) =>
                                                setFormMedicao({ ...formMedicao, quantidade_folhas: e.target.value })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            label="Tipo de Vidro"
                                            placeholder="Ex: Temperado 10mm Incolor"
                                            value={formMedicao.tipo_vidro || ""}
                                            onChange={(e) =>
                                                setFormMedicao({ ...formMedicao, tipo_vidro: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            label="Modelo do Automatizador"
                                            placeholder="Ex: APORTEC Slim 200"
                                            value={formMedicao.modelo_automatizador || ""}
                                            onChange={(e) =>
                                                setFormMedicao({
                                                    ...formMedicao,
                                                    modelo_automatizador: e.target.value,
                                                })
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth>
                                            <InputLabel id="med-tecnico-label">Técnico Responsável</InputLabel>
                                            <Select
                                                labelId="med-tecnico-label"
                                                label="Técnico Responsável"
                                                value={formMedicao.tecnico_id || ""}
                                                onChange={(e) =>
                                                    setFormMedicao({ ...formMedicao, tecnico_id: e.target.value })
                                                }
                                            >
                                                <MenuItem value="">Não informado</MenuItem>
                                                {tecnicos.map((t) => (
                                                    <MenuItem key={t.id} value={String(t.id)}>
                                                        {t.nome_completo} ({t.perfil})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                        Validação de Infraestrutura no Local
                                    </Typography>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={Boolean(formMedicao.viga_ok)}
                                                    onChange={(e) =>
                                                        setFormMedicao({ ...formMedicao, viga_ok: e.target.checked })
                                                    }
                                                />
                                            }
                                            label="Viga / Estrutura OK"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={Boolean(formMedicao.piso_ok)}
                                                    onChange={(e) =>
                                                        setFormMedicao({ ...formMedicao, piso_ok: e.target.checked })
                                                    }
                                                />
                                            }
                                            label="Nivelamento do Piso OK"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={Boolean(formMedicao.ponto_eletrico_ok)}
                                                    onChange={(e) =>
                                                        setFormMedicao({
                                                            ...formMedicao,
                                                            ponto_eletrico_ok: e.target.checked,
                                                        })
                                                    }
                                                />
                                            }
                                            label="Ponto Elétrico OK"
                                        />
                                    </Stack>
                                    {infraComPendencia && (
                                        <Alert severity="warning" sx={{ mt: 1.5 }}>
                                            Com pendências de infraestrutura, o checklist não pode ser aprovado e a
                                            fabricação permanecerá bloqueada (RF08).
                                        </Alert>
                                    )}
                                </Paper>

                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required>
                                            <InputLabel id="med-status-label">Status do Checklist</InputLabel>
                                            <Select
                                                labelId="med-status-label"
                                                label="Status do Checklist"
                                                value={formMedicao.status_aprovacao || "Pendente"}
                                                onChange={(e) =>
                                                    setFormMedicao({
                                                        ...formMedicao,
                                                        status_aprovacao: e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="Pendente">Pendente</MenuItem>
                                                <MenuItem value="Aprovado" disabled={infraComPendencia}>
                                                    Aprovado {infraComPendencia ? "(Exige infra 100% OK)" : ""}
                                                </MenuItem>
                                                <MenuItem value="Reprovado">Reprovado</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            disabled={salvando}
                                        >
                                            {salvando ? "Salvando..." : "Salvar Checklist de Medição"}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </form>
                    )}

                    {aba === 3 && (
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Etapas de Produção e Instalação (RF09, RF12)
                                </Typography>
                                {pedido.status === "Cancelado" ? (
                                    <Alert severity="error">Este pedido encontra-se Cancelado.</Alert>
                                ) : (
                                    <Stepper activeStep={indiceEtapaAtual} alternativeLabel sx={{ py: 2 }}>
                                        {ETAPAS_STEPPER.map((etapa) => (
                                            <Step key={etapa}>
                                                <StepLabel>{etapa}</StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                )}

                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                                    {ETAPAS_STEPPER.map((etapa) => {
                                        const atual = pedido.status === etapa;
                                        const exigeDesbloqueio = ETAPAS_FABRICACAO.includes(etapa);
                                        const bloqueada = exigeDesbloqueio && pedido.bloqueio_fabricacao;

                                        return (
                                            <Button
                                                key={etapa}
                                                size="small"
                                                variant={atual ? "contained" : "outlined"}
                                                color={bloqueada ? "inherit" : atual ? "primary" : "secondary"}
                                                startIcon={
                                                    bloqueada ? (
                                                        <LockIcon fontSize="small" />
                                                    ) : atual ? (
                                                        <CheckCircleIcon fontSize="small" />
                                                    ) : null
                                                }
                                                disabled={salvando || atual}
                                                onClick={() => alterarEtapaProducao(etapa)}
                                            >
                                                {etapa}
                                            </Button>
                                        );
                                    })}
                                    {pedido.status !== "Cancelado" && ehAdm && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            disabled={salvando}
                                            onClick={() => alterarEtapaProducao("Cancelado")}
                                        >
                                            Cancelar Pedido
                                        </Button>
                                    )}
                                </Stack>
                            </Box>

                            {checklistPreSaida && (
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, borderRadius: 2, borderColor: "primary.main", bgcolor: "grey.50" }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>
                                        Checklist de Pré-Saída Gerado (RF12)
                                    </Typography>
                                    <Grid container spacing={1} sx={{ mb: 1.5 }}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Endereço de Instalação
                                            </Typography>
                                            <Typography variant="body2">
                                                {checklistPreSaida.endereco_instalacao || "-"}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Medidas do Vão
                                            </Typography>
                                            <Typography variant="body2">
                                                {checklistPreSaida.medidas_vao || "-"}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                            <Typography variant="caption" color="text.secondary">
                                                Automatizador
                                            </Typography>
                                            <Typography variant="body2">
                                                {checklistPreSaida.modelo_automatizador || "-"}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    {Array.isArray(checklistPreSaida.itens_conferencia) &&
                                    checklistPreSaida.itens_conferencia.length > 0 ? (
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Item</TableCell>
                                                    <TableCell>Quantidade Prevista</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {checklistPreSaida.itens_conferencia.map((ic) => (
                                                    <TableRow key={ic.item_id}>
                                                        <TableCell>{ic.descricao}</TableCell>
                                                        <TableCell>
                                                            {ic.quantidade_prevista} {ic.unidade_medida}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">
                                            Sem itens vinculados para conferência.
                                        </Typography>
                                    )}
                                </Paper>
                            )}

                            <Divider />

                            <Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Aceite Digital da Instalação, Nº de Série e Garantia (RF13, RF15)
                                </Typography>

                                {pedido.assinatura_cliente_instalacao && pedido.status === "Concluido" && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Instalação concluída em {formatarDataHoraBr(pedido.data_conclusao)} • Nº de Série:{" "}
                                        <strong>{pedido.numero_serie}</strong> • Garantia até{" "}
                                        <strong>{formatarDataBr(pedido.fim_garantia)}</strong>
                                    </Alert>
                                )}

                                {pedido.bloqueio_fabricacao && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Para concluir o pedido e registrar o aceite da instalação, é necessário primeiro
                                        desbloquear a fabricação (aprovação comercial + checklist de medição aprovado).
                                    </Alert>
                                )}

                                {pedido.assinatura_cliente_instalacao ? (
                                    <Box sx={{ mb: 2 }}>
                                        <VisualizarAssinatura
                                            valor={pedido.assinatura_cliente_instalacao}
                                            titulo="Assinatura de Aceite Registrada"
                                        />
                                    </Box>
                                ) : null}

                                <form onSubmit={registrarAceiteInstalacao}>
                                    <Stack spacing={2}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Nº de Série da Porta (opcional)"
                                                    placeholder={`Auto: APORTEC-${new Date().getFullYear()}-${String(
                                                        pedido.id
                                                    ).padStart(4, "0")}`}
                                                    value={numeroSerieInput}
                                                    onChange={(e) => setNumeroSerieInput(e.target.value)}
                                                    helperText="Deixe em branco para gerar automaticamente no padrão APORTEC."
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label="Fim da Garantia (opcional)"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={fimGarantiaInput}
                                                    onChange={(e) => setFimGarantiaInput(e.target.value)}
                                                    helperText="Deixe em branco para definir 1 ano a partir de hoje."
                                                />
                                            </Grid>
                                        </Grid>

                                        <AssinaturaDigital
                                            valor={assinaturaAceite}
                                            onChange={setAssinaturaAceite}
                                            label="Coletar / Atualizar Assinatura Digital do Cliente"
                                        />

                                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="success"
                                                startIcon={<CheckCircleIcon />}
                                                disabled={salvando || pedido.bloqueio_fabricacao}
                                            >
                                                {salvando ? (
                                                    <CircularProgress size={20} color="inherit" />
                                                ) : (
                                                    "Registrar Aceite e Concluir Instalação"
                                                )}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </form>
                            </Box>
                        </Stack>
                    )}
                </Box>
            </Paper>

            <Dialog open={Boolean(itemEdicao)} onClose={() => setItemEdicao(null)} maxWidth="xs" fullWidth>
                <form onSubmit={salvarEdicaoItem}>
                    <DialogTitle>Editar Item do Pedido</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                {itemEdicao?.item_catalogo?.descricao || `Item #${itemEdicao?.item_id}`}
                            </Typography>
                            <TextField
                                required
                                fullWidth
                                type="number"
                                inputProps={{ min: 0.01, step: "0.01" }}
                                label="Quantidade"
                                value={qtdEdicao}
                                onChange={(e) => setQtdEdicao(e.target.value)}
                            />
                            <TextField
                                required
                                fullWidth
                                type="number"
                                inputProps={{ min: 0, step: "0.01" }}
                                label="Valor Unitário (R$)"
                                value={valorUnitEdicao}
                                onChange={(e) => setValorUnitEdicao(e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setItemEdicao(null)} color="inherit" disabled={salvando}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={salvando}>
                            Salvar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
