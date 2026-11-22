import { Autocomplete, TextField } from "@mui/material";

export default function CampoComSugestoes({ value = "", onChange, options, ...campoProps }) {
    return <Autocomplete
        freeSolo
        fullWidth
        options={options}
        inputValue={value}
        onInputChange={(_, texto) => onChange(texto)}
        renderInput={(params) => <TextField {...params} {...campoProps} />}
    />;
}
