// Arquivo: dashboardFuncionario.js
// Painel Funcionário com Sistema de Filtros

// --- Função para decodificar o token JWT e obter o ID do usuário ---

// --- Função para decodificar o token JWT e obter o ID do usuário ---
function pegarToken() {
  // Buscar no localStorage em vez de diretamente
  const authData = localStorage.getItem("authToken");

  if (!authData) return null;

  try {
    // Parse do objeto que contém token e timestamp
    const { token, timestamp } = JSON.parse(authData);

    // Verificar se o token expirou (24 horas)
    const tempoDecorrido = Date.now() - timestamp;
    const TEMPO_EXPIRACAO = 24 * 60 * 60 * 1000; // 24 horas

    if (tempoDecorrido >= TEMPO_EXPIRACAO) {
      // Token expirado, limpar e retornar null
      localStorage.removeItem("authToken");
      return null;
    }

    // Limpar o token de aspas extras se existirem
    const tokenLimpo = token.trim().replace(/^"|"$/g, "");

    if (!tokenLimpo || tokenLimpo === "null" || tokenLimpo === "undefined" || tokenLimpo.length < 20) {
      return null;
    }

    return tokenLimpo;
  } catch (e) {
    console.error("Erro ao processar authToken:", e);
    localStorage.removeItem("authToken");
    return null;
  }
}


function pegarUserIdDoToken() {
  const token = pegarToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    return payload.idUsuario || payload.id || null;
  } catch (e) {
    console.error("Erro ao decodificar token JWT:", e);
    return null;
  }
}



// --- Variáveis Globais ---
const userId = pegarUserIdDoToken();
const baseUrl = 'http://localhost:3000';
let dataCadastroAtual = null;
let idCargoAtual = null;
let calendarioInstancia = null;

// Armazenamento de tarefas
let todasAsTarefas = [];

// Filtros ativos
let filtrosTarefasAtivos = {};

// Elementos DOM
const tbodyTarefas = document.getElementById("tbodyTarefas");
const postit = document.getElementById("postit");
const formEditar = document.getElementById("formEditarRelacao");
const idTarefaSelecionada = document.getElementById("idTarefaSelecionada");
const txtStatusEditar = document.getElementById("txtStatusEditar");
const divResposta = document.getElementById("divResposta");
const formEditarContainer = document.getElementById("formEditarContainer");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

const navBtns = document.querySelectorAll(".btn-nav");
const paineis = document.querySelectorAll(".content-section");

// Elementos de filtros
const seletorFiltroTarefas = document.getElementById("seletorFiltroTarefas");
const filtrosAtivosTarefas = document.getElementById("filtrosAtivosTarefas");
const btnLimparFiltrosTarefas = document.getElementById("btnLimparFiltrosTarefas");

// Modais
const modalRecado = document.getElementById("modalRecado");
const dataRecado = document.getElementById("dataRecado");
const txtRecado = document.getElementById("txtRecado");
const btnSalvarRecado = document.getElementById("salvarRecado");
const btnCancelarRecado = document.getElementById("cancelarRecado");

const modalConfirmacao = document.getElementById("modalConfirmacao");
const textoModalConfirmacao = document.getElementById("modal-text");
const btnConfirmarExcluir = document.getElementById("confirmarExcluir");
const btnCancelarExcluir = document.getElementById("cancelarExcluir");

const modalConclusao = document.getElementById("modalConclusao");
const textoModalConclusao = document.getElementById("modal-conclusao-text");
const btnConfirmarConclusao = document.getElementById("confirmarConclusao");
const btnCancelarConclusao = document.getElementById("cancelarConclusao");

const modalDetalhesTarefa = document.getElementById("modalDetalhesTarefa");
const tituloDetalhes = document.getElementById("detalhesTituloTarefa");
const descricaoDetalhes = document.getElementById("detalhesDescricaoTarefa");
const btnFecharDetalhes = document.getElementById("fecharDetalhesTarefa");

