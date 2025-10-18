/* Modern Financial Task Management Dashboard
   Versão com integração de tarefas do gerente comum
   Compatível com login.js
*/

/* ---------- CONFIGURAÇÕES E UTILITÁRIOS ---------- */
const baseUrl = 'http://localhost:3000';

// Função auxiliar para obter o token do localStorage
function obterToken() {
  const authData = localStorage.getItem("authToken");

  if (!authData) return null;

  try {
    const { token, timestamp } = JSON.parse(authData);
    const tempoDecorrido = Date.now() - timestamp;
    const TEMPO_EXPIRACAO = 24 * 60 * 60 * 1000; // 24 horas

    if (tempoDecorrido >= TEMPO_EXPIRACAO) {
      console.log("Token expirado, limpando localStorage");
      localStorage.removeItem("authToken");
      return null;
    }

    return token;
  } catch (e) {
    console.error("Erro ao processar authToken:", e);
    localStorage.removeItem("authToken");
    return null;
  }
}

// Função para decodificar JWT e obter ID do usuário
function pegarUserIdDoToken() {
  const token = obterToken();

  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    return payload.idUsuario || null;
  } catch (e) {
    console.error("Erro ao decodificar token JWT:", e);
    return null;
  }
}

// Fetch com autenticação
function fetchWithAuth(url, options = {}) {
  const token = obterToken();

  if (!token) {
    console.error("Token não encontrado ou inválido");
    window.location.href = "../../html/login.html";
    return Promise.reject(new Error("Token não encontrado"));
  }

  const headers = options.headers || {};
  options.headers = {
    'Content-Type': 'application/json',
    ...headers,
    'Authorization': `Bearer ${token}`
  };

  return fetch(url, options).then(async res => {
    if (res.status === 401 || res.status === 403) {
      console.error("Token inválido ou expirado (servidor)");
      localStorage.removeItem("authToken");
      window.location.href = "../../html/login.html";
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!res.ok) {
      let errorData = null;
      try {
        errorData = await res.json();
      } catch (e) { }
      const errorMessage = (errorData && errorData.message) || `Erro ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }
    return res.json();
  });
}

// Sistema de notificações moderno
function mostrarRespostaPopup(mensagem, sucesso = true, tempo = 3500) {
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());

  const notification = document.createElement('div');
  notification.className = `notification ${sucesso ? 'success' : 'error'}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        ${sucesso ? '✓' : '✗'}
      </div>
      <div class="notification-message">${mensagem}</div>
    </div>
  `;

  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
      }
      
      .notification.success {
        background: linear-gradient(135deg, hsl(142, 69%, 58%), hsl(142, 69%, 68%));
        color: white;
        border: 1px solid hsl(142, 69%, 48%);
      }
      
      .notification.error {
        background: linear-gradient(135deg, hsl(0, 72%, 51%), hsl(0, 72%, 61%));
        color: white;
        border: 1px solid hsl(0, 72%, 41%);
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .notification-icon {
        font-weight: bold;
        font-size: 18px;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), tempo);
}

function exibirToast(titulo, descricao, tipo = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.classList.add('toast-container');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `
    <div class="toast-title">${escaparHTML(titulo)}</div>
    <div class="toast-description">${escaparHTML(descricao)}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---------- ESTADO GLOBAL ---------- */
const userId = pegarUserIdDoToken();
let dataCadastroAtual = null;
let idCargoAtual = null;
let calendarioInstancia = null;

// Dados em cache
let todasAsTarefas = [];
let todosLancamentos = [];
let todosExtratos = [];
let todosIndices = [];
let todosProdutos = [];
let todasCategorias = [];
let todasSubcategorias = [];
let todasTarefasComTitulo = [];
let todosSegmentos = [];
let todosSubsegmentos = [];
let todasAsTarefasCompletas = [];
let todasUsuarios = [];
let todasAtribuicoes = [];
let todosOrcamentosAnuais = [];
let todosOrcamentosTri = [];


// Filtros ativos
let filtrosTarefasAtivos = {};
let filtrosAtivos = {
  lancamentos: {},
  extratos: {},
  indices: {},
  produtos: {},
  atribuicoes: {},
  orcamentosAnuais: {},
  orcamentosTri: {}
};

// Instâncias de gráficos
let graficoInstances = {
  tarefas: null,
  fluxoCaixa: null,
  lancamentosStatus: null,
  lancamentosClassificacao: null,
  extratosTipo: null,
  indicesTaxas: null,
  produtosCusto: null,
  orcamentosAnuais: null,
  orcamentosTri: null
};

/* ---------- ELEMENTOS DOM ---------- */
const elements = {
  tbodyTarefas: document.getElementById("tbodyTarefas"),
  tbodyLancamentos: document.getElementById("tbodyLancamentos"),
  tbodyExtratos: document.getElementById("tbodyExtratos"),
  tbodyIndices: document.getElementById("tbodyIndices"),
  tbodyProdutos: document.getElementById("tbodyProdutos"),
  tbodyOrcamentosAnuais: document.getElementById("tbodyOrcamentosAnuais"),
  tbodyOrcamentosTri: document.getElementById("tbodyOrcamentosTri"),
  totalReceitasMes: document.getElementById("totalReceitasMes"),
  totalDespesasMes: document.getElementById("totalDespesasMes"),
  saldoAtual: document.getElementById("saldoAtual"),
  lancamentosEmAbertoCount: document.getElementById("lancamentosEmAbertoCount"),
  modais: {
    lancamento: document.getElementById("modalLancamento"),
    extrato: document.getElementById("modalExtrato"),
    produto: document.getElementById("modalProduto"),
    indice: document.getElementById("modalIndice"),
    orcamentoAnual: document.getElementById("modalOrcamentoAnual"),
    orcamentoTri: document.getElementById("modalOrcamentoTri")
  }
};
// Elementos específicos para tarefas
const modalConfirmacao = document.getElementById("modalConfirmacao");
const textoModalConfirmacao = document.getElementById("modal-text-confirmacao");
const btnConfirmarAcao = document.getElementById("confirmarAcao");
const btnCancelarAcao = document.getElementById("cancelarAcao");

const modalTarefa = document.getElementById("modalTarefa");
const modalTituloTarefa = document.getElementById("modalTituloTarefa");
const formTarefa = document.getElementById("formTarefa");
const inputIdTarefa = document.getElementById("inputIdTarefa");
const inputTituloTarefa = document.getElementById("inputTituloTarefa");
const inputDescricaoTarefa = document.getElementById("inputDescricaoTarefa");
const selectPrioridadeTarefa = document.getElementById("selectPrioridadeTarefa");
const inputDataInicio = document.getElementById("inputDataInicio");
const inputDataFim = document.getElementById("inputDataFim");
const btnCancelarTarefa = document.getElementById("btnCancelarTarefa");

const seletorFiltroTarefas = document.getElementById("seletorFiltroTarefas");
const filtrosAtivosTarefas = document.getElementById("filtrosAtivosTarefas");
const btnLimparFiltrosTarefas = document.getElementById("btnLimparFiltrosTarefas");
const btnNovaTarefa = document.getElementById("btnNovaTarefa");
const btnLogout = document.getElementById("logoutBtn") || document.getElementById("btnLogout");

const navBtns = document.querySelectorAll(".btn-nav");
const paineis = document.querySelectorAll(".content-section");

/* ---------- FUNÇÕES UTILITÁRIAS ---------- */
function escaparHTML(texto) {
  return (texto || '').replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizar(txt) {
  return (txt || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarDataExibicao(dataISO) {
  if (!dataISO) return '-';
  try {
    const d = new Date(dataISO);
    if (isNaN(d.getTime())) return '-';
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return '-';
  }
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  return new Date(dataStr).toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  return `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function atualizarIconesLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function fetchData(url) {
  try {
    const res = await fetchWithAuth(url);
    if (url.includes('/indices')) return { status: true, data: res.indices || [] };
    if (url.includes('/produtos')) return { status: true, data: res.produtos || [] };
    if (url.includes('/lancamentos')) return { status: true, data: res.lancamentos || [] };
    if (url.includes('/extratos')) return { status: true, data: res.extratos || [] };
    if (url.includes('/orcamentosanuais')) return { status: true, data: res.orcamentos || [] };
    if (url.includes('/orcamentostri')) return { status: true, data: res.orcamentos || [] };
    return { status: true, data: res };
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
    return { status: false, message: err.message || "Erro desconhecido", data: [] };
  }
}

/* ---------- CARREGAMENTO DE CATEGORIAS, SUBCATEGORIAS E TAREFAS ---------- */

// Carregamento de usuários para o select de atribuições
async function carregarUsuarios() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/usuarios`);
    todasUsuarios = res.data || res || [];
    preencherSelectUsuarios();
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
    todasUsuarios = [];
  }
}

function preencherSelectUsuarios() {
  const select = document.getElementById("selectUsuario");
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um usuário...</option>';
  todasUsuarios.forEach(user => {
    const option = document.createElement('option');
    option.value = user.idUsuario;
    option.textContent = user.nomeUsuario;
    select.appendChild(option);
  });
}

async function carregarAtribuicoes() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/usuariostarefas`);
    const associacoes = res.associacoes || [];

    // Normalizar a estrutura dos dados
    todasAtribuicoes = associacoes.map((a, index) => ({
      idAtribuicao: index + 1,
      idUsuario: a.usuarios_idUsuario,
      tarefas_idTarefa: a.tarefas_idTarefa,
      statusAtribuicao: a.status || 'pendente'
    }));

    renderizarTabelaAtribuicoes(todasAtribuicoes);
  } catch (error) {
    console.error("Erro ao carregar atribuições:", error);
  }
}

// Renderizar tabela de atribuições
function renderizarTabelaAtribuicoes(atribuicoes) {
  const tbody = document.getElementById("tbodyAtribuicoes");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (atribuicoes.length === 0) {
    const emptyState = document.getElementById("emptyStateAtribuicoes");
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  const emptyState = document.getElementById("emptyStateAtribuicoes");
  if (emptyState) emptyState.style.display = 'none';

  atribuicoes.forEach(atrib => {
    const tr = document.createElement("tr");
    const nomeUsuario = todasUsuarios.find(u => u.idUsuario == atrib.idUsuario)?.nomeUsuario || `Usuário #${atrib.idUsuario}`;
    const tituloTarefa = todasTarefasComTitulo.find(t => t.idTarefa == atrib.tarefas_idTarefa)?.tituloTarefa || `Tarefa #${atrib.tarefas_idTarefa}`;

    tr.innerHTML = `
      <td>${escaparHTML(nomeUsuario)}</td>
      <td>${escaparHTML(tituloTarefa)}</td>
      <td><span class="status-badge">${escaparHTML(atrib.statusAtribuicao || 'Pendente')}</span></td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarAtribuicao(${atrib.idAtribuicao})">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirAtribuicao(${atrib.idAtribuicao})">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  atualizarIconesLucide();
}


// Carregar atribuições com filtros
async function carregarAtribuicoesComFiltros() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/usuariostarefas`);
    const associacoes = res.associacoes || [];

    todasAtribuicoes = associacoes.map((a, index) => ({
      idAtribuicao: index + 1, // ID temporário para manipulação
      idUsuario: a.usuarios_idUsuario,
      tarefas_idTarefa: a.tarefas_idTarefa,
      statusAtribuicao: a.status || 'pendente'
    }));

    console.log("Atribuições carregadas:", todasAtribuicoes);
    aplicarFiltrosAtribuicoes();
  } catch (error) {
    console.error("Erro ao carregar atribuições:", error);
  }
}

function aplicarFiltrosAtribuicoes() {
  let atribuicoesFiltradas = [...todasAtribuicoes];
  const filtros = filtrosAtivos.atribuicoes;

  // Filtro de busca
  if (filtros.busca && filtros.busca.valor) {
    const busca = filtros.busca.valor.toLowerCase();
    atribuicoesFiltradas = atribuicoesFiltradas.filter(item => {
      const usuario = todasUsuarios.find(u => u.idUsuario == item.idUsuario);
      const tarefa = todasTarefasComTitulo.find(t => t.idTarefa == item.tarefas_idTarefa);
      const nomeUsuario = usuario ? usuario.nomeUsuario.toLowerCase() : '';
      const tituloTarefa = tarefa ? tarefa.tituloTarefa.toLowerCase() : '';
      return nomeUsuario.includes(busca) || tituloTarefa.includes(busca);
    });
  }

  // Filtro por usuário
  if (filtros.usuario && filtros.usuario.valor) {
    atribuicoesFiltradas = atribuicoesFiltradas.filter(item =>
      item.idUsuario == filtros.usuario.valor
    );
  }

  // Filtro por tarefa
  if (filtros.tarefa && filtros.tarefa.valor) {
    atribuicoesFiltradas = atribuicoesFiltradas.filter(item =>
      item.tarefas_idTarefa == filtros.tarefa.valor
    );
  }

  // Filtro por status
  if (filtros.status && filtros.status.valor) {
    atribuicoesFiltradas = atribuicoesFiltradas.filter(item =>
      normalizar(item.statusAtribuicao) === normalizar(filtros.status.valor)
    );
  }

  renderizarTabelaAtribuicoes(atribuicoesFiltradas);
}

function adicionarFiltroAtribuicao(tipo) {
  if (!filtrosAtivos.atribuicoes) {
    filtrosAtivos.atribuicoes = {};
  }
  if (filtrosAtivos.atribuicoes[tipo]) {
    exibirToast("Aviso", "Este filtro já está ativo", "error");
    return;
  }
  filtrosAtivos.atribuicoes[tipo] = {};
  renderizarFiltrosAtribuicoes();
  aplicarFiltrosAtribuicoes();
}

function removerFiltroAtribuicao(tipo) {
  delete filtrosAtivos.atribuicoes[tipo];
  renderizarFiltrosAtribuicoes();
  aplicarFiltrosAtribuicoes();
}

function renderizarFiltrosAtribuicoes() {
  const container = document.getElementById("filtrosAtivosAtribuicoes");
  if (!container) return;

  container.innerHTML = '';
  const filtros = filtrosAtivos.atribuicoes;

  Object.keys(filtros).forEach(tipo => {
    const filterItem = document.createElement('div');
    filterItem.className = 'filter-item';

    let content = '';
    let titulo = '';

    switch (tipo) {
      case 'busca':
        titulo = '🔍 Buscar';
        content = `<input type="text" id="filtroAtribuicaoBusca" placeholder="Buscar..." value="${filtros[tipo].valor || ''}" />`;
        break;

      case 'usuario':
        titulo = '👤 Usuário';
        content = `
          <select id="filtroAtribuicaoUsuario">
            <option value="">Todos</option>
            ${todasUsuarios.map(u => `<option value="${u.idUsuario}" ${filtros[tipo].valor == u.idUsuario ? 'selected' : ''}>${u.nomeUsuario}</option>`).join('')}
          </select>
        `;
        break;

      case 'tarefa':
        titulo = '📋 Tarefa';
        content = `
          <select id="filtroAtribuicaoTarefa">
            <option value="">Todos</option>
            ${todasTarefasComTitulo.map(t => `<option value="${t.idTarefa}" ${filtros[tipo].valor == t.idTarefa ? 'selected' : ''}>${t.tituloTarefa}</option>`).join('')}
          </select>
        `;
        break;

      case 'status':
        titulo = '✅ Status';
        content = `
          <select id="filtroAtribuicaoStatus">
            <option value="">Todos</option>
            <option value="pendente" ${filtros[tipo].valor === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="andamento" ${filtros[tipo].valor === 'andamento' ? 'selected' : ''}>Em andamento</option>
            <option value="concluida" ${filtros[tipo].valor === 'concluida' ? 'selected' : ''}>Concluída</option>
          </select>
        `;
        break;

      case 'ordenar':
        titulo = '↕️ Ordenar';
        content = `
          <select id="filtroAtribuicaoOrdenar">
            <option value="usuario-asc" ${filtros[tipo].valor === 'usuario-asc' ? 'selected' : ''}>Usuário (A-Z)</option>
            <option value="usuario-desc" ${filtros[tipo].valor === 'usuario-desc' ? 'selected' : ''}>Usuário (Z-A)</option>
            <option value="tarefa-asc" ${filtros[tipo].valor === 'tarefa-asc' ? 'selected' : ''}>Tarefa (A-Z)</option>
            <option value="tarefa-desc" ${filtros[tipo].valor === 'tarefa-desc' ? 'selected' : ''}>Tarefa (Z-A)</option>
          </select>
        `;
        break;
    }

    filterItem.innerHTML = `
      <div class="filter-item-header">
        <span class="filter-item-title">${titulo}</span>
        <button class="btn-remove-filter" onclick="removerFiltroAtribuicao('${tipo}')">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="filter-item-content">${content}</div>
    `;

    container.appendChild(filterItem);
  });

  atualizarIconesLucide();
  adicionarEventosFiltrosAtribuicoes();
}

function adicionarEventosFiltrosAtribuicoes() {
  const inputBusca = document.getElementById('filtroAtribuicaoBusca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      filtrosAtivos.atribuicoes.busca.valor = e.target.value;
      aplicarFiltrosAtribuicoes();
    });
  }

  const selectUsuario = document.getElementById('filtroAtribuicaoUsuario');
  if (selectUsuario) {
    selectUsuario.addEventListener('change', (e) => {
      filtrosAtivos.atribuicoes.usuario.valor = e.target.value;
      aplicarFiltrosAtribuicoes();
    });
  }

  const selectTarefa = document.getElementById('filtroAtribuicaoTarefa');
  if (selectTarefa) {
    selectTarefa.addEventListener('change', (e) => {
      filtrosAtivos.atribuicoes.tarefa.valor = e.target.value;
      aplicarFiltrosAtribuicoes();
    });
  }

  const selectStatus = document.getElementById('filtroAtribuicaoStatus');
  if (selectStatus) {
    selectStatus.addEventListener('change', (e) => {
      filtrosAtivos.atribuicoes.status.valor = e.target.value;
      aplicarFiltrosAtribuicoes();
    });
  }

  const selectOrdenar = document.getElementById('filtroAtribuicaoOrdenar');
  if (selectOrdenar) {
    selectOrdenar.addEventListener('change', (e) => {
      filtrosAtivos.atribuicoes.ordenar.valor = e.target.value;
      aplicarFiltrosAtribuicoes();
    });
  }
}

