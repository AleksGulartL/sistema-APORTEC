const criarErro = (mensagem, status = 400, extras = {}) =>
    Object.assign(new Error(mensagem), { status, ...extras });

module.exports = { criarErro };

