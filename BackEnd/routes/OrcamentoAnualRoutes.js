const express = require('express');
const OrcamentoAnualMiddleware = require('../middlewares/OrcamentoAnualMiddleware');
const OrcamentoAnualController = require('../controllers/OrcamentoAnualController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class OrcamentoAnualRoutes {
    constructor() {
        this._router = express.Router();
        this._middleware = new OrcamentoAnualMiddleware();
        this._controller = new OrcamentoAnualController();
        this._jwtMiddleware = new JwtMiddleware();
        this.criarRotas();
    }

    criarRotas() {
        this._router.post('/',
            this._jwtMiddleware.validar_token_acesso,
            this._middleware.validar_valorOrcamentoAnual,
            this._middleware.validar_anoOrcamentoAnual,
            this._middleware.validar_idCategoria,
            this._controller.OrcamentoAnual_create_controller
        );

        this._router.get('/',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.OrcamentoAnual_readAll_controller
        );

        this._router.get('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.OrcamentoAnual_readById_controller
        );

        this._router.put('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._middleware.validar_valorOrcamentoAnual,
            this._middleware.validar_anoOrcamentoAnual,
            this._middleware.validar_idCategoria,
            this._controller.OrcamentoAnual_update_controller
        );

        this._router.delete('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.OrcamentoAnual_delete_controller
        );
    }

    get router() {
        return this._router;
    }
};
