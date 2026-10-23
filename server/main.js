const express = require("express");
const autoresRoutes = require("./src/autores/autores.routes");
const livrosRoutes = require("./src/livros/livros.routes");
const leitoresRoutes = require("./src/leitores/leitores.routes");
const emprestimosRoutes = require("./src/emprestimos/emprestimos.routes");

const app = express();
const PORT = 3001;

app.use(express.json());


app.use(autoresRoutes);
app.use(livrosRoutes);
app.use(leitoresRoutes);
app.use(emprestimosRoutes);


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
