import { TableCell, TableSortLabel } from "@mui/material";

export default function CabecalhoOrdenavel({
    campo,
    rotulo,
    ordenacao,
    onOrdenar,
    align = "left",
}) {
    const ativo = ordenacao?.campo === campo;
    const direcao = ativo ? ordenacao.direcao : "asc";

    function handleClick() {
        if (!onOrdenar) return;
        const novaDirecao = ativo && direcao === "asc" ? "desc" : "asc";
        onOrdenar({ campo, direcao: novaDirecao });
    }

    return (
        <TableCell align={align} sx={{ color: "white", fontWeight: "bold", whiteSpace: "nowrap" }}>
            <TableSortLabel
                active={ativo}
                direction={direcao}
                onClick={handleClick}
                sx={{
                    color: "white !important",
                    "&:hover": { color: "rgba(255,255,255,0.85) !important" },
                    "& .MuiTableSortLabel-icon": {
                        color: "white !important",
                        opacity: ativo ? 1 : 0.45,
                    },
                }}
            >
                {rotulo}
            </TableSortLabel>
        </TableCell>
    );
}
