const express = require('express');
const UsuarioTarefaMiddleware = require('../middlewares/usuario_TarefasMiddleware');
const UsuarioTarefaController = require('../controllers/Usuario_TarefasController');
const JwtMiddleware = require('../middlewares/JwtMiddleware');

module.exports = class UsuarioTarefaRoutes {
    constructor() {
        this._router = express.Router();
        this._usuarioTarefaMiddleware = new UsuarioTarefaMiddleware();
        this._usuarioTarefaController = new UsuarioTarefaController();
        this._jwtMiddleware = new JwtMiddleware();
        this.criarRotasUsuarioTarefa();
    }

    criarRotasUsuarioTarefa() {
        // ✅ Criar associação Usuário-Tarefa (POST)
        this._router.post('/',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaMiddleware.validar_ids.bind(this._usuarioTarefaMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_create_controller.bind(this._usuarioTarefaController)
        );

        // ✅ Listar todas as associações (GET)
        this._router.get('/',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_readAll_controller.bind(this._usuarioTarefaController)
        );

        // ✅ Listar todas as associações de uma tarefa (GET /usuariostarefas/tarefa/:idTarefa)
        this._router.get('/tarefa/:idTarefa',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaMiddleware.validar_parametro_tarefa.bind(this._usuarioTarefaMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_readByTarefa_controller.bind(this._usuarioTarefaController)
        );

        // ✅ Atualizar todas as associações de uma tarefa (PUT /usuariostarefas/tarefa/:idTarefa)
        this._router.put('/tarefa/:idTarefa',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaMiddleware.validar_parametro_tarefa.bind(this._usuarioTarefaMiddleware),
            this._usuarioTarefaMiddleware.validar_permissao_gerente.bind(this._usuarioTarefaMiddleware), // opcional, veja abaixo
            this._usuarioTarefaController.UsuarioTarefa_updateByTarefa_controller.bind(this._usuarioTarefaController)
        );


        // ✅ NOVA: Listar todas as tarefas de um usuário específico
        this._router.get('/:idUsuario',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_readByUsuario_controller.bind(this._usuarioTarefaController)
        );

        // ✅ Buscar associação específica por usuário e tarefa
        this._router.get('/:idUsuario/:idTarefa',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaMiddleware.validar_parametros_id.bind(this._usuarioTarefaMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_readById_controller.bind(this._usuarioTarefaController)
        );

        // ✅ Atualizar associação
        this._router.put('/:idUsuario/:idTarefa',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaMiddleware.validar_ids.bind(this._usuarioTarefaMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_update_controller.bind(this._usuarioTarefaController)
        );

        // ✅ Excluir associação
        this._router.delete('/:idUsuario/:idTarefa',
            this._jwtMiddleware.validar_token_acesso.bind(this._jwtMiddleware),
            this._usuarioTarefaMiddleware.validar_parametros_id.bind(this._usuarioTarefaMiddleware),
            this._usuarioTarefaController.UsuarioTarefa_delete_controller.bind(this._usuarioTarefaController)
        );
    }

    get router() {
        return this._router;
    }
};
