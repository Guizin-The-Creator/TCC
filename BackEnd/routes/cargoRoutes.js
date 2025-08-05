const express = require('express');
const CargoController = require('../controllers/CargoController');
const CargoMiddleware = require('../middlewares/cargoMiddleware');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class CargoRoutes {
    constructor() {
        this._router = express.Router();
        this._cargoController = new CargoController();
        this._cargoMiddleware = new CargoMiddleware();
        this._jwtMiddleware = new JwtMiddleware();
        this.criarRotasCargo();
    }

    criarRotasCargo() {
        this._router.post('/',
            this._jwtMiddleware.validar_token_acesso,
            this._cargoMiddleware.validar_nomeCargo,
            this._cargoMiddleware.validar_prioridadeCargo,
            this._cargoMiddleware.validar_nomeCargoDuplicado,
            this._cargoController.Cargo_create_controller
        );

        this._router.get('/',
            this._jwtMiddleware.validar_token_acesso,
            this._cargoController.Cargo_readAll_controller
        );

        this._router.get('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._cargoController.Cargo_readById_controller
        );

        this._router.put('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._cargoMiddleware.validar_nomeCargo,
            this._cargoMiddleware.validar_prioridadeCargo,
            this._cargoMiddleware.validar_nomeCargoDuplicado,
            this._cargoController.Cargo_update_controller
        );

        this._router.delete('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._cargoMiddleware.validar_cargoSemUsuariosVinculados,
            this._cargoController.Cargo_delete_controller
        );
    }

    get router() {
        return this._router;
    }
};
