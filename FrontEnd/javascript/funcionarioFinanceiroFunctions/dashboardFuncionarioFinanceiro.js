

/* ---------- CONFIGURAÇÕES E UTILITÁRIOS ---------- */
const baseUrl=  'http://localhost:3000';

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

/* ---------- ESTADO GLOBAL ---------- */
const userId = pegarUserIdDoToken();
let dataCadastroAtual = null;
let idCargoAtual = null;
let calendarioInstancia = null;

// Dados em cache
let todosLancamentos = [];
let todosExtratos = [];
let todosIndices = [];
let todosProdutos = [];
let todasTarefas = [];
let todasCategorias = [];
let todasSubcategorias = [];
let todasTarefasComTitulo = [];
let todosSegmentos = [];
let todosSubsegmentos = [];

// Filtros ativos por seção
let filtrosAtivos = {
  tarefas: {},
  lancamentos: {},
  extratos: {},
  indices: {},
  produtos: {}
};

// Instâncias de gráficos
let graficoInstances = {
  tarefas: null,
  fluxoCaixa: null,
  lancamentosStatus: null,
  lancamentosClassificacao: null,
  extratosTipo: null,
  indicesTaxas: null,
  produtosCusto: null
};

/* ---------- ELEMENTOS DOM ---------- */
const elements = {
  tbodyTarefas: document.getElementById("tbodyTarefas"),
  postit: document.getElementById("postit"),
  formEditar: document.getElementById("formEditarRelacao"),
  idTarefaSelecionada: document.getElementById("idTarefaSelecionada"),
  txtStatusEditar: document.getElementById("txtStatusEditar"),
  tbodyLancamentos: document.getElementById("tbodyLancamentos"),
  tbodyExtratos: document.getElementById("tbodyExtratos"),
  tbodyIndices: document.getElementById("tbodyIndices"),
  tbodyProdutos: document.getElementById("tbodyProdutos"),
  totalReceitasMes: document.getElementById("totalReceitasMes"),
  totalDespesasMes: document.getElementById("totalDespesasMes"),
  saldoAtual: document.getElementById("saldoAtual"),
  lancamentosEmAbertoCount: document.getElementById("lancamentosEmAbertoCount"),
  modais: {
    lancamento: document.getElementById("modalLancamento"),
    extrato: document.getElementById("modalExtrato"),
    produto: document.getElementById("modalProduto"),
    indice: document.getElementById("modalIndice")
  }
};

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

function formatarStatus(status) {
  const s = (status || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  switch (s) {
    case "pendente": return "Pendente";
    case "em andamento": return "Em andamento";
    case "concluida": return "Concluída";
    default: return status || "Indefinido";
  }
}

function obterCorPrioridade(prioridade) {
  switch ((prioridade || "").toLowerCase()) {
    case "alta": return "vermelha";
    case "media":
    case "média": return "amarela";
    case "baixa": return "verde";
    default: return "cinza";
  }
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
    return { status: true, data: res };
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
    return { status: false, message: err.message || "Erro desconhecido", data: [] };
  }
}

/* ---------- CARREGAMENTO DE CATEGORIAS, SUBCATEGORIAS E TAREFAS ---------- */
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
    const data = await fetchWithAuth(`${baseUrl}/usuariostarefas/${userId}`);
    const associacoes = data.associacoes || [];

    todasTarefasComTitulo = [];

    for (const rel of associacoes) {
      const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
      todasTarefasComTitulo.push({
        idTarefa: rel.tarefas_idTarefa,
        tituloTarefa: tarefa.tituloTarefa || 'Sem título'
      });
    }

    console.log("Tarefas com título carregadas:", todasTarefasComTitulo);
  } catch (err) {
    console.error("Erro ao carregar tarefas com título:", err);
    todasTarefasComTitulo = [];
  }
}

