// Arquivo: dashboardGerente.js
// Painel Gerente com Sistema de Filtros por Combobox

// --- Função para decodificar o token JWT e obter o ID do usuário ---
function pegarToken() {
    // Buscar no localStorage
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
let todasAsTarefas = [];
let todasAsAtribuicoes = [];
let todosOsUsuarios = [];
let todasAsTarefasCompletas = [];

// Filtros ativos
let filtrosTarefasAtivos = {};
let filtrosAtribuicoesAtivos = {};

// --- Utilitários Visuais ---
function escaparHTML(texto) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Elementos
const modalConfirmacao = document.getElementById("modalConfirmacao");
const textoModalConfirmacao = document.getElementById("modal-text-confirmacao");
const btnConfirmarAcao = document.getElementById("confirmarAcao");
const btnCancelarAcao = document.getElementById("cancelarAcao");

const modalRecado = document.getElementById("modalRecado");
const dataRecado = document.getElementById("dataRecado");
const txtRecado = document.getElementById("txtRecado");
const btnSalvarRecado = document.getElementById("salvarRecado");
const btnCancelarRecado = document.getElementById("cancelarRecado");

const modalDetalhesTarefa = document.getElementById("modalDetalhesTarefa");
const tituloDetalhes = document.getElementById("detalhesTituloTarefa");
const descricaoDetalhes = document.getElementById("detalhesDescricaoTarefa");
const btnFecharDetalhes = document.getElementById("fecharDetalhesTarefa");

const navBtns = document.querySelectorAll(".btn-nav");
const paineis = document.querySelectorAll(".content-section");

const tabelaTarefasBody = document.querySelector("#tabelaTarefas tbody");
const tabelaAtribuicoesBody = document.querySelector("#tabelaAtribuicoes tbody");

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

const modalAtribuicao = document.getElementById("modalAtribuicao");
const modalTituloAtribuicao = document.getElementById("modalTituloAtribuicao");
const formAtribuicao = document.getElementById("formAtribuicao");
const selectUsuario = document.getElementById("selectUsuario");
const selectTarefa = document.getElementById("selectTarefa");
const selectStatusAtribuicao = document.getElementById("selectStatusAtribuicao");
const btnCancelarAtribuicao = document.getElementById("btnCancelarAtribuicao");

const btnNovaTarefa = document.getElementById("btnNovaTarefa");
const btnNovaAtribuicao = document.getElementById("btnNovaAtribuicao");
const btnLogout = document.getElementById("logoutBtn");

// Elementos de filtros
const seletorFiltroTarefas = document.getElementById("seletorFiltroTarefas");
const filtrosAtivosTarefas = document.getElementById("filtrosAtivosTarefas");
const btnLimparFiltrosTarefas = document.getElementById("btnLimparFiltrosTarefas");

const seletorFiltroAtribuicoes = document.getElementById("seletorFiltroAtribuicoes");
const filtrosAtivosAtribuicoes = document.getElementById("filtrosAtivosAtribuicoes");
const btnLimparFiltrosAtribuicoes = document.getElementById("btnLimparFiltrosAtribuicoes");

const divResposta = document.getElementById("divResposta");

let calendarioInstancia = null;

// --- Funções de Utilidades ---
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

function formatarData(dataStr) {
    return new Date(dataStr).toLocaleDateString('pt-BR');
}

function atualizarIconesLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

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

function mostrarModalDetalhes(titulo, descricao) {
    if (modalDetalhesTarefa && tituloDetalhes && descricaoDetalhes) {
        tituloDetalhes.textContent = titulo;
        descricaoDetalhes.textContent = descricao;
        modalDetalhesTarefa.classList.remove("oculto");
    }
}

function normalizar(txt) {
    return (txt || "").toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// --- Função fetchWithAuth atualizada ---
function fetchWithAuth(url, options = {}) {
    const token = pegarToken();

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

// --- Sistema de Logout Seguro ---
function realizarLogoutSeguroGerente() {
    try {
        // Mostrar modal de redirecionamento
        mostrarModalRedirecionamento();

        setTimeout(() => {
            localStorage.removeItem("authToken");
            sessionStorage.clear();

            const chavesParaRemover = [
                "userData",
                "userRole",
                "lastActivity",
                "sessionId",
                "refreshToken",
                "permissions",
                "eventosGerente",
                "tarefaFixada"
            ];
            chavesParaRemover.forEach(chave => localStorage.removeItem(chave));

            console.log(`[${new Date().toISOString()}] Logout seguro realizado pelo gerente`);

            setTimeout(() => {
                window.location.replace("../../html/login.html");
            }, 1500);
        }, 500);

    } catch (erro) {
        console.error("Erro durante logout seguro:", erro);
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.error("Erro crítico ao limpar storage:", e);
        }
        setTimeout(() => {
            window.location.replace("../../html/login.html");
        }, 1000);
    }
}

function mostrarModalRedirecionamento() {
    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalRedirecionamento');
    if (modalExistente) {
        modalExistente.remove();
    }

    // Criar modal de redirecionamento
    const modal = document.createElement('div');
    modal.id = 'modalRedirecionamento';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
          <div class="modal-content" style="text-align: center; max-width: 400px;">
              <div class="modal-header">
                  <h3>Saindo do Sistema</h3>
              </div>
              <div class="modal-body" style="padding: 2rem;">
                  <div style="margin-bottom: 1.5rem;">
                      <i data-lucide="log-out" style="width: 48px; height: 48px; color: var(--primary); margin: 0 auto;"></i>
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

    document.body.appendChild(modal);

    // Atualizar ícones Lucide
    setTimeout(() => atualizarIconesLucide(), 10);
}

// --- Atualização de Resumo ---
function atualizarResumoTarefas(tarefas) {
    const cardTotal = document.getElementById("cardTotal");
    const cardConcluidas = document.getElementById("cardConcluidas");
    const cardPendentes = document.getElementById("cardPendentes");
    const cardAndamento = document.getElementById("cardAndamento");

    if (cardTotal) cardTotal.textContent = tarefas.length;
    if (cardConcluidas) {
        cardConcluidas.textContent = tarefas.filter(t =>
            t.statusTarefa && normalizar(t.statusTarefa) === "concluida"
        ).length;
    }
    if (cardPendentes) {
        cardPendentes.textContent = tarefas.filter(t =>
            t.statusTarefa && normalizar(t.statusTarefa) === "pendente"
        ).length;
    }
    if (cardAndamento) {
        cardAndamento.textContent = tarefas.filter(t =>
            t.statusTarefa && normalizar(t.statusTarefa) === "em andamento"
        ).length;
    }
}

// --- Sistema de Filtros por Combobox - TAREFAS ---
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
                t.tituloTarefa.toLowerCase().includes(busca) ||
                (t.descricaoTarefa && t.descricaoTarefa.toLowerCase().includes(busca))
            );
        }
    }

    if (filtrosTarefasAtivos.prioridade && filtrosTarefasAtivos.prioridade.valor) {
        tarefasFiltradas = tarefasFiltradas.filter(t =>
            t.prioridadeTarefa === filtrosTarefasAtivos.prioridade.valor
        );
    }

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

    // Ordenação
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