const btnLogout = document.getElementById("logoutBtn");

// --- Funções Utilitárias ---
function escaparHTML(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function atualizarIconesLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
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

function mostrarRespostaPopup(mensagem, sucesso = true, tempo = 3000) {
  if (!divResposta) {
    alert(mensagem);
    return;
  }
  divResposta.innerText = mensagem;
  divResposta.className = sucesso ? 'resposta-popup sucesso' : 'resposta-popup erro';
  divResposta.style.display = 'block';
  setTimeout(() => {
    divResposta.style.display = 'none';
  }, tempo);
}

function mostrarModalRecado(dataSelecionada, onSalvar) {
  if (modalRecado && dataRecado && txtRecado && btnSalvarRecado && btnCancelarRecado) {
    dataRecado.textContent = dataSelecionada;
    txtRecado.value = "";
    modalRecado.classList.remove("oculto");

    btnSalvarRecado.onclick = () => {
      const texto = txtRecado.value.trim();
      if (texto) {
        modalRecado.classList.add("oculto");
        onSalvar(texto);
      }
    };

    btnCancelarRecado.onclick = () => {
      modalRecado.classList.add("oculto");
    };
  }
}

function mostrarModalConfirmacao(texto, onConfirmar) {
  if (modalConfirmacao && textoModalConfirmacao && btnConfirmarExcluir && btnCancelarExcluir) {
    textoModalConfirmacao.textContent = texto;
    modalConfirmacao.classList.remove("oculto");

    btnConfirmarExcluir.onclick = () => {
      modalConfirmacao.classList.add("oculto");
      onConfirmar();
    };

    btnCancelarExcluir.onclick = () => {
      modalConfirmacao.classList.add("oculto");
    };
  }
}

function mostrarModalConclusao(tituloTarefa, onConfirmar) {
  if (modalConclusao && textoModalConclusao && btnConfirmarConclusao && btnCancelarConclusao) {
    textoModalConclusao.textContent = `Deseja marcar a tarefa '${tituloTarefa}' como Concluída?`;
    modalConclusao.classList.remove("oculto");

    btnConfirmarConclusao.onclick = () => {
      modalConclusao.classList.add("oculto");
      onConfirmar();
    };

    btnCancelarConclusao.onclick = () => {
      modalConclusao.classList.add("oculto");
    };
  }
}

function mostrarModalDetalhes(titulo, descricao) {
  if (modalDetalhesTarefa && tituloDetalhes && descricaoDetalhes) {
    tituloDetalhes.textContent = titulo;
    descricaoDetalhes.textContent = descricao || "Nenhuma descrição disponível.";
    modalDetalhesTarefa.classList.remove("oculto");
  }
}

// --- Função fetchWithAuth atualizada ---
function fetchWithAuth(url, options = {}) {
  const token = pegarToken(); // Usar a função pegarToken()

  if (!token) {
    throw new Error("Token não encontrado ou expirado");
  }

  const headers = options.headers || {};
  options.headers = {
    'Content-Type': 'application/json',
    ...headers,
    'Authorization': `Bearer ${token}`
  };

  return fetch(url, options).then(async res => {
    if (res.status === 401 || res.status === 403) {
      // Token inválido ou expirado no servidor
      localStorage.removeItem("authToken");
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "../../html/login.html";
      throw new Error("Sessão expirada");
    }

    if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
    return res.json();
  });
}

// --- Atualizar o botão de logout ---
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    mostrarModalConfirmacao("Deseja realmente sair?", () => {
      localStorage.removeItem("authToken"); // Remover authToken em vez de token
      window.location.href = "../../html/login.html";
    });
  });
}

