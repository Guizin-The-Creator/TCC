// controllers/UsuarioController.js
const Usuario = require('../models/Usuario');
const Cargo = require('../models/Cargo');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class UsuarioController {

    /**
     * Controller de login:
     * - Cria instância de Usuario apenas com email e senha
     * - Chama Usuario.login() que retorna { idUsuario, nomeUsuario, emailUsuario, dataCadastro, idCargo, nomeCargo }
     * - Se login falhar, retorna 401
     * - Caso contrário, gera token JWT passando todas as claims (inclusive nomeCargo)
     * - Retorna JSON com { status, message, token }
     */
    Usuario_login_controller = async (req, res) => {
        console.log("UsuarioController.Usuario_login_controller()");

        const usuario = new Usuario();
        usuario.emailUsuario = req.body.emailUsuario;
        usuario.senhaUsuario = req.body.senhaUsuario;

        const usuarioLogado = await usuario.login();

        if (!usuarioLogado) {
            return res.status(401).send({
                status: false,
                message: 'Email ou senha inválidos'
            });
        }

        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken({
            idUsuario: usuarioLogado.idUsuario,
            emailUsuario: usuarioLogado.emailUsuario,
            nomeUsuario: usuarioLogado.nomeUsuario,
            dataCadastro: usuarioLogado.dataCadastro,
            idCargo: usuarioLogado.idCargo,
            nomeCargo: usuarioLogado.nomeCargo   // <--- inclui aqui
        });

        console.log("Token gerado:", token);

        return res.status(200).send({
            status: true,
            message: 'Autenticado com sucesso',
            token
        });
    }

    /**
     * Controller para criação de usuário:
     * - Preenche campos, chama usuario.create()
     * - Após criar, busca novamente nomeCargo via Cargo.readById para enviar no token
     */
    Usuario_create_controller = async (req, res) => {
        const usuario = new Usuario();
        usuario.nomeUsuario = req.body.nomeUsuario;
        usuario.emailUsuario = req.body.emailUsuario;
        usuario.senhaUsuario = req.body.senhaUsuario;
        usuario.dataCadastro = new Date();
        usuario.idCargo = req.body.idCargo;

        const criado = await usuario.create();

        if (!criado) {
            return res.status(500).send({
                status: false,
                message: 'Erro ao criar usuário'
            });
        }

        // Já temos nomeCargo em usuario._nomeCargo, mas vamos garantir pegando do modelo
        const cargo = await Cargo.readById(usuario.idCargo);
        const nomeCargo = cargo ? cargo.nomeCargo : null;

        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken({
            idUsuario: usuario.idUsuario,
            emailUsuario: usuario.emailUsuario,
            nomeUsuario: usuario.nomeUsuario,
            dataCadastro: usuario.dataCadastro,
            idCargo: usuario.idCargo,
            nomeCargo: nomeCargo
        });

        return res.status(201).send({
            status: true,
            message: 'Usuário criado com sucesso',
            data: {
                idUsuario: usuario.idUsuario,
                nomeUsuario: usuario.nomeUsuario,
                emailUsuario: usuario.emailUsuario,
                dataCadastro: usuario.dataCadastro,
                idCargo: usuario.idCargo,
                nomeCargo: nomeCargo
            },
            token
        });
    }

    /**
     * Retorna todos os usuários (retorna apenas o array de objetos brutos).
     */
    Usuario_readAll_controller = async (req, res) => {
        const usuarios = await Usuario.readAll();

        return res.status(200).send({
            status: true,
            message: 'Usuários encontrados com sucesso',
            data: usuarios
        });
    }

    /**
     * Retorna um único usuário por ID. Faz a busca bruta e, se existir, pesquisa nomeCargo
     * antes de devolver.
     */
    Usuario_readById_controller = async (req, res) => {
        const id = req.params.id;
        const registro = await Usuario.readById(id);

        if (!registro) {
            return res.status(404).send({
                status: false,
                message: 'Usuário não encontrado'
            });
        }

        // Buscar nomeCargo
        const cargo = await Cargo.readById(registro.idCargo);
        registro.nomeCargo = cargo ? cargo.nomeCargo : null;

        return res.status(200).send({
            status: true,
            message: 'Usuário encontrado com sucesso',
            data: registro
        });
    }

    /**
     * Atualiza um usuário. Preenche campos em instância, chama update() e devolve status.
     */
    Usuario_update_controller = async (req, res) => {
        const usuario = new Usuario();
        usuario.idUsuario = req.params.id;
        usuario.nomeUsuario = req.body.nomeUsuario;
        usuario.emailUsuario = req.body.emailUsuario;
        usuario.senhaUsuario = req.body.senhaUsuario;
        usuario.idCargo = req.body.idCargo;
        usuario.dataCadastro = new Date(); // Podemos atualizar a data de modificação

        const sucesso = await usuario.update();
        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Usuário atualizado com sucesso'
            });
        } else {
            return res.status(500).send({
                status: false,
                message: 'Erro ao atualizar usuário'
            });
        }
    }

    /**
     * Deleta um usuário pelo ID.
     */
    Usuario_delete_controller = async (req, res) => {
        const usuario = new Usuario();
        usuario.idUsuario = req.params.id;

        const sucesso = await usuario.delete();
        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Usuário deletado com sucesso'
            });
        } else {
            return res.status(500).send({
                status: false,
                message: 'Erro ao deletar usuário'
            });
        }
    }

};