// --- Sistema de Filtros por Combobox - ATRIBUIÇÕES ---
function adicionarFiltroAtribuicao(tipo) {
    if (filtrosAtribuicoesAtivos[tipo]) {
        exibirToast("Aviso", "Este filtro já está ativo", "error");
        return;
    }

    filtrosAtribuicoesAtivos[tipo] = {};
    renderizarFiltrosAtribuicoes();
    aplicarFiltrosAtribuicoes();
}

function removerFiltroAtribuicao(tipo) {
    delete filtrosAtribuicoesAtivos[tipo];
    renderizarFiltrosAtribuicoes();
    aplicarFiltrosAtribuicoes();
}

function renderizarFiltrosAtribuicoes() {
    filtrosAtivosAtribuicoes.innerHTML = '';

    Object.keys(filtrosAtribuicoesAtivos).forEach(tipo => {
        const filterItem = document.createElement('div');
        filterItem.className = 'filter-item';

        let content = '';
        let titulo = '';

        switch (tipo) {
            case 'busca':
                titulo = '🔍 Buscar';
                content = `
                      <input type="text" 
                             id="filtroAtribuicoesBusca" 
                             placeholder="Buscar por usuário ou tarefa..." 
                             value="${filtrosAtribuicoesAtivos[tipo].valor || ''}" />
                  `;
                break;

            case 'usuario':
                titulo = '👤 Usuário';
                const usuariosOptions = todosOsUsuarios.map(u =>
                    `<option value="${u.idUsuario}" ${filtrosAtribuicoesAtivos[tipo].valor == u.idUsuario ? 'selected' : ''}>${escaparHTML(u.nomeUsuario)}</option>`
                ).join('');
                content = `
                      <select id="filtroAtribuicoesUsuario">
                          <option value="">Todos</option>
                          ${usuariosOptions}
                      </select>
                  `;
                break;

            case 'tarefa':
                titulo = '📋 Tarefa';
                const tarefasOptions = todasAsTarefasCompletas.map(t =>
                    `<option value="${t.idTarefa}" ${filtrosAtribuicoesAtivos[tipo].valor == t.idTarefa ? 'selected' : ''}>${t.idTarefa} - ${escaparHTML(t.tituloTarefa)}</option>`
                ).join('');
                content = `
                      <select id="filtroAtribuicoesTarefa">
                          <option value="">Todas</option>
                          ${tarefasOptions}
                      </select>
                  `;
                break;

            case 'status':
                titulo = '✅ Status';
                content = `
                      <select id="filtroAtribuicoesStatus">
                          <option value="">Todos</option>
                          <option value="pendente" ${filtrosAtribuicoesAtivos[tipo].valor === 'pendente' ? 'selected' : ''}>Pendente</option>
                          <option value="em andamento" ${filtrosAtribuicoesAtivos[tipo].valor === 'em andamento' ? 'selected' : ''}>Em Andamento</option>
                          <option value="andamento" ${filtrosAtribuicoesAtivos[tipo].valor === 'andamento' ? 'selected' : ''}>Andamento</option>
                          <option value="concluida" ${filtrosAtribuicoesAtivos[tipo].valor === 'concluida' ? 'selected' : ''}>Concluída</option>
                      </select>
                  `;
                break;

            case 'ordenar':
                titulo = '↕️ Ordenar';
                content = `
                      <select id="filtroAtribuicoesOrdenar">
                          <option value="usuario-asc" ${filtrosAtribuicoesAtivos[tipo].valor === 'usuario-asc' ? 'selected' : ''}>Usuário (A-Z)</option>
                          <option value="usuario-desc" ${filtrosAtribuicoesAtivos[tipo].valor === 'usuario-desc' ? 'selected' : ''}>Usuário (Z-A)</option>
                          <option value="tarefa-asc" ${filtrosAtribuicoesAtivos[tipo].valor === 'tarefa-asc' ? 'selected' : ''}>Tarefa (A-Z)</option>
                          <option value="tarefa-desc" ${filtrosAtribuicoesAtivos[tipo].valor === 'tarefa-desc' ? 'selected' : ''}>Tarefa (Z-A)</option>
                          <option value="status-asc" ${filtrosAtribuicoesAtivos[tipo].valor === 'status-asc' ? 'selected' : ''}>Status (A-Z)</option>
                          <option value="status-desc" ${filtrosAtribuicoesAtivos[tipo].valor === 'status-desc' ? 'selected' : ''}>Status (Z-A)</option>
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
              <div class="filter-item-content">
                  ${content}
              </div>
          `;

        filtrosAtivosAtribuicoes.appendChild(filterItem);
    });

    atualizarIconesLucide();
    adicionarEventosFiltrosAtribuicoes();
}

function adicionarEventosFiltrosAtribuicoes() {
    const inputBusca = document.getElementById('filtroAtribuicoesBusca');
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            filtrosAtribuicoesAtivos.busca.valor = e.target.value;
            aplicarFiltrosAtribuicoes();
        });
    }

    const selectUsuario = document.getElementById('filtroAtribuicoesUsuario');
    if (selectUsuario) {
        selectUsuario.addEventListener('change', (e) => {
            filtrosAtribuicoesAtivos.usuario.valor = e.target.value;
            aplicarFiltrosAtribuicoes();
        });
    }

    const selectTarefa = document.getElementById('filtroAtribuicoesTarefa');
    if (selectTarefa) {
        selectTarefa.addEventListener('change', (e) => {
            filtrosAtribuicoesAtivos.tarefa.valor = e.target.value;
            aplicarFiltrosAtribuicoes();
        });
    }

    const selectStatus = document.getElementById('filtroAtribuicoesStatus');
    if (selectStatus) {
        selectStatus.addEventListener('change', (e) => {
            filtrosAtribuicoesAtivos.status.valor = e.target.value;
            aplicarFiltrosAtribuicoes();
        });
    }

    const selectOrdenar = document.getElementById('filtroAtribuicoesOrdenar');
    if (selectOrdenar) {
        selectOrdenar.addEventListener('change', (e) => {
            filtrosAtribuicoesAtivos.ordenar.valor = e.target.value;
            aplicarFiltrosAtribuicoes();
        });
    }
}