function limparFiltrosAtribuicoes() {
  filtrosAtivos.atribuicoes = {};
  filtrosAtivos.orcamentosAnuais = {};
  filtrosAtivos.orcamentosTri = {};
  filtrosAtivos.produtos = {};
  filtrosAtivos.indices = {};
  filtrosAtivos.extratos = {};
  filtrosAtivos.lancamentos = {};
  filtrosAtivos.tarefas = {};
  filtrosAtivos.atribuicoes = {};
  renderizarFiltrosAtribuicoes();
  aplicarFiltrosAtribuicoes();
}

// CRUD de atribuições
async function salvarAtribuicao(ev) {
  ev.preventDefault();

  const idUsuario = document.getElementById("selectUsuario").value;
  const idTarefa = document.getElementById("selectTarefa").value;
  const status = document.getElementById("selectStatusAtribuicao").value;

  if (!idUsuario || !idTarefa) {
    mostrarRespostaPopup("Selecione usuário e tarefa!", false);
    return;
  }

  const dados = {
    idUsuario: parseInt(idUsuario),
    tarefas_idTarefa: parseInt(idTarefa),
    statusAtribuicao: status
  };

  try {
    await fetchWithAuth(`${baseUrl}/usuariostarefas`, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    exibirToast("Sucesso", "Atribuição criada com sucesso!");
    document.getElementById("modalAtribuicao").classList.add("oculto");
    document.getElementById("formAtribuicao").reset();
    await carregarAtribuicoesComFiltros();
  } catch (err) {
    console.error("Erro ao salvar atribuição:", err);
    exibirToast("Erro", "Falha ao salvar atribuição", "error");
  }
}

async function editarAtribuicao(id) {
  const atribuicao = todasAtribuicoes.find(a => a.idAtribuicao === id);
  if (!atribuicao) return;

  document.getElementById("selectUsuario").value = atribuicao.idUsuario;
  document.getElementById("selectTarefa").value = atribuicao.tarefas_idTarefa;
  document.getElementById("selectStatusAtribuicao").value = atribuicao.statusAtribuicao;

  document.getElementById("modalTituloAtribuicao").textContent = "Editar Atribuição";
  document.getElementById("modalAtribuicao").classList.remove("oculto");
}

async function excluirAtribuicao(id) {
  mostrarModalConfirmacao("Deseja excluir esta atribuição?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/usuariostarefas/${id}`, {
        method: "DELETE"
      });
      exibirToast("Sucesso", "Atribuição excluída com sucesso!");
      await carregarAtribuicoesComFiltros();
    } catch (erro) {
      console.error("Erro:", erro);
      exibirToast("Erro", "Falha ao excluir atribuição", "error");
    }
  });
}

function abrirModalCriarOrcamentoAnual() {
  const form = document.getElementById("formOrcamentoAnual");
  if (form) form.reset();

  document.getElementById("idOrcamentoAnual").value = "";
  document.getElementById("tituloModalOrcamentoAnual").textContent = "Novo Orçamento Anual";

  preencherSelectCategorias("idCategoriaOrcamentoAnual");

  if (elements.modais.orcamentoAnual) {
    elements.modais.orcamentoAnual.classList.remove("oculto");
  }
}

// Fechar modal
function fecharModalOrcamentoAnual() {
  if (elements.modais.orcamentoAnual) {
    elements.modais.orcamentoAnual.classList.add("oculto");
  }
}

// Editar
async function editarOrcamentoAnual(id) {
  const orcamento = todosOrcamentosAnuais.find(o => o.idOrcamentoAnual === id);
  if (!orcamento) {
    mostrarRespostaPopup("Orçamento anual não encontrado.", false);
    return;
  }

  document.getElementById("idOrcamentoAnual").value = orcamento.idOrcamentoAnual;
  document.getElementById("valorOrcamentoAnual").value = orcamento.valorOrcamentoAnual || "";
  document.getElementById("anoOrcamentoAnual").value = orcamento.anoOrcamentoAnual || "";

  preencherSelectCategorias("idCategoriaOrcamentoAnual");
  document.getElementById("idCategoriaOrcamentoAnual").value = orcamento.idCategoria || "";

  document.getElementById("tituloModalOrcamentoAnual").textContent = "Editar Orçamento Anual";

  if (elements.modais.orcamentoAnual) {
    elements.modais.orcamentoAnual.classList.remove("oculto");
  }
}

// Salvar
async function salvarOrcamentoAnual(ev) {
  ev.preventDefault();

  const id = document.getElementById("idOrcamentoAnual").value;
  const dados = {
    valorOrcamentoAnual: parseFloat(document.getElementById("valorOrcamentoAnual").value || 0),
    anoOrcamentoAnual: parseInt(document.getElementById("anoOrcamentoAnual").value) || new Date().getFullYear(),
    idCategoria: parseInt(document.getElementById("idCategoriaOrcamentoAnual").value) || null
  };

  const url = id ? `${baseUrl}/orcamentosanuais/${id}` : `${baseUrl}/orcamentosanuais`;
  const method = id ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, { method, body: JSON.stringify(dados) });
    mostrarRespostaPopup("Orçamento anual salvo com sucesso!", true);
    fecharModalOrcamentoAnual();
    await carregarOrcamentosAnuais();
  } catch (err) {
    console.error("Erro ao salvar orçamento anual:", err);
    mostrarRespostaPopup("Erro ao salvar orçamento anual: " + err.message, false);
  }
}

// Excluir
async function excluirOrcamentoAnual(id) {
  mostrarModalConfirmacao("Excluir orçamento anual?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/orcamentosanuais/${id}`, { method: "DELETE" });
      mostrarRespostaPopup("Orçamento anual excluído com sucesso.", true);
      await carregarOrcamentosAnuais();
    } catch (err) {
      console.error("Erro ao excluir orçamento anual:", err);
      mostrarRespostaPopup("Erro ao excluir orçamento anual.", false);
    }
  });
}

// Carregar
async function carregarOrcamentosAnuais() {
  try {
    const res = await fetchData(`${baseUrl}/orcamentosanuais`);
    todosOrcamentosAnuais = Array.isArray(res.data) ? res.data : [];
    console.log(`Orçamentos anuais carregados: ${todosOrcamentosAnuais.length}`);
    aplicarFiltros('orcamentosAnuais');
    gerarGraficoOrcamentosAnuais();
  } catch (error) {
    console.error("Erro ao carregar orçamentos anuais:", error);
    todosOrcamentosAnuais = [];
    mostrarRespostaPopup("Erro ao carregar orçamentos anuais", false);
  }
}
// Renderizar tabela
function renderizarTabelaOrcamentosAnuais(orcamentosParaRenderizar) {
  if (!elements.tbodyOrcamentosAnuais) {
    console.error("Tbody orçamentos anuais não encontrado!");
    return;
  }

  const orcamentos = orcamentosParaRenderizar || todosOrcamentosAnuais;
  elements.tbodyOrcamentosAnuais.innerHTML = "";

  if (orcamentos.length === 0) {
    elements.tbodyOrcamentosAnuais.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">Nenhum orçamento anual encontrado.</td></tr>';
    return;
  }

  orcamentos.forEach(o => {
    const tr = document.createElement("tr");
    const nomeCategoria = obterNomeCategoria(o.idCategoria);

    tr.innerHTML = `
      <td><strong>${o.anoOrcamentoAnual || '-'}</strong></td>
      <td><strong>R$ ${parseFloat(o.valorOrcamentoAnual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${escaparHTML(nomeCategoria)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarOrcamentoAnual(${o.idOrcamentoAnual})">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirOrcamentoAnual(${o.idOrcamentoAnual})">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    elements.tbodyOrcamentosAnuais.appendChild(tr);
  });

  atualizarIconesLucide();
}

// Gráfico
function gerarGraficoOrcamentosAnuais() {
  const ctx = document.getElementById("graficoOrcamentosAnuais");
  if (!ctx) return;

  if (graficoInstances.orcamentosAnuais) {
    graficoInstances.orcamentosAnuais.destroy();
  }

  // Garantir que todosOrcamentosAnuais é um array
  if (!Array.isArray(todosOrcamentosAnuais) || todosOrcamentosAnuais.length === 0) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  const labels = todosOrcamentosAnuais.map(o => o.anoOrcamentoAnual || 'S/A');
  const data = todosOrcamentosAnuais.map(o => parseFloat(o.valorOrcamentoAnual || 0));

  graficoInstances.orcamentosAnuais = new Chart(ctx.getContext("2d"), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor Orçado',
        data,
        backgroundColor: 'hsla(142, 69%, 58%, 0.8)',
        borderColor: 'hsl(142, 69%, 48%)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          callbacks: {
            label: function (context) {
              return `Orçamento: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { maxRotation: 45 } },
        y: {
          beginAtZero: true,
          ticks: { callback: value => `R$ ${value.toLocaleString('pt-BR')}` }
        }
      }
    }
  });
}

// ========================================
// FUNÇÕES PARA ORÇAMENTO TRIMESTRAL
// ========================================

// Abrir modal criar
function abrirModalCriarOrcamentoTri() {
  const form = document.getElementById("formOrcamentoTri");
  if (form) form.reset();

  document.getElementById("idOrcamentoTri").value = "";
  document.getElementById("tituloModalOrcamentoTri").textContent = "Novo Orçamento Trimestral";

  preencherSelectOrcamentosAnuais("idOrcamentoAnualRef");
  preencherSelectCategorias("idCategoriaOrcamentoTri");

  if (elements.modais.orcamentoTri) {
    elements.modais.orcamentoTri.classList.remove("oculto");
  }
}

// Fechar modal
function fecharModalOrcamentoTri() {
  if (elements.modais.orcamentoTri) {
    elements.modais.orcamentoTri.classList.add("oculto");
  }
}

// Preencher select de orçamentos anuais
function preencherSelectOrcamentosAnuais(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`Select ${selectId} não encontrado!`);
    return;
  }

  select.innerHTML = '<option value="">Selecione um orçamento anual...</option>';
  todosOrcamentosAnuais.forEach(orc => {
    const option = document.createElement('option');
    option.value = orc.idOrcamentoAnual;
    option.textContent = `${orc.anoOrcamentoAnual} - R$ ${parseFloat(orc.valorOrcamentoAnual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    select.appendChild(option);
  });
}

// Editar
async function editarOrcamentoTri(id) {
  const orcamento = todosOrcamentosTri.find(o => o.idOrcamentoTri === id);
  if (!orcamento) {
    mostrarRespostaPopup("Orçamento trimestral não encontrado.", false);
    return;
  }

  document.getElementById("idOrcamentoTri").value = orcamento.idOrcamentoTri;
  document.getElementById("valorOrcamentoTri").value = orcamento.valorOrcamentoTri || "";
  document.getElementById("trimestreOrcamentoTri").value = orcamento.trimestreOrcamentoTri || "";

  preencherSelectOrcamentosAnuais("idOrcamentoAnualRef");
  document.getElementById("idOrcamentoAnualRef").value = orcamento.idOrcamentoAnual || "";

  preencherSelectCategorias("idCategoriaOrcamentoTri");
  document.getElementById("idCategoriaOrcamentoTri").value = orcamento.idCategoria || "";

  document.getElementById("tituloModalOrcamentoTri").textContent = "Editar Orçamento Trimestral";

  if (elements.modais.orcamentoTri) {
    elements.modais.orcamentoTri.classList.remove("oculto");
  }
}

// Salvar
async function salvarOrcamentoTri(ev) {
  ev.preventDefault();

  const id = document.getElementById("idOrcamentoTri").value;
  const dados = {
    valorOrcamentoTri: parseFloat(document.getElementById("valorOrcamentoTri").value || 0),
    trimestreOrcamentoTri: parseInt(document.getElementById("trimestreOrcamentoTri").value) || 1,
    idOrcamentoAnual: parseInt(document.getElementById("idOrcamentoAnualRef").value) || null,
    idCategoria: parseInt(document.getElementById("idCategoriaOrcamentoTri").value) || null
  };

  const url = id ? `${baseUrl}/orcamentostri/${id}` : `${baseUrl}/orcamentostri`;
  const method = id ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, { method, body: JSON.stringify(dados) });
    mostrarRespostaPopup("Orçamento trimestral salvo com sucesso!", true);
    fecharModalOrcamentoTri();
    await carregarOrcamentosTri();
  } catch (err) {
    console.error("Erro ao salvar orçamento trimestral:", err);
    mostrarRespostaPopup("Erro ao salvar orçamento trimestral: " + err.message, false);
  }
}

// Excluir
async function excluirOrcamentoTri(id) {
  mostrarModalConfirmacao("Excluir orçamento trimestral?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/orcamentostri/${id}`, { method: "DELETE" });
      mostrarRespostaPopup("Orçamento trimestral excluído com sucesso.", true);
      await carregarOrcamentosTri();
    } catch (err) {
      console.error("Erro ao excluir orçamento trimestral:", err);
      mostrarRespostaPopup("Erro ao excluir orçamento trimestral.", false);
    }
  });
}

// Carregar
async function carregarOrcamentosTri() {
  try {
    const res = await fetchData(`${baseUrl}/orcamentostri`);
    todosOrcamentosTri = Array.isArray(res.data) ? res.data : [];
    console.log(`Orçamentos trimestrais carregados: ${todosOrcamentosTri.length}`);
    aplicarFiltros('orcamentosTri');
    gerarGraficoOrcamentosTri();
  } catch (error) {
    console.error("Erro ao carregar orçamentos trimestrais:", error);
    todosOrcamentosTri = [];
    mostrarRespostaPopup("Erro ao carregar orçamentos trimestrais", false);
  }
}
// Função auxiliar para obter ano do orçamento anual
function obterAnoOrcamentoAnual(idOrcamentoAnual) {
  if (!idOrcamentoAnual) return '-';
  const orc = todosOrcamentosAnuais.find(o => o.idOrcamentoAnual == idOrcamentoAnual);
  return orc ? orc.anoOrcamentoAnual : `Orçamento #${idOrcamentoAnual}`;
}

