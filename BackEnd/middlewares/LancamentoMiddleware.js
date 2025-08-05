module.exports = class LancamentoMiddleware {
    validar_vencimentoLancamento = (req, res, next) => {
        const data = req.body.vencimentoLancamento;
        if (!data || isNaN(Date.parse(data))) {
            return res.status(400).send({
                status: false,
                error: 'vencimentoLancamento obrigatório e formato YYYY-MM-DD'
            });
        }
        next();
    }

    validar_valorLancamento = (req, res, next) => {
        const val = req.body.valorLancamento;
        if (val === undefined || isNaN(val) || Number(val) < 0) {
            return res.status(400).send({
                status: false,
                error: 'valorLancamento obrigatório e ≥ 0'
            });
        }
        next();
    }

    validar_classificacaoLancamento = (req, res, next) => {
        const cls = req.body.classificacaoLancamento;
        if (!cls || typeof cls !== 'string' || cls.length > 45) {
            return res.status(400).send({
                status: false,
                error: 'classificacaoLancamento obrigatório e ≤ 45 caracteres'
            });
        }
        next();
    }

    validar_pagamentoLancamento = (req, res, next) => {
        const pag = req.body.pagamentoLancamento;
        if (pag && isNaN(Date.parse(pag))) {
            return res.status(400).send({
                status: false,
                error: 'pagamentoLancamento deve ser data válida ou vazio'
            });
        }
        next();
    }

    validar_statusLancamento = (req, res, next) => {
        const st = req.body.statusLancamento;
        if (!st || typeof st !== 'string' || st.length > 45) {
            return res.status(400).send({
                status: false,
                error: 'statusLancamento obrigatório e ≤ 45 caracteres'
            });
        }
        next();
    }

    validar_fkIds = (req, res, next) => {
        const { idCategoria, idSubcategoria } = req.body;
        if (!Number.isInteger(idCategoria) || idCategoria <= 0 ||
            !Number.isInteger(idSubcategoria) || idSubcategoria <= 0) {
            return res.status(400).send({
                status: false,
                error: 'idCategoria e idSubcategoria obrigatórios e válidos'
            });
        }
        next();
    }
};
