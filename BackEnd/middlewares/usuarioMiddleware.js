const Banco = require('../models/Banco');
const Usuario = require('../models/Usuario');

module.exports = class UsuarioMiddleware {

    validar_nomeUsuario = (request, response, next) => {
        const nomeUsuario = request.body.nomeUsuario;
        if (!nomeUsuario) {
            const objetoResposta = {
                status: false,
                error: 'O nome do usuário é obrigatório'
            }
            return response.status(400).send(objetoResposta);
        } else if (nomeUsuario.length < 3) {
            const objetoResposta = {
                status: false,
                error: 'O nome do usuário deve ter mais de 3 caracteres'
            }
            return response.status(400).send(objetoResposta);
        } else if (nomeUsuario.length > 100) {
            const objetoResposta = {
                status: false,
                error: 'O nome do usuário deve ter menos de 100 caracteres'
            }
            return response.status(400).send(objetoResposta);
        } else if (!/^[a-zA-Z\s]+$/.test(nomeUsuario)) {
            const objetoResposta = {
                status: false,
                error: 'O nome do usuário deve conter apenas letras e espaços'
            }
            return response.status(400).send(objetoResposta);
        } else if (nomeUsuario.trim() === '') {
            const objetoResposta = {
                status: false,
                error: 'O nome do usuário não pode conter apenas espaços'
            }
            return response.status(400).send(objetoResposta);
        }
        else {
            next();
        }
    }

    validar_emailUsuario = (request, response, next) => {
        const emailUsuario = request.body.emailUsuario;
        if (!emailUsuario) {
            const objetoResposta = {
                status: false,
                error: 'O email do usuário é obrigatório'
            }
            return response.status(400).send(objetoResposta);
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailUsuario)) {
            const objetoResposta = {
                status: false,
                error: 'O email do usuário é inválido'
            }
            return response.status(400).send(objetoResposta);
        } else if (emailUsuario.trim() === '') {
            const objetoResposta = {
                status: false,
                error: 'O email do usuário não pode conter apenas espaços'
            }
            return response.status(400).send(objetoResposta);
        }
        else {
            next();
        }
    }

    validar_senhaUsuario = (request, response, next) => {
        const senhaUsuario = request.body.senhaUsuario;
        if (!senhaUsuario) {
            const objetoResposta = {
                status: false,
                error: 'A senha do usuário é obrigatória'
            }
            return response.status(400).send(objetoResposta);
        } else if (senhaUsuario.length < 8) {
            const objetoResposta = {
                status: false,
                error: 'A senha do usuário deve ter mais de 8 caracteres'
            }
            return response.status(400).send(objetoResposta);
        } else if (senhaUsuario.length > 100) {
            const objetoResposta = {
                status: false,
                error: 'A senha do usuário deve ter menos de 100 caracteres'
            }
            return response.status(400).send(objetoResposta);
        }
        else {
            next();
        }
    }

    validar_emailDuplicado = async (request, response, next) => {
        const emailUsuario = request.body.emailUsuario;
        // CORREÇÃO: Pegar o ID dos params (para PUT) ou do body (para POST)
        const idUsuario = request.params.id || request.body.idUsuario;

        try {
            const conexao = Banco.getConexao();
            let query = 'SELECT COUNT(*) as qtd FROM usuarios WHERE emailUsuario = ?';
            let params = [emailUsuario];

            // Se estiver atualizando um usuário existente, exclui o próprio usuário da verificação
            if (idUsuario) {
                query += ' AND idUsuario != ?';
                params.push(idUsuario);
            }

            const [resposta] = await conexao.promise().execute(query, params);

            if (resposta[0].qtd > 0) {
                const objetoResposta = {
                    status: false,
                    error: 'Este email já está cadastrado no sistema'
                }
                return response.status(400).send(objetoResposta);
            }

            next();
        } catch (error) {
            console.error('Erro ao verificar duplicidade de email:', error);
            const objetoResposta = {
                status: false,
                error: 'Erro ao verificar duplicidade de email'
            }
            return response.status(500).send(objetoResposta);
        }
    }

}