// Renderizar tabela
function renderizarTabelaOrcamentosTri(orcamentosParaRenderizar) {
  if (!elements.tbodyOrcamentosTri) {
    console.error("Tbody orçamentos trimestrais não encontrado!");
    return;
  }

  const orcamentos = orcamentosParaRenderizar || todosOrcamentosTri;
  elements.tbodyOrcamentosTri.innerHTML = "";

  if (orcamentos.length === 0) {
    elements.tbodyOrcamentosTri.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum orçamento trimestral encontrado.</td></tr>';
    return;
  }

  orcamentos.forEach(o => {
    const tr = document.createElement("tr");
    const nomeCategoria = obterNomeCategoria(o.idCategoria);
    const anoOrcamento = obterAnoOrcamentoAnual(o.idOrcamentoAnual);

    tr.innerHTML = `
      <td><strong>${anoOrcamento}</strong></td>
      <td><strong>${o.trimestreOrcamentoTri}º Trimestre</strong></td>
      <td><strong>R$ ${parseFloat(o.valorOrcamentoTri || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${escaparHTML(nomeCategoria)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarOrcamentoTri(${o.idOrcamentoTri})">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirOrcamentoTri(${o.idOrcamentoTri})">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    elements.tbodyOrcamentosTri.appendChild(tr);
  });

  atualizarIconesLucide();
}

// Gráfico
function gerarGraficoOrcamentosTri() {
  const ctx = document.getElementById("graficoOrcamentosTri");
  if (!ctx) return;

  if (graficoInstances.orcamentosTri) {
    graficoInstances.orcamentosTri.destroy();
  }

  // Garantir que todosOrcamentosTri é um array
  if (!Array.isArray(todosOrcamentosTri) || todosOrcamentosTri.length === 0) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  const labels = todosOrcamentosTri.map(o => `${obterAnoOrcamentoAnual(o.idOrcamentoAnual)} - T${o.trimestreOrcamentoTri}`);
  const data = todosOrcamentosTri.map(o => parseFloat(o.valorOrcamentoTri || 0));

  graficoInstances.orcamentosTri = new Chart(ctx.getContext("2d"), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor Orçado',
        data,
        backgroundColor: 'hsla(230, 75%, 58%, 0.8)',
        borderColor: 'hsl(230, 75%, 48%)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          callbacks: {
            label: function (context) {
              return `Orçamento: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { maxRotation: 45 } },
        y: {
          beginAtZero: true,
          ticks: { callback: value => `R$ ${value.toLocaleString('pt-BR')}` }
        }
      }
    }
  });
}
async function carregarCategorias() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/categorias`);
    todasCategorias = res.data || [];
    console.log("Categorias carregadas:", todasCategorias);
  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
    todasCategorias = [];
  }
}

async function carregarSubcategorias() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/subcategorias`);
    todasSubcategorias = res.data || [];
    console.log("Subcategorias carregadas:", todasSubcategorias);
  } catch (err) {
    console.error("Erro ao carregar subcategorias:", err);
    todasSubcategorias = [];
  }
}

async function carregarTarefasComTitulo() {
  try {
    // Se já há tarefas carregadas (cache), use-as para criar o mapeamento
    if (Array.isArray(todasAsTarefas) && todasAsTarefas.length > 0) {
      todasTarefasComTitulo = todasAsTarefas.map(t => ({
        idTarefa: t.idTarefa || t.id || t.tarefas_idTarefa,
        tituloTarefa: t.tituloTarefa || t.titulo || t.nomeTarefa || 'Sem título'
      }));
      console.log("Tarefas com título (a partir do cache) carregadas:", todasTarefasComTitulo.length);
      return;
    }

    const res = await fetchWithAuth(`${baseUrl}/tarefas`);
    const fetched = (res && (res.tarefas || res.data)) ? (res.tarefas || res.data) : (Array.isArray(res) ? res : []);
    todasTarefasComTitulo = fetched.map(t => ({
      idTarefa: t.idTarefa || t.id || t.tarefas_idTarefa,
      tituloTarefa: t.tituloTarefa || t.titulo || t.nomeTarefa || 'Sem título'
    }));

    console.log("Tarefas com título (fetch) carregadas:", todasTarefasComTitulo.length);
  } catch (err) {
    console.error("Erro ao carregar tarefas com título:", err);
    todasTarefasComTitulo = [];
  }
}



// Carrega segmentos com suporte a diferentes formatos de resposta e logs
async function carregarSegmentos() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/segmentos`);
    // aceita res.data, res.segmentos ou res diretamente
    todosSegmentos = (res && (res.data || res.segmentos)) ? (res.data || res.segmentos) : (Array.isArray(res) ? res : []);
    console.log("Segmentos carregados:", todosSegmentos.length, todosSegmentos);
  } catch (err) {
    console.error("Erro ao carregar segmentos:", err);
    todosSegmentos = [];
  }
}

// Carrega subsegmentos com suporte a diferentes formatos de resposta e logs
async function carregarSubsegmentos() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/subsegmentos`);
    todosSubsegmentos = (res && (res.data || res.subsegmentos)) ? (res.data || res.subsegmentos) : (Array.isArray(res) ? res : []);
    console.log("Subsegmentos carregados:", todosSubsegmentos.length, todosSubsegmentos);
  } catch (err) {
    console.error("Erro ao carregar subsegmentos:", err);
    todosSubsegmentos = [];
  }
}

// Helpers para obter nome do segmento / subsegmento a partir do id
function obterNomeSegmento(idSegmento) {
  if (!idSegmento) return '-';
  const seg = todosSegmentos.find(s => String(s.idSegmento) === String(idSegmento) || String(s.id) === String(idSegmento));
  return seg ? (seg.nomeSegmento || seg.titulo || seg.nome || `Segmento #${idSegmento}`) : `Segmento #${idSegmento}`;
}

function obterNomeSubsegmento(idSubsegmento) {
  if (!idSubsegmento) return '-';
  const sub = todosSubsegmentos.find(s => String(s.idSubsegmento) === String(idSubsegmento) || String(s.id) === String(idSubsegmento));
  return sub ? (sub.nomeSubsegmento || sub.titulo || sub.nome || `Subsegmento #${idSubsegmento}`) : `Subsegmento #${idSubsegmento}`;
}


/* ---------- PREENCHIMENTO DE SELECTS ---------- */
function preencherSelectCategorias(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Selecione uma categoria...</option>';

  todasCategorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.idCategoria;
    option.textContent = cat.nomeCategoria;
    select.appendChild(option);
  });
}

function preencherSelectSubcategorias(selectId, idCategoriaFiltro = null) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Selecione uma subcategoria...</option>';

  const subcategoriasFiltradas = idCategoriaFiltro
    ? todasSubcategorias.filter(sub => sub.idCategoria == idCategoriaFiltro)
    : todasSubcategorias;

  subcategoriasFiltradas.forEach(subcat => {
    const option = document.createElement('option');
    option.value = subcat.idSubcategoria;
    option.textContent = subcat.nomeSubcategoria;
    select.appendChild(option);
  });
}

function preencherSelectSegmentos(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um segmento...</option>';

  todosSegmentos.forEach(seg => {
    const option = document.createElement('option');
    option.value = seg.idSegmento;
    option.textContent = seg.nomeSegmento;
    select.appendChild(option);
  });
}

function preencherSelectSubsegmentos(selectId, idSegmentoFiltro = null) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um subsegmento...</option>';

  const subsegmentosFiltrados = idSegmentoFiltro
    ? todosSubsegmentos.filter(sub => sub.idSegmento == idSegmentoFiltro)
    : todosSubsegmentos;

  subsegmentosFiltrados.forEach(subseg => {
    const option = document.createElement('option');
    option.value = subseg.idSubsegmento;
    option.textContent = subseg.nomeSubsegmento;
    select.appendChild(option);
  });
}

function preencherSelectTarefas(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Selecione uma tarefa...</option>';

  todasTarefasComTitulo.forEach(tarefa => {
    const option = document.createElement('option');
    option.value = tarefa.idTarefa;
    option.textContent = tarefa.tituloTarefa;
    select.appendChild(option);
  });
}

function preencherSelectProdutos(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`Select ${selectId} não encontrado!`);
    return;
  }

  select.innerHTML = '<option value="">Selecione um produto...</option>';

  console.log(`Preenchendo select ${selectId} com ${todosProdutos.length} produtos`);

  todosProdutos.forEach(prod => {
    const option = document.createElement('option');
    option.value = prod.idProduto;
    option.textContent = `${prod.nomeProduto} (R$ ${parseFloat(prod.custoProduto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
    select.appendChild(option);
  });
}

function configurarListenersCategoriaSubcategoria() {
  const selectCategoriaLancamento = document.getElementById("categoriaLancamento");
  const selectSubcategoriaLancamento = document.getElementById("subcategoriaLancamento");

  if (selectCategoriaLancamento && selectSubcategoriaLancamento) {
    selectCategoriaLancamento.addEventListener("change", (e) => {
      const idCategoria = e.target.value;
      preencherSelectSubcategorias("subcategoriaLancamento", idCategoria || null);
    });
  }

  const selectCategoriaExtrato = document.getElementById("idCategoriaExtrato");
  const selectSubcategoriaExtrato = document.getElementById("idSubcategoriaExtrato");

  if (selectCategoriaExtrato && selectSubcategoriaExtrato) {
    selectCategoriaExtrato.addEventListener("change", (e) => {
      const idCategoria = e.target.value;
      preencherSelectSubcategorias("idSubcategoriaExtrato", idCategoria || null);
    });
  }
}

function configurarListenersSegmentoSubsegmento() {
  const selectSegmentoProduto = document.getElementById("idSegmentoProduto");
  const selectSubsegmentoProduto = document.getElementById("idSubsegmentoProduto");

  if (selectSegmentoProduto && selectSubsegmentoProduto) {
    selectSegmentoProduto.addEventListener("change", (e) => {
      const idSegmento = e.target.value;
      preencherSelectSubsegmentos("idSubsegmentoProduto", idSegmento || null);
    });
  }

  const selectSubsegmentoIndice = document.getElementById("idSubsegmentoIndice");
  if (selectSubsegmentoIndice) {
    selectSubsegmentoIndice.addEventListener("change", (e) => {
      const idSegmento = e.target.value;
      preencherSelectSubsegmentos("idSubsegmentoIndice", idSegmento || null);
    });
  }
}

/* ---------- SISTEMA DE FILTROS PARA TAREFAS ---------- */
function adicionarFiltroTarefa(tipo) {
  if (filtrosTarefasAtivos[tipo]) {
    exibirToast("Aviso", "Este filtro já está ativo", "error");
    return;
  }

  filtrosTarefasAtivos[tipo] = {};
  renderizarFiltrosTarefas();
  aplicarFiltrosTarefas();
}

function removerFiltroTarefa(tipo) {
  delete filtrosTarefasAtivos[tipo];
  renderizarFiltrosTarefas();
  aplicarFiltrosTarefas();
}

function renderizarFiltrosTarefas() {
  filtrosAtivosTarefas.innerHTML = '';

  Object.keys(filtrosTarefasAtivos).forEach(tipo => {
    const filterItem = document.createElement('div');
    filterItem.className = 'filter-item';

    let content = '';
    let titulo = '';

    switch (tipo) {
      case 'busca':
        titulo = '🔍 Buscar';
        content = `
          <input type="text" 
                 id="filtroTarefasBusca" 
                 placeholder="Buscar por título ou descrição..." 
                 value="${filtrosTarefasAtivos[tipo].valor || ''}" />
        `;
        break;

      case 'prioridade':
        titulo = '🚩 Prioridade';
        content = `
          <select id="filtroTarefasPrioridade">
            <option value="">Todas</option>
            <option value="Baixa" ${filtrosTarefasAtivos[tipo].valor === 'Baixa' ? 'selected' : ''}>Baixa</option>
            <option value="Média" ${filtrosTarefasAtivos[tipo].valor === 'Média' ? 'selected' : ''}>Média</option>
            <option value="Alta" ${filtrosTarefasAtivos[tipo].valor === 'Alta' ? 'selected' : ''}>Alta</option>
          </select>
        `;
        break;

      case 'data':
        titulo = '📅 Data';
        content = `
          <div class="filter-date-range">
            <div class="filter-date-group">
              <label>Data Início (De)</label>
              <input type="date" id="filtroTarefasDataInicioDe" value="${filtrosTarefasAtivos[tipo].dataInicioDe || ''}" />
            </div>
            <div class="filter-date-group">
              <label>Data Início (Até)</label>
              <input type="date" id="filtroTarefasDataInicioAte" value="${filtrosTarefasAtivos[tipo].dataInicioAte || ''}" />
            </div>
            <div class="filter-date-group">
              <label>Data Fim (De)</label>
              <input type="date" id="filtroTarefasDataFimDe" value="${filtrosTarefasAtivos[tipo].dataFimDe || ''}" />
            </div>
            <div class="filter-date-group">
              <label>Data Fim (Até)</label>
              <input type="date" id="filtroTarefasDataFimAte" value="${filtrosTarefasAtivos[tipo].dataFimAte || ''}" />
            </div>
          </div>
        `;
        break;

      case 'ordenar':
        titulo = '↕️ Ordenar';
        content = `
          <select id="filtroTarefasOrdenar">
            <option value="id-asc" ${filtrosTarefasAtivos[tipo].valor === 'id-asc' ? 'selected' : ''}>ID (Crescente)</option>
            <option value="id-desc" ${filtrosTarefasAtivos[tipo].valor === 'id-desc' ? 'selected' : ''}>ID (Decrescente)</option>
            <option value="titulo-asc" ${filtrosTarefasAtivos[tipo].valor === 'titulo-asc' ? 'selected' : ''}>Título (A-Z)</option>
            <option value="titulo-desc" ${filtrosTarefasAtivos[tipo].valor === 'titulo-desc' ? 'selected' : ''}>Título (Z-A)</option>
            <option value="prioridade-desc" ${filtrosTarefasAtivos[tipo].valor === 'prioridade-desc' ? 'selected' : ''}>Prioridade (Alta → Baixa)</option>
            <option value="prioridade-asc" ${filtrosTarefasAtivos[tipo].valor === 'prioridade-asc' ? 'selected' : ''}>Prioridade (Baixa → Alta)</option>
            <option value="dataInicio-asc" ${filtrosTarefasAtivos[tipo].valor === 'dataInicio-asc' ? 'selected' : ''}>Data Início (Mais antiga)</option>
            <option value="dataInicio-desc" ${filtrosTarefasAtivos[tipo].valor === 'dataInicio-desc' ? 'selected' : ''}>Data Início (Mais recente)</option>
            <option value="dataFim-asc" ${filtrosTarefasAtivos[tipo].valor === 'dataFim-asc' ? 'selected' : ''}>Data Fim (Mais antiga)</option>
            <option value="dataFim-desc" ${filtrosTarefasAtivos[tipo].valor === 'dataFim-desc' ? 'selected' : ''}>Data Fim (Mais recente)</option>
          </select>
        `;
        break;
    }

    filterItem.innerHTML = `
      <div class="filter-item-header">
        <span class="filter-item-title">${titulo}</span>
        <button class="btn-remove-filter" onclick="removerFiltroTarefa('${tipo}')">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="filter-item-content">
        ${content}
      </div>
    `;

    filtrosAtivosTarefas.appendChild(filterItem);
  });

  atualizarIconesLucide();
  adicionarEventosFiltrosTarefas();
}

function adicionarEventosFiltrosTarefas() {
  const inputBusca = document.getElementById('filtroTarefasBusca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      filtrosTarefasAtivos.busca.valor = e.target.value;
      aplicarFiltrosTarefas();
    });
  }

  const selectPrioridade = document.getElementById('filtroTarefasPrioridade');
  if (selectPrioridade) {
    selectPrioridade.addEventListener('change', (e) => {
      filtrosTarefasAtivos.prioridade.valor = e.target.value;
      aplicarFiltrosTarefas();
    });
  }

  const selectOrdenar = document.getElementById('filtroTarefasOrdenar');
  if (selectOrdenar) {
    selectOrdenar.addEventListener('change', (e) => {
      filtrosTarefasAtivos.ordenar.valor = e.target.value;
      aplicarFiltrosTarefas();
    });
  }

  ['dataInicioDe', 'dataInicioAte', 'dataFimDe', 'dataFimAte'].forEach(campo => {
    const input = document.getElementById(`filtroTarefas${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
    if (input) {
      input.addEventListener('change', (e) => {
        filtrosTarefasAtivos.data = filtrosTarefasAtivos.data || {};
        filtrosTarefasAtivos.data[campo] = e.target.value;
        aplicarFiltrosTarefas();
      });
    }
  });
}

function aplicarFiltrosTarefas() {
  let tarefasFiltradas = [...todasAsTarefas];

  // Aplicar filtro de busca
  if (filtrosTarefasAtivos.busca) {
    const busca = (filtrosTarefasAtivos.busca.valor || '').toLowerCase().trim();
    if (busca) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        t.tituloTarefa.toLowerCase().includes(busca) ||
        (t.descricaoTarefa && t.descricaoTarefa.toLowerCase().includes(busca))
      );
    }
  }

  // Aplicar filtro de prioridade
  if (filtrosTarefasAtivos.prioridade && filtrosTarefasAtivos.prioridade.valor) {
    tarefasFiltradas = tarefasFiltradas.filter(t =>
      t.prioridadeTarefa === filtrosTarefasAtivos.prioridade.valor
    );
  }

  // Aplicar filtro de data
  if (filtrosTarefasAtivos.data) {
    const { dataInicioDe, dataInicioAte, dataFimDe, dataFimAte } = filtrosTarefasAtivos.data;

    if (dataInicioDe) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.dataInicio) >= new Date(dataInicioDe)
      );
    }
    if (dataInicioAte) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.dataInicio) <= new Date(dataInicioAte)
      );
    }
    if (dataFimDe) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.dataFim) >= new Date(dataFimDe)
      );
    }
    if (dataFimAte) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.dataFim) <= new Date(dataFimAte)
      );
    }
  }

  if (filtrosTarefasAtivos.ordenar) {
    ordenarTarefas(tarefasFiltradas, filtrosTarefasAtivos.ordenar.valor || 'id-asc');
  }

  renderizarTabelaTarefas(tarefasFiltradas);
}

