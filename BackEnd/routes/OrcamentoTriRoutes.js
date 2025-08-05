const express = require('express');
const OrcamentoTriMiddleware = require('../middlewares/OrcamentoTriMiddleware');
const OrcamentoTriController = require('../controllers/OrcamentoTriController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class OrcamentoTriRoutes {
    constructor() {
        this._router = express.Router();
        this._middleware = new OrcamentoTriMiddleware();
        this._controller = new OrcamentoTriController();
        this._jwtMiddleware = new JwtMiddleware();
        this.criarRotas();
    }

    criarRotas() {
        this._router.post('/',
            this._jwtMiddleware.validar_token_acesso,
            this._middleware.validar_valorOrcamentoTri,
            this._middleware.validar_trimestreOrcamentoTri,
            this._middleware.validar_idOrcamentoAnual,
            this._middleware.validar_idCategoria,
            this._controller.OrcamentoTri_create_controller
        );

        this._router.get('/',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.OrcamentoTri_readAll_controller
        );

        this._router.get('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.OrcamentoTri_readById_controller
        );

        this._router.put('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._middleware.validar_valorOrcamentoTri,
            this._middleware.validar_trimestreOrcamentoTri,
            this._middleware.validar_idOrcamentoAnual,
            this._middleware.validar_idCategoria,
            this._controller.OrcamentoTri_update_controller
        );

        this._router.delete('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.OrcamentoTri_delete_controller
        );
    }

    get router() {
        return this._router;
    }
};
