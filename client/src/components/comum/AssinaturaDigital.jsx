import { useEffect, useRef, useState } from "react";
import { Box, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import DrawIcon from "@mui/icons-material/Draw";
import KeyboardIcon from "@mui/icons-material/Keyboard";

export function VisualizarAssinatura({ valor, titulo = "Assinatura Digital" }) {
    if (!valor || !String(valor).trim()) {
        return (
            <Typography variant="body2" color="text.secondary">
                Nenhuma assinatura coletada.
            </Typography>
        );
    }

    const texto = String(valor).trim();
    const ehImagem = texto.startsWith("data:image/");

    return (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                {titulo}
            </Typography>
            {ehImagem ? (
                <Box
                    component="img"
                    src={texto}
                    alt={titulo}
                    sx={{
                        maxWidth: "100%",
                        maxHeight: 140,
                        bgcolor: "white",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 0.5,
                    }}
                />
            ) : (
                <Typography variant="body2" fontWeight="medium" sx={{ fontStyle: "italic", wordBreak: "break-word" }}>
                    {texto}
                </Typography>
            )}
        </Paper>
    );
}

export default function AssinaturaDigital({
    valor = "",
    onChange,
    label = "Assinatura Digital do Cliente",
    altura = 150,
}) {
    const [modo, setModo] = useState(() =>
        valor && !String(valor).startsWith("data:image/") ? "texto" : "desenho"
    );
    const canvasRef = useRef(null);
    const desenhandoRef = useRef(false);
    const [textoManual, setTextoManual] = useState(() =>
        valor && !String(valor).startsWith("data:image/") ? String(valor) : ""
    );

    useEffect(() => {
        if (!valor) {
            setTextoManual("");
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }
        if (String(valor).startsWith("data:image/")) {
            setModo("desenho");
            const canvas = canvasRef.current;
            if (canvas) {
                const img = new Image();
                img.onload = () => {
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = valor;
            }
        } else {
            setTextoManual(String(valor));
        }
    }, [valor]);

    function obterPosicao(e) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    function iniciarDesenho(e) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const ctx = canvas.getContext("2d");
        const { x, y } = obterPosicao(e);
        ctx.strokeStyle = "#0f3460";
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        desenhandoRef.current = true;
    }

    function moverDesenho(e) {
        if (!desenhandoRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { x, y } = obterPosicao(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function finalizarDesenho() {
        if (!desenhandoRef.current) return;
        desenhandoRef.current = false;
        const canvas = canvasRef.current;
        if (!canvas) return;
        onChange?.(canvas.toDataURL("image/png"));
    }

    function limparDesenho() {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setTextoManual("");
        onChange?.("");
    }

    function trocarModo(_, novoModo) {
        setModo(novoModo);
        if (novoModo === "texto") {
            onChange?.(textoManual);
        }
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    {label}
                </Typography>
                <Button size="small" startIcon={<ClearIcon />} onClick={limparDesenho}>
                    Limpar
                </Button>
            </Stack>

            <Tabs value={modo} onChange={trocarModo} sx={{ mb: 1.5, minHeight: 36 }}>
                <Tab
                    value="desenho"
                    icon={<DrawIcon fontSize="small" />}
                    iconPosition="start"
                    label="Assinar na Tela"
                    sx={{ minHeight: 36, py: 0.5 }}
                />
                <Tab
                    value="texto"
                    icon={<KeyboardIcon fontSize="small" />}
                    iconPosition="start"
                    label="Assinatura por Texto"
                    sx={{ minHeight: 36, py: 0.5 }}
                />
            </Tabs>

            {modo === "desenho" ? (
                <Box>
                    <Paper
                        variant="outlined"
                        sx={{
                            borderStyle: "dashed",
                            borderColor: "primary.light",
                            bgcolor: "#fff",
                            overflow: "hidden",
                            touchAction: "none",
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={520}
                            height={altura}
                            onPointerDown={iniciarDesenho}
                            onPointerMove={moverDesenho}
                            onPointerUp={finalizarDesenho}
                            onPointerCancel={finalizarDesenho}
                            style={{
                                width: "100%",
                                height: `${altura}px`,
                                display: "block",
                                cursor: "crosshair",
                            }}
                        />
                    </Paper>
                    <Typography variant="caption" color="text.secondary">
                        Desenhe a assinatura com o mouse ou toque no quadro acima.
                    </Typography>
                </Box>
            ) : (
                <TextField
                    fullWidth
                    size="small"
                    label="Nome / Confirmação de Aceite Digital"
                    placeholder="Ex: João Silva - CPF 000.000.000-00 - Aceite confirmado"
                    value={textoManual}
                    onChange={(e) => {
                        setTextoManual(e.target.value);
                        onChange?.(e.target.value);
                    }}
                />
            )}
        </Box>
    );
}