function ordenarTarefas(tarefas, criterio) {
  const prioridadeValor = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };

  switch (criterio) {
    case 'id-asc':
      tarefas.sort((a, b) => a.idTarefa - b.idTarefa);
      break;
    case 'id-desc':
      tarefas.sort((a, b) => b.idTarefa - a.idTarefa);
      break;
    case 'titulo-asc':
      tarefas.sort((a, b) => a.tituloTarefa.localeCompare(b.tituloTarefa));
      break;
    case 'titulo-desc':
      tarefas.sort((a, b) => b.tituloTarefa.localeCompare(a.tituloTarefa));
      break;
    case 'prioridade-desc':
      tarefas.sort((a, b) => (prioridadeValor[b.prioridadeTarefa] || 0) - (prioridadeValor[a.prioridadeTarefa] || 0));
      break;
    case 'prioridade-asc':
      tarefas.sort((a, b) => (prioridadeValor[a.prioridadeTarefa] || 0) - (prioridadeValor[b.prioridadeTarefa] || 0));
      break;
    case 'dataInicio-asc':
      tarefas.sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
      break;
    case 'dataInicio-desc':
      tarefas.sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
      break;
    case 'dataFim-asc':
      tarefas.sort((a, b) => new Date(a.dataFim) - new Date(b.dataFim));
      break;
    case 'dataFim-desc':
      tarefas.sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim));
      break;
  }
}

function limparFiltrosTarefas() {
  filtrosTarefasAtivos = {};
  renderizarFiltrosTarefas();
  aplicarFiltrosTarefas();
}

/* ---------- MODAIS E FUNÇÕES DE CONFIRMAÇÃO ---------- */
function mostrarModalConfirmacao(texto, onConfirmar) {
  if (modalConfirmacao && textoModalConfirmacao && btnConfirmarAcao && btnCancelarAcao) {
    textoModalConfirmacao.textContent = texto;
    modalConfirmacao.classList.remove("oculto");

    btnConfirmarAcao.onclick = () => {
      modalConfirmacao.classList.add("oculto");
      onConfirmar();
    };

    btnCancelarAcao.onclick = () => {
      modalConfirmacao.classList.add("oculto");
    };
  }
}

/* ---------- RENDERIZAÇÃO DE TABELA DE TAREFAS ---------- */
function renderizarTabelaTarefas(tarefas) {
  if (!elements.tbodyTarefas) return;

  elements.tbodyTarefas.innerHTML = '';
  const emptyState = document.getElementById('emptyStateTarefas');

  if (tarefas.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tarefas.forEach(tarefa => {
    const tr = document.createElement('tr');

    const prioridadeClass = normalizar(tarefa.prioridadeTarefa);
    const prioridadeBadge = `
      <span class="priority-badge ${prioridadeClass}">
        <i data-lucide="flag" class="priority-flag"></i>
        ${escaparHTML(tarefa.prioridadeTarefa)}
      </span>
    `;

    tr.innerHTML = `
      <td>${tarefa.idTarefa}</td>
      <td>${escaparHTML(tarefa.tituloTarefa)}</td>
      <td>${escaparHTML(tarefa.descricaoTarefa || 'N/A')}</td>
      <td>${prioridadeBadge}</td>
      <td>${formatarData(tarefa.dataInicio)}</td>
      <td>${formatarData(tarefa.dataFim)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit editar" data-id="${tarefa.idTarefa}">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-action btn-delete excluir" data-id="${tarefa.idTarefa}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;

    elements.tbodyTarefas.appendChild(tr);
  });

  atualizarIconesLucide();
  adicionarEventosAcoesTarefas();
}

/* ---------- EVENTOS DE AÇÕES NAS TABELAS ---------- */
function adicionarEventosAcoesTarefas() {
  document.querySelectorAll('.editar').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      editarTarefa(id);
    });
  });

  document.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      excluirTarefa(id);
    });
  });
}

/* ---------- CRUD DE TAREFAS ---------- */
async function carregarTarefas() {
  try {
    const data = await fetchWithAuth(`${baseUrl}/tarefas`);
    todasAsTarefas = data.tarefas || [];
    aplicarFiltrosTarefas(); // This now renders the table
  } catch (erro) {
    console.error('Erro ao carregar tarefas:', erro);
    mostrarRespostaPopup('Erro ao carregar tarefas: ' + erro.message, false);
  }
}
async function salvarTarefa(e) {
  e.preventDefault();

  const tarefa = {
    tituloTarefa: inputTituloTarefa.value.trim(),
    descricaoTarefa: inputDescricaoTarefa.value.trim(),
    prioridadeTarefa: selectPrioridadeTarefa.value,
    dataInicio: inputDataInicio.value,
    dataFim: inputDataFim.value,
  };

  const idTarefa = inputIdTarefa.value;
  const url = idTarefa
    ? `${baseUrl}/tarefas/${idTarefa}`
    : `${baseUrl}/tarefas`;
  const metodo = idTarefa ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, {
      method: metodo,
      body: JSON.stringify(tarefa)
    });

    exibirToast("Sucesso", `Tarefa ${idTarefa ? 'atualizada' : 'criada'} com sucesso!`);
    modalTarefa.classList.add("oculto");
    formTarefa.reset();
    await carregarTarefas();
    await carregarTarefasComTitulo();
  } catch (erro) {
    console.error("Erro:", erro);
    exibirToast("Erro", "Falha ao salvar tarefa", "error");
  }
}

function editarTarefa(id) {
  const tarefa = todasAsTarefas.find(t => t.idTarefa === id);
  if (!tarefa) return;

  inputIdTarefa.value = tarefa.idTarefa;
  inputTituloTarefa.value = tarefa.tituloTarefa;
  inputDescricaoTarefa.value = tarefa.descricaoTarefa || '';
  selectPrioridadeTarefa.value = tarefa.prioridadeTarefa;
  inputDataInicio.value = tarefa.dataInicio.split('T')[0];
  inputDataFim.value = tarefa.dataFim.split('T')[0];

  modalTituloTarefa.textContent = "Editar Tarefa";
  modalTarefa.classList.remove("oculto");
}

function excluirTarefa(id) {
  mostrarModalConfirmacao("Deseja realmente excluir esta tarefa?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/tarefas/${id}`, {
        method: "DELETE"
      });

      exibirToast("Sucesso", "Tarefa excluída com sucesso!");
      await carregarTarefas();
      await carregarTarefasComTitulo();
    } catch (erro) {
      console.error("Erro:", erro);
      exibirToast("Erro", "Falha ao excluir tarefa", "error");
    }
  });
}

async function buscarTarefa(id) {
  try {
    const data = await fetchWithAuth(`${baseUrl}/tarefas/${id}`);
    return data.tarefa || {};
  } catch (err) {
    console.error(`Erro ao buscar tarefa ${id}:`, err);
    return {};
  }
}

/* ---------- SISTEMA DE FILTROS PARA LANÇAMENTOS ---------- */
function adicionarFiltro(secao, tipo) {
  if (!filtrosAtivos[secao]) {
    filtrosAtivos[secao] = {};
  }
  if (filtrosAtivos[secao][tipo]) {
    mostrarRespostaPopup("Este filtro já está ativo", false);
    return;
  }
  filtrosAtivos[secao][tipo] = {};
  renderizarFiltros(secao);
  aplicarFiltros(secao);
}

function removerFiltro(secao, tipo) {
  delete filtrosAtivos[secao][tipo];
  renderizarFiltros(secao);
  aplicarFiltros(secao);
}