function aplicarFiltrosAtribuicoes() {
    let atribuicoesFiltradas = [...todasAsAtribuicoes];

    // Aplicar filtros
    if (filtrosAtribuicoesAtivos.busca) {
        const busca = (filtrosAtribuicoesAtivos.busca.valor || '').toLowerCase().trim();
        if (busca) {
            atribuicoesFiltradas = atribuicoesFiltradas.filter(a => {
                const usuario = todosOsUsuarios.find(u => u.idUsuario === a.idUsuario);
                const tarefa = todasAsTarefasCompletas.find(t => t.idTarefa === a.idTarefa);
                const nomeUsuario = usuario ? usuario.nomeUsuario.toLowerCase() : '';
                const tituloTarefa = tarefa ? tarefa.tituloTarefa.toLowerCase() : '';
                return nomeUsuario.includes(busca) || tituloTarefa.includes(busca);
            });
        }
    }

    if (filtrosAtribuicoesAtivos.usuario && filtrosAtribuicoesAtivos.usuario.valor) {
        const usuarioId = parseInt(filtrosAtribuicoesAtivos.usuario.valor);
        atribuicoesFiltradas = atribuicoesFiltradas.filter(a => a.idUsuario === usuarioId);
    }

    if (filtrosAtribuicoesAtivos.tarefa && filtrosAtribuicoesAtivos.tarefa.valor) {
        const tarefaId = parseInt(filtrosAtribuicoesAtivos.tarefa.valor);
        atribuicoesFiltradas = atribuicoesFiltradas.filter(a => a.idTarefa === tarefaId);
    }

    if (filtrosAtribuicoesAtivos.status && filtrosAtribuicoesAtivos.status.valor) {
        const status = filtrosAtribuicoesAtivos.status.valor.toLowerCase();
        atribuicoesFiltradas = atribuicoesFiltradas.filter(a =>
            normalizar(a.statusAtribuicao) === normalizar(status)
        );
    }

    // Ordenação
    if (filtrosAtribuicoesAtivos.ordenar) {
        ordenarAtribuicoes(atribuicoesFiltradas, filtrosAtribuicoesAtivos.ordenar.valor || 'usuario-asc');
    }

    renderizarTabelaAtribuicoes(atribuicoesFiltradas);
}

