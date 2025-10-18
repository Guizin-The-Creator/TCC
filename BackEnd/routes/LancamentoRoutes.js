const express = require('express');
const LancamentoMiddleware = require('../middlewares/LancamentoMiddleware');
const LancamentoController = require('../controllers/LancamentoController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class LancamentoRoutes {
  constructor() {
    this._router = express.Router();
    this._middleware = new LancamentoMiddleware();
    this._controller = new LancamentoController();
    this._jwtMiddleware = new JwtMiddleware();
    this.criarRotas();
  }

  criarRotas() {
    this._router.post('/',
      this._jwtMiddleware.validar_token_acesso,
      this._middleware.validar_vencimentoLancamento,
      this._middleware.validar_valorLancamento,
      this._middleware.validar_classificacaoLancamento,
      this._middleware.validar_pagamentoLancamento,
      this._middleware.validar_statusLancamento,
      this._middleware.validar_fkIds,
      this._controller.Lancamento_create_controller,
      this._middleware.validar_tituloLancamento,
      this._middleware.validar_descricaoLancamento
    );

    this._router.get('/',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Lancamento_readAll_controller
    );

    this._router.get('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Lancamento_readById_controller
    );

    this._router.put('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._middleware.validar_vencimentoLancamento,
      this._middleware.validar_valorLancamento,
      this._middleware.validar_classificacaoLancamento,
      this._middleware.validar_pagamentoLancamento,
      this._middleware.validar_statusLancamento,
      this._middleware.validar_fkIds,
      this._controller.Lancamento_update_controller,
      this._middleware.validar_tituloLancamento,
      this._middleware.validar_descricaoLancamento,

    );

    this._router.delete('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Lancamento_delete_controller
    );
  }

  get router() {
    return this._router;
  }
};
