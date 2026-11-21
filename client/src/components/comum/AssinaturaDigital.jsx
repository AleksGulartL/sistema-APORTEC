import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

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
}) {
    const texto = typeof valor === "string" && !valor.startsWith("data:image/") ? valor : "";

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    {label}
                </Typography>
                {texto && (
                    <Button size="small" startIcon={<ClearIcon />} onClick={() => onChange?.("")}>
                        Limpar
                    </Button>
                )}
            </Stack>

            <TextField
                fullWidth
                required
                size="small"
                label="Nome / Confirmação de Aceite Digital"
                placeholder="Ex: João Silva - CPF 000.000.000-00 - Aceite confirmado"
                value={texto}
                onChange={(e) => onChange?.(e.target.value)}
            />
        </Box>
    );
}