// --- Atualizar a função inicializar() ---
async function inicializar() {
  const token = pegarToken();
  if (!token) {
    alert("Você precisa estar logado.");
    window.location.href = "../../html/login.html";
    return;
  }

  try {
    configurarEventListeners();

    await Promise.all([
      carregarTarefas(),
      carregarPerfil()
    ]);

    carregarPostit();

    const painelAtivo = document.querySelector(".content-section.active");
    if (painelAtivo && painelAtivo.id === "painel-calendario") {
      inicializarCalendario();
    }

    atualizarIconesLucide();
    exibirToast("Bem-vindo", "Sistema carregado com sucesso!");
  } catch (erro) {
    console.error("Erro na inicialização:", erro);

    // Se for erro de autenticação, redirecionar para login
    if (erro.message.includes("Token") || erro.message.includes("Sessão")) {
      localStorage.removeItem("authToken");
      window.location.href = "../../html/login.html";
    } else {
      exibirToast("Erro", "Falha ao inicializar o sistema", "error");
    }
  }
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function formatarStatus(status) {
  const s = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  switch (s) {
    case "pendente": return "Pendente";
    case "em andamento": return "Em andamento";
    case "concluida": return "Concluída";
    default: return status;
  }
}

function normalizar(txt) {
  return (txt || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// --- Sistema de Filtros ---
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
  if (!filtrosAtivosTarefas) return;

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
                 placeholder="Buscar por título..." 
                 value="${filtrosTarefasAtivos[tipo].valor || ''}" />
        `;
        break;

      case 'status':
        titulo = '✅ Status';
        content = `
          <select id="filtroTarefasStatus">
            <option value="">Todos</option>
            <option value="Pendente" ${filtrosTarefasAtivos[tipo].valor === 'Pendente' ? 'selected' : ''}>Pendente</option>
            <option value="Em andamento" ${filtrosTarefasAtivos[tipo].valor === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
            <option value="Concluída" ${filtrosTarefasAtivos[tipo].valor === 'Concluída' ? 'selected' : ''}>Concluída</option>
          </select>
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

  const selectStatus = document.getElementById('filtroTarefasStatus');
  if (selectStatus) {
    selectStatus.addEventListener('change', (e) => {
      filtrosTarefasAtivos.status.valor = e.target.value;
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
        filtrosTarefasAtivos.data[campo] = e.target.value;
        aplicarFiltrosTarefas();
      });
    }
  });
}

function aplicarFiltrosTarefas() {
  let tarefasFiltradas = [...todasAsTarefas];

  // Aplicar filtros
  if (filtrosTarefasAtivos.busca) {
    const busca = (filtrosTarefasAtivos.busca.valor || '').toLowerCase().trim();
    if (busca) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        t.tarefa.tituloTarefa.toLowerCase().includes(busca)
      );
    }
  }

  if (filtrosTarefasAtivos.status && filtrosTarefasAtivos.status.valor) {
    tarefasFiltradas = tarefasFiltradas.filter(t =>
      formatarStatus(t.status) === filtrosTarefasAtivos.status.valor
    );
  }

  if (filtrosTarefasAtivos.prioridade && filtrosTarefasAtivos.prioridade.valor) {
    tarefasFiltradas = tarefasFiltradas.filter(t =>
      t.tarefa.prioridadeTarefa === filtrosTarefasAtivos.prioridade.valor
    );
  }

  if (filtrosTarefasAtivos.data) {
    const { dataInicioDe, dataInicioAte, dataFimDe, dataFimAte } = filtrosTarefasAtivos.data;

    if (dataInicioDe) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.tarefa.dataInicio) >= new Date(dataInicioDe)
      );
    }
    if (dataInicioAte) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.tarefa.dataInicio) <= new Date(dataInicioAte)
      );
    }
    if (dataFimDe) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.tarefa.dataFim) >= new Date(dataFimDe)
      );
    }
    if (dataFimAte) {
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        new Date(t.tarefa.dataFim) <= new Date(dataFimAte)
      );
    }
  }

  // Ordenação
  if (filtrosTarefasAtivos.ordenar) {
    ordenarTarefas(tarefasFiltradas, filtrosTarefasAtivos.ordenar.valor || 'titulo-asc');
  }

  renderizarTabelaTarefas(tarefasFiltradas);
}