function ordenarAtribuicoes(atribuicoes, criterio) {
    switch (criterio) {
        case 'usuario-asc':
            atribuicoes.sort((a, b) => {
                const usuarioA = todosOsUsuarios.find(u => u.idUsuario === a.idUsuario);
                const usuarioB = todosOsUsuarios.find(u => u.idUsuario === b.idUsuario);
                return (usuarioA?.nomeUsuario || '').localeCompare(usuarioB?.nomeUsuario || '');
            });
            break;
        case 'usuario-desc':
            atribuicoes.sort((a, b) => {
                const usuarioA = todosOsUsuarios.find(u => u.idUsuario === a.idUsuario);
                const usuarioB = todosOsUsuarios.find(u => u.idUsuario === b.idUsuario);
                return (usuarioB?.nomeUsuario || '').localeCompare(usuarioA?.nomeUsuario || '');
            });
            break;
        case 'tarefa-asc':
            atribuicoes.sort((a, b) => {
                const tarefaA = todasAsTarefasCompletas.find(t => t.idTarefa === a.idTarefa);
                const tarefaB = todasAsTarefasCompletas.find(t => t.idTarefa === b.idTarefa);
                return (tarefaA?.tituloTarefa || '').localeCompare(tarefaB?.tituloTarefa || '');
            });
            break;
        case 'tarefa-desc':
            atribuicoes.sort((a, b) => {
                const tarefaA = todasAsTarefasCompletas.find(t => t.idTarefa === a.idTarefa);
                const tarefaB = todasAsTarefasCompletas.find(t => t.idTarefa === b.idTarefa);
                return (tarefaB?.tituloTarefa || '').localeCompare(tarefaA?.tituloTarefa || '');
            });
            break;
        case 'status-asc':
            atribuicoes.sort((a, b) => a.statusAtribuicao.localeCompare(b.statusAtribuicao));
            break;
        case 'status-desc':
            atribuicoes.sort((a, b) => b.statusAtribuicao.localeCompare(a.statusAtribuicao));
            break;
    }
}

