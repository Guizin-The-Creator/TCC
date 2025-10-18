const express = require('express');
const SegmentoController = require('../controllers/SegmentoController');

module.exports = class SegmentoRoutes {
    constructor() {
        this._router = express.Router();
        this._segmentoController = new SegmentoController();
        this.criarRotasSegmento();
    }

    criarRotasSegmento() {
        // Listar todos os segmentos
        this._router.get('/',
            this._segmentoController.Segmento_readAll_controller
        );

        // Buscar um segmento por ID
        this._router.get('/:id',
            this._segmentoController.Segmento_readById_controller
        );

        // Listar todos os subsegmentos
        this._router.get('/subsegmentos/todos',
            this._segmentoController.Subsegmento_readAll_controller
        );

        // Buscar subsegmentos de um segmento específico
        this._router.get('/:id/subsegmentos',
            this._segmentoController.Subsegmento_readBySegmento_controller
        );
    }

    get router() {
        return this._router;
    }
};