function ordenarTarefas(tarefas, criterio) {
  const prioridadeValor = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };

  switch (criterio) {
    case 'titulo-asc':
      tarefas.sort((a, b) => a.tarefa.tituloTarefa.localeCompare(b.tarefa.tituloTarefa));
      break;
    case 'titulo-desc':
      tarefas.sort((a, b) => b.tarefa.tituloTarefa.localeCompare(a.tarefa.tituloTarefa));
      break;
    case 'prioridade-desc':
      tarefas.sort((a, b) => (prioridadeValor[b.tarefa.prioridadeTarefa] || 0) - (prioridadeValor[a.tarefa.prioridadeTarefa] || 0));
      break;
    case 'prioridade-asc':
      tarefas.sort((a, b) => (prioridadeValor[a.tarefa.prioridadeTarefa] || 0) - (prioridadeValor[b.tarefa.prioridadeTarefa] || 0));
      break;
    case 'dataInicio-asc':
      tarefas.sort((a, b) => new Date(a.tarefa.dataInicio) - new Date(b.tarefa.dataInicio));
      break;
    case 'dataInicio-desc':
      tarefas.sort((a, b) => new Date(b.tarefa.dataInicio) - new Date(a.tarefa.dataInicio));
      break;
    case 'dataFim-asc':
      tarefas.sort((a, b) => new Date(a.tarefa.dataFim) - new Date(b.tarefa.dataFim));
      break;
    case 'dataFim-desc':
      tarefas.sort((a, b) => new Date(b.tarefa.dataFim) - new Date(a.tarefa.dataFim));
      break;
  }
}

function limparFiltrosTarefas() {
  filtrosTarefasAtivos = {};
  renderizarFiltrosTarefas();
  aplicarFiltrosTarefas();
}

// --- Navegação entre Painéis ---
function mostrarPainel(secao) {
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-secao') === secao) {
      btn.classList.add('ativo', 'active');
    } else {
      btn.classList.remove('ativo', 'active');
    }
  });

  paineis.forEach(painel => {
    const painelId = painel.id.replace('painel-', '');
    if (painelId === secao) {
      painel.classList.add('active');
      painel.classList.remove('oculto');
    } else {
      painel.classList.remove('active');
      painel.classList.add('oculto');
    }
  });

  if (secao === 'calendario') {
    setTimeout(() => {
      inicializarCalendario();
      if (calendarioInstancia) {
        calendarioInstancia.updateSize();
      }
    }, 100);
  }

  if (secao === 'tarefas') {
    aplicarFiltrosTarefas();
  }

  if (secao === 'visao-geral') {
    carregarTarefas();
  }
}

// --- Post-it ---
function fixarPostit(titulo) {
  postit.innerHTML = `📌 ${escaparHTML(titulo)} <button onclick="removerPostit()">×</button>`;
  postit.classList.remove("oculto");
  localStorage.setItem("tarefaFixada", titulo);
  atualizarIconesLucide();
}

function removerPostit() {
  postit.innerHTML = "";
  postit.classList.add("oculto");
  localStorage.removeItem("tarefaFixada");
}

function carregarPostit() {
  const titulo = localStorage.getItem("tarefaFixada");
  if (titulo) fixarPostit(titulo);
}

// --- Editar Status ---
function editarStatus(id, status) {
  idTarefaSelecionada.value = id;
  txtStatusEditar.value = status;
  formEditarContainer.classList.remove("oculto");
  formEditarContainer.scrollIntoView({ behavior: "smooth" });
}