function limparFiltrosAtribuicoes() {
    filtrosAtribuicoesAtivos = {};
    renderizarFiltrosAtribuicoes();
    aplicarFiltrosAtribuicoes();
}

// --- Renderização de Tabelas ---
function renderizarTabelaTarefas(tarefas) {
    tabelaTarefasBody.innerHTML = '';
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

        tabelaTarefasBody.appendChild(tr);
    });

    atualizarIconesLucide();
    adicionarEventosAcoesTarefas();
}

function renderizarTabelaAtribuicoes(atribuicoes) {
    tabelaAtribuicoesBody.innerHTML = '';
    const emptyState = document.getElementById('emptyStateAtribuicoes');

    if (atribuicoes.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    atribuicoes.forEach(atribuicao => {
        const usuario = todosOsUsuarios.find(u => u.idUsuario === atribuicao.idUsuario);
        const tarefa = todasAsTarefasCompletas.find(t => t.idTarefa === atribuicao.idTarefa);

        const tr = document.createElement('tr');
        tr.innerHTML = `
              <td>${escaparHTML(usuario?.nomeUsuario || 'Desconhecido')}</td>
              <td>${escaparHTML(tarefa?.tituloTarefa || 'Desconhecida')}</td>
              <td>${escaparHTML(atribuicao.statusAtribuicao)}</td>
              <td>
                  <div class="action-buttons">
                      <button class="btn-action btn-delete btn-excluir" data-usuario="${atribuicao.idUsuario}" data-tarefa="${atribuicao.idTarefa}">
                          <i data-lucide="trash-2"></i>
                      </button>
                  </div>
              </td>
          `;

        tabelaAtribuicoesBody.appendChild(tr);
    });

    atualizarIconesLucide();
    adicionarEventosAcoesAtribuicoes();
}

// --- Eventos de Ações nas Tabelas ---
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

function adicionarEventosAcoesAtribuicoes() {
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', () => {
            const idUsuario = parseInt(btn.getAttribute('data-usuario'));
            const idTarefa = parseInt(btn.getAttribute('data-tarefa'));
            excluirAtribuicao(idUsuario, idTarefa);
        });
    });
}

// --- CRUD de Tarefas ---
async function carregarTarefas() {
    try {
        const data = await fetchWithAuth("http://localhost:3000/tarefas");
        todasAsTarefas = data.tarefas || [];
        aplicarFiltrosTarefas();
        atualizarResumoTarefas(todasAsTarefas);
    } catch (erro) {
        console.error("Erro:", erro);
        exibirToast("Erro", "Falha ao carregar tarefas", "error");
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
        ? `http://localhost:3000/tarefas/${idTarefa}`
        : "http://localhost:3000/tarefas";
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
        await carregarTarefasCompletas();

        // Atualizar calendário se estiver ativo
        const painelCalendario = document.getElementById("painel-calendario");
        if (painelCalendario && painelCalendario.classList.contains("active")) {
            inicializarCalendario();
        }
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
            await fetchWithAuth(`http://localhost:3000/tarefas/${id}`, {
                method: "DELETE"
            });

            exibirToast("Sucesso", "Tarefa excluída com sucesso!");
            await carregarTarefas();
            await carregarTarefasCompletas();

            // Atualizar calendário se estiver ativo
            const painelCalendario = document.getElementById("painel-calendario");
            if (painelCalendario && painelCalendario.classList.contains("active")) {
                inicializarCalendario();
            }
        } catch (erro) {
            console.error("Erro:", erro);
            exibirToast("Erro", "Falha ao excluir tarefa", "error");
        }
    });
}

// --- CRUD de Atribuições ---
async function carregarAtribuicoes() {
    try {
        const data = await fetchWithAuth("http://localhost:3000/usuariostarefas");

        // Normalizar os dados da API para o formato esperado
        todasAsAtribuicoes = (data.associacoes || []).map(assoc => ({
            idUsuario: assoc.usuarios_idUsuario,
            idTarefa: assoc.tarefas_idTarefa,
            statusAtribuicao: assoc.status
        }));

        aplicarFiltrosAtribuicoes();
    } catch (erro) {
        console.error("Erro:", erro);
        exibirToast("Erro", "Falha ao carregar atribuições", "error");
    }
}

