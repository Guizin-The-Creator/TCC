const express = require('express');
const IndiceMiddleware = require('../middlewares/IndiceMiddleware');
const IndiceController = require('../controllers/IndiceController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class IndiceRoutes {
    constructor() {
        this._router = express.Router();
        this._middleware = new IndiceMiddleware();
        this._controller = new IndiceController();
        this._jwtMiddleware = new JwtMiddleware();
        this.criarRotas();
    }

    criarRotas() {
        this._router.post('/',
            this._jwtMiddleware.validar_token_acesso,
            this._middleware.validar_nomeIndice,
            this._middleware.validar_taxaIndice,
            this._middleware.validar_idSubsegmento,
            this._middleware.validar_anoIndice,
            this._controller.Indice_create_controller
        );

        this._router.get('/',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.Indice_readAll_controller
        );

        this._router.get('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.Indice_readById_controller
        );

        this._router.put('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._middleware.validar_nomeIndice,
            this._middleware.validar_taxaIndice,
            this._middleware.validar_idSubsegmento,
            this._middleware.validar_anoIndice,
            this._controller.Indice_update_controller
        );

        this._router.delete('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._controller.Indice_delete_controller
        );
    }

    get router() {
        return this._router;
    }
};