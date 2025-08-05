module.exports = class ExtratoMiddleware {
    validar_tipoExtrato = (req, res, next) => {
        const tipo = req.body.tipoExtrato;
        if (!tipo || typeof tipo !== 'string' || tipo.length > 45) {
            return res.status(400).send({
                status: false,
                error: 'tipoExtrato obrigatório e ≤ 45 caracteres'
            });
        }
        next();
    }

    validar_valorExtrato = (req, res, next) => {
        const valor = req.body.valorExtrato;
        if (valor === undefined || isNaN(valor) || Number(valor) < 0) {
            return res.status(400).send({
                status: false,
                error: 'valorExtrato obrigatório e ≥ 0'
            });
        }
        next();
    }

    validar_dataExtrato = (req, res, next) => {
        const data = req.body.dataExtrato;
        if (!data || isNaN(Date.parse(data))) {
            return res.status(400).send({
                status: false,
                error: 'dataExtrato obrigatória no formato YYYY-MM-DD'
            });
        }
        next();
    }

    validar_idsRelacionais = (req, res, next) => {
        const { idTarefa, idLancamento, idCategoria, idSubcategoria, idProduto } = req.body;
        
        // Valida que pelo menos um ID relacional está presente
        if (!idTarefa && !idLancamento && !idCategoria && !idSubcategoria && !idProduto) {
            return res.status(400).send({
                status: false,
                error: 'Pelo menos um ID relacional é obrigatório (idTarefa, idLancamento, idCategoria, idSubcategoria ou idProduto)'
            });
        }
        
        // Valida os IDs que foram fornecidos (corrigindo os parênteses)
        if (idTarefa && (!Number.isInteger(idTarefa) || idTarefa <= 0)) {
            return res.status(400).send({ error: 'idTarefa deve ser um inteiro positivo' });
        }
        if (idLancamento && (!Number.isInteger(idLancamento) || idLancamento <= 0)) {
            return res.status(400).send({ error: 'idLancamento deve ser um inteiro positivo' });
        }
        if (idCategoria && (!Number.isInteger(idCategoria) || idCategoria <= 0)) {
            return res.status(400).send({ error: 'idCategoria deve ser um inteiro positivo' });
        }
        if (idSubcategoria && (!Number.isInteger(idSubcategoria) || idSubcategoria <= 0)) {
            return res.status(400).send({ error: 'idSubcategoria deve ser um inteiro positivo' });
        }
        if (idProduto && (!Number.isInteger(idProduto) || idProduto <= 0)) {
            return res.status(400).send({ error: 'idProduto deve ser um inteiro positivo' });
        }
        
        next();
    }
};