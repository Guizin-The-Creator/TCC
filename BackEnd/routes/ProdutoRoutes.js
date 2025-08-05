const express = require('express');
const ProdutoMiddleware = require('../middlewares/ProdutoMiddleware');
const ProdutoController = require('../controllers/ProdutoController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class ProdutoRoutes {
  constructor() {
    this._router = express.Router();
    this._middleware = new ProdutoMiddleware();
    this._controller = new ProdutoController();
    this._jwtMiddleware = new JwtMiddleware();
    this.criarRotas();
  }

  criarRotas() {
    this._router.post('/',
      this._jwtMiddleware.validar_token_acesso,
      this._middleware.validar_nomeProduto,
      this._middleware.validar_custoProduto,
      this._middleware.validar_idSegmento,
      this._middleware.validar_idSubsegmento,
      this._controller.Produto_create_controller
    );

    this._router.get('/',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Produto_readAll_controller
    );

    this._router.get('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Produto_readById_controller
    );

    this._router.put('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._middleware.validar_nomeProduto,
      this._middleware.validar_custoProduto,
      this._middleware.validar_idSegmento,
      this._middleware.validar_idSubsegmento,
      this._controller.Produto_update_controller
    );

    this._router.delete('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Produto_delete_controller
    );
  }

  get router() {
    return this._router;
  }
};
