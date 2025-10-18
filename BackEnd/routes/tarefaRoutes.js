const express = require('express');
const TarefaMiddleware = require('../middlewares/tarefaMiddleware');
const TarefaController = require('../controllers/TarefaController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class TarefaRoutes {
    constructor() {
        this._router = express.Router();
        this._tarefaMiddleware = new TarefaMiddleware();
        this._tarefaController = new TarefaController();
        this._jwtMiddleware = new JwtMiddleware();
        this.criarRotasTarefa();
    }

    criarRotasTarefa() {
        this._router.post('/',
            this._jwtMiddleware.validar_token_acesso,
            this._tarefaMiddleware.validar_tituloTarefa,
            this._tarefaMiddleware.validar_descricaoTarefa,
            this._tarefaMiddleware.validar_prioridadeTarefa,  // novo
            this._tarefaMiddleware.validar_datas,
            this._tarefaController.Tarefa_create_controller
        );

        this._router.get('/',
            this._jwtMiddleware.validar_token_acesso,
            this._tarefaController.Tarefa_readAll_controller
        );

        this._router.get('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._tarefaController.Tarefa_readById_controller
        );

        this._router.put('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._tarefaMiddleware.validar_tituloTarefa,
            this._tarefaMiddleware.validar_descricaoTarefa,
            this._tarefaMiddleware.validar_prioridadeTarefa,  // novo
            this._tarefaMiddleware.validar_datas,
            this._tarefaController.Tarefa_update_controller
        );

        this._router.delete('/:id',
            this._jwtMiddleware.validar_token_acesso,
            this._tarefaController.Tarefa_delete_controller
        );
    }

    get router() {
        return this._router;
    }
};