async function carregarSegmentos() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/segmentos`);
    todosSegmentos = res.data || [];
    console.log("Segmentos carregados:", todosSegmentos);
  } catch (err) {
    console.error("Erro ao carregar segmentos:", err);
    todosSegmentos = [];
  }
}

async function carregarSubsegmentos() {
  try {
    const res = await fetchWithAuth(`${baseUrl}/subsegmentos`);
    todosSubsegmentos = res.data || [];
    console.log("Subsegmentos carregados:", todosSubsegmentos);
  } catch (err) {
    console.error("Erro ao carregar subsegmentos:", err);
    todosSubsegmentos = [];
  }
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
  // Para Produtos
  const selectSegmentoProduto = document.getElementById("idSegmentoProduto");
  const selectSubsegmentoProduto = document.getElementById("idSubsegmentoProduto");

  if (selectSegmentoProduto && selectSubsegmentoProduto) {
    selectSegmentoProduto.addEventListener("change", (e) => {
      const idSegmento = e.target.value;
      preencherSelectSubsegmentos("idSubsegmentoProduto", idSegmento || null);
    });
  }

  // Para Índices
  const selectSegmentoIndice = document.getElementById("idSegmentoIndice");
  const selectSubsegmentoIndice = document.getElementById("idSubsegmentoIndice");

  if (selectSegmentoIndice && selectSubsegmentoIndice) {
    selectSegmentoIndice.addEventListener("change", (e) => {
      const idSegmento = e.target.value;
      preencherSelectSubsegmentos("idSubsegmentoIndice", idSegmento || null);
    });
  }
}

/* ---------- FUNÇÕES PARA MODAIS DINÂMICOS ---------- */
// Função global para mostrar modal de confirmação
window.mostrarModalConfirmacao = function (mensagem, onConfirmar) {
  const modal = document.getElementById("modalConfirmacaoFinanceiro");
  if (!modal) return;

  const texto = modal.querySelector("#modal-confirmacao-text");
  const btnConfirmar = modal.querySelector("#confirmar-acao");

  if (texto) texto.textContent = mensagem;

  // Remove listeners anteriores
  const novoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);

  novoBtn.onclick = () => {
    modal.classList.add("oculto");
    if (onConfirmar) onConfirmar();
  };

  modal.classList.remove("oculto");
};

// Função global para mostrar modal de recado
window.mostrarModalRecado = function (dateStr, onSave) {
  const modal = document.getElementById("modalRecadoFinanceiro");
  if (!modal) return;

  const dataSpan = modal.querySelector("#data-evento");
  const textoInput = modal.querySelector("#texto-evento");
  const btnSalvar = modal.querySelector("#salvar-evento");

  if (dataSpan) dataSpan.textContent = new Date(dateStr).toLocaleDateString('pt-BR');
  if (textoInput) textoInput.value = "";

  // Remove listeners anteriores
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

// Função global para mostrar modal de conclusão
window.mostrarModalConclusao = function (mensagem, onConfirmar) {
  const modal = document.getElementById("modalConclusaoFinanceiro");
  if (!modal) return;

  const texto = modal.querySelector("#modal-conclusao-text");
  const btnConfirmar = modal.querySelector("#confirmar-conclusao");

  if (texto) texto.textContent = mensagem;

  // Remove listeners anteriores
  const novoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);

  novoBtn.onclick = () => {
    modal.classList.add("oculto");
    if (onConfirmar) onConfirmar();
  };

  modal.classList.remove("oculto");
};

// Função global para mostrar detalhes
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

function obterNomeSegmento(idSegmento) {
  if (!idSegmento) return '-';
  const segmento = todosSegmentos.find(s => s.idSegmento == idSegmento);
  return segmento ? segmento.nomeSegmento : `Segmento ${idSegmento}`;
}

function obterNomeSubsegmento(idSubsegmento) {
  if (!idSubsegmento) return '-';
  const subsegmento = todosSubsegmentos.find(s => s.idSubsegmento == idSubsegmento);
  return subsegmento ? subsegmento.nomeSubsegmento : `Subsegmento ${idSubsegmento}`;
}

// realizarLogoutSeguroFinanceiro (aguarda confirmação e só então faz cleanup + redirect)
function realizarLogoutSeguroFinanceiro() {
  try {
    window.mostrarModalConfirmacao("Deseja realmente sair do sistema?", () => {
      mostrarModalRedirecionamento();

      try {
        setTimeout(() => {
          try { localStorage.removeItem("authToken"); } catch (e) { /* ignore */ }
          try { sessionStorage.clear(); } catch (e) { /* ignore */ }

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
            try { localStorage.removeItem(chave); } catch (e) { /* ignore */ }
          });

          try {
            if (typeof graficoInstances === "object" && graficoInstances) {
              Object.values(graficoInstances).forEach(inst => { if (inst && inst.destroy) inst.destroy(); });
            }
          } catch (e) { /* ignore */ }

          try {
            if (typeof calendarioInstancia === "object" && calendarioInstancia && calendarioInstancia.destroy) {
              calendarioInstancia.destroy();
            }
          } catch (e) { /* ignore */ }

          console.log(`[${new Date().toISOString()}] Logout seguro realizado pelo funcionário financeiro`);

          setTimeout(() => {
            window.location.replace("../../html/login.html");
          }, 1200);
        }, 350);
      } catch (erroInterno) {
        console.error("Erro durante processo final de logout:", erroInterno);
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* ignore */ }
        setTimeout(() => { window.location.replace("../../html/login.html"); }, 1000);
      }
    });
  } catch (erro) {
    console.error("Erro ao iniciar logout seguro:", erro);
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* ignore */ }
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
  if (elements.formEditar) {
    elements.formEditar.addEventListener("submit", handleEditarTarefa);
  }

  configurarSeletoresFiltros();
  configurarBotoesLimparFiltros();

  const formsHandlers = {
    'formLancamento': salvarLancamento,
    'formExtrato': salvarExtrato,
    'formProduto': salvarProduto,
    'formIndice': salvarIndice,
    'formPerfil': atualizarPerfil
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

  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', () => {
      document.getElementById("formEditarContainer")?.classList.add("oculto");
    });
  }

  const btnLogout = document.getElementById("logoutBtn") || document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Logout clicado — abrindo modal de confirmação");
      realizarLogoutSeguroFinanceiro();
    });
  } else {
    console.warn("Botão de logout não encontrado ao configurar listeners.");
  }

  configurarBotoesModais();
  configurarListenersCategoriaSubcategoria();
  configurarListenersSegmentoSubsegmento(); // ADICIONAR

}

function configurarSeletoresFiltros() {
  const seletores = [
    'seletorFiltroTarefas',
    'seletorFiltroLancamentos',
    'seletorFiltroExtratos',
    'seletorFiltroIndices',
    'seletorFiltroProdutos'
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
    'btnLimparFiltrosTarefas',
    'btnLimparFiltrosLancamentos',
    'btnLimparFiltrosExtratos',
    'btnLimparFiltrosIndices',
    'btnLimparFiltrosProdutos'
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
}

async function inicializarDashboard() {
  try {
    const token = obterToken();
    if (!token) {
      console.log("Token inválido ou expirado, redirecionando...");
      mostrarRespostaPopup("Sessão expirada. Redirecionando...", false, 2000);
      setTimeout(() => {
        window.location.replace("../../html/login.html");
      }, 2000);
      return;
    }

    // Carregar produtos e lançamentos ANTES de tudo
    await carregarProdutos();
    await carregarLancamentos();

    await Promise.all([
      carregarTarefas(),
      carregarPostit(),
      carregarPerfil(),
      carregarCategorias(),
      carregarSubcategorias(),
      carregarTarefasComTitulo(),
      carregarSegmentos(),
      carregarSubsegmentos()
    ]);

    mostrarPainel('tarefas');
    console.log("Dashboard inicializado com sucesso!");
    console.log(`Produtos carregados: ${todosProdutos.length}`);
    console.log(`Lançamentos carregados: ${todosLancamentos.length}`);
  } catch (error) {
    console.error("Erro na inicialização:", error);

    if (error.message.includes("Token") || error.message.includes("Sessão")) {
      mostrarRespostaPopup("Erro de autenticação. Redirecionando...", false, 2000);
      setTimeout(() => {
        window.location.replace("../../html/login.html");
      }, 2000);
    } else {
      mostrarRespostaPopup("Erro ao inicializar dashboard", false);
    }
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
function mostrarPainel(secao) {
  document.querySelectorAll('.btn-nav').forEach(btn => {
    btn.classList.remove('ativo', 'active');
    if (btn.dataset.secao === secao) btn.classList.add('ativo', 'active');
  });

  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
    section.classList.add('oculto');
  });

  const painel = document.getElementById(`painel-${secao}`);
  if (!painel) {
    console.warn(`Painel não encontrado: painel-${secao}`);
    return;
  }

  painel.classList.add('active');
  painel.classList.remove('oculto');

  switch (secao) {
    case "tarefas":
      aplicarFiltros('tarefas');
      break;
    case "visao-geral":
      carregarTarefas();
      break;
    case "visao-geral-financeira":
      carregarDashboardFinanceiro();
      break;
    case "lancamentos":
      carregarLancamentos();
      break;
    case "extratos":
      carregarExtratos();
      break;
    case "indices":
      carregarIndices();
      break;
    case "produtos":
      carregarProdutos();
      break;
    case "calendario":
      inicializarCalendario();
      break;
    case "perfil":
      carregarPerfil();
      break;
  }
}

async function carregarDashboardFinanceiro() {
  await Promise.all([
    carregarKPIsFinanceiros(),
    carregarFluxoCaixaMensal(),
    carregarGraficosFinanceiros()
  ]);
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

/* ---------- GESTÃO DE TAREFAS ---------- */
async function handleEditarTarefa(e) {
  e.preventDefault();
  const id = elements.idTarefaSelecionada.value;
  const status = elements.txtStatusEditar.value;

  if (status === "Concluída") {
    const tarefa = await buscarTarefa(id);
    const tituloTarefa = tarefa.tituloTarefa || 'Tarefa';

    mostrarModalConclusao(
      `Deseja marcar a tarefa '${tituloTarefa}' como Concluída?`,
      () => updateTaskStatus(id, status)
    );
  } else {
    await updateTaskStatus(id, status);
  }
}

async function updateTaskStatus(id, status) {
  try {
    await fetchWithAuth(`${baseUrl}/usuariostarefas/tarefa/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });

    mostrarRespostaPopup("Status atualizado com sucesso!", true);
    await carregarTarefas();
    document.getElementById("formEditarContainer")?.classList.add("oculto");
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    mostrarRespostaPopup("Erro ao atualizar status: " + err.message, false);
  }
}

