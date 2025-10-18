const express = require('express');
const UsuarioRoutes = require('./BackEnd/routes/usuarioRoutes');
const CargoRoutes = require('./BackEnd/routes/cargoRoutes');
const TarefaRoutes = require('./BackEnd/routes/tarefaRoutes');
const UsuarioTarefasRoutes = require('./BackEnd/routes/usuario_TarefasRoutes');
const OrcamentoTriRoutes = require('./BackEnd/routes/OrcamentoTriRoutes');
const OrcamentoAnualRoutes = require('./BackEnd/routes/OrcamentoAnualRoutes');
const ProdutoRoutes = require('./BackEnd/routes/ProdutoRoutes');
const LancamentoRoutes = require('./BackEnd/routes/LancamentoRoutes');
const ExtratoRoutes = require('./BackEnd/routes/extratoRoutes');
const IndiceRoutes = require('./BackEnd/routes/IndiceRoutes');
const CategoriaRoutes = require('./BackEnd/routes/categoriaRoutes');
const SubcategoriaRoutes = require('./BackEnd/routes/subcategoriaRoutes');
const SegmentoRoutes = require('./BackEnd/routes/segmentoRoutes');
const SubsegmentoRoutes = require('./BackEnd/routes/subsegmentoRoutes');

module.exports = class Servidor {
  constructor() {
    this._app = express();
    this._porta = 3000;

    this._app.use(express.json());
    this._app.use(express.static('FrontEnd'));
    
    
    

    

    this._usuarioRoutes = new UsuarioRoutes();
    this._cargoRoutes = new CargoRoutes();
    this._tarefaRoutes = new TarefaRoutes();
    this._usuarioTarefasRoutes = new UsuarioTarefasRoutes();
    this._produtoRoutes = new ProdutoRoutes();
    this._orcamentoAnualRoutes = new OrcamentoAnualRoutes();
    this._orcamentoTriRoutes = new OrcamentoTriRoutes();
    this._lancamentoRoutes = new LancamentoRoutes();
    this._extratoRoutes = new ExtratoRoutes();
    this._indiceRoutes = new IndiceRoutes();
    this._categoriaRoutes = new CategoriaRoutes();
    this._subcategoriaRoutes = new SubcategoriaRoutes();
    this._segmentoRoutes = new SegmentoRoutes();
    this._subsegmentoRoutes = new SubsegmentoRoutes();

    this.configurarRotas();
  }

  configurarRotas = () => {
    this._app.use('/usuarios', this._usuarioRoutes.router);
    this._app.use('/cargos', this._cargoRoutes.router);
    this._app.use('/tarefas', this._tarefaRoutes.router);
    this._app.use('/usuariostarefas', this._usuarioTarefasRoutes.router);
    this._app.use('/orcamentosanuais', this._orcamentoAnualRoutes.router);
    this._app.use('/orcamentostri', this._orcamentoTriRoutes.router);
    this._app.use('/produtos', this._produtoRoutes.router);
    this._app.use('/lancamentos', this._lancamentoRoutes.router);
    this._app.use('/extratos', this._extratoRoutes.router);
    this._app.use('/indices', this._indiceRoutes.router);
    this._app.use('/categorias', this._categoriaRoutes.router);
    this._app.use('/subcategorias', this._subcategoriaRoutes.router);
    this._app.use('/segmentos', this._segmentoRoutes.router);
    this._app.use('/subsegmentos', this._subsegmentoRoutes.router);
  };

  iniciar = () => {
    this._app.listen(this._porta, () => {
      console.log(`Servidor rodando na porta ${this._porta}`);
    });
  };
};