async function salvarAtribuicao(e) {
    e.preventDefault();

    const idUsuario = parseInt(selectUsuario.value);
    const idTarefa = parseInt(selectTarefa.value);
    const status = selectStatusAtribuicao.value;

    if (!idUsuario || !idTarefa) {
        exibirToast("Erro", "Selecione usuário e tarefa", "error");
        return;
    }

    try {
        // Verificar se associação existe
        const resGet = await fetchWithAuth("http://localhost:3000/usuariostarefas");
        const dataGet = resGet;
        const assocExiste = dataGet.associacoes?.some(
            a => a.usuarios_idUsuario === idUsuario && a.tarefas_idTarefa === idTarefa
        );

        let response, data;
        if (assocExiste) {
            // Atualizar
            response = await fetchWithAuth(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, {
                method: "PUT",
                body: JSON.stringify({ status })
            });
        } else {
            // Criar
            response = await fetchWithAuth("http://localhost:3000/usuariostarefas", {
                method: "POST",
                body: JSON.stringify({ idUsuario, idTarefa, status })
            });
        }

        data = response;

        if (data) {
            exibirToast("Sucesso", assocExiste ? "Atribuição atualizada!" : "Atribuição criada!");
            modalAtribuicao.classList.add("oculto");
            formAtribuicao.reset();
            await carregarAtribuicoes();

            // Atualizar calendário se estiver ativo
            const painelCalendario = document.getElementById("painel-calendario");
            if (painelCalendario && painelCalendario.classList.contains("active")) {
                inicializarCalendario();
            }
        } else {
            exibirToast("Erro", data.message || "Operação falhou", "error");
        }
    } catch (erro) {
        console.error("Erro:", erro);
        exibirToast("Erro", "Falha ao salvar atribuição", "error");
    }
}

function excluirAtribuicao(idUsuario, idTarefa) {
    mostrarModalConfirmacao("Deseja realmente excluir esta atribuição?", async () => {
        try {
            await fetchWithAuth(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, {
                method: "DELETE"
            });

            exibirToast("Sucesso", "Atribuição excluída com sucesso!");
            await carregarAtribuicoes();

            // Atualizar calendário se estiver ativo
            const painelCalendario = document.getElementById("painel-calendario");
            if (painelCalendario && painelCalendario.classList.contains("active")) {
                inicializarCalendario();
            }
        } catch (erro) {
            console.error("Erro:", erro);
            exibirToast("Erro", "Falha ao excluir atribuição", "error");
        }
    });
}

// --- Carregamento de Dados Auxiliares ---
async function carregarUsuarios() {
    try {
        const data = await fetchWithAuth("http://localhost:3000/usuarios");
        todosOsUsuarios = data.data || [];
        popularSelectUsuarios();
    } catch (erro) {
        console.error("Erro:", erro);
        exibirToast("Erro", "Falha ao carregar usuários", "error");
    }
}

async function carregarTarefasCompletas() {
    try {
        const data = await fetchWithAuth("http://localhost:3000/tarefas");
        todasAsTarefasCompletas = data.tarefas || [];
        popularSelectTarefas();
    } catch (erro) {
        console.error("Erro:", erro);
        exibirToast("Erro", "Falha ao carregar tarefas completas", "error");
    }
}

// --- População de Selects ---
function popularSelectUsuarios() {
    if (!selectUsuario) return;

    selectUsuario.innerHTML = '<option value="">Selecione um usuário</option>';
    todosOsUsuarios.forEach(usuario => {
        const option = document.createElement('option');
        option.value = usuario.idUsuario;
        option.textContent = usuario.nomeUsuario;
        selectUsuario.appendChild(option);
    });
}

function popularSelectTarefas() {
    if (!selectTarefa) return;

    selectTarefa.innerHTML = '<option value="">Selecione uma tarefa</option>';
    todasAsTarefasCompletas.forEach(tarefa => {
        const option = document.createElement('option');
        option.value = tarefa.idTarefa;
        option.textContent = `${tarefa.idTarefa} - ${tarefa.tituloTarefa}`;
        selectTarefa.appendChild(option);
    });
}