async function updateTaskStatus(id, status) {
  try {
    await fetchWithAuth(`${baseUrl}/usuariostarefas/tarefa/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    exibirToast("Sucesso", "Status atualizado com sucesso!");
    await carregarTarefas();
    formEditarContainer.classList.add("oculto");
  } catch (err) {
    console.error(err);
    exibirToast("Erro", "Falha ao atualizar status", "error");
  }
}

// --- Renderizar Tabela ---
function renderizarTabelaTarefas(tarefas) {
  tbodyTarefas.innerHTML = "";

  let contadores = { Pendente: 0, "Em andamento": 0, "Concluída": 0 };

  tarefas.forEach(rel => {
    const tarefa = rel.tarefa;
    const statusFormatado = formatarStatus(rel.status);
    contadores[statusFormatado]++;

    const prioridadeClass = normalizar(tarefa.prioridadeTarefa);
    const prioridadeBadge = `
      <span class="priority-badge ${prioridadeClass}">
        <i data-lucide="flag" class="priority-flag"></i>
        ${escaparHTML(tarefa.prioridadeTarefa)}
      </span>
    `;

    const statusClass = statusFormatado.toLowerCase().replace(" ", "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escaparHTML(tarefa.tituloTarefa)}</td>
      <td><span class="status-${statusClass}">${escaparHTML(statusFormatado)}</span></td>
      <td><input type="text" class="data" value="${formatarData(tarefa.dataInicio)}" disabled></td>
      <td><input type="text" class="data" value="${formatarData(tarefa.dataFim)}" disabled></td>
      <td>${prioridadeBadge}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="editarStatus(${rel.tarefas_idTarefa}, '${statusFormatado}')">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-action btn-secondary-action" onclick="fixarPostit('${escaparHTML(tarefa.tituloTarefa)}')">
            <i data-lucide="pin"></i>
          </button>
        </div>
      </td>
    `;
    tbodyTarefas.appendChild(tr);
  });

  atualizarIconesLucide();
  gerarGrafico(contadores);

  if (typeof flatpickr !== 'undefined') {
    flatpickr(".data", { enableTime: true, dateFormat: "d/m/Y H:i" });
  }
}

// --- Carregar Tarefas ---
async function carregarTarefas() {
  try {
    const data = await fetchWithAuth(`${baseUrl}/usuariostarefas/${userId}`);
    const associacoes = data.associacoes || [];

    todasAsTarefas = [];

    for (const rel of associacoes) {
      const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
      todasAsTarefas.push({
        ...rel,
        tarefa: tarefa
      });
    }

    aplicarFiltrosTarefas();
  } catch (err) {
    console.error('Erro ao carregar tarefas:', err);
    exibirToast('Erro', 'Falha ao carregar tarefas', 'error');
  }
}

async function buscarTarefa(id) {
  const data = await fetchWithAuth(`${baseUrl}/tarefas/${id}`);
  return data.tarefa || {};
}

