import { Autocomplete, Stack, TextField } from "@mui/material";

export default function PagamentoFields({ forma = "", condicoes = "", disabled = false, onForma, onCondicoes }) {
    return <Stack spacing={2}>
        <Autocomplete freeSolo disabled={disabled} options={["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Boleto", "Transferência"]}
            inputValue={forma} onInputChange={(_, value) => onForma(value)}
            renderInput={(params) => <TextField {...params} label="Forma de pagamento" helperText="Selecione uma sugestão ou digite outra forma." />} />
        <Autocomplete freeSolo disabled={disabled} options={["À vista", "Parcelado em 2x", "Parcelado em 3x", "Parcelado em 6x", "50% de entrada + 50% na entrega"]}
            inputValue={condicoes} onInputChange={(_, value) => onCondicoes(value)}
            renderInput={(params) => <TextField {...params} label="Condições de pagamento" helperText="Selecione uma sugestão ou escreva uma condição personalizada." />} />
    </Stack>;
}