async function carregarTarefas() {
  try {
    const data = await fetchWithAuth(`${baseUrl}/usuariostarefas/${userId}`);
    const associacoes = data.associacoes || [];

    todasTarefas = [];

    for (const rel of associacoes) {
      const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
      todasTarefas.push({
        ...rel,
        tarefa: tarefa
      });
    }

    aplicarFiltros('tarefas');
  } catch (err) {
    console.error('Erro ao carregar tarefas:', err);
    mostrarRespostaPopup('Erro ao carregar tarefas: ' + err.message, false);
  }
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

function editarStatus(id, status) {
  elements.idTarefaSelecionada.value = id;
  elements.txtStatusEditar.value = status;
  const container = document.getElementById("formEditarContainer");

  if (container) {
    container.classList.remove("oculto");
    container.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function fixarPostit(titulo) {
  if (!elements.postit) return;

  elements.postit.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span>📌 ${titulo}</span>
      <button onclick="removerPostit()" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer;">×</button>
    </div>
  `;
  elements.postit.classList.remove("oculto");
  localStorage.setItem("tarefaFixada", titulo);
}

function removerPostit() {
  if (!elements.postit) return;

  elements.postit.innerHTML = "";
  elements.postit.classList.add("oculto");
  localStorage.removeItem("tarefaFixada");
}

function carregarPostit() {
  const titulo = localStorage.getItem("tarefaFixada");
  if (titulo) {
    fixarPostit(titulo);
  }
}


function renderizarTabelaTarefas(tarefas) {
  elements.tbodyTarefas.innerHTML = "";
  let contadores = { Pendente: 0, "Em andamento": 0, "Concluída": 0 };

  tarefas.forEach(rel => {
    const tarefa = rel.tarefa;
    const statusFormatado = formatarStatus(rel.status);
    contadores[statusFormatado]++;

    const prioridadeClass = normalizar(tarefa.prioridadeTarefa || '');
    const corPrioridade = obterCorPrioridade(tarefa.prioridadeTarefa);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escaparHTML(tarefa.tituloTarefa || 'Sem título')}</strong></td>
      <td><span class="status-${statusFormatado.toLowerCase().replace(/\s+/g, '')}">${escaparHTML(statusFormatado)}</span></td>
      <td>${formatarDataExibicao(tarefa.dataInicio)}</td>
      <td>${formatarDataExibicao(tarefa.dataFim)}</td>
      <td><span class="bandeirinha ${corPrioridade}" title="Prioridade: ${tarefa.prioridadeTarefa || 'N/A'}"></span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="editarStatus(${rel.tarefas_idTarefa}, '${statusFormatado}')">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-action btn-secondary-action" onclick="fixarPostit('${escaparHTML(tarefa.tituloTarefa || '')}')">
            <i data-lucide="pin"></i>
          </button>
        </div>
      </td>
    `;
    elements.tbodyTarefas.appendChild(tr);
  });

  atualizarIconesLucide();
  gerarGraficoTarefas(contadores);

  if (typeof flatpickr !== 'undefined') {
    flatpickr(".data", {
      enableTime: true,
      dateFormat: "d/m/Y H:i",
      locale: "pt"
    });
  }
}

function gerarGraficoTarefas({ Pendente, "Em andamento": EmAndamento, "Concluída": Concluida }) {
  const ctx = document.getElementById("graficoTarefas");
  if (!ctx) return;

  if (graficoInstances.tarefas) {
    graficoInstances.tarefas.destroy();
  }

  const total = Pendente + EmAndamento + Concluida;
  if (total === 0) {
    ctx.style.display = 'none';
    return;
  }

  ctx.style.display = 'block';
  graficoInstances.tarefas = new Chart(ctx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Pendente", "Em Andamento", "Concluída"],
      datasets: [{
        data: [Pendente, EmAndamento, Concluida],
        backgroundColor: [
          "hsl(45, 93%, 58%)",
          "hsl(199, 89%, 48%)",
          "hsl(142, 69%, 58%)"
        ],
        borderWidth: 3,
        borderColor: "#fff",
        hoverBorderWidth: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              family: 'Inter',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function (context) {
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%',
      animation: {
        animateRotate: true,
        duration: 1000
      }
    }
  });
}

/* ---------- SISTEMA DE FILTROS ---------- */
function adicionarFiltro(secao, tipo) {
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

      case 'prioridade':
        titulo = '🚩 Prioridade';
        content = `
          <select id="filtro${capitalize(secao)}Prioridade">
            <option value="">Todas</option>
            <option value="Baixa" ${filtros[tipo].valor === 'Baixa' ? 'selected' : ''}>Baixa</option>
            <option value="Média" ${filtros[tipo].valor === 'Média' ? 'selected' : ''}>Média</option>
            <option value="Alta" ${filtros[tipo].valor === 'Alta' ? 'selected' : ''}>Alta</option>
          </select>
        `;
        break;

      case 'segmento':
        titulo = '📋 Segmento';
        content = `<input type="number" id="filtro${capitalize(secao)}Segmento" placeholder="ID Segmento" value="${filtros[tipo].valor || ''}" />`;
        break;

      case 'ano':
        titulo = '📅 Ano';
        content = `<input type="number" id="filtro${capitalize(secao)}Ano" placeholder="Ano" value="${filtros[tipo].valor || ''}" />`;
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

  const selectPrioridade = document.getElementById(`filtro${capitalize(secao)}Prioridade`);
  if (selectPrioridade) {
    selectPrioridade.addEventListener('change', (e) => {
      filtrosAtivos[secao].prioridade.valor = e.target.value;
      aplicarFiltros(secao);
    });
  }

  const inputSegmento = document.getElementById(`filtro${capitalize(secao)}Segmento`);
  if (inputSegmento) {
    inputSegmento.addEventListener('input', (e) => {
      filtrosAtivos[secao].segmento.valor = e.target.value;
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
}

function aplicarFiltros(secao) {
  let dadosOriginais = [];

  // Salva dados originais antes de filtrar
  switch (secao) {
    case 'tarefas':
      dadosOriginais = [...todasTarefas];
      break;
    case 'lancamentos':
      dadosOriginais = [...todosLancamentos];
      break;
    case 'extratos':
      dadosOriginais = [...todosExtratos];
      break;
    case 'indices':
      dadosOriginais = [...todosIndices];
      break;
    case 'produtos':
      dadosOriginais = [...todosProdutos];
      break;
  }

  let dados = [...dadosOriginais];
  const filtros = filtrosAtivos[secao];

  // Aplicar filtro de busca
  if (filtros.busca && filtros.busca.valor) {
    const busca = filtros.busca.valor.toLowerCase();
    dados = dados.filter(item => buscarEmObjeto(item, busca));
  }

  // Aplicar filtro de status
  if (filtros.status && filtros.status.valor) {
    dados = dados.filter(item => filtrarPorStatus(item, filtros.status.valor, secao));
  }

  // Aplicar filtro de classificação
  if (filtros.classificacao && filtros.classificacao.valor) {
    dados = dados.filter(item => normalizar(item.classificacaoLancamento) === normalizar(filtros.classificacao.valor));
  }

  // Aplicar filtro de tipo
  if (filtros.tipo && filtros.tipo.valor) {
    dados = dados.filter(item => normalizar(item.tipoExtrato) === normalizar(filtros.tipo.valor));
  }

  // Aplicar filtro de prioridade
  if (filtros.prioridade && filtros.prioridade.valor) {
    dados = dados.filter(item => {
      if (item.tarefa) {
        return item.tarefa.prioridadeTarefa === filtros.prioridade.valor;
      }
      return false;
    });
  }

  // Aplicar filtro de segmento
  if (filtros.segmento && filtros.segmento.valor) {
    dados = dados.filter(item => String(item.idSegmento) === String(filtros.segmento.valor));
  }

  // Aplicar filtro de ano
  if (filtros.ano && filtros.ano.valor) {
    dados = dados.filter(item => String(item.anoIndice) === String(filtros.ano.valor));
  }

  // Aplicar filtro de data
  if (filtros.data) {
    const { dataDe, dataAte } = filtros.data;
    dados = dados.filter(item => filtrarPorData(item, dataDe, dataAte, secao));
  }

  // Aplicar ordenação
  if (filtros.ordenar && filtros.ordenar.valor) {
    ordenarDados(dados, filtros.ordenar.valor, secao);
  }

  // Renderizar apenas os dados filtrados
  switch (secao) {
    case 'tarefas':
      renderizarTabelaTarefas(dados);
      break;
    case 'lancamentos':
      const lancamentosTemp = todosLancamentos;
      todosLancamentos = dados;
      renderizarTabelaLancamentos();
      todosLancamentos = lancamentosTemp; // Restaura dados originais
      break;
    case 'extratos':
      const extratosTemp = todosExtratos;
      todosExtratos = dados;
      renderizarTabelaExtratos();
      todosExtratos = extratosTemp; // Restaura dados originais
      break;
    case 'indices':
      const indicesTemp = todosIndices;
      todosIndices = dados;
      renderizarTabelaIndices();
      todosIndices = indicesTemp; // Restaura dados originais
      break;
    case 'produtos':
      const produtosTemp = todosProdutos;
      todosProdutos = dados;
      renderizarTabelaProdutos();
      todosProdutos = produtosTemp; // Restaura dados originais
      break;
  }
}

function limparFiltros(secao) {
  filtrosAtivos[secao] = {};
  renderizarFiltros(secao);
  aplicarFiltros(secao);
}

function buscarEmObjeto(obj, busca) {
  if (obj.tarefa) {
    return Object.values(obj.tarefa).some(val =>
      String(val).toLowerCase().includes(busca)
    );
  }
  return Object.values(obj).some(val =>
    String(val).toLowerCase().includes(busca)
  );
}

function filtrarPorStatus(item, status, secao) {
  switch (secao) {
    case 'tarefas':
      return formatarStatus(item.status) === status;
    case 'lancamentos':
      return normalizar(item.statusLancamento) === normalizar(status);
    default:
      return true;
  }
}

function filtrarPorData(item, dataDe, dataAte, secao) {
  let dataItem;

  switch (secao) {
    case 'tarefas':
      if (!item.tarefa) return true;
      dataItem = new Date(item.tarefa.dataInicio);
      break;
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
  dados.sort((a, b) => {
    const [campo, ordem] = criterio.split('-');
    let valA, valB;

    if (secao === 'tarefas' && a.tarefa && b.tarefa) {
      valA = a.tarefa[campo] || '';
      valB = b.tarefa[campo] || '';
    } else {
      valA = a[campo] || '';
      valB = b[campo] || '';
    }

    if (ordem === 'desc') [valA, valB] = [valB, valA];
    return String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true });
  });
}

function getOpcoesStatus(secao) {
  switch (secao) {
    case 'tarefas':
      return ['Pendente', 'Em andamento', 'Concluída'];
    case 'lancamentos':
      return ['Em aberto', 'Pago', 'Vencido'];
    default:
      return [];
  }
}

function getOpcoesOrdenacao(secao) {
  const opcoes = [];

  switch (secao) {
    case 'tarefas':
      opcoes.push(
        { value: 'tituloTarefa-asc', label: 'Título (A-Z)' },
        { value: 'tituloTarefa-desc', label: 'Título (Z-A)' },
        { value: 'dataInicio-asc', label: 'Data Início (Antiga)' },
        { value: 'dataInicio-desc', label: 'Data Início (Recente)' }
      );
      break;
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

function renderizarTabela(secao, dados) {
  switch (secao) {
    case 'tarefas':
      renderizarTabelaTarefas(dados);
      break;
    case 'lancamentos':
      todosLancamentos = dados; // Atualiza o array global com dados filtrados
      renderizarTabelaLancamentos();
      break;
    case 'extratos':
      todosExtratos = dados; // Atualiza o array global com dados filtrados
      renderizarTabelaExtratos();
      break;
    case 'indices':
      todosIndices = dados; // Atualiza o array global com dados filtrados
      renderizarTabelaIndices();
      break;
    case 'produtos':
      todosProdutos = dados; // Atualiza o array global com dados filtrados
      renderizarTabelaProdutos();
      break;
    default:
      return;
  }


  if (!tbody) return;

  tbody.innerHTML = '';

  if (dados.length === 0) {
    const colspan = secao === 'tarefas' ? 6 : secao === 'lancamentos' ? 6 : 6;
    tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 40px;">Nenhum registro encontrado</td></tr>`;

    if (secao === 'tarefas') {
      gerarGraficoTarefas({ Pendente: 0, "Em andamento": 0, "Concluída": 0 });
    }
    return;
  }

  switch (secao) {
    case 'tarefas':
      renderizarTabelaTarefas(dados);
      break;
    case 'lancamentos':
      renderizarTabelaLancamentos();
      break;
    case 'extratos':
      renderizarTabelaExtratos();
      break;
    case 'indices':
      renderizarTabelaIndices();
      break;
    case 'produtos':
      renderizarTabelaProdutos();
      break;
  }
}

/* ---------- FUNCIONALIDADES FINANCEIRAS ---------- */
async function carregarKPIsFinanceiros() {
  try {
    const [lancamentosRes, extratosRes] = await Promise.all([
      fetchData(`${baseUrl}/lancamentos`),
      fetchData(`${baseUrl}/extratos`)
    ]);

    const lancamentos = lancamentosRes.data || [];
    const extratos = extratosRes.data || [];

    const kpis = calcularKPIs(lancamentos, extratos);
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

function renderizarTabelaLancamentos() {
  if (!elements.tbodyLancamentos) return;

  elements.tbodyLancamentos.innerHTML = "";

  if (todosLancamentos.length === 0) {
    elements.tbodyLancamentos.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Nenhum lançamento encontrado.</td></tr>';
    return;
  }

  todosLancamentos.forEach(l => {
    const statusClass = `status-${(l.statusLancamento || "").toLowerCase().replace(/\s/g, '')}`;
    const classificacaoClass = l.classificacaoLancamento === 'Receita' ? 'text-success' : 'text-error';
    const tr = document.createElement("tr");

    // Obter nomes de categoria e subcategoria
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
    const res = await fetchData(`${baseUrl}/extratos`);
    todosExtratos = res.data || [];
    aplicarFiltros('extratos');
    gerarGraficoExtratosTipo();
  } catch (error) {
    console.error("Erro ao carregar extratos:", error);
    mostrarRespostaPopup("Erro ao carregar extratos", false);
  }
}

function renderizarTabelaExtratos() {
  if (!elements.tbodyExtratos) return;

  elements.tbodyExtratos.innerHTML = "";

  if (todosExtratos.length === 0) {
    elements.tbodyExtratos.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Nenhum extrato encontrado.</td></tr>';
    return;
  }

  todosExtratos.forEach(e => {
    const tipoClass = e.tipoExtrato === 'Entrada' ? 'text-success' : 'text-error';
    const tr = document.createElement("tr");

    // Mostrar título se existir, senão mostrar "Extrato #ID"
    const titulo = e.tituloExtrato || `Extrato #${e.idExtrato}`;

    // Obter nomes relacionados
    const nomeProduto = obterNomeProduto(e.idProduto);
    const nomeCategoria = obterNomeCategoria(e.idCategoria);
    const nomeSubcategoria = obterNomeSubcategoria(e.idSubcategoria);
    const tituloLancamento = obterTituloLancamento(e.idLancamento);
    const tituloTarefa = obterTituloTarefa(e.idTarefa);

    tr.innerHTML = `
      <td><strong>${escaparHTML(titulo)}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escaparHTML(e.descricaoExtrato || '')}">${escaparHTML(e.descricaoExtrato || '-')}</td>
      <td><strong>R$ ${parseFloat(e.valorExtrato || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td>${formatarData(e.dataExtrato)}</td>
      <td><span class="${tipoClass}"><strong>${escaparHTML(e.tipoExtrato || '-')}</strong></span></td>
      <td>${escaparHTML(nomeProduto)}</td>
      <td>${escaparHTML(nomeCategoria)}<br><small style="color: var(--muted-foreground);">${escaparHTML(nomeSubcategoria)}</small></td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escaparHTML(tituloLancamento)}">${escaparHTML(tituloLancamento)}</td>
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

function renderizarTabelaProdutos() {
  if (!elements.tbodyProdutos) return;

  elements.tbodyProdutos.innerHTML = "";

  if (todosProdutos.length === 0) {
    elements.tbodyProdutos.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum produto encontrado.</td></tr>';
    return;
  }

  todosProdutos.forEach(p => {
    const tr = document.createElement("tr");

    // MODIFICAR para mostrar nomes
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
  const nomeIndice = document.getElementById("nomeIndice").value?.trim();
  const taxaIndice = parseFloat(document.getElementById("taxaIndice").value || 0);
  const anoIndice = document.getElementById("anoIndice").value?.trim();
  const idSubsegmento = parseInt(document.getElementById("idSubsegmentoIndice").value);

  // Validações
  if (!nomeIndice) {
    mostrarRespostaPopup("Nome do índice é obrigatório!", false);
    return;
  }

  if (!anoIndice) {
    mostrarRespostaPopup("Ano é obrigatório!", false);
    return;
  }

  if (!idSubsegmento || isNaN(idSubsegmento)) {
    mostrarRespostaPopup("Selecione um subsegmento válido!", false);
    return;
  }

  if (isNaN(taxaIndice) || taxaIndice < 0) {
    mostrarRespostaPopup("Taxa deve ser um número válido!", false);
    return;
  }

  const dados = {
    nomeIndice: document.getElementById("nomeIndice").value.trim(),
    taxaIndice: parseFloat(document.getElementById("taxaIndice").value || 0),
    anoIndice: document.getElementById("anoIndice").value.trim(), // ← STRING
    idSubsegmento: parseInt(document.getElementById("idSubsegmentoIndice").value)
  };

  console.log("Dados sendo enviados:", dados); // DEBUG

  const url = id ? `${baseUrl}/indices/${id}` : `${baseUrl}/indices`;
  const method = id ? "PUT" : "POST";

  try {
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(dados)
    });

    console.log("Resposta do servidor:", response); // DEBUG

    mostrarRespostaPopup("Índice salvo com sucesso!", true);
    fecharModalIndice();
    carregarIndices();
  } catch (err) {
    console.error("Erro ao salvar índice:", err);
    console.error("Dados que causaram erro:", dados); // DEBUG
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

function renderizarTabelaIndices() {
  if (!elements.tbodyIndices) return;

  elements.tbodyIndices.innerHTML = "";

  if (todosIndices.length === 0) {
    elements.tbodyIndices.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum índice encontrado.</td></tr>';
    return;
  }

  todosIndices.forEach(i => {
    const tr = document.createElement("tr");

    // MODIFICAR para mostrar nome
    const nomeSubsegmento = obterNomeSubsegmento(i.idSubsegmento);

    tr.innerHTML = `
      <td><strong>${escaparHTML(i.nomeIndice || 'Sem nome')}</strong></td>
      <td>${i.taxaIndice || '-'}</td>
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