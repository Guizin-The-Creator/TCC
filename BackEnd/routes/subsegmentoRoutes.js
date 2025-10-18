const express = require('express');
const SubsegmentoController = require('../controllers/SubsegmentoController');

module.exports = class SubsegmentoRoutes {
    constructor() {
        this._router = express.Router();
        this._subsegmentoController = new SubsegmentoController();
        this.criarRotasSubsegmento();
    }

    criarRotasSubsegmento() {

        // Listar todos os subsegmentos
        this._router.get('/',
            this._subsegmentoController.Subsegmento_readAll_controller
        );

        // Buscar subsegmentos de um segmento específico
        this._router.get('/segmento/:idSegmento',
            this._subsegmentoController.Subsegmento_readBySegmento_controller
        );

        // Buscar um subsegmento pelo ID
        this._router.get('/:idSubsegmento',
            this._subsegmentoController.Subsegmento_readById_controller
        );
    }

    get router() {
        return this._router;
    }
};
