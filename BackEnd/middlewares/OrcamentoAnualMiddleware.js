module.exports = class OrcamentoAnualMiddleware {
    validar_valorOrcamentoAnual = (req, res, next) => {
      const val = req.body.valorOrcamentoAnual;
      if (val === undefined || isNaN(val) || Number(val) < 0) {
        return res.status(400).send({
          status: false,
          error: 'valorOrcamentoAnual é obrigatório e deve ser numérico ≥ 0'
        });
      }
      next();
    }
  
    validar_anoOrcamentoAnual = (req, res, next) => {
      const ano = req.body.anoOrcamentoAnual;
      if (!Number.isInteger(ano) || ano < 1900 || ano > 3000) {
        return res.status(400).send({
          status: false,
          error: 'anoOrcamentoAnual é obrigatório e deve ser um inteiro válido'
        });
      }
      next();
    }
  
    validar_idCategoria = (req, res, next) => {
      const cat = req.body.idCategoria;
      if (!Number.isInteger(cat) || cat <= 0) {
        return res.status(400).send({
          status: false,
          error: 'idCategoria é obrigatório e deve ser um inteiro válido'
        });
      }
      next();
    }
  }
  