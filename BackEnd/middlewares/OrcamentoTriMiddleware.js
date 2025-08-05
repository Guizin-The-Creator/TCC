module.exports = class OrcamentoTriMiddleware {
    validar_valorOrcamentoTri = (req, res, next) => {
      const val = req.body.valorOrcamentoTri;
      if (val === undefined || isNaN(val) || Number(val) < 0) {
        return res.status(400).send({
          status: false,
          error: 'valorOrcamentoTri é obrigatório e deve ser numérico ≥ 0'
        });
      }
      next();
    }
  
    validar_trimestreOrcamentoTri = (req, res, next) => {
      const tri = req.body.trimestreOrcamentoTri;
      if (!Number.isInteger(tri) || tri < 1 || tri > 4) {
        return res.status(400).send({
          status: false,
          error: 'trimestreOrcamentoTri é obrigatório e deve ser inteiro entre 1 e 4'
        });
      }
      next();
    }
  
    validar_idOrcamentoAnual = (req, res, next) => {
      const idAno = req.body.idOrcamentoAnual;
      if (!Number.isInteger(idAno) || idAno <= 0) {
        return res.status(400).send({
          status: false,
          error: 'idOrcamentoAnual é obrigatório e deve ser inteiro válido'
        });
      }
      next();
    }
  
    validar_idCategoria = (req, res, next) => {
      const cat = req.body.idCategoria;
      if (!Number.isInteger(cat) || cat <= 0) {
        return res.status(400).send({
          status: false,
          error: 'idCategoria é obrigatório e deve ser inteiro válido'
        });
      }
      next();
    }
  }
  