const Cargo = require('../models/Cargo');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class CargoController {

    // Criar um novo cargo
    Cargo_create_controller = async (req, res) => {
        try {
            const cargo = new Cargo();
            cargo.nomeCargo = req.body.nomeCargo;
            cargo.prioridadeCargo = req.body.prioridadeCargo;

            const sucesso = await cargo.create();

            
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);

            if (sucesso) {
                return res.status(201).send({
                    status: true,
                    message: 'Cargo criado com sucesso',
                    data: cargo,
                    token
                });
            } else {
                return res.status(500).send({
                    status: false,
                    message: 'Erro ao criar cargo',
                    token
                });
            }
        } catch (error) {
            console.error('Erro ao criar cargo:', error);
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);
            return res.status(500).send({
                status: false,
                message: 'Erro interno ao criar cargo',
                token
            });
        }
    }

    // Ler todos os cargos
    Cargo_readAll_controller = async (req, res) => {
        try {
            const cargos = await Cargo.readAll();

            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);

            if (cargos && cargos.length > 0) {
                return res.status(200).send({
                    status: true,
                    message: 'Cargos encontrados com sucesso',
                    data: cargos,
                    token
                });
            } else {
                return res.status(404).send({
                    status: false,
                    message: 'Nenhum cargo encontrado',
                    token
                });
            }
        } catch (error) {
            console.error('Erro ao ler cargos:', error);
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);
            return res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar cargos',
                token
            });
        }
    }

    // Ler um cargo pelo ID
    Cargo_readById_controller = async (req, res) => {
        const id = req.params.id;
        try {
            const cargo = await Cargo.readById(id);

            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);

            if (cargo) {
                return res.status(200).send({
                    status: true,
                    message: 'Cargo encontrado com sucesso',
                    data: cargo,
                    token
                });
            } else {
                return res.status(404).send({
                    status: false,
                    message: 'Cargo não encontrado',
                    token
                });
            }
        } catch (error) {
            console.error('Erro ao ler cargo:', error);
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);
            return res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar cargo',
                token
            });
        }
    }

    // Atualizar um cargo
    Cargo_update_controller = async (req, res) => {
        try {
            const cargo = new Cargo();
            cargo.idCargo = req.params.id;
            cargo.nomeCargo = req.body.nomeCargo;
            cargo.prioridadeCargo = req.body.prioridadeCargo;

            const sucesso = await cargo.update();

            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);

            if (sucesso) {
                return res.status(200).send({
                    status: true,
                    message: 'Cargo atualizado com sucesso',
                    token
                });
            } else {
                return res.status(500).send({
                    status: false,
                    message: 'Erro ao atualizar cargo',
                    token
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar cargo:', error);
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);
            return res.status(500).send({
                status: false,
                message: 'Erro interno ao atualizar cargo',
                token
            });
        }
    }

    // Deletar um cargo
    Cargo_delete_controller = async (req, res) => {
        const idCargo = req.params.id;
        try {
            const sucesso = await Cargo.delete(idCargo);

            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);

            if (sucesso) {
                return res.status(200).send({
                    status: true,
                    message: 'Cargo deletado com sucesso',
                    token
                });
            } else {
                return res.status(500).send({
                    status: false,
                    message: 'Erro ao deletar cargo',
                    token
                });
            }
        } catch (error) {
            console.error('Erro ao deletar cargo:', error);
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);
            return res.status(500).send({
                status: false,
                message: 'Erro interno ao deletar cargo',
                token
            });
        }
    }
}
