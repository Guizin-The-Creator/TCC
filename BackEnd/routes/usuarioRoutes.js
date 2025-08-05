const express = require('express');
const UsuarioMiddleware = require('../middlewares/UsuarioMiddleware');
const UsuarioController = require('../controllers/UsuarioController');

module.exports = class UsuarioRoutes {
    constructor() {
        this._router = express.Router();
        this._usuarioMiddleware = new UsuarioMiddleware();
        this._usuarioController = new UsuarioController();

        this.criarRotasUsuario();
    }

    criarRotasUsuario() {
        // Remova o "/usuarios" aqui, pois já está sendo configurado no servidor
        this._router.post('/', // Aqui não precisamos de '/usuarios'
            this._usuarioMiddleware.validar_nomeUsuario,
            this._usuarioMiddleware.validar_emailUsuario,
            this._usuarioMiddleware.validar_senhaUsuario,
            this._usuarioMiddleware.validar_emailDuplicado,
            this._usuarioController.Usuario_create_controller
        );
        this._router.post("/login/",
            this._usuarioController.Usuario_login_controller
        );

        this._router.get('/', this._usuarioController.Usuario_readAll_controller);
        this._router.get('/:id', this._usuarioController.Usuario_readById_controller);
        this._router.put('/:id',
            this._usuarioMiddleware.validar_nomeUsuario,
            this._usuarioMiddleware.validar_emailUsuario,
            this._usuarioMiddleware.validar_senhaUsuario,
            this._usuarioMiddleware.validar_emailDuplicado,
            this._usuarioController.Usuario_update_controller
        );
        this._router.delete('/:id', this._usuarioController.Usuario_delete_controller);
    }

    get router() {
        return this._router;
    }
};
