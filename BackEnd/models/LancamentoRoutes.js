const express = require('express');
const LancamentoMiddleware = require('../middlewares/LancamentoMiddleware');
const LancamentoController = require('../controllers/LancamentoController');

module.exports = class LancamentoRoutes {
  constructor() {
    this._router = express.Router();
    this._middleware = new LancamentoMiddleware();
    this._controller = new LancamentoController();
    this.criarRotas();
  }

  criarRotas() {
    // POST /lancamentos
    this._router.post('/',
      this._middleware.validar_vencimentoLancamento,
      this._middleware.validar_valorLancamento,
      this._middleware.validar_classificacaoLancamento,
      this._middleware.validar_pagamentoLancamento,
      this._middleware.validar_statusLancamento,
      this._middleware.validar_fkIds,
      this._controller.Lancamento_create_controller
    );

    // GET /lancamentos
    this._router.get('/',
      this._controller.Lancamento_readAll_controller
    );

    // GET /lancamentos/:id
    this._router.get('/:id',
      this._controller.Lancamento_readById_controller
    );

    // PUT /lancamentos/:id
    this._router.put('/:id',
      this._middleware.validar_vencimentoLancamento,
      this._middleware.validar_valorLancamento,
      this._middleware.validar_classificacaoLancamento,
      this._middleware.validar_pagamentoLancamento,
      this._middleware.validar_statusLancamento,
      this._middleware.validar_fkIds,
      this._controller.Lancamento_update_controller
    );

    // DELETE /lancamentos/:id
    this._router.delete('/:id',
      this._controller.Lancamento_delete_controller
    );
  }

  get router() {
    return this._router;
  }
};
