const UsuarioTarefa = require('../models/UsuarioTarefas');



module.exports = class UsuarioTarefaMiddleware {

  validar_ids(req, res, next) {
    const { idUsuario, idTarefa } = req.body;

    if (idUsuario == null || idTarefa == null) {
      return res.status(400).send({
        status: false,
        error: 'Os campos idUsuario e idTarefa são obrigatórios'
      });
    }

    const nUsuario = Number(idUsuario);
    const nTarefa = Number(idTarefa);

    if (!Number.isInteger(nUsuario) || nUsuario <= 0) {
      return res.status(400).send({
        status: false,
        error: 'idUsuario deve ser um número inteiro positivo'
      });
    }

    if (!Number.isInteger(nTarefa) || nTarefa <= 0) {
      return res.status(400).send({
        status: false,
        error: 'idTarefa deve ser um número inteiro positivo'
      });
    }

    next();
  }

  validar_parametro_tarefa(req, res, next) {
    const { idTarefa } = req.params;
    const nTarefa = Number(idTarefa);
    if (!Number.isInteger(nTarefa) || nTarefa <= 0) {
      return res.status(400).send({
        status: false,
        error: 'Parâmetro idTarefa inválido'
      });
    }
    next();
  }

  // Permite se o usuário for gerente OU se o usuário estiver associado à tarefa
  async validar_permissao_gerente(req, res, next) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).send({ status: false, message: 'Usuário não autenticado' });
      }

      // pegar idTarefa (pode vir em params ou no body)
      const idTarefa = Number(req.params.idTarefa || req.body.idTarefa);
      if (!Number.isInteger(idTarefa) || idTarefa <= 0) {
        return res.status(400).send({ status: false, message: 'idTarefa inválido' });
      }

      // Ajuste conforme o campo do token que identifica cargo/role
      const ehGerente =
        (user.idCargo && Number(user.idCargo) === 1) ||
        (user.role && String(user.role).toLowerCase() === 'gerente') ||
        (user.role && ['admin', 'manager'].includes(String(user.role).toLowerCase()));

      if (ehGerente) {
        return next();
      }

      // se não é gerente, verificar se o usuário está associado à tarefa
      const associado = await UsuarioTarefa.isAssociacao(user.idUsuario, idTarefa);
      if (associado) {
        return next();
      }

      return res.status(403).send({
        status: false,
        message: 'Permissão negada: apenas gerentes ou usuários associados podem executar esta ação'
      });
    } catch (err) {
      console.error('Erro em validar_permissao_gerente:', err);
      return res.status(500).send({ status: false, message: 'Erro ao verificar permissões' });
    }
  }



  validar_parametros_id(req, res, next) {
    const { idUsuario, idTarefa } = req.params;

    const nUsuario = Number(idUsuario);
    const nTarefa = Number(idTarefa);

    if (!Number.isInteger(nUsuario) || nUsuario <= 0) {
      return res.status(400).send({
        status: false,
        error: 'Parâmetro idUsuario inválido'
      });
    }

    if (!Number.isInteger(nTarefa) || nTarefa <= 0) {
      return res.status(400).send({
        status: false,
        error: 'Parâmetro idTarefa inválido'
      });
    }

    next();
  }
}