// --- Gráfico ---
function gerarGrafico({ Pendente, "Em andamento": EmAndamento, "Concluída": Concluida }) {
  const ctx = document.getElementById("graficoTarefas");
  if (!ctx) return;

  const context = ctx.getContext("2d");
  if (window.myPieChart) window.myPieChart.destroy();

  window.myPieChart = new Chart(context, {
    type: "pie",
    data: {
      labels: ["Pendente", "Em andamento", "Concluída"],
      datasets: [{
        data: [Pendente, EmAndamento, Concluida],
        backgroundColor: [
          "hsl(45, 85%, 55%)",
          "hsl(215, 85%, 50%)",
          "hsl(142, 70%, 45%)"
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: {
              size: 13,
              weight: 500
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1,
          padding: 12,
          displayColors: true
        }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

// --- Perfil ---
async function carregarPerfil() {
  if (!userId) {
    console.error("userId não definido no token");
    return;
  }
  try {
    const data = await fetchWithAuth(`${baseUrl}/usuarios/${userId}`);
    const user = data.data || data.usuario || data;
    document.getElementById("nomeUsuario").value = user.nomeUsuario || "";
    document.getElementById("emailUsuario").value = user.emailUsuario || "";
    dataCadastroAtual = user.dataCadastro || null;
    idCargoAtual = user.idCargo || null;
  } catch (err) {
    console.error(err);
    exibirToast("Erro", "Falha ao carregar perfil", "error");
  }
}

async function atualizarPerfil(ev) {
  ev.preventDefault();
  if (!userId) {
    exibirToast("Erro", "Usuário não identificado. Faça login novamente.", "error");
    return;
  }

  const nome = document.getElementById("nomeUsuario").value;
  const email = document.getElementById("emailUsuario").value;
  const senha = document.getElementById("senhaUsuario").value;

  const corpo = {
    nomeUsuario: nome,
    emailUsuario: email,
  };

  if (dataCadastroAtual) corpo.dataCadastro = dataCadastroAtual;
  if (idCargoAtual) corpo.idCargo = idCargoAtual;
  if (senha.trim() !== "") corpo.senhaUsuario = senha;

  try {
    await fetchWithAuth(`${baseUrl}/usuarios/${userId}`, {
      method: "PUT",
      body: JSON.stringify(corpo)
    });
    exibirToast("Sucesso", "Perfil atualizado com sucesso!");
  } catch (err) {
    console.error(err);
    exibirToast("Erro", "Falha ao atualizar perfil", "error");
  }
}

// --- Calendário ---
async function buscarTarefasDoUsuario() {
  const data = await fetchWithAuth(`${baseUrl}/usuariostarefas/${userId}`);
  const tarefas = [];

  for (const rel of data.associacoes || []) {
    const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
    if (tarefa?.dataInicio) {
      const dataISO = new Date(tarefa.dataInicio).toISOString().split("T")[0];
      tarefas.push({
        titulo: tarefa.tituloTarefa,
        descricao: tarefa.descricaoTarefa,
        dataInicio: dataISO
      });
    }
  }
  return tarefas;
}

function inicializarCalendario() {
  const calendarioEl = document.getElementById("calendario");
  if (!calendarioEl) return;

  if (calendarioInstancia) {
    calendarioInstancia.destroy();
  }

  calendarioInstancia = new FullCalendar.Calendar(calendarioEl, {
    initialView: "dayGridMonth",
    locale: "pt-br",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,listWeek"
    },
    buttonText: {
      today: 'Hoje',
      month: 'Mês',
      week: 'Semana',
      day: 'Dia',
      list: 'Lista'
    },
    dateClick: function (info) {
      mostrarModalRecado(info.dateStr, (anotacao) => {
        const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
        const novoEvento = {
          title: anotacao,
          date: info.dateStr,
          id: Date.now().toString(),
          backgroundColor: "#17a2b8",
          borderColor: "#17a2b8"
        };
        eventosSalvos.push(novoEvento);
        localStorage.setItem("eventosUsuario", JSON.stringify(eventosSalvos));
        calendarioInstancia.addEvent(novoEvento);
        exibirToast("Sucesso", "Recado adicionado ao calendário");
      });
    },
    eventClick: function (info) {
      const props = info.event.extendedProps;
      const isTask = info.event.id?.startsWith("task-");

      if (isTask) {
        mostrarModalDetalhes(info.event.title, props?.descricao || '');
      } else {
        mostrarModalConfirmacao(`Deseja apagar o recado: "${info.event.title}"?`, () => {
          info.event.remove();
          const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
          const atualizados = eventosSalvos.filter(ev => ev.id !== info.event.id);
          localStorage.setItem("eventosUsuario", JSON.stringify(atualizados));
          exibirToast("Sucesso", "Recado removido");
        });
      }
    }
  });

  buscarTarefasDoUsuario().then(tarefas => {
    tarefas.forEach(t => {
      calendarioInstancia.addEvent({
        title: t.titulo,
        date: t.dataInicio,
        extendedProps: { descricao: t.descricao },
        id: `task-${t.titulo}-${t.dataInicio}`,
        backgroundColor: "hsl(215, 85%, 35%)",
        borderColor: "hsl(215, 85%, 35%)"
      });
    });

    const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
    eventosSalvos.forEach(e => calendarioInstancia.addEvent(e));

    calendarioInstancia.render();
  });
}

// --- Event Listeners ---
function configurarEventListeners() {
  // Navegação
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const secao = btn.getAttribute('data-secao');
      mostrarPainel(secao);
    });
  });

  // Formulário de edição
  if (formEditar) {
    formEditar.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = idTarefaSelecionada.value;
      const status = txtStatusEditar.value;

      if (status === "Concluída") {
        const tarefa = await buscarTarefa(id);
        const tituloTarefa = tarefa.tituloTarefa;
        mostrarModalConclusao(tituloTarefa, async () => {
          await updateTaskStatus(id, status);
        });
      } else {
        await updateTaskStatus(id, status);
      }
    });
  }

  // Botão cancelar edição
  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', () => {
      formEditarContainer.classList.add("oculto");
    });
  }

  // Botão logout
  // --- Sistema de Logout Seguro (adaptado do adm.js) ---
  function realizarLogoutSeguroFinanceiro() {
    try {
      localStorage.removeItem("authToken");
      sessionStorage.clear();

      const chavesParaRemover = [
        "userData",
        "userRole",
        "lastActivity",
        "sessionId",
        "refreshToken",
        "permissions"
      ];
      chavesParaRemover.forEach(chave => localStorage.removeItem(chave));

      mostrarRespostaPopup("Logout realizado com sucesso! Redirecionando...", true);
      console.log(`[${new Date().toISOString()}] Logout seguro realizado pelo funcionário financeiro`);

      setTimeout(() => {
        window.location.replace("../../html/login.html");
      }, 1500);

    } catch (erro) {
      console.error("Erro durante logout seguro:", erro);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Erro crítico ao limpar storage:", e);
      }
      mostrarRespostaPopup("Encerrando sessão...", true);
      setTimeout(() => {
        window.location.replace("../../html/login.html");
      }, 1000);
    }
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      mostrarModalConfirmacao("Deseja realmente sair do sistema?", () => {
        realizarLogoutSeguroFinanceiro();
      });
    });
  }

      // Formulário de perfil
      const formPerfil = document.getElementById("formPerfil");
      if (formPerfil) {
        formPerfil.addEventListener("submit", atualizarPerfil);
      }

      // Fechar modal de detalhes
      if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener('click', () => {
          modalDetalhesTarefa.classList.add("oculto");
        });
      }

      // Seletor de filtros
      if (seletorFiltroTarefas) {
        seletorFiltroTarefas.addEventListener('change', (e) => {
          if (e.target.value) {
            adicionarFiltroTarefa(e.target.value);
            e.target.value = '';
          }
        });
      }

      // Botão limpar filtros
      if (btnLimparFiltrosTarefas) {
        btnLimparFiltrosTarefas.addEventListener('click', limparFiltrosTarefas);
      }

      // Fechar modais ao clicar fora
      window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          const modal = e.target.closest('.modal');
          if (modal) {
            modal.classList.add('oculto');
          }
        }
      });
    }





// --- Dentro da função inicializar() ---
async function inicializar() {
        const token = pegarToken();
        if (!token) {
          //alert("Você precisa estar logado.");
          //window.location.href = "../../html/login.html";
          //return;
        }

        try {
          configurarEventListeners();

          await Promise.all([
            carregarTarefas(),
            carregarPerfil()
          ]);

          carregarPostit();

          const painelAtivo = document.querySelector(".content-section.active");
          if (painelAtivo && painelAtivo.id === "painel-calendario") {
            inicializarCalendario();
          }

          atualizarIconesLucide();
          exibirToast("Bem-vindo", "Sistema carregado com sucesso!");
        } catch (erro) {
          console.error("Erro na inicialização:", erro);
          exibirToast("Erro", "Falha ao inicializar o sistema", "error");
        }
      }


// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inicializar);
    } else {
      inicializar();
    }