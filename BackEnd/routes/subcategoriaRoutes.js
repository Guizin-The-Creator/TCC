// routes/subcategoriaRoutes.js
const express = require('express');
const SubcategoriaController = require('../controllers/SubcategoriaController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class SubcategoriaRoutes {
    constructor() {
        this._router = express.Router();
        this._controller = new SubcategoriaController();
        this._jwt = new JwtMiddleware();
        this.criarRotas();
    }

    criarRotas() {
        // GET /subcategorias
        this._router.get('/',
            this._jwt.validar_token_acesso, // REMOVA se quiser público
            this._controller.Subcategoria_readAll_controller
        );

        // GET /subcategorias/:id
        this._router.get('/:id',
            this._jwt.validar_token_acesso,
            this._controller.Subcategoria_readById_controller
        );

        // GET /subcategorias/categoria/:categoriaId  -> subcategorias de uma categoria
        this._router.get('/categoria/:categoriaId',
            this._jwt.validar_token_acesso,
            this._controller.Subcategoria_readByCategoria_controller
        );
    }

    get router() {
        return this._router;
    }
};
