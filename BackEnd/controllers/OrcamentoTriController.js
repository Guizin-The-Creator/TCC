const OrcamentoTri = require('../models/OrcamentoTri');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class OrcamentoTriController {
    // POST /orcamentostri
    OrcamentoTri_create_controller = async (req, res) => {
        const o = new OrcamentoTri();
        o.valorOrcamentoTri = req.body.valorOrcamentoTri;
        o.trimestreOrcamentoTri = req.body.trimestreOrcamentoTri;
        o.idOrcamentoAnual = req.body.idOrcamentoAnual;
        o.idCategoria = req.body.idCategoria;

        const sucesso = await o.create();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(201).send({
                status: true,
                message: 'Orçamento trimestral criado com sucesso',
                orcamento: o,
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao criar orçamento trimestral',
            token
        });
    }

    // GET /orcamentostri
    OrcamentoTri_readAll_controller = async (req, res) => {
        const lista = await OrcamentoTri.readAll();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        return res.status(200).send({
            status: true,
            message: 'Orçamentos trimestrais encontrados com sucesso',
            orcamentos: lista,
            token
        });
    }

    // GET /orcamentostri/:id
    OrcamentoTri_readById_controller = async (req, res) => {
        const id = req.params.id;
        const orc = await OrcamentoTri.readById(id);
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (orc) {
            return res.status(200).send({
                status: true,
                message: 'Orçamento trimestral encontrado',
                orcamento: orc,
                token
            });
        }
        return res.status(404).send({
            status: false,
            message: 'Orçamento trimestral não encontrado',
            token
        });
    }

    // PUT /orcamentostri/:id
    OrcamentoTri_update_controller = async (req, res) => {
        const o = new OrcamentoTri();
        o.idOrcamentoTri = req.params.id;
        o.valorOrcamentoTri = req.body.valorOrcamentoTri;
        o.trimestreOrcamentoTri = req.body.trimestreOrcamentoTri;
        o.idOrcamentoAnual = req.body.idOrcamentoAnual;
        o.idCategoria = req.body.idCategoria;

        const sucesso = await o.update();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Orçamento trimestral atualizado com sucesso',
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao atualizar orçamento trimestral',
            token
        });
    }

    // DELETE /orcamentostri/:id
    OrcamentoTri_delete_controller = async (req, res) => {
        const o = new OrcamentoTri();
        o.idOrcamentoTri = req.params.id;

        const sucesso = await o.delete();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Orçamento trimestral deletado com sucesso',
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao deletar orçamento trimestral',
            token
        });
    }
};