// --- Calendário ---
async function buscarTodasAsTarefasEAtribuicoes() {
    try {
        const [dataTarefas, dataAtrib, dataUsuarios] = await Promise.all([
            fetchWithAuth("http://localhost:3000/tarefas"),
            fetchWithAuth("http://localhost:3000/usuariostarefas"),
            fetchWithAuth("http://localhost:3000/usuarios")
        ]);

        if (!dataTarefas.status || !dataAtrib.status || !dataUsuarios.status) {
            exibirToast("Erro", "Dados incompletos para o calendário", "error");
            return [];
        }

        const tarefas = dataTarefas.tarefas || [];
        const atribuicoes = (dataAtrib.associacoes || []).map(a => ({
            idUsuario: a.usuarios_idUsuario,
            idTarefa: a.tarefas_idTarefa,
            status: a.status
        }));
        const usuarios = dataUsuarios.data || [];

        // Mapa de usuários para cores
        const mapaUsuarios = new Map();
        usuarios.forEach(usuario => {
            mapaUsuarios.set(usuario.idUsuario, usuario.nomeUsuario);
        });

        const cores = ["#FF5733", "#33C1FF", "#33FF7F", "#FFC300", "#DA33FF", "#FF3380", "#3380FF", "#33FFDA"];
        const mapaCores = new Map();

        const events = [];

        tarefas.forEach(tarefa => {
            const atribuicoesDaTarefa = atribuicoes.filter(a => a.idTarefa === tarefa.idTarefa);
            const textoAtribuicoes = atribuicoesDaTarefa.map(atrib => {
                const nomeUsuario = mapaUsuarios.get(atrib.idUsuario) || `Usuário ${atrib.idUsuario}`;
                return `${nomeUsuario} (${atrib.status})`;
            }).join(", ");

            // Atribuir cor única por usuário
            let corEvento = "#6c757d";
            if (atribuicoesDaTarefa.length > 0) {
                const primeiroUsuario = atribuicoesDaTarefa[0].idUsuario;

                if (!mapaCores.has(primeiroUsuario)) {
                    const indiceCor = mapaCores.size % cores.length;
                    mapaCores.set(primeiroUsuario, cores[indiceCor]);
                }

                corEvento = mapaCores.get(primeiroUsuario);
            }

            // Formatar data de término (adicionar 1 dia para correção visual)
            const dataFim = tarefa.dataFim
                ? new Date(new Date(tarefa.dataFim).setDate(new Date(tarefa.dataFim).getDate() + 1))
                : null;

            events.push({
                title: tarefa.tituloTarefa,
                start: tarefa.dataInicio.split('T')[0],
                end: dataFim ? dataFim.toISOString().split('T')[0] : null,
                extendedProps: {
                    descricao: tarefa.descricaoTarefa || 'Sem descrição',
                    prioridade: tarefa.prioridadeTarefa || 'Não especificada',
                    atribuicoes: textoAtribuicoes || 'Não atribuída'
                },
                backgroundColor: corEvento,
                borderColor: corEvento,
                id: `task-${tarefa.idTarefa}`
            });
        });

        return events;
    } catch (erro) {
        exibirToast("Erro", "Falha ao carregar dados do calendário", "error");
        return [];
    }
}

function inicializarCalendario() {
    const calendarioEl = document.getElementById("calendar");
    if (!calendarioEl) return;

    // Destruir instância anterior se existir
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
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
        },
        dateClick(info) {
            mostrarModalRecado(info.dateStr, (anotacao) => {
                const eventosSalvos = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                const novoEvento = {
                    title: anotacao,
                    date: info.dateStr,
                    id: `note-${Date.now()}`,
                    backgroundColor: "#17a2b8",
                    borderColor: "#17a2b8"
                };
                eventosSalvos.push(novoEvento);
                localStorage.setItem("eventosGerente", JSON.stringify(eventosSalvos));
                calendarioInstancia.addEvent(novoEvento);
                exibirToast("Sucesso", "Recado adicionado ao calendário");
            });
        },
        eventClick(info) {
            const evento = info.event;
            const props = evento.extendedProps;

            if (evento.id.startsWith("task-")) {
                const detalhes =
                    `Descrição: ${props.descricao || '—'}\n` +
                    `Prioridade: ${props.prioridade || '—'}\n` +
                    `Atribuído a: ${props.atribuicoes || '—'}`;
                mostrarModalDetalhes(evento.title, detalhes);
            } else {
                mostrarModalConfirmacao(`Deseja apagar o recado: "${evento.title}"?`, () => {
                    evento.remove();
                    const eventos = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                    const atualizados = eventos.filter(e => e.id !== evento.id);
                    localStorage.setItem("eventosGerente", JSON.stringify(atualizados));
                    exibirToast("Sucesso", "Recado removido");
                });
            }
        },
        events: async function (fetchInfo, successCallback, failureCallback) {
            try {
                const eventosTarefas = await buscarTodasAsTarefasEAtribuicoes();
                const eventosNotas = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                successCallback([...eventosTarefas, ...eventosNotas]);
            } catch (e) {
                exibirToast("Erro", "Falha ao carregar eventos do calendário", "error");
                failureCallback(e);
            }
        }
    });

    calendarioInstancia.render();
}

