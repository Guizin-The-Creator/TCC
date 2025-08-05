// routes/ProdutoRoutes.js
const express = require('express');
const ProdutoMiddleware = require('../middlewares/ProdutoMiddleware');
const ProdutoController = require('../controllers/ProdutoController');

module.exports = class ProdutoRoutes {
  constructor() {
    this._router = express.Router();
    this._middleware = new ProdutoMiddleware();
    this._controller = new ProdutoController();
    this.criarRotas();
  }

  criarRotas() {
    // POST /produtos
    this._router.post('/',
      this._middleware.validar_nomeProduto,
      this._middleware.validar_custoProduto,
      this._middleware.validar_idSegmento,
      this._middleware.validar_idSubsegmento,
      this._controller.Produto_create_controller
    );

    // GET /produtos
    this._router.get('/',
      this._controller.Produto_readAll_controller
    );

    // GET /produtos/:id
    this._router.get('/:id',
      this._controller.Produto_readById_controller
    );

    // PUT /produtos/:id
    this._router.put('/:id',
      this._middleware.validar_nomeProduto,
      this._middleware.validar_custoProduto,
      this._middleware.validar_idSegmento,
      this._middleware.validar_idSubsegmento,
      this._controller.Produto_update_controller
    );

    // DELETE /produtos/:id
    this._router.delete('/:id',
      this._controller.Produto_delete_controller
    );
  }

  get router() {
    return this._router;
  }
};
