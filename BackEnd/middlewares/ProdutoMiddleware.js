// middlewares/ProdutoMiddleware.js
module.exports = class ProdutoMiddleware {
  validar_nomeProduto = (req, res, next) => {
    const nome = req.body.nomeProduto;
    if (!nome || typeof nome !== 'string' || nome.length > 45) {
      return res.status(400).send({
        status: false,
        error: 'nomeProduto é obrigatório e deve ter no máximo 45 caracteres'
      });
    }
    next();
  }

  validar_custoProduto = (req, res, next) => {
    const custo = req.body.custoProduto;
    if (custo === undefined || isNaN(custo) || Number(custo) < 0) {
      return res.status(400).send({
        status: false,
        error: 'custoProduto é obrigatório e deve ser numérico ≥ 0'
      });
    }
    next();
  }

  validar_idSegmento = (req, res, next) => {
    const seg = req.body.idSegmento;
    if (!Number.isInteger(seg) || seg <= 0) {
      return res.status(400).send({
        status: false,
        error: 'idSegmento é obrigatório e deve ser um inteiro válido'
      });
    }
    next();
  }

  validar_idSubsegmento = (req, res, next) => {
    const sub = req.body.idSubsegmento;
    if (!Number.isInteger(sub) || sub <= 0) {
      return res.status(400).send({
        status: false,
        error: 'idSubsegmento é obrigatório e deve ser um inteiro válido'
      });
    }
    next();
  }
};