function renderizarFiltros(secao) {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const container = document.getElementById(`filtrosAtivos${capitalize(secao)}`);
  if (!container) return;

  container.innerHTML = '';
  const filtros = filtrosAtivos[secao];

  Object.keys(filtros).forEach(tipo => {
    const filterItem = document.createElement('div');
    filterItem.className = 'filter-item';

    let content = '';
    let titulo = '';

    switch (tipo) {
      case 'busca':
        titulo = '🔍 Buscar';
        content = `<input type="text" id="filtro${capitalize(secao)}Busca" placeholder="Buscar..." value="${filtros[tipo].valor || ''}" />`;
        break;

      case 'status':
        titulo = '✅ Status';
        const opcoesStatus = getOpcoesStatus(secao);
        content = `
          <select id="filtro${capitalize(secao)}Status">
            <option value="">Todos</option>
            ${opcoesStatus.map(opt => `<option value="${opt}" ${filtros[tipo].valor === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        `;
        break;

      case 'classificacao':
        titulo = '📋 Classificação';
        content = `
          <select id="filtro${capitalize(secao)}Classificacao">
            <option value="">Todas</option>
            <option value="Receita" ${filtros[tipo].valor === 'Receita' ? 'selected' : ''}>Receita</option>
            <option value="Despesa" ${filtros[tipo].valor === 'Despesa' ? 'selected' : ''}>Despesa</option>
          </select>
        `;
        break;

      case 'tipo':
        titulo = '📋 Tipo';
        content = `
          <select id="filtro${capitalize(secao)}Tipo">
            <option value="">Todos</option>
            <option value="Entrada" ${filtros[tipo].valor === 'Entrada' ? 'selected' : ''}>Entrada</option>
            <option value="Saida" ${filtros[tipo].valor === 'Saida' ? 'selected' : ''}>Saída</option>
          </select>
        `;
        break;

      case 'data':
        titulo = '📅 Data';
        content = `
          <div class="filter-date-range">
            <div class="filter-date-group">
              <label>Data Inicial</label>
              <input type="date" id="filtro${capitalize(secao)}DataDe" value="${filtros[tipo].dataDe || ''}" />
            </div>
            <div class="filter-date-group">
              <label>Data Final</label>
              <input type="date" id="filtro${capitalize(secao)}DataAte" value="${filtros[tipo].dataAte || ''}" />
            </div>
          </div>
        `;
        break;

      case 'ordenar':
        titulo = '↕️ Ordenar';
        const opcoesOrdem = getOpcoesOrdenacao(secao);
        content = `
          <select id="filtro${capitalize(secao)}Ordenar">
            ${opcoesOrdem.map(opt => `<option value="${opt.value}" ${filtros[tipo].valor === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>
        `;
        break;

      case 'ano':
        titulo = '📅 Ano';
        content = `
            <input type="number" id="filtro${capitalize(secao)}Ano" 
                   placeholder="Digite o ano..." 
                   min="2020" 
                   max="2100" 
                   value="${filtros[tipo].valor || ''}" />
          `;
        break;

      case 'trimestre':
        titulo = '📊 Trimestre';
        content = `
          <select id="filtro${capitalize(secao)}Trimestre">
            <option value="">Todos</option>
            <option value="1" ${filtros[tipo].valor === '1' ? 'selected' : ''}>1º Trimestre</option>
            <option value="2" ${filtros[tipo].valor === '2' ? 'selected' : ''}>2º Trimestre</option>
            <option value="3" ${filtros[tipo].valor === '3' ? 'selected' : ''}>3º Trimestre</option>
            <option value="4" ${filtros[tipo].valor === '4' ? 'selected' : ''}>4º Trimestre</option>
          </select>
        `;
        break;

      case 'ordenar':
    }


    filterItem.innerHTML = `
      <div class="filter-item-header">
        <span class="filter-item-title">${titulo}</span>
        <button class="btn-remove-filter" onclick="removerFiltro('${secao}', '${tipo}')">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="filter-item-content">${content}</div>
    `;

    container.appendChild(filterItem);
  });

  atualizarIconesLucide();
  adicionarEventosFiltros(secao);
}

function adicionarEventosFiltros(secao) {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const inputBusca = document.getElementById(`filtro${capitalize(secao)}Busca`);
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      filtrosAtivos[secao].busca.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const selectStatus = document.getElementById(`filtro${capitalize(secao)}Status`);
  if (selectStatus) {
    selectStatus.addEventListener('change', (e) => {
      filtrosAtivos[secao].status.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const selectClassificacao = document.getElementById(`filtro${capitalize(secao)}Classificacao`);
  if (selectClassificacao) {
    selectClassificacao.addEventListener('change', (e) => {
      filtrosAtivos[secao].classificacao.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const selectTipo = document.getElementById(`filtro${capitalize(secao)}Tipo`);
  if (selectTipo) {
    selectTipo.addEventListener('change', (e) => {
      filtrosAtivos[secao].tipo.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const inputDataDe = document.getElementById(`filtro${capitalize(secao)}DataDe`);
  if (inputDataDe) {
    inputDataDe.addEventListener('change', (e) => {
      filtrosAtivos[secao].data.dataDe = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const inputDataAte = document.getElementById(`filtro${capitalize(secao)}DataAte`);
  if (inputDataAte) {
    inputDataAte.addEventListener('change', (e) => {
      filtrosAtivos[secao].data.dataAte = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const selectOrdenar = document.getElementById(`filtro${capitalize(secao)}Ordenar`);
  if (selectOrdenar) {
    selectOrdenar.addEventListener('change', (e) => {
      filtrosAtivos[secao].ordenar.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const inputAno = document.getElementById(`filtro${capitalize(secao)}Ano`);
  if (inputAno) {
    inputAno.addEventListener('input', (e) => {
      filtrosAtivos[secao].ano.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const selectTrimestre = document.getElementById(`filtro${capitalize(secao)}Trimestre`);
  if (selectTrimestre) {
    selectTrimestre.addEventListener('change', (e) => {
      filtrosAtivos[secao].trimestre.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }
}

// Substitua a sua função aplicarFiltros por esta versão
function aplicarFiltros(secao) {
  // começar com cópia dos dados originais para não sobrescrever o cache
  let dadosOriginais = [];

  switch (secao) {
    case 'lancamentos':
      dadosOriginais = Array.isArray(todosLancamentos) ? todosLancamentos.slice() : [];
      break;
    case 'extratos':
      dadosOriginais = Array.isArray(todosExtratos) ? todosExtratos.slice() : [];
      break;
    case 'indices':
      dadosOriginais = Array.isArray(todosIndices) ? todosIndices.slice() : [];
      break;
    case 'produtos':
      dadosOriginais = Array.isArray(todosProdutos) ? todosProdutos.slice() : [];
      break;
    case 'orcamentosAnuais':
      dadosOriginais = Array.isArray(todosOrcamentosAnuais) ? todosOrcamentosAnuais.slice() : [];
      break;
    case 'orcamentosTri':
      dadosOriginais = Array.isArray(todosOrcamentosTri) ? todosOrcamentosTri.slice() : [];
      break;
    default:
      dadosOriginais = [];
  }

  let dados = dadosOriginais.slice();
  const filtros = filtrosAtivos[secao] || {};

  // Busca
  if (filtros.busca && filtros.busca.valor) {
    const busca = String(filtros.busca.valor).toLowerCase();
    dados = dados.filter(item => buscarEmObjeto(item, busca));
  }

  // Status
  if (filtros.status && filtros.status.valor) {
    dados = dados.filter(item => filtrarPorStatus(item, filtros.status.valor, secao));
  }

  // Classificação (aplicável a lançamentos)
  if (filtros.classificacao && filtros.classificacao.valor) {
    dados = dados.filter(item => normalizar(item.classificacaoLancamento) === normalizar(filtros.classificacao.valor));
  }

  // Tipo (aplicável a extratos)
  if (filtros.tipo && filtros.tipo.valor) {
    dados = dados.filter(item => normalizar(item.tipoExtrato) === normalizar(filtros.tipo.valor));
  }

  if (filtros.ano && filtros.ano.valor) {
    dados = dados.filter(item => {
      const anoItem = item.anoOrcamentoAnual || item.anoIndice || item.anoOrcamentoTri;
      return String(anoItem) === String(filtros.ano.valor);
    });
  }

  // Trimestre (aplicável a orçamentos trimestrais)
  if (filtros.trimestre && filtros.trimestre.valor) {
    dados = dados.filter(item => String(item.trimestreOrcamentoTri) === String(filtros.trimestre.valor));
  }


  // Data
  if (filtros.data) {
    const { dataDe, dataAte } = filtros.data;
    dados = dados.filter(item => filtrarPorData(item, dataDe, dataAte, secao));
  }

  // Ordenação
  if (filtros.ordenar && filtros.ordenar.valor) {
    ordenarDados(dados, filtros.ordenar.valor, secao);
  }


  switch (secao) {
    case 'lancamentos':
      renderizarTabelaLancamentos(dados);
      break;
    case 'extratos':
      renderizarTabelaExtratos(dados);
      break;
    case 'indices':
      renderizarTabelaIndices(dados);
      break;
    case 'produtos':
      renderizarTabelaProdutos(dados);
      break;
    case 'orcamentosAnuais':
      renderizarTabelaOrcamentosAnuais(dados);
      break;
    case 'orcamentosTri':
      renderizarTabelaOrcamentosTri(dados);
      break;
  }
}




function limparFiltros(secao) {
  filtrosAtivos[secao] = {};
  renderizarFiltros(secao);
  aplicarFiltros(secao);
}

function buscarEmObjeto(obj, busca) {
  return Object.values(obj).some(val =>
    String(val).toLowerCase().includes(busca)
  );
}

function filtrarPorStatus(item, status, secao) {
  switch (secao) {
    case 'lancamentos':
      return normalizar(item.statusLancamento) === normalizar(status);
    default:
      return true;
  }
}

function filtrarPorData(item, dataDe, dataAte, secao) {
  let dataItem;

  switch (secao) {
    case 'lancamentos':
      dataItem = new Date(item.vencimentoLancamento);
      break;
    case 'extratos':
      dataItem = new Date(item.dataExtrato);
      break;
    default:
      return true;
  }

  if (dataDe && new Date(dataDe) > dataItem) return false;
  if (dataAte && new Date(dataAte) < dataItem) return false;
  return true;
}

function ordenarDados(dados, criterio, secao) {
  const [campo, ordem] = criterio.split('-');
  let valA, valB;

  dados.sort((a, b) => {
    valA = a[campo] || '';
    valB = b[campo] || '';

    if (ordem === 'desc') [valA, valB] = [valB, valA];
    return String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true });
  });
}

function getOpcoesStatus(secao) {
  switch (secao) {
    case 'lancamentos':
      return ['Em aberto', 'Pago', 'Vencido'];
    default:
      return [];
  }
}

function getOpcoesOrdenacao(secao) {
  const opcoes = [];

  switch (secao) {
    case 'lancamentos':
      opcoes.push(
        { value: 'valorLancamento-asc', label: 'Valor (Menor)' },
        { value: 'valorLancamento-desc', label: 'Valor (Maior)' },
        { value: 'vencimentoLancamento-asc', label: 'Vencimento (Antigo)' },
        { value: 'vencimentoLancamento-desc', label: 'Vencimento (Recente)' }
      );
      break;
    case 'extratos':
      opcoes.push(
        { value: 'dataExtrato-asc', label: 'Data (Antiga)' },
        { value: 'dataExtrato-desc', label: 'Data (Recente)' },
        { value: 'valorExtrato-asc', label: 'Valor (Menor)' },
        { value: 'valorExtrato-desc', label: 'Valor (Maior)' }
      );
      break;
    case 'indices':
      opcoes.push(
        { value: 'nomeIndice-asc', label: 'Nome (A-Z)' },
        { value: 'anoIndice-desc', label: 'Ano (Recente)' }
      );
      break;
    case 'produtos':
      opcoes.push(
        { value: 'nomeProduto-asc', label: 'Nome (A-Z)' },
        { value: 'custoProduto-desc', label: 'Custo (Maior)' }
      );
      break;
  }

  return opcoes;
}

/* ---------- FUNÇÕES PARA MODAIS DINÂMICOS ---------- */
window.mostrarModalConfirmacao = function (mensagem, onConfirmar) {
  const modal = document.getElementById("modalConfirmacaoFinanceiro");
  if (!modal) return;

  const texto = modal.querySelector("#modal-confirmacao-text");
  const btnConfirmar = modal.querySelector("#confirmar-acao");

  if (texto) texto.textContent = mensagem;

  const novoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);

  novoBtn.onclick = () => {
    modal.classList.add("oculto");
    if (onConfirmar) onConfirmar();
  };

  modal.classList.remove("oculto");
};

window.mostrarModalRecado = function (dateStr, onSave) {
  const modal = document.getElementById("modalRecadoFinanceiro");
  if (!modal) return;

  const dataSpan = modal.querySelector("#data-evento");
  const textoInput = modal.querySelector("#texto-evento");
  const btnSalvar = modal.querySelector("#salvar-evento");

  if (dataSpan) dataSpan.textContent = new Date(dateStr).toLocaleDateString('pt-BR');
  if (textoInput) textoInput.value = "";

  const novoBtn = btnSalvar.cloneNode(true);
  btnSalvar.parentNode.replaceChild(novoBtn, btnSalvar);

  novoBtn.onclick = () => {
    const texto = textoInput.value.trim();
    if (texto) {
      modal.classList.add("oculto");
      if (onSave) onSave(texto);
    } else {
      textoInput.focus();
    }
  };

  modal.classList.remove("oculto");
};

window.mostrarModalConclusao = function (mensagem, onConfirmar) {
  const modal = document.getElementById("modalConclusaoFinanceiro");
  if (!modal) return;

  const texto = modal.querySelector("#modal-conclusao-text");
  const btnConfirmar = modal.querySelector("#confirmar-conclusao");

  if (texto) texto.textContent = mensagem;

  const novoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);

  novoBtn.onclick = () => {
    modal.classList.add("oculto");
    if (onConfirmar) onConfirmar();
  };

  modal.classList.remove("oculto");
};

window.mostrarModalDetalhes = function (tituloTexto, descricaoTexto) {
  const modal = document.getElementById("modalDetalhesFinanceiro");
  if (!modal) return;

  const titulo = modal.querySelector("#detalhes-titulo");
  const conteudo = modal.querySelector("#detalhes-conteudo");

  if (titulo) titulo.textContent = tituloTexto;
  if (conteudo) conteudo.textContent = descricaoTexto;

  modal.classList.remove("oculto");
};

/* ---------- INICIALIZAÇÃO ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const token = obterToken();

  if (!token) {
    console.log("Usuário não autenticado, redirecionando para login...");
    window.location.href = "../../html/login.html";
    return;
  }

  console.log("Inicializando Dashboard Financeiro...");
  criarModaisDinamicos();
  configurarEventListeners();

  inicializarDashboard();
});


function criarModaisDinamicos() {
  const appendIfMissing = (factoryFn) => {
    const temp = factoryFn();
    if (!document.getElementById(temp.id)) {
      document.body.appendChild(temp);
    }
  };

  appendIfMissing(criarModalConfirmacao);
  appendIfMissing(criarModalRecado);
  appendIfMissing(criarModalConclusao);
  appendIfMissing(criarModalDetalhesTarefa);
  appendIfMissing(criarModalRedirecionamento);
}

function realizarLogoutSeguroFinanceiro() {
  try {
    window.mostrarModalConfirmacao("Deseja realmente sair do sistema?", () => {
      mostrarModalRedirecionamento();

      try {
        setTimeout(() => {
          try { localStorage.removeItem("authToken"); } catch (e) { }
          try { sessionStorage.clear(); } catch (e) { }

          const chavesParaRemover = [
            "eventosUsuarioFinanceiro",
            "tarefaFixada",
            "userData",
            "userRole",
            "lastActivity",
            "sessionId",
            "refreshToken",
            "permissions"
          ];
          chavesParaRemover.forEach(chave => {
            try { localStorage.removeItem(chave); } catch (e) { }
          });

          try {
            if (typeof graficoInstances === "object" && graficoInstances) {
              Object.values(graficoInstances).forEach(inst => { if (inst && inst.destroy) inst.destroy(); });
            }
          } catch (e) { }

          try {
            if (typeof calendarioInstancia === "object" && calendarioInstancia && calendarioInstancia.destroy) {
              calendarioInstancia.destroy();
            }
          } catch (e) { }

          console.log(`[${new Date().toISOString()}] Logout seguro realizado pelo funcionário financeiro`);

          setTimeout(() => {
            window.location.replace("../../html/login.html");
          }, 1200);
        }, 350);
      } catch (erroInterno) {
        console.error("Erro durante processo final de logout:", erroInterno);
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) { }
        setTimeout(() => { window.location.replace("../../html/login.html"); }, 1000);
      }
    });
  } catch (erro) {
    console.error("Erro ao iniciar logout seguro:", erro);
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) { }
    setTimeout(() => { window.location.replace("../../html/login.html"); }, 1000);
  }
}

function mostrarModalRedirecionamento() {
  const modal = document.getElementById("modalRedirecionamentoFinanceiro");
  if (!modal) {
    console.error("Modal de redirecionamento financeiro não encontrado!");
    return;
  }

  const modalConfirmacao = document.getElementById("modalConfirmacaoFinanceiro") || document.getElementById("modalConfirmacao");
  if (modalConfirmacao) {
    modalConfirmacao.classList.add("oculto");
  }

  modal.style.display = "";
  modal.classList.remove("oculto");
  modal.classList.add("active");
}

function configurarEventListeners() {
  configurarSeletoresFiltros();
  configurarBotoesLimparFiltros();

  const formsHandlers = {
    'formLancamento': salvarLancamento,
    'formExtrato': salvarExtrato,
    'formProduto': salvarProduto,
    'formIndice': salvarIndice,
    'formPerfil': atualizarPerfil,
    'formOrcamentoAnual': salvarOrcamentoAnual,
    'formOrcamentoTri': salvarOrcamentoTri

  };

  Object.entries(formsHandlers).forEach(([formId, handler]) => {
    const form = document.getElementById(formId);
    if (form) form.addEventListener("submit", handler);
  });

  const btnExportarXML = document.getElementById("btnExportarXML");
  if (btnExportarXML) btnExportarXML.addEventListener("click", gerarXMLFinanceiro);

  document.querySelectorAll(".btn-nav").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarPainel(btn.dataset.secao);
    });
  });

  const seletorFiltroAtribuicoes = document.getElementById("seletorFiltroAtribuicoes");
  if (seletorFiltroAtribuicoes) {
    seletorFiltroAtribuicoes.addEventListener('change', (e) => {
      if (e.target.value) {
        adicionarFiltroAtribuicao(e.target.value);
        e.target.value = '';
      }
    });
  }

  const btnLimparFiltrosAtribuicoes = document.getElementById("btnLimparFiltrosAtribuicoes");
  if (btnLimparFiltrosAtribuicoes) {
    btnLimparFiltrosAtribuicoes.addEventListener('click', limparFiltrosAtribuicoes);
  }

  const btnNovaAtribuicao = document.getElementById("btnNovaAtribuicao");
  if (btnNovaAtribuicao) {
    btnNovaAtribuicao.addEventListener('click', () => {
      document.getElementById("formAtribuicao").reset();
      document.getElementById("modalTituloAtribuicao").textContent = "Nova Atribuição";
      document.getElementById("modalAtribuicao").classList.remove("oculto");
    });
  }

  const btnCancelarAtribuicao = document.getElementById("btnCancelarAtribuicao");
  if (btnCancelarAtribuicao) {
    btnCancelarAtribuicao.addEventListener('click', () => {
      document.getElementById("modalAtribuicao").classList.add("oculto");
    });
  }

  const formAtribuicao = document.getElementById("formAtribuicao");
  if (formAtribuicao) {
    formAtribuicao.addEventListener('submit', salvarAtribuicao);
  }

  // Eventos de tarefas
  if (seletorFiltroTarefas) {
    seletorFiltroTarefas.addEventListener('change', (e) => {
      if (e.target.value) {
        adicionarFiltroTarefa(e.target.value);
        e.target.value = '';
      }
    });
  }

  if (btnLimparFiltrosTarefas) {
    btnLimparFiltrosTarefas.addEventListener('click', limparFiltrosTarefas);
  }

  if (btnNovaTarefa) {
    btnNovaTarefa.addEventListener('click', () => {
      formTarefa.reset();
      inputIdTarefa.value = '';
      modalTituloTarefa.textContent = "Nova Tarefa";
      modalTarefa.classList.remove("oculto");
    });
  }

  if (btnCancelarTarefa) {
    btnCancelarTarefa.addEventListener('click', () => {
      modalTarefa.classList.add("oculto");
    });
  }

  if (formTarefa) {
    formTarefa.addEventListener('submit', salvarTarefa);
  }

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Logout clicado – abrindo modal de confirmação");
      realizarLogoutSeguroFinanceiro();
    });
  } else {
    console.warn("Botão de logout não encontrado ao configurar listeners.");
  }

  configurarBotoesModais();
  configurarListenersCategoriaSubcategoria();
  configurarListenersSegmentoSubsegmento();
}

function configurarSeletoresFiltros() {
  const seletores = [
    'seletorFiltroLancamentos',
    'seletorFiltroExtratos',
    'seletorFiltroIndices',
    'seletorFiltroProdutos',
    'seletorFiltroOrcamentosAnuais',
    'seletorFiltroOrcamentosTri'
  ];

  seletores.forEach(seletorId => {
    const seletor = document.getElementById(seletorId);
    if (seletor) {
      seletor.addEventListener('change', (e) => {
        if (e.target.value) {
          const secao = seletorId.replace('seletorFiltro', '').toLowerCase();
          adicionarFiltro(secao, e.target.value);
          e.target.value = '';
        }
      });
    }
  });
}

function configurarBotoesLimparFiltros() {
  const botoes = [
    'btnLimparFiltrosLancamentos',
    'btnLimparFiltrosExtratos',
    'btnLimparFiltrosIndices',
    'btnLimparFiltrosProdutos',
    'btnLimparFiltrosOrcamentosAnuais',
    'btnLimparFiltrosOrcamentosTri'
  ];

  botoes.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        const secao = btnId.replace('btnLimparFiltros', '').toLowerCase();
        limparFiltros(secao);
      });
    }
  });
}

function configurarBotoesModais() {
  const btnNovoLancamento = document.getElementById("btnNovoLancamento");
  if (btnNovoLancamento) btnNovoLancamento.addEventListener("click", abrirModalCriarLancamento);

  const btnNovoExtrato = document.getElementById("btnNovoExtrato");
  if (btnNovoExtrato) btnNovoExtrato.addEventListener("click", abrirModalCriarExtrato);

  const btnNovoProduto = document.getElementById("btnNovoProduto");
  if (btnNovoProduto) btnNovoProduto.addEventListener("click", abrirModalCriarProduto);

  const btnNovoIndice = document.getElementById("btnNovoIndice");
  if (btnNovoIndice) btnNovoIndice.addEventListener("click", abrirModalCriarIndice);

  const btnNovoOrcamentoAnual = document.getElementById("btnNovoOrcamentoAnual");
  if (btnNovoOrcamentoAnual) btnNovoOrcamentoAnual.addEventListener("click", abrirModalCriarOrcamentoAnual);

  const btnNovoOrcamentoTri = document.getElementById("btnNovoOrcamentoTri");
  if (btnNovoOrcamentoTri) btnNovoOrcamentoTri.addEventListener("click", abrirModalCriarOrcamentoTri);
}

async function inicializarDashboard() {
  try {
    const token = obterToken();
    if (!token) {
      return;
    }

    console.log("Inicializando dashboard...");

    // Carregar dados básicos primeiro
    await carregarSegmentos();
    await carregarSubsegmentos();
    await carregarCategorias();
    await carregarSubcategorias();
    await carregarProdutos();

    // Carregar tarefas
    await carregarTarefas();
    await carregarTarefasComTitulo();

    // Carregar usuários e atribuições
    await carregarUsuarios();
    await carregarAtribuicoesComFiltros();

    // Carregar dados financeiros
    await carregarLancamentos();
    await carregarExtratos();
    await carregarIndices();
    await carregarOrcamentosAnuais();
    await carregarOrcamentosTri();

    // Mostrar painel inicial
    mostrarPainel('tarefas');

    console.log("Dashboard inicializado com sucesso!");

  } catch (error) {
    console.error("Erro na inicialização:", error);
    mostrarRespostaPopup("Erro ao inicializar sistema", false);
  }
}

/* ---------- LOGOUT SEGURO ---------- */
setInterval(() => {
  const token = obterToken();
  if (!token) {
    console.log("Token expirado durante a sessão");
    mostrarRespostaPopup("Sessão expirada. Faça login novamente.", false, 3000);
    setTimeout(() => {
      window.location.href = "../../html/login.html";
    }, 3000);
  }
}, 5 * 60 * 1000);

/* ---------- NAVEGAÇÃO ENTRE PAINÉIS ---------- */
function mostrarPainel(painelId) {
  console.log("Mostrando painel:", painelId);

  // Oculta todos os painéis
  paineis.forEach(p => p.style.display = "none");

  // Remove classe ativo de todos os botões
  navBtns.forEach(btn => btn.classList.remove('ativo'));

  // Adiciona classe ativo ao botão clicado
  const btnAtivo = document.querySelector(`[data-secao="${painelId}"]`);
  if (btnAtivo) btnAtivo.classList.add('ativo');

  // Mostra apenas o painel selecionado
  const painel = document.getElementById(`painel-${painelId}`);
  if (painel) {
    painel.style.display = "block";
    console.log("Display do painel:", painel.style.display);
  }

  // Aplica os filtros adequados conforme o painel
  switch (painelId) {
    case "tarefas":
      if (typeof aplicarFiltrosTarefas === "function") aplicarFiltrosTarefas();
      break;

    case "atribuicoes":
      if (typeof aplicarFiltrosAtribuicoes === "function") aplicarFiltrosAtribuicoes();
      else carregarAtribuicoesComFiltros(); // Chamada alternativa
      break;

    case "lancamentos":
      aplicarFiltros('lancamentos');
      break;

    case "extratos":
      aplicarFiltros('extratos');
      break;

    case "indices":
      aplicarFiltros('indices');
      break;

    case "produtos":
      aplicarFiltros('produtos');
      break;
    case "orcamentos-anuais":
      if (typeof aplicarFiltros === "function") aplicarFiltros('orcamentosAnuais');
      break;
    case "orcamentos-tri":
      if (typeof aplicarFiltros === "function") aplicarFiltros('orcamentosTri');
      break;

    case "visao-geral-financeira":
      // IMPORTANTE: Carregar dados da visão geral
      carregarDashboardFinanceiro();
      break;

    case "calendario":
      setTimeout(() => {
        inicializarCalendario();
      }, 100);
      break;
  }

  atualizarIconesLucide();
}



async function carregarDashboardFinanceiro() {
  try {
    console.log("Carregando dashboard financeiro...");

    await Promise.all([
      carregarKPIsFinanceiros(),
      carregarFluxoCaixaMensal()
    ]);

    // Gerar gráficos
    gerarGraficosLancamentos();
    gerarGraficoExtratosTipo();

    console.log("Dashboard financeiro carregado!");
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    mostrarRespostaPopup("Erro ao carregar visão geral", false);
  }
}

/* ---------- CRIAÇÃO DE MODAIS DINÂMICOS ---------- */
function criarModalConfirmacao() {
  const modal = document.createElement("div");
  modal.id = "modalConfirmacaoFinanceiro";
  modal.className = "modal oculto";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Confirmar Ação</h3>
      </div>
      <div class="modal-body">
        <p id="modal-confirmacao-text"></p>
      </div>
      <div class="modal-actions">
        <button id="confirmar-acao" class="btn-primary">Confirmar</button>
        <button id="cancelar-acao" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `;

  const btnCancelar = modal.querySelector("#cancelar-acao");
  btnCancelar.onclick = () => modal.classList.add("oculto");

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add("oculto");
    }
  });

  return modal;
}

function criarModalRecado() {
  const modal = document.createElement("div");
  modal.id = "modalRecadoFinanceiro";
  modal.className = "modal oculto";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Adicionar Evento</h3>
      </div>
      <div class="modal-body">
        <p>Para o dia: <strong id="data-evento"></strong></p>
        <textarea id="texto-evento" placeholder="Descreva o evento..." rows="4"></textarea>
      </div>
      <div class="modal-actions">
        <button id="salvar-evento" class="btn-primary">Salvar</button>
        <button id="cancelar-evento" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `;

  const btnCancelar = modal.querySelector("#cancelar-evento");
  btnCancelar.onclick = () => modal.classList.add("oculto");

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add("oculto");
    }
  });

  return modal;
}

function criarModalConclusao() {
  const modal = document.createElement("div");
  modal.id = "modalConclusaoFinanceiro";
  modal.className = "modal oculto";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Confirmar Conclusão</h3>
      </div>
      <div class="modal-body">
        <p id="modal-conclusao-text"></p>
      </div>
      <div class="modal-actions">
        <button id="confirmar-conclusao" class="btn-primary">Sim, Concluir</button>
        <button id="cancelar-conclusao" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `;

  const btnCancelar = modal.querySelector("#cancelar-conclusao");
  btnCancelar.onclick = () => modal.classList.add("oculto");

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add("oculto");
    }
  });

  return modal;
}

function criarModalDetalhesTarefa() {
  const modal = document.createElement("div");
  modal.id = "modalDetalhesFinanceiro";
  modal.className = "modal oculto";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="detalhes-titulo"></h3>
      </div>
      <div class="modal-body">
        <div id="detalhes-conteudo" style="text-align: left; max-height: 300px; overflow-y: auto; padding: 16px; background: var(--muted); border-radius: 8px; margin: 16px 0;"></div>
      </div>
      <div class="modal-actions">
        <button id="fechar-detalhes" class="btn-secondary">Fechar</button>
      </div>
    </div>
  `;

  const btnFechar = modal.querySelector("#fechar-detalhes");
  btnFechar.onclick = () => modal.classList.add("oculto");

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add("oculto");
    }
  });

  return modal;
}

function criarModalRedirecionamento() {
  const modal = document.createElement("div");
  modal.id = "modalRedirecionamentoFinanceiro";
  modal.className = "modal-overlay modal oculto";

  modal.innerHTML = `
    <div class="modal-content" style="text-align: center; max-width: 420px;">
      <div class="modal-header">
        <h3>Saindo do Sistema</h3>
      </div>
      <div class="modal-body" style="padding: 2rem;">
        <div style="margin-bottom: 1.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor"
            viewBox="0 0 24 24" style="color: var(--primary); margin: 0 auto; display: block;">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </div>
        <p style="font-size: 1rem; color: var(--foreground); margin-bottom: 0.5rem;">
          Logout realizado com sucesso!
        </p>
        <p style="font-size: 0.875rem; color: var(--muted-foreground);">
          Redirecionando para a página de login...
        </p>
        <div style="margin-top: 1.5rem;">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>
  `;

  return modal;
}

/* ---------- KPIs FINANCEIROS ---------- */
async function carregarKPIsFinanceiros() {
  try {
    console.log("Carregando KPIs financeiros...");

    const [lancamentosRes, extratosRes] = await Promise.all([
      fetchData(`${baseUrl}/lancamentos`),
      fetchData(`${baseUrl}/extratos`)
    ]);

    console.log("Resposta lançamentos:", lancamentosRes);
    console.log("Resposta extratos:", extratosRes);

    const lancamentos = lancamentosRes.data || lancamentosRes.lancamentos ||
      (Array.isArray(lancamentosRes) ? lancamentosRes : []);
    const extratos = extratosRes.data || extratosRes.extratos ||
      (Array.isArray(extratosRes) ? extratosRes : []);

    console.log("Lançamentos processados:", lancamentos.length);
    console.log("Extratos processados:", extratos.length);

    const kpis = calcularKPIs(lancamentos, extratos);
    console.log("KPIs calculados:", kpis);

    atualizarKPIsNaInterface(kpis);

  } catch (error) {
    console.error("Erro ao carregar KPIs:", error);
    mostrarRespostaPopup("Erro ao carregar indicadores financeiros", false);
  }
}

function calcularKPIs(lancamentos, extratos) {
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;
  let saldo = 0;
  let lancamentosAbertos = 0;

  lancamentos.forEach(l => {
    const vencimento = l.vencimentoLancamento ? new Date(l.vencimentoLancamento) : null;
    const valor = parseFloat(l.valorLancamento || 0);

    if (vencimento && vencimento.getMonth() === mesAtual && vencimento.getFullYear() === anoAtual) {
      if (l.classificacaoLancamento === "Receita") {
        totalReceitas += valor;
      } else if (l.classificacaoLancamento === "Despesa") {
        totalDespesas += valor;
      }
    }

    if (["Em aberto", "Pendente"].includes(l.statusLancamento)) {
      lancamentosAbertos++;
    }
  });

  extratos.forEach(e => {
    const valor = parseFloat(e.valorExtrato || 0);
    if (e.tipoExtrato === "Entrada") {
      saldo += valor;
    } else if (["Saida", "Saída"].includes(e.tipoExtrato)) {
      saldo -= valor;
    }
  });

  return {
    totalReceitas,
    totalDespesas,
    saldo,
    lancamentosAbertos,
    lucroLiquido: totalReceitas - totalDespesas
  };
}

function atualizarKPIsNaInterface(kpis) {
  const formatarMoedaKPI = (valor) => `R$ ${Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (elements.totalReceitasMes) {
    elements.totalReceitasMes.textContent = formatarMoedaKPI(kpis.totalReceitas);
  }

  if (elements.totalDespesasMes) {
    elements.totalDespesasMes.textContent = formatarMoedaKPI(kpis.totalDespesas);
  }

  if (elements.saldoAtual) {
    elements.saldoAtual.textContent = formatarMoedaKPI(kpis.saldo);
    elements.saldoAtual.className = kpis.saldo >= 0 ? 'text-success' : 'text-error';
  }

  if (elements.lancamentosEmAbertoCount) {
    elements.lancamentosEmAbertoCount.textContent = kpis.lancamentosAbertos;
  }
}

async function carregarFluxoCaixaMensal() {
  try {
    const extratosRes = await fetchData(`${baseUrl}/extratos`);
    const extratos = extratosRes.data || [];

    const fluxoCaixaMensal = processarFluxoCaixa(extratos);
    gerarGraficoFluxoCaixa(fluxoCaixaMensal);

  } catch (error) {
    console.error("Erro ao carregar fluxo de caixa:", error);
  }
}

function processarFluxoCaixa(extratos) {
  const fluxo = {};

  extratos.forEach(e => {
    if (!e.dataExtrato) return;

    try {
      const d = new Date(e.dataExtrato);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!fluxo[key]) {
        fluxo[key] = { receitas: 0, despesas: 0 };
      }

      const valor = parseFloat(e.valorExtrato || 0);
      if (e.tipoExtrato === "Entrada") {
        fluxo[key].receitas += valor;
      } else if (["Saida", "Saída"].includes(e.tipoExtrato)) {
        fluxo[key].despesas += valor;
      }
    } catch (error) {
      console.error("Erro ao processar data do extrato:", error);
    }
  });

  return fluxo;
}

function gerarGraficoFluxoCaixa(fluxoCaixaMensal) {
  const ctx = document.getElementById("graficoFluxoCaixa");
  if (!ctx) return;

  if (graficoInstances.fluxoCaixa) {
    graficoInstances.fluxoCaixa.destroy();
  }

  const months = Object.keys(fluxoCaixaMensal).sort();

  if (months.length === 0) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  const labels = months.map(m => {
    const [year, month] = m.split('-');
    return `${month}/${year}`;
  });

  const receitasData = months.map(m => fluxoCaixaMensal[m].receitas);
  const despesasData = months.map(m => fluxoCaixaMensal[m].despesas);

  graficoInstances.fluxoCaixa = new Chart(ctx.getContext("2d"), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: receitasData,
          backgroundColor: 'hsla(142, 69%, 58%, 0.8)',
          borderColor: 'hsl(142, 69%, 48%)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Despesas',
          data: despesasData,
          backgroundColor: 'hsla(0, 72%, 51%, 0.8)',
          borderColor: 'hsl(0, 72%, 41%)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            font: { family: 'Inter' }
          }
        },
        title: {
          display: true,
          text: 'Fluxo de Caixa Mensal',
          font: { family: 'Inter', weight: '600' }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter' } }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `R$ ${value.toLocaleString('pt-BR')}`,
            font: { family: 'Inter' }
          },
          grid: { color: 'rgba(0,0,0,0.1)' }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

async function carregarGraficosFinanceiros() {
  gerarGraficosLancamentos();
  gerarGraficoExtratosTipo();
}

function gerarGraficosLancamentos() {
  gerarGraficoLancamentosStatus();
  gerarGraficoLancamentosClassificacao();
}

function gerarGraficoLancamentosStatus() {
  const ctx = document.getElementById("graficoLancamentosStatus");
  if (!ctx) return;

  if (graficoInstances.lancamentosStatus) {
    graficoInstances.lancamentosStatus.destroy();
  }

  const counts = { "Em aberto": 0, "Pendente": 0, "Pago": 0, "Outro": 0 };

  todosLancamentos.forEach(l => {
    const status = l.statusLancamento || "Outro";
    if (counts[status] !== undefined) {
      counts[status]++;
    } else {
      counts["Outro"]++;
    }
  });

  const hasData = Object.values(counts).some(v => v > 0);
  if (!hasData) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  graficoInstances.lancamentosStatus = new Chart(ctx.getContext("2d"), {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: [
          'hsl(45, 93%, 58%)',
          'hsl(215, 14%, 63%)',
          'hsl(142, 69%, 58%)',
          'hsl(210, 11%, 93%)'
        ],
        borderWidth: 3,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          cornerRadius: 8
        }
      },
      cutout: '60%'
    }
  });
}

function gerarGraficoLancamentosClassificacao() {
  const ctx = document.getElementById("graficoLancamentosClassificacao");
  if (!ctx) return;

  if (graficoInstances.lancamentosClassificacao) {
    graficoInstances.lancamentosClassificacao.destroy();
  }

  const map = {};
  todosLancamentos.forEach(l => {
    const classificacao = l.classificacaoLancamento || "Não classificado";
    map[classificacao] = (map[classificacao] || 0) + 1;
  });

  const hasData = Object.keys(map).length > 0;
  if (!hasData) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  graficoInstances.lancamentosClassificacao = new Chart(ctx.getContext("2d"), {
    type: 'pie',
    data: {
      labels: Object.keys(map),
      datasets: [{
        data: Object.values(map),
        backgroundColor: [
          'hsl(230, 75%, 58%)',
          'hsl(250, 75%, 65%)',
          'hsl(45, 93%, 58%)',
          'hsl(0, 72%, 51%)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function gerarGraficoExtratosTipo() {
  const ctx = document.getElementById("graficoExtratosTipo");
  if (!ctx) return;

  if (graficoInstances.extratosTipo) {
    graficoInstances.extratosTipo.destroy();
  }

  const map = {};
  todosExtratos.forEach(e => {
    const tipo = e.tipoExtrato || 'Outro';
    map[tipo] = (map[tipo] || 0) + 1;
  });

  const hasData = Object.keys(map).length > 0;
  if (!hasData) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  graficoInstances.extratosTipo = new Chart(ctx.getContext("2d"), {
    type: 'pie',
    data: {
      labels: Object.keys(map),
      datasets: [{
        data: Object.values(map),
        backgroundColor: [
          'hsl(142, 69%, 58%)',
          'hsl(0, 72%, 51%)',
          'hsl(215, 14%, 63%)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

/* ---------- LANÇAMENTOS CRUD ---------- */
function abrirModalCriarLancamento() {
  const form = document.getElementById("formLancamento");
  if (form) form.reset();

  document.getElementById("idLancamento").value = "";
  document.getElementById("tituloModalLancamento").textContent = "Novo Lançamento";

  preencherSelectCategorias("categoriaLancamento");
  preencherSelectSubcategorias("subcategoriaLancamento");

  if (elements.modais.lancamento) {
    elements.modais.lancamento.classList.remove("oculto");
  }
}

function fecharModalLancamento() {
  if (elements.modais.lancamento) {
    elements.modais.lancamento.classList.add("oculto");
  }
}

async function editarLancamento(id) {
  const lancamento = todosLancamentos.find(l => l.idLancamento === id);
  if (!lancamento) {
    mostrarRespostaPopup("Lançamento não encontrado.", false);
    return;
  }

  document.getElementById("idLancamento").value = lancamento.idLancamento;
  document.getElementById("tituloLancamento").value = lancamento.tituloLancamento || "";
  document.getElementById("descLancamento").value = lancamento.descricaoLancamento || "";
  document.getElementById("valorLancamento").value = lancamento.valorLancamento || "";

  const vencimento = lancamento.vencimentoLancamento ? lancamento.vencimentoLancamento.split("T")[0] : "";
  document.getElementById("vencimentoLancamento").value = vencimento;

  const pagamento = lancamento.pagamentoLancamento ? lancamento.pagamentoLancamento.split("T")[0] : "";
  document.getElementById("pagamentoLancamento").value = pagamento;

  document.getElementById("statusLancamento").value = lancamento.statusLancamento || "";
  document.getElementById("classificacaoLancamento").value = lancamento.classificacaoLancamento || "";

  preencherSelectCategorias("categoriaLancamento");
  document.getElementById("categoriaLancamento").value = lancamento.idCategoria || "";

  preencherSelectSubcategorias("subcategoriaLancamento", lancamento.idCategoria);
  document.getElementById("subcategoriaLancamento").value = lancamento.idSubcategoria || "";

  document.getElementById("tituloModalLancamento").textContent = "Editar Lançamento";

  if (elements.modais.lancamento) {
    elements.modais.lancamento.classList.remove("oculto");
  }
}

async function salvarLancamento(ev) {
  ev.preventDefault();

  const id = document.getElementById("idLancamento").value;

  // Capturar o título do lançamento
  const tituloLancamento = document.getElementById("tituloLancamento")?.value || "Lançamento sem título";

  const dados = {
    tituloLancamento: tituloLancamento,
    descricaoLancamento: document.getElementById("descLancamento").value,
    valorLancamento: parseFloat(document.getElementById("valorLancamento").value || 0),
    vencimentoLancamento: document.getElementById("vencimentoLancamento").value,
    pagamentoLancamento: document.getElementById("pagamentoLancamento").value || null,
    statusLancamento: document.getElementById("statusLancamento").value,
    classificacaoLancamento: document.getElementById("classificacaoLancamento").value,
    idCategoria: parseInt(document.getElementById("categoriaLancamento").value) || null,
    idSubcategoria: parseInt(document.getElementById("subcategoriaLancamento").value) || null
  };

  console.log("Dados do lançamento a salvar:", dados);

  const url = id ? `${baseUrl}/lancamentos/${id}` : `${baseUrl}/lancamentos`;
  const method = id ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, { method, body: JSON.stringify(dados) });
    mostrarRespostaPopup("Lançamento salvo com sucesso!", true);
    fecharModalLancamento();
    carregarLancamentos();
  } catch (err) {
    console.error("Erro ao salvar lançamento:", err);
    mostrarRespostaPopup("Erro ao salvar lançamento: " + err.message, false);
  }
}

async function excluirLancamento(id) {
  mostrarModalConfirmacao("Tem certeza que deseja excluir este lançamento?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/lancamentos/${id}`, { method: "DELETE" });
      mostrarRespostaPopup("Lançamento excluído com sucesso.", true);
      carregarLancamentos();
    } catch (err) {
      console.error("Erro ao excluir lançamento:", err);
      mostrarRespostaPopup("Erro ao excluir lançamento.", false);
    }
  });
}

async function carregarLancamentos() {
  try {
    const res = await fetchData(`${baseUrl}/lancamentos`);
    todosLancamentos = res.data || [];
    aplicarFiltros('lancamentos');
    gerarGraficosLancamentos();
  } catch (error) {
    console.error("Erro ao carregar lançamentos:", error);
    mostrarRespostaPopup("Erro ao carregar lançamentos", false);
  }
}

// Função auxiliar para buscar nome da categoria
function obterNomeCategoria(idCategoria) {
  if (!idCategoria) return '-';
  const categoria = todasCategorias.find(c => c.idCategoria == idCategoria);
  return categoria ? categoria.nomeCategoria : `Categoria ${idCategoria}`;
}

// Função auxiliar para buscar nome da subcategoria
function obterNomeSubcategoria(idSubcategoria) {
  if (!idSubcategoria) return '-';
  const subcategoria = todasSubcategorias.find(s => s.idSubcategoria == idSubcategoria);
  return subcategoria ? subcategoria.nomeSubcategoria : `Subcategoria ${idSubcategoria}`;
}

function renderizarTabelaLancamentos(lancamentosParaRenderizar) {
  if (!elements.tbodyLancamentos) {
    console.error("Tbody lancamentos não encontrado!");
    return;
  }

  // Use the passed data, or fall back to todosLancamentos
  const lancamentos = lancamentosParaRenderizar || todosLancamentos;

  elements.tbodyLancamentos.innerHTML = "";

  if (lancamentos.length === 0) {
    elements.tbodyLancamentos.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Nenhum lançamento encontrado.</td></tr>';
    return;
  }

  lancamentos.forEach(l => {
    const statusClass = `status-${(l.statusLancamento || "").toLowerCase().replace(/\s/g, '')}`;
    const classificacaoClass = l.classificacaoLancamento === 'Receita' ? 'text-success' : 'text-error';
    const tr = document.createElement("tr");

    const nomeCategoria = obterNomeCategoria(l.idCategoria);
    const nomeSubcategoria = obterNomeSubcategoria(l.idSubcategoria);

    tr.innerHTML = `
      <td><strong>${escaparHTML(l.tituloLancamento || 'Sem título')}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escaparHTML(l.descricaoLancamento || '')}">${escaparHTML(l.descricaoLancamento || '-')}</td>
      <td><strong>R$ ${parseFloat(l.valorLancamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${formatarData(l.vencimentoLancamento)}</td>
      <td>${l.pagamentoLancamento ? formatarData(l.pagamentoLancamento) : '-'}</td>
      <td><span class="${statusClass}">${escaparHTML(l.statusLancamento || '-')}</span></td>
      <td><span class="${classificacaoClass}"><strong>${escaparHTML(l.classificacaoLancamento || '-')}</strong></span></td>
      <td>${escaparHTML(nomeCategoria)}<br><small style="color: var(--muted-foreground);">${escaparHTML(nomeSubcategoria)}</small></td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarLancamento(${l.idLancamento})" title="Editar">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirLancamento(${l.idLancamento})" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    elements.tbodyLancamentos.appendChild(tr);
  });

  atualizarIconesLucide();
}

/* ---------- EXTRATOS CRUD ---------- */
function abrirModalCriarExtrato() {
  const form = document.getElementById("formExtrato");
  if (form) form.reset();

  document.getElementById("idExtrato").value = "";
  document.getElementById("tituloModalExtrato").textContent = "Novo Extrato";

  // Carregar todos os selects necessários
  preencherSelectTarefas("idTarefaExtrato");
  preencherSelectCategorias("idCategoriaExtrato");
  preencherSelectSubcategorias("idSubcategoriaExtrato");
  preencherSelectProdutos("idProdutoExtrato");
  preencherSelectLancamentos("idLancamentoExtrato");

  if (elements.modais.extrato) {
    elements.modais.extrato.classList.remove("oculto");
  }
}

function fecharModalExtrato() {
  if (elements.modais.extrato) {
    elements.modais.extrato.classList.add("oculto");
  }
}

// Função auxiliar para preencher select de lançamentos
function preencherSelectLancamentos(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`Select ${selectId} não encontrado!`);
    return;
  }

  select.innerHTML = '<option value="">Selecione um lançamento...</option>';

  console.log(`Preenchendo select ${selectId} com ${todosLancamentos.length} lançamentos`);

  todosLancamentos.forEach(lanc => {
    const option = document.createElement('option');
    option.value = lanc.idLancamento;
    const titulo = lanc.tituloLancamento || lanc.descricaoLancamento || `Lançamento #${lanc.idLancamento}`;
    option.textContent = `${titulo} - R$ ${parseFloat(lanc.valorLancamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    select.appendChild(option);
  });
}

// Função auxiliar para obter título do lançamento
function obterTituloLancamento(idLancamento) {
  if (!idLancamento) return '-';
  const lancamento = todosLancamentos.find(l => l.idLancamento == idLancamento);
  if (!lancamento) return `Lançamento #${idLancamento}`;
  return lancamento.tituloLancamento || lancamento.descricaoLancamento || `Lançamento #${idLancamento}`;
}

// Função auxiliar para obter título da tarefa
function obterTituloTarefa(idTarefa) {
  if (!idTarefa) return '-';
  const tarefa = todasTarefasComTitulo.find(t => t.idTarefa == idTarefa);
  return tarefa ? tarefa.tituloTarefa : `Tarefa #${idTarefa}`;
}

// Função auxiliar para obter nome do produto
function obterNomeProduto(idProduto) {
  if (!idProduto) return '-';
  const produto = todosProdutos.find(p => p.idProduto == idProduto);
  return produto ? produto.nomeProduto : `Produto #${idProduto}`;
}

async function editarExtrato(id) {
  const extrato = todosExtratos.find(e => e.idExtrato === id);
  if (!extrato) {
    mostrarRespostaPopup("Extrato não encontrado.", false);
    return;
  }

  document.getElementById("idExtrato").value = extrato.idExtrato;

  // Preencher título e descrição
  document.getElementById("tituloExtrato").value = extrato.tituloExtrato || "";
  document.getElementById("descricaoExtrato").value = extrato.descricaoExtrato || "";

  document.getElementById("tipoExtrato").value = extrato.tipoExtrato || "";
  document.getElementById("valorExtrato").value = extrato.valorExtrato || "";
  document.getElementById("dataExtrato").value = (extrato.dataExtrato || "").split("T")[0] || "";

  // Preencher selects
  preencherSelectTarefas("idTarefaExtrato");
  document.getElementById("idTarefaExtrato").value = extrato.idTarefa || "";

  preencherSelectLancamentos("idLancamentoExtrato");
  document.getElementById("idLancamentoExtrato").value = extrato.idLancamento || "";

  preencherSelectCategorias("idCategoriaExtrato");
  document.getElementById("idCategoriaExtrato").value = extrato.idCategoria || "";

  preencherSelectSubcategorias("idSubcategoriaExtrato", extrato.idCategoria);
  document.getElementById("idSubcategoriaExtrato").value = extrato.idSubcategoria || "";

  preencherSelectProdutos("idProdutoExtrato");
  document.getElementById("idProdutoExtrato").value = extrato.idProduto || "";

  document.getElementById("tituloModalExtrato").textContent = "Editar Extrato";

  if (elements.modais.extrato) {
    elements.modais.extrato.classList.remove("oculto");
  }
}

function parseIntSafe(valor) {
  if (!valor || valor === '') return null;
  const parsed = parseInt(valor);
  return isNaN(parsed) ? null : parsed;
}

async function salvarExtrato(ev) {
  ev.preventDefault();

  const id = document.getElementById("idExtrato").value;

  // Capturar título e descrição do extrato
  const tituloExtrato = document.getElementById("tituloExtrato")?.value || null;
  const descricaoExtrato = document.getElementById("descricaoExtrato")?.value || null;

  const dados = {
    tituloExtrato: tituloExtrato,
    descricaoExtrato: descricaoExtrato,
    tipoExtrato: document.getElementById("tipoExtrato").value,
    valorExtrato: parseFloat(document.getElementById("valorExtrato").value || 0),
    dataExtrato: document.getElementById("dataExtrato").value,
    idTarefa: parseIntSafe(document.getElementById("idTarefaExtrato").value),
    idLancamento: parseIntSafe(document.getElementById("idLancamentoExtrato").value),
    idCategoria: parseIntSafe(document.getElementById("idCategoriaExtrato").value),
    idSubcategoria: parseIntSafe(document.getElementById("idSubcategoriaExtrato").value),
    idProduto: parseIntSafe(document.getElementById("idProdutoExtrato").value)
  };

  // Validar se idProduto foi selecionado
  if (!dados.idProduto) {
    mostrarRespostaPopup("Selecione um produto válido!", false);
    return;
  }

  console.log('Dados do extrato a enviar:', dados);

  const url = id ? `${baseUrl}/extratos/${id}` : `${baseUrl}/extratos`;
  const method = id ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, { method, body: JSON.stringify(dados) });
    mostrarRespostaPopup("Extrato salvo com sucesso!", true);
    fecharModalExtrato();
    carregarExtratos();
  } catch (err) {
    console.error("Erro ao salvar extrato:", err);
    mostrarRespostaPopup("Erro ao salvar extrato: " + err.message, false);
  }
}

async function excluirExtrato(id) {
  mostrarModalConfirmacao("Deseja excluir este extrato?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/extratos/${id}`, { method: "DELETE" });
      mostrarRespostaPopup("Extrato excluído com sucesso.", true);
      carregarExtratos();
    } catch (err) {
      console.error("Erro ao excluir extrato:", err);
      mostrarRespostaPopup("Erro ao excluir extrato.", false);
    }
  });
}

async function carregarExtratos() {
  try {
    console.log("Carregando extratos...");
    const res = await fetchData(`${baseUrl}/extratos`);

    // Normalizar dados vindos da API
    if (res.status && res.data) {
      todosExtratos = res.data;
    } else if (res.extratos) {
      todosExtratos = res.extratos;
    } else if (Array.isArray(res)) {
      todosExtratos = res;
    } else {
      todosExtratos = [];
    }

    console.log("Extratos carregados:", todosExtratos.length);

    aplicarFiltros('extratos');
    carregarKPIsFinanceiros();

  } catch (error) {
    console.error("Erro ao carregar extratos:", error);
    todosExtratos = [];
    mostrarRespostaPopup("Erro ao carregar extratos", false);
  }
}


function renderizarTabelaExtratos(extratosParaRenderizar) {
  if (!elements.tbodyExtratos) {
    console.error("Tbody extratos não encontrado!");
    return;
  }

  const extratos = extratosParaRenderizar || todosExtratos;
  console.log("Renderizando extratos:", extratos.length);

  elements.tbodyExtratos.innerHTML = "";

  if (extratos.length === 0) {
    elements.tbodyExtratos.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Nenhum extrato encontrado.</td></tr>';
    return;
  }

  extratos.forEach(e => {
    const tr = document.createElement("tr");

    const tituloExtrato = e.tituloExtrato || e.titulo || 'Sem título';
    const descricaoExtrato = e.descricaoExtrato || e.descricao || '-';
    const valorExtrato = parseFloat(e.valorExtrato || e.valor || 0);
    const dataExtrato = e.dataExtrato || e.data;
    const tipoExtrato = e.tipoExtrato || e.tipo || '-';

    const nomeProduto = obterNomeProduto(e.idProduto);
    const nomeCategoria = obterNomeCategoria(e.idCategoria);
    const nomeSubcategoria = obterNomeSubcategoria(e.idSubcategoria);
    const tituloLancamento = obterTituloLancamento(e.idLancamento);

    tr.innerHTML = `
      <td><strong>${escaparHTML(tituloExtrato)}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
          title="${escaparHTML(descricaoExtrato)}">${escaparHTML(descricaoExtrato)}</td>
      <td><strong>R$ ${valorExtrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${formatarData(dataExtrato)}</td>
      <td>${escaparHTML(tipoExtrato)}</td>
      <td>${escaparHTML(nomeProduto)}</td>
      <td>${escaparHTML(nomeCategoria)}<br><small style="color: var(--muted-foreground);">${escaparHTML(nomeSubcategoria)}</small></td>
      <td>${escaparHTML(tituloLancamento)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarExtrato(${e.idExtrato})" title="Editar">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirExtrato(${e.idExtrato})" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    elements.tbodyExtratos.appendChild(tr);
  });

  atualizarIconesLucide();
}


/* ---------- PRODUTOS CRUD ---------- */function abrirModalCriarProduto() {
  const form = document.getElementById("formProduto");
  if (form) form.reset();

  document.getElementById("idProduto").value = "";
  document.getElementById("tituloModalProduto").textContent = "Novo Produto";

  preencherSelectSegmentos("idSegmentoProduto");
  preencherSelectSubsegmentos("idSubsegmentoProduto"); // Preencher vazio inicialmente

  if (elements.modais.produto) {
    elements.modais.produto.classList.remove("oculto");
  }
}

function fecharModalProduto() {
  if (elements.modais.produto) {
    elements.modais.produto.classList.add("oculto");
  }
}

async function editarProduto(id) {
  const produto = todosProdutos.find(p => p.idProduto === id);
  if (!produto) {
    mostrarRespostaPopup("Produto não encontrado.", false);
    return;
  }

  document.getElementById("idProduto").value = produto.idProduto;
  document.getElementById("nomeProduto").value = produto.nomeProduto || "";
  document.getElementById("custoProduto").value = produto.custoProduto || "";

  preencherSelectSegmentos("idSegmentoProduto");
  document.getElementById("idSegmentoProduto").value = produto.idSegmento || "";

  preencherSelectSubsegmentos("idSubsegmentoProduto", produto.idSegmento);
  document.getElementById("idSubsegmentoProduto").value = produto.idSubsegmento || "";

  document.getElementById("tituloModalProduto").textContent = "Editar Produto";

  if (elements.modais.produto) {
    elements.modais.produto.classList.remove("oculto");
  }
}

async function salvarProduto(ev) {
  ev.preventDefault();

  const id = document.getElementById("idProduto").value;
  const dados = {
    nomeProduto: document.getElementById("nomeProduto").value,
    custoProduto: parseFloat(document.getElementById("custoProduto").value || 0),
    idSegmento: parseInt(document.getElementById("idSegmentoProduto").value) || null,
    idSubsegmento: parseInt(document.getElementById("idSubsegmentoProduto").value) || null
  };

  const url = id ? `${baseUrl}/produtos/${id}` : `${baseUrl}/produtos`;
  const method = id ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, { method, body: JSON.stringify(dados) });
    mostrarRespostaPopup("Produto salvo com sucesso!", true);
    fecharModalProduto();
    await carregarProdutos();
  } catch (err) {
    console.error("Erro ao salvar produto:", err);
    mostrarRespostaPopup("Erro ao salvar produto: " + err.message, false);
  }
}

async function excluirProduto(id) {
  mostrarModalConfirmacao("Excluir produto?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/produtos/${id}`, { method: "DELETE" });
      mostrarRespostaPopup("Produto excluído com sucesso.", true);
      await carregarProdutos();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      mostrarRespostaPopup("Erro ao excluir produto.", false);
    }
  });
}

async function carregarProdutos() {
  try {
    const res = await fetchData(`${baseUrl}/produtos`);
    todosProdutos = res.data || [];
    console.log(`Produtos carregados: ${todosProdutos.length}`, todosProdutos);
    aplicarFiltros('produtos');
    gerarGraficoProdutosCusto();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    mostrarRespostaPopup("Erro ao carregar produtos", false);
  }
}

function renderizarTabelaProdutos(produtosParaRenderizar) {
  if (!elements.tbodyProdutos) {
    console.error("Tbody produtos não encontrado!");
    return;
  }

  const produtos = produtosParaRenderizar || todosProdutos;

  elements.tbodyProdutos.innerHTML = "";

  if (produtos.length === 0) {
    elements.tbodyProdutos.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum produto encontrado.</td></tr>';
    return;
  }

  produtos.forEach(p => {
    const tr = document.createElement("tr");

    const nomeSegmento = obterNomeSegmento(p.idSegmento);
    const nomeSubsegmento = obterNomeSubsegmento(p.idSubsegmento);

    tr.innerHTML = `
      <td><strong>${escaparHTML(p.nomeProduto || 'Sem nome')}</strong></td>
      <td><strong>R$ ${parseFloat(p.custoProduto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${escaparHTML(nomeSegmento)}</td>
      <td>${escaparHTML(nomeSubsegmento)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarProduto(${p.idProduto})">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirProduto(${p.idProduto})">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    elements.tbodyProdutos.appendChild(tr);
  });

  atualizarIconesLucide();
}

function gerarGraficoProdutosCusto() {
  const ctx = document.getElementById("graficoProdutosCusto");
  if (!ctx) return;

  if (graficoInstances.produtosCusto) {
    graficoInstances.produtosCusto.destroy();
  }

  if (todosProdutos.length === 0) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  const labels = todosProdutos.map(p => p.nomeProduto || 'Sem nome');
  const data = todosProdutos.map(p => parseFloat(p.custoProduto || 0));

  graficoInstances.produtosCusto = new Chart(ctx.getContext("2d"), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Custo',
        data,
        backgroundColor: 'hsla(230, 75%, 58%, 0.8)',
        borderColor: 'hsl(230, 75%, 48%)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          callbacks: {
            label: function (context) {
              return `Custo: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { maxRotation: 45 }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `R$ ${value.toLocaleString('pt-BR')}`
          }
        }
      }
    }
  });
}

/* ---------- ÍNDICES CRUD ---------- */
function abrirModalCriarIndice() {
  const form = document.getElementById("formIndice");
  if (form) form.reset();

  document.getElementById("idIndice").value = "";
  document.getElementById("tituloModalIndice").textContent = "Novo Índice";

  preencherSelectSubsegmentos("idSubsegmentoIndice");

  if (elements.modais.indice) {
    elements.modais.indice.classList.remove("oculto");
  }
}

function fecharModalIndice() {
  if (elements.modais.indice) {
    elements.modais.indice.classList.add("oculto");
  }
}

async function editarIndice(id) {
  const indice = todosIndices.find(i => i.idIndice === id);
  if (!indice) {
    mostrarRespostaPopup("Índice não encontrado.", false);
    return;
  }

  document.getElementById("idIndice").value = indice.idIndice;
  document.getElementById("nomeIndice").value = indice.nomeIndice || "";
  document.getElementById("taxaIndice").value = indice.taxaIndice || "";
  document.getElementById("anoIndice").value = indice.anoIndice || "";

  // ADICIONAR - precisamos descobrir o idSegmento do subsegmento
  const subsegmento = todosSubsegmentos.find(s => s.idSubsegmento == indice.idSubsegmento);
  const idSegmento = subsegmento ? subsegmento.idSegmento : null;


  preencherSelectSubsegmentos("idSubsegmentoIndice", idSegmento);
  document.getElementById("idSubsegmentoIndice").value = indice.idSubsegmento || "";

  document.getElementById("tituloModalIndice").textContent = "Editar Índice";

  if (elements.modais.indice) {
    elements.modais.indice.classList.remove("oculto");
  }
}

async function salvarIndice(ev) {
  ev.preventDefault();

  const id = document.getElementById("idIndice").value;
  const dados = {
    nomeIndice: document.getElementById("nomeIndice").value,
    taxaIndice: parseFloat(document.getElementById("taxaIndice").value || 0),
    anoIndice: parseInt(document.getElementById("anoIndice").value) || null,
    idSubsegmento: parseInt(document.getElementById("idSubsegmentoIndice").value) || null
  };

  const url = id ? `${baseUrl}/indices/${id}` : `${baseUrl}/indices`;
  const method = id ? "PUT" : "POST";

  try {
    await fetchWithAuth(url, { method, body: JSON.stringify(dados) });
    mostrarRespostaPopup("Índice salvo com sucesso!", true);
    fecharModalIndice();
    carregarIndices();
  } catch (err) {
    console.error("Erro ao salvar índice:", err);
    mostrarRespostaPopup("Erro ao salvar índice: " + err.message, false);
  }
}

async function excluirIndice(id) {
  mostrarModalConfirmacao("Excluir índice?", async () => {
    try {
      await fetchWithAuth(`${baseUrl}/indices/${id}`, { method: "DELETE" });
      mostrarRespostaPopup("Índice excluído com sucesso.", true);
      carregarIndices();
    } catch (err) {
      console.error("Erro ao excluir índice:", err);
      mostrarRespostaPopup("Erro ao excluir índice.", false);
    }
  });
}

async function carregarIndices() {
  try {
    const res = await fetchData(`${baseUrl}/indices`);
    todosIndices = res.data || [];
    aplicarFiltros('indices');
    gerarGraficoIndicesTaxas();
  } catch (error) {
    console.error("Erro ao carregar índices:", error);
    mostrarRespostaPopup("Erro ao carregar índices", false);
  }
}

function renderizarTabelaIndices(indicesParaRenderizar) {
  if (!elements.tbodyIndices) {
    console.error("Tbody índices não encontrado!");
    return;
  }

  const indices = indicesParaRenderizar || todosIndices;
  console.log("Renderizando índices:", indices.length);

  elements.tbodyIndices.innerHTML = "";

  if (indices.length === 0) {
    elements.tbodyIndices.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum índice encontrado.</td></tr>';
    return;
  }

  indices.forEach(i => {
    const tr = document.createElement("tr");
    const nomeSubsegmento = obterNomeSubsegmento(i.idSubsegmento);

    tr.innerHTML = `
      <td><strong>${escaparHTML(i.nomeIndice || 'Sem nome')}</strong></td>
      <td>${i.taxaIndice || '-'}%</td>
      <td>${i.anoIndice || '-'}</td>
      <td>${escaparHTML(nomeSubsegmento)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editarIndice(${i.idIndice})">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-action btn-secondary-action" onclick="excluirIndice(${i.idIndice})">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    elements.tbodyIndices.appendChild(tr);
  });

  atualizarIconesLucide();
}

function gerarGraficoIndicesTaxas() {
  const ctx = document.getElementById("graficoIndicesTaxas");
  if (!ctx) return;

  if (graficoInstances.indicesTaxas) {
    graficoInstances.indicesTaxas.destroy();
  }

  if (todosIndices.length === 0) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';

  const labels = todosIndices.map(i => `${i.nomeIndice || 'Sem nome'} (${i.anoIndice || 'S/A'})`);
  const data = todosIndices.map(i => parseFloat(i.taxaIndice || 0));

  graficoInstances.indicesTaxas = new Chart(ctx.getContext("2d"), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Taxa',
        data,
        fill: false,
        borderColor: 'hsl(230, 75%, 58%)',
        backgroundColor: 'hsla(230, 75%, 58%, 0.1)',
        tension: 0.2,
        pointBackgroundColor: 'hsl(230, 75%, 58%)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          callbacks: {
            label: function (context) {
              return `Taxa: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { maxRotation: 45 }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value}%`
          }
        }
      }
    }
  });
}

/* ---------- PERFIL DE USUÁRIO ---------- */
async function carregarPerfil() {
  if (!userId) {
    console.error("ID do usuário não encontrado no token");
    return;
  }

  try {
    const res = await fetchWithAuth(`${baseUrl}/usuarios/${userId}`);
    const user = res.data || res.usuario || res;

    const nomeInput = document.getElementById("nomeUsuario");
    const emailInput = document.getElementById("emailUsuario");

    if (nomeInput) nomeInput.value = user.nomeUsuario || "";
    if (emailInput) emailInput.value = user.emailUsuario || "";

    dataCadastroAtual = user.dataCadastro || null;
    idCargoAtual = user.idCargo || null;

  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
    mostrarRespostaPopup("Erro ao carregar dados do perfil", false);
  }
}

async function atualizarPerfil(ev) {
  ev.preventDefault();

  if (!userId) {
    mostrarRespostaPopup("Usuário não identificado. Faça login novamente.", false);
    return;
  }

  const nome = document.getElementById("nomeUsuario")?.value;
  const email = document.getElementById("emailUsuario")?.value;
  const senha = document.getElementById("senhaUsuario")?.value;

  const corpo = {
    nomeUsuario: nome,
    emailUsuario: email
  };

  if (dataCadastroAtual) corpo.dataCadastro = dataCadastroAtual;
  if (idCargoAtual) corpo.idCargo = idCargoAtual;
  if (senha && senha.trim() !== "") corpo.senhaUsuario = senha;

  try {
    await fetchWithAuth(`${baseUrl}/usuarios/${userId}`, {
      method: "PUT",
      body: JSON.stringify(corpo)
    });

    mostrarRespostaPopup("Perfil atualizado com sucesso!", true);

    const senhaInput = document.getElementById("senhaUsuario");
    if (senhaInput) senhaInput.value = "";

  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    mostrarRespostaPopup("Erro ao atualizar perfil: " + err.message, false);
  }
}

/* ---------- CALENDÁRIO ---------- */
async function buscarTarefasDoUsuario() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/usuariostarefas/${userId}`);
    const tarefas = res.associacoes || [];
    const eventos = [];

    for (const rel of tarefas) {
      const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
      if (tarefa && tarefa.dataInicio) {
        const dataISO = new Date(tarefa.dataInicio).toISOString().split('T')[0];
        eventos.push({
          title: tarefa.tituloTarefa || 'Tarefa sem título',
          descricao: tarefa.descricaoTarefa || '',
          date: dataISO
        });
      }
    }

    return eventos;
  } catch (err) {
    console.error("Erro ao buscar tarefas do usuário:", err);
    return [];
  }
}

function inicializarCalendario() {
  const calendarioEl = document.getElementById("calendario");
  if (!calendarioEl) return;

  if (calendarioInstancia) {
    calendarioInstancia.destroy();
    calendarioInstancia = null;
  }

  calendarioInstancia = new FullCalendar.Calendar(calendarioEl, {
    initialView: "dayGridMonth",
    locale: "pt-br",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,listWeek"
    },
    height: 'auto',
    dateClick: function (info) {
      mostrarModalRecado(info.dateStr, anotacao => {
        const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuarioFinanceiro") || "[]");
        const novoEvento = {
          title: anotacao,
          date: info.dateStr,
          id: Date.now().toString()
        };
        eventosSalvos.push(novoEvento);
        localStorage.setItem("eventosUsuarioFinanceiro", JSON.stringify(eventosSalvos));
        calendarioInstancia.addEvent(novoEvento);
        mostrarRespostaPopup("Evento adicionado ao calendário!", true);
      });
    },
    eventClick: function (info) {
      const isTask = info.event.id && String(info.event.id).startsWith("task-");

      if (isTask) {
        mostrarModalDetalhes(
          info.event.title,
          info.event.extendedProps?.descricao || 'Nenhuma descrição disponível.'
        );
      } else {
        mostrarModalConfirmacao(
          `Deseja excluir o evento '${info.event.title}'?`,
          () => {
            info.event.remove();
            const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuarioFinanceiro") || "[]");
            const eventosAtualizados = eventosSalvos.filter(ev => ev.id !== info.event.id);
            localStorage.setItem("eventosUsuarioFinanceiro", JSON.stringify(eventosAtualizados));
            mostrarRespostaPopup("Evento removido do calendário!", true);
          }
        );
      }
    }
  });

  Promise.all([
    buscarTarefasDoUsuario(),
    Promise.resolve(JSON.parse(localStorage.getItem("eventosUsuarioFinanceiro") || "[]"))
  ]).then(([tarefas, eventosSalvos]) => {
    tarefas.forEach(t => {
      calendarioInstancia.addEvent({
        title: t.title,
        date: t.date,
        extendedProps: { descricao: t.descricao },
        id: `task-${t.title}-${t.date}`,
        backgroundColor: 'hsl(230, 75%, 58%)',
        borderColor: 'hsl(230, 75%, 48%)'
      });
    });

    eventosSalvos.forEach(e => {
      calendarioInstancia.addEvent({
        ...e,
        backgroundColor: 'hsl(45, 93%, 58%)',
        borderColor: 'hsl(45, 93%, 48%)'
      });
    });

    calendarioInstancia.render();
  }).catch(error => {
    console.error("Erro ao carregar eventos do calendário:", error);
  });
}

/* ---------- EXPORTAÇÃO XML ---------- */
async function gerarXMLFinanceiro() {
  try {
    mostrarRespostaPopup("Gerando arquivo XML...", true, 1000);

    const [lancRes, extrRes, prodRes, indRes] = await Promise.all([
      fetchData(`${baseUrl}/lancamentos`),
      fetchData(`${baseUrl}/extratos`),
      fetchData(`${baseUrl}/produtos`),
      fetchData(`${baseUrl}/indices`)
    ]);

    const xmlContent = construirXMLFinanceiro({
      lancamentos: lancRes.data || [],
      extratos: extrRes.data || [],
      produtos: prodRes.data || [],
      indices: indRes.data || []
    });

    baixarArquivo(xmlContent, 'relatorio_financeiro.xml', 'application/xml');
    mostrarRespostaPopup("Arquivo XML exportado com sucesso!", true);

  } catch (err) {
    console.error("Erro ao gerar XML:", err);
    mostrarRespostaPopup("Erro ao gerar arquivo XML: " + err.message, false);
  }
}

function construirXMLFinanceiro({ lancamentos, extratos, produtos, indices }) {
  const dataExportacao = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<relatorio_financeiro data_exportacao="${dataExportacao}">
  <resumo>
    <total_lancamentos>${lancamentos.length}</total_lancamentos>
    <total_extratos>${extratos.length}</total_extratos>
    <total_produtos>${produtos.length}</total_produtos>
    <total_indices>${indices.length}</total_indices>
  </resumo>

  <lancamentos>`;

  lancamentos.forEach(l => {
    xml += `
    <lancamento>
      <id>${l.idLancamento}</id>
      <titulo>${escapeXml(l.tituloLancamento || "")}</titulo>
      <descricao>${escapeXml(l.descricaoLancamento || "")}</descricao>
      <valor>${l.valorLancamento || 0}</valor>
      <vencimento>${l.vencimentoLancamento || ""}</vencimento>
      <status>${escapeXml(l.statusLancamento || "")}</status>
      <classificacao>${escapeXml(l.classificacaoLancamento || "")}</classificacao>
    </lancamento>`;
  });

  xml += `
  </lancamentos>

  <extratos>`;

  extratos.forEach(e => {
    xml += `
    <extrato>
      <id>${e.idExtrato}</id>
      <tipo>${escapeXml(e.tipoExtrato || "")}</tipo>
      <valor>${e.valorExtrato || 0}</valor>
      <data>${e.dataExtrato || ""}</data>
      <produto>${e.idProduto || ""}</produto>
    </extrato>`;
  });

  xml += `
  </extratos>

  <produtos>`;

  produtos.forEach(p => {
    xml += `
    <produto>
      <id>${p.idProduto}</id>
      <nome>${escapeXml(p.nomeProduto || "")}</nome>
      <custo>${p.custoProduto || 0}</custo>
      <segmento>${p.idSegmento || ""}</segmento>
    </produto>`;
  });

  xml += `
  </produtos>

  <indices>`;

  indices.forEach(i => {
    xml += `
    <indice>
      <id>${i.idIndice}</id>
      <nome>${escapeXml(i.nomeIndice || "")}</nome>
      <taxa>${i.taxaIndice || 0}</taxa>
      <ano>${i.anoIndice || ""}</ano>
    </indice>`;
  });

  xml += `
  </indices>
</relatorio_financeiro>`;

  return xml;
}

function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* ---------- LIMPEZA ---------- */
window.addEventListener('beforeunload', () => {
  Object.values(graficoInstances).forEach(instance => {
    if (instance) {
      instance.destroy();
    }
  });

  if (calendarioInstancia) {
    calendarioInstancia.destroy();
  }
});

console.log("Dashboard Financeiro carregado e pronto para uso!");