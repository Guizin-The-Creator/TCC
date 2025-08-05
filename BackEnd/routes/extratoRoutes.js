const express = require('express');
const ExtratoMiddleware = require('../middlewares/ExtratoMiddleware');
const ExtratoController = require('../controllers/ExtratoController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class ExtratoRoutes {
  constructor() {
    this._router = express.Router();
    this._middleware = new ExtratoMiddleware();
    this._controller = new ExtratoController();
    this._jwtMiddleware = new JwtMiddleware();
    this.criarRotas();
  }

  criarRotas() {
    this._router.post('/',
      this._jwtMiddleware.validar_token_acesso,
      this._middleware.validar_tipoExtrato,
      this._middleware.validar_valorExtrato,
      this._middleware.validar_dataExtrato,
      this._middleware.validar_idsRelacionais,
      this._controller.Extrato_create_controller
    );

    this._router.get('/',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Extrato_readAll_controller
    );

    this._router.get('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Extrato_readById_controller
    );

    this._router.put('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._middleware.validar_tipoExtrato,
      this._middleware.validar_valorExtrato,
      this._middleware.validar_dataExtrato,
      this._middleware.validar_idsRelacionais,
      this._controller.Extrato_update_controller
    );

    this._router.delete('/:id',
      this._jwtMiddleware.validar_token_acesso,
      this._controller.Extrato_delete_controller
    );
  }

  get router() {
    return this._router;
  }
};
