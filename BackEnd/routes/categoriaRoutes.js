// routes/categoriaRoutes.js
const express = require('express');
const CategoriaController = require('../controllers/CategoriaController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class CategoriaRoutes {
    constructor() {
        this._router = express.Router();
        this._controller = new CategoriaController();
        this._jwt = new JwtMiddleware();
        this.criarRotas();
    }

    criarRotas() {
        // GET /categorias
        this._router.get('/',
            this._jwt.validar_token_acesso,

            this._controller.Categoria_readAll_controller
        );

        // GET /categorias/:id
        this._router.get('/:id',
            this._jwt.validar_token_acesso,
            this._controller.Categoria_readById_controller
        );
    }

    get router() {
        return this._router;
    }
};
