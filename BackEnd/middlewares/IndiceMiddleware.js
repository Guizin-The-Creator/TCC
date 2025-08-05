module.exports = class IndiceMiddleware {
    validar_nomeIndice = (req, res, next) => {
      const nome = req.body.nomeIndice;
      if (typeof nome !== 'string' || nome.trim() === '') {
        return res.status(400).send({
          status: false,
          error: 'nomeIndice é obrigatório e deve ser uma string não vazia'
        });
      }
      next();
    }
  
    validar_taxaIndice = (req, res, next) => {
      const taxa = req.body.taxaIndice;
      if (taxa === undefined || isNaN(taxa) || Number(taxa) < 0) {
        return res.status(400).send({
          status: false,
          error: 'taxaIndice é obrigatória e deve ser numérica ≥ 0'
        });
      }
      next();
    }
  
    validar_idSubsegmento = (req, res, next) => {
      const id = req.body.idSubsegmento;
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send({
          status: false,
          error: 'idSubsegmento é obrigatório e deve ser um inteiro válido'
        });
      }
      next();
    }
  
    validar_anoIndice = (req, res, next) => {
      const ano = req.body.anoIndice;
      if (typeof ano !== 'string' || ano.trim() === '' || ano.length !== 4 || isNaN(Number(ano))) {
        return res.status(400).send({
          status: false,
          error: 'anoIndice é obrigatório e deve ser uma string de 4 dígitos representando um ano'
        });
      }
      next();
    }
  }