// --- Navegação entre Painéis ---
function configurarNavegacao() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const secao = btn.getAttribute('data-secao');

            navBtns.forEach(b => b.classList.remove('ativo', 'active'));
            btn.classList.add('ativo', 'active');

            paineis.forEach(p => {
                p.classList.remove('active');
                p.classList.add('oculto');
            });

            const painelAlvo = document.getElementById(`painel-${secao}`);
            if (painelAlvo) {
                painelAlvo.classList.add('active');
                painelAlvo.classList.remove('oculto');
            }

            if (secao === 'calendario') {
                setTimeout(() => {
                    inicializarCalendario();
                    if (calendarioInstancia) {
                        calendarioInstancia.updateSize();
                    }
                }, 100);
            }
        });
    });
}

// --- Event Listeners ---
function configurarEventListeners() {
    // Botões principais
    if (btnNovaTarefa) {
        btnNovaTarefa.addEventListener('click', () => {
            formTarefa.reset();
            inputIdTarefa.value = '';
            modalTituloTarefa.textContent = "Nova Tarefa";
            modalTarefa.classList.remove("oculto");
        });
    }

    if (btnNovaAtribuicao) {
        btnNovaAtribuicao.addEventListener('click', async () => {
            formAtribuicao.reset();
            modalTituloAtribuicao.textContent = "Nova Atribuição";
            await popularSelectUsuarios();
            await popularSelectTarefas();
            modalAtribuicao.classList.remove("oculto");
        });
    }

    // Botão logout com modal de confirmação
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            mostrarModalConfirmacao("Deseja realmente sair do sistema?", () => {
                realizarLogoutSeguroGerente();
            });
        });
    }

    // Formulários
    if (formTarefa) {
        formTarefa.addEventListener('submit', salvarTarefa);
    }

    if (formAtribuicao) {
        formAtribuicao.addEventListener('submit', salvarAtribuicao);
    }

    // Botões de cancelar
    if (btnCancelarTarefa) {
        btnCancelarTarefa.addEventListener('click', () => {
            modalTarefa.classList.add("oculto");
        });
    }

    if (btnCancelarAtribuicao) {
        btnCancelarAtribuicao.addEventListener('click', () => {
            modalAtribuicao.classList.add("oculto");
        });
    }

    if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener('click', () => {
            modalDetalhesTarefa.classList.add("oculto");
        });
    }

    // Seletores de filtros
    if (seletorFiltroTarefas) {
        seletorFiltroTarefas.addEventListener('change', (e) => {
            if (e.target.value) {
                adicionarFiltroTarefa(e.target.value);
                e.target.value = '';
            }
        });
    }

    if (seletorFiltroAtribuicoes) {
        seletorFiltroAtribuicoes.addEventListener('change', (e) => {
            if (e.target.value) {
                adicionarFiltroAtribuicao(e.target.value);
                e.target.value = '';
            }
        });
    }

    // Botões limpar filtros
    if (btnLimparFiltrosTarefas) {
        btnLimparFiltrosTarefas.addEventListener('click', limparFiltrosTarefas);
    }

    if (btnLimparFiltrosAtribuicoes) {
        btnLimparFiltrosAtribuicoes.addEventListener('click', limparFiltrosAtribuicoes);
    }

    // Fechar modais ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.add('oculto');
        }
    });
}

// --- Inicialização ---
async function inicializar() {
    const token = pegarToken();
    if (!token) {
        alert("Você precisa estar logado.");
        window.location.href = "../../html/login.html";
        return;
    }

    try {
        configurarNavegacao();
        configurarEventListeners();

        await Promise.all([
            carregarTarefas(),
            carregarUsuarios(),
            carregarTarefasCompletas()
        ]);

        await carregarAtribuicoes();

        // Verificar se o painel de calendário está ativo
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

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}