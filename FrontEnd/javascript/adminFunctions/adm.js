const API_BASE = "http://localhost:3000";

(function () {
    "use strict";

    /* ---------- VARIÁVEIS GLOBAIS ---------- */
    let timerInatividade;
    const TEMPO_INATIVIDADE = 30 * 60 * 1000; // 30 minutos
    let divResposta = null;

    /* ---------- FUNÇÃO SHOWMESSAGE (DEFINIDA NO TOPO) ---------- */
    function showMessage(msg, sucesso = true, timeout = 4000) {
        if (!divResposta) {
            divResposta = document.getElementById("divResposta");
            if (!divResposta) {
                if (sucesso) console.log("OK:", msg);
                else console.error("ERRO:", msg);
                return;
            }
        }
        divResposta.innerText = msg;
        divResposta.classList.remove("sucesso", "erro");
        divResposta.classList.add(sucesso ? "sucesso" : "erro");
        divResposta.style.display = "block";
        setTimeout(() => {
            divResposta.style.display = "none";
            divResposta.classList.remove("sucesso", "erro");
        }, timeout);
    }

    /* ---------- SISTEMA DE LOGOUT SEGURO ---------- */
    /**
     * Realiza logout completo e seguro
     * Remove todos os dados de autenticação e redireciona
     */
    function realizarLogoutSeguro() {
        try {
            // Mostrar modal de redirecionamento
            mostrarModalRedirecionamento();

            setTimeout(() => {
                // Limpar authToken principal
                localStorage.removeItem("authToken");

                // Limpar sessionStorage
                sessionStorage.clear();

                // Limpar outros dados sensíveis
                const chavesParaRemover = [
                    "userData",
                    "userRole",
                    "lastActivity",
                    "sessionId",
                    "refreshToken",
                    "permissions",
                    "eventosGerente",
                    "eventosAdmin",
                    "tarefaFixada"
                ];

                chavesParaRemover.forEach(chave => {
                    if (localStorage.getItem(chave)) {
                        localStorage.removeItem(chave);
                    }
                });

                // Log para auditoria
                console.log(`[${new Date().toISOString()}] Logout realizado pelo administrador`);

                // Redirecionar usando replace para evitar histórico
                setTimeout(() => {
                    window.location.replace("../../html/login.html");
                }, 1500);

            }, 500);

        } catch (erro) {
            console.error("Erro durante logout:", erro);

            // Fallback: limpar tudo e redirecionar mesmo com erro
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
        // Buscar o modal
        const modal = document.getElementById('modalRedirecionamento');

        if (!modal) {
            console.error("Modal de redirecionamento não encontrado!");
            return;
        }

        // Fechar todos os outros modais primeiro
        const modaisParaFechar = ["modalCriarUsuario", "modalEditarUsuario", "modalEditarCargo", "modalConfirmarExclusao"];
        modaisParaFechar.forEach(id => {
            const m = document.getElementById(id);
            if (m) m.classList.remove("active");
        });

        // Mostrar modal de redirecionamento
        modal.style.display = 'flex';
    }

    function resetarTimerInatividade() {
        if (timerInatividade) clearTimeout(timerInatividade);

        timerInatividade = setTimeout(() => {
            showMessage("Sua sessão expirou por inatividade.", false, 3000);
            setTimeout(() => {
                realizarLogoutSeguro();
            }, 2000);
        }, TEMPO_INATIVIDADE);
    }

    function iniciarMonitoramentoInatividade() {
        const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        eventos.forEach(evento => {
            document.addEventListener(evento, resetarTimerInatividade, true);
        });

        resetarTimerInatividade();
    }

    function iniciarVerificacaoToken() {
        setInterval(() => {
            const token = pegarToken();

            if (!token) {
                showMessage("Sessão expirada. Por favor, faça login novamente.", false, 3000);
                setTimeout(() => {
                    window.location.replace("../../html/login.html");
                }, 2000);
            }
        }, 5 * 60 * 1000);
    }

    // Detectar quando a página volta a ficar visível
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            const token = pegarToken();

            if (!token) {
                showMessage("Sua sessão expirou.", false);
                setTimeout(() => {
                    window.location.replace("../../html/login.html");
                }, 2000);
            }
        }
    });

    /* ---------- FIM DO SISTEMA DE LOGOUT SEGURO ---------- */

    document.addEventListener("DOMContentLoaded", () => {
        /* Elementos Globais */
        const navItems = document.querySelectorAll(".nav .nav-item");
        const btnRefresh = document.getElementById("btnRefresh");
        divResposta = document.getElementById("divResposta");
        const countUsuarios = document.getElementById("countUsuarios");
        const countCargos = document.getElementById("countCargos");

        let tabelaUsuariosBody = document.querySelector("#tabelaUsuarios");
        let tabelaCargosBody = document.querySelector("#tabelaCargos");

        let cargosCache = [];
        let usuariosCache = [];

        // Sistema de filtros
        let filtrosAtivos = {
            usuarios: {},
            cargos: {}
        };

        // Modal de confirmação
        let confirmarExclusaoCallback = null;

        /* ---------- Helpers ---------- */
        function pegarToken() {
            const authData = localStorage.getItem("authToken");

            if (!authData) return null;

            try {
                const { token, timestamp } = JSON.parse(authData);

                // Verificar se o token expirou (24 horas)
                const tempoDecorrido = Date.now() - timestamp;
                const TEMPO_EXPIRACAO = 24 * 60 * 60 * 1000;

                if (tempoDecorrido >= TEMPO_EXPIRACAO) {
                    localStorage.removeItem("authToken");
                    return null;
                }

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

        function apiFetch(path, options = {}) {
            const token = pegarToken();

            if (!token) {
                showMessage("Sessão expirada. Faça login novamente.", false);
                setTimeout(() => {
                    window.location.href = "../../html/login.html";
                }, 2000);
                return Promise.reject(new Error("Token não encontrado"));
            }

            const headers = options.headers || {};
            headers["Accept"] = "application/json";
            if (options.body) headers["Content-Type"] = "application/json";
            headers["Authorization"] = `Bearer ${token}`;
            options.headers = headers;

            return fetch(`${API_BASE}${path}`, options)
                .then(async (resp) => {
                    const data = await resp.json().catch(() => null);

                    if (resp.status === 401 || resp.status === 403) {
                        showMessage("Sessão inválida ou expirada. Redirecionando...", false);
                        localStorage.removeItem("authToken");
                        setTimeout(() => {
                            window.location.href = "../../html/login.html";
                        }, 2000);
                        throw new Error("Sessão expirada");
                    }

                    return { ok: resp.ok, status: resp.status, data, raw: resp };
                })
                .catch((err) => {
                    console.error("apiFetch erro de rede:", err);
                    return { ok: false, status: 0, data: null, error: err };
                });
        }

        function formatDate(dateStr) {
            if (!dateStr) return "-";
            const date = new Date(dateStr);
            if (isNaN(date)) return dateStr;
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            return date.toLocaleDateString('pt-BR', options);
        }

        function getCargoNome(id) {
            const cargo = cargosCache.find(c => String(c.idCargo) === String(id));
            return cargo ? cargo.nomeCargo : "-";
        }

        function normalizar(txt) {
            return (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /* ---------- Modal utilities ---------- */
        function getModal(idOrEl) {
            if (!idOrEl) return null;
            if (typeof idOrEl === "string") return document.getElementById(idOrEl);
            return idOrEl;
        }

        function showModal(modalElement) {
            const m = getModal(modalElement);
            if (!m) return;
            m.classList.remove("oculto");
            m.classList.add("active");
            const first = m.querySelector("input, select, textarea, button");
            if (first) first.focus();
        }

        function hideModal(modalElement) {
            const m = getModal(modalElement);
            if (!m) return;
            m.classList.remove("active");
        }

        function garantirModaisFechados() {
            ["modalCriarUsuario", "modalEditarUsuario", "modalEditarCargo", "modalConfirmarExclusao"].forEach(id => {
                const m = document.getElementById(id);
                if (m) m.classList.remove("active");
            });
        }

        function limparFormCriarUsuario() {
            const f = document.getElementById("formCriarUsuario");
            if (f) f.reset();
        }

        function popularSelectsCargos() {
            const selCriar = document.querySelector("#modalCriarUsuario #criarCargo");
            const selEditar = document.querySelector("#modalEditarUsuario #editarCargo");
            [selCriar, selEditar].forEach(sel => {
                if (!sel) return;
                sel.innerHTML = "";
                const optEmpty = document.createElement("option");
                optEmpty.value = "";
                optEmpty.text = "-- selecione --";
                sel.appendChild(optEmpty);
                cargosCache.forEach(c => {
                    const o = document.createElement("option");
                    o.value = c.idCargo;
                    o.text = c.nomeCargo;
                    sel.appendChild(o);
                });
            });
        }

        /* ---------- SISTEMA DE FILTROS ---------- */
        function adicionarFiltro(secao, tipo) {
            if (filtrosAtivos[secao][tipo]) {
                showMessage("Este filtro já está ativo", false);
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

                    case 'cargo':
                        titulo = '💼 Cargo';
                        const opcoesCargo = cargosCache.map(c => c.nomeCargo);
                        content = `
                            <select id="filtro${capitalize(secao)}Cargo">
                                <option value="">Todos</option>
                                ${opcoesCargo.map(opt => `<option value="${opt}" ${filtros[tipo].valor === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
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
                        <button class="btn-remove-filter" onclick="window.removerFiltro('${secao}', '${tipo}')">×</button>
                    </div>
                    <div class="filter-item-content">${content}</div>
                `;

                container.appendChild(filterItem);
            });

            adicionarEventosFiltros(secao);
        }

        function adicionarEventosFiltros(secao) {
            const inputBusca = document.getElementById(`filtro${capitalize(secao)}Busca`);
            if (inputBusca) {
                inputBusca.addEventListener('input', (e) => {
                    filtrosAtivos[secao].busca.valor = e.target.value;
                    aplicarFiltros(secao);
                });
            }

            const selectCargo = document.getElementById(`filtro${capitalize(secao)}Cargo`);
            if (selectCargo) {
                selectCargo.addEventListener('change', (e) => {
                    filtrosAtivos[secao].cargo.valor = e.target.value;
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
            let dados = secao === 'usuarios' ? [...usuariosCache] : [...cargosCache];
            const filtros = filtrosAtivos[secao];

            if (filtros.busca && filtros.busca.valor) {
                const busca = filtros.busca.valor.toLowerCase();
                dados = dados.filter(item => buscarEmObjeto(item, busca));
            }

            if (filtros.cargo && filtros.cargo.valor) {
                dados = dados.filter(item => {
                    const cargoNome = getCargoNome(item.idCargo);
                    return normalizar(cargoNome) === normalizar(filtros.cargo.valor);
                });
            }

            if (filtros.ordenar && filtros.ordenar.valor) {
                ordenarDados(dados, filtros.ordenar.valor, secao);
            }

            renderizarTabela(secao, dados);
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

        function ordenarDados(dados, criterio, secao) {
            dados.sort((a, b) => {
                const [campo, ordem] = criterio.split('-');
                let valA = a[campo] || '';
                let valB = b[campo] || '';

                if (ordem === 'desc') [valA, valB] = [valB, valA];

                return String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true });
            });
        }

        function getOpcoesOrdenacao(secao) {
            const opcoes = [
                { value: 'idUsuario-asc', label: 'ID (Crescente)' },
                { value: 'idUsuario-desc', label: 'ID (Decrescente)' }
            ];

            if (secao === 'usuarios') {
                opcoes.push(
                    { value: 'nomeUsuario-asc', label: 'Nome (A-Z)' },
                    { value: 'nomeUsuario-desc', label: 'Nome (Z-A)' },
                    { value: 'emailUsuario-asc', label: 'Email (A-Z)' }
                );
            } else if (secao === 'cargos') {
                opcoes.splice(0, 2,
                    { value: 'idCargo-asc', label: 'ID (Crescente)' },
                    { value: 'idCargo-desc', label: 'ID (Decrescente)' }
                );
                opcoes.push(
                    { value: 'nomeCargo-asc', label: 'Nome (A-Z)' },
                    { value: 'nomeCargo-desc', label: 'Nome (Z-A)' },
                    { value: 'prioridadeCargo-asc', label: 'Prioridade (Crescente)' },
                    { value: 'prioridadeCargo-desc', label: 'Prioridade (Decrescente)' }
                );
            }

            return opcoes;
        }

        function renderizarTabela(secao, dados) {
            const tbody = secao === 'usuarios' ? tabelaUsuariosBody : tabelaCargosBody;
            if (!tbody) return;

            tbody.innerHTML = '';

            if (dados.length === 0) {
                const colspan = secao === 'usuarios' ? 5 : 3;
                tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-state">Nenhum registro encontrado</td></tr>`;
                return;
            }

            dados.forEach(item => {
                const tr = criarLinhaTabela(secao, item);
                tbody.appendChild(tr);
            });
        }

        function criarLinhaTabela(secao, item) {
            const tr = document.createElement('tr');

            if (secao === 'usuarios') {
                const cargoNome = getCargoNome(item.idCargo);
                const dataCadastro = formatDate(item.dataCadastro);

                tr.innerHTML = `
                    <td>${item.nomeUsuario ?? "-"}</td>
                    <td>${item.emailUsuario ?? "-"}</td>
                    <td>${dataCadastro}</td>
                    <td>${cargoNome}</td>
                    <td class="center">
                        <button class="btn-inline primary btn-edit-user" data-id="${item.idUsuario}" title="Editar usuário">
                            <span class="btn-icon" aria-hidden="true">✎</span>
                            <span class="btn-text">Editar</span>
                        </button>
                        <button class="btn-inline danger btn-delete-user" data-id="${item.idUsuario}" title="Excluir usuário">
                            <span class="btn-icon" aria-hidden="true">🗑</span>
                            <span class="btn-text">Excluir</span>
                        </button>
                    </td>
                `;
            } else if (secao === 'cargos') {
                const prioridade = item.prioridadeCargo ?? item.prioridade ?? "-";

                tr.innerHTML = `
                    <td>${item.nomeCargo ?? "-"}</td>
                    <td>${prioridade}</td>
                    <td class="center">
                        <button class="btn-inline primary btn-edit-cargo" data-id="${item.idCargo}" title="Editar cargo">
                            <span class="btn-icon" aria-hidden="true">✎</span>
                            <span class="btn-text">Editar</span>
                        </button>
                        <button class="btn-inline danger btn-delete-cargo" data-id="${item.idCargo}" title="Excluir cargo">
                            <span class="btn-icon" aria-hidden="true">🗑</span>
                            <span class="btn-text">Excluir</span>
                        </button>
                    </td>
                `;
            }

            return tr;
        }

        // Expor funções para uso global
        window.removerFiltro = removerFiltro;

        /* ---------- Requisições / Cache ---------- */
        async function carregarCargos() {
            const { ok, data } = await apiFetch("/cargos", { method: "GET" });
            if (!ok || !data) {
                showMessage("Falha ao carregar cargos.", false);
                cargosCache = [];
                if (countCargos) countCargos.textContent = 0;
                aplicarFiltros('cargos');
                return;
            }
            if (data.status !== true) {
                showMessage(data.message || "Erro ao obter cargos", false);
                cargosCache = [];
                if (countCargos) countCargos.textContent = 0;
                aplicarFiltros('cargos');
                return;
            }
            cargosCache = Array.isArray(data.data) ? data.data : [];
            if (countCargos) countCargos.textContent = cargosCache.length;
            aplicarFiltros('cargos');
        }

        async function carregarUsuarios() {
            if (!cargosCache || cargosCache.length === 0) {
                await carregarCargos();
            }

            const { ok, data } = await apiFetch("/usuarios", { method: "GET" });
            if (!ok || !data) {
                showMessage("Falha ao carregar usuários.", false);
                usuariosCache = [];
                if (countUsuarios) countUsuarios.textContent = 0;
                aplicarFiltros('usuarios');
                return;
            }
            if (data.status !== true) {
                showMessage(data.message || "Erro ao obter usuários", false);
                usuariosCache = [];
                if (countUsuarios) countUsuarios.textContent = 0;
                aplicarFiltros('usuarios');
                return;
            }
            usuariosCache = Array.isArray(data.data) ? data.data : [];
            if (countUsuarios) countUsuarios.textContent = usuariosCache.length;
            aplicarFiltros('usuarios');
        }

        /* ---------- Modal de Confirmação ---------- */
        function abrirModalConfirmacao(texto, callback) {
            const modal = document.getElementById("modalConfirmarExclusao");
            const textoEl = document.getElementById("confirmarExclusaoTexto");

            if (textoEl) textoEl.textContent = texto;
            confirmarExclusaoCallback = callback;
            showModal(modal);
        }

        document.getElementById("btnConfirmarExclusao")?.addEventListener("click", () => {
            if (confirmarExclusaoCallback) {
                confirmarExclusaoCallback();
                confirmarExclusaoCallback = null;
            }
            hideModal("modalConfirmarExclusao");
        });

        /* ---------- CRUD ---------- */
        async function criarUsuario(payload) {
            const { ok, data } = await apiFetch("/usuarios", { method: "POST", body: JSON.stringify(payload) });
            if (ok && data && data.status === true) {
                showMessage(data.message || "Usuário criado.", true);
                hideModal("modalCriarUsuario");
                await carregarUsuarios();
                return true;
            } else {
                const msg = data ? (data.message || JSON.stringify(data)) : "Erro ao criar usuário";
                showMessage(msg, false);
                console.error("criarUsuario erro:", data);
                return false;
            }
        }

        async function atualizarUsuario(idUsuario, payload) {
            const { ok, data } = await apiFetch(`/usuarios/${idUsuario}`, { method: "PUT", body: JSON.stringify(payload) });
            if (ok && data && data.status === true) {
                showMessage(data.message || "Usuário atualizado.", true);
                hideModal("modalEditarUsuario");
                await carregarUsuarios();
                return true;
            } else {
                const msg = data ? (data.message || JSON.stringify(data)) : "Erro ao atualizar usuário";
                showMessage(msg, false);
                console.error("atualizarUsuario erro:", data);
                return false;
            }
        }

        async function excluirUsuario(idUsuario) {
            const usuario = usuariosCache.find(u => String(u.idUsuario) === String(idUsuario));
            const nomeUsuario = usuario ? usuario.nomeUsuario : `ID ${idUsuario}`;

            abrirModalConfirmacao(
                `Deseja realmente excluir o usuário "${nomeUsuario}"? Esta ação não pode ser desfeita.`,
                async () => {
                    const { ok, data } = await apiFetch(`/usuarios/${idUsuario}`, { method: "DELETE" });
                    if (ok && data && data.status === true) {
                        showMessage(data.message || "Usuário excluído.", true);
                        await carregarUsuarios();
                        return true;
                    } else {
                        const msg = data ? (data.message || JSON.stringify(data)) : "Erro ao excluir usuário";
                        showMessage(msg, false);
                        console.error("excluirUsuario erro:", data);
                        return false;
                    }
                }
            );
        }

        async function criarCargo(payload) {
            const { ok, data } = await apiFetch("/cargos", { method: "POST", body: JSON.stringify(payload) });
            if (ok && data && data.status === true) {
                showMessage(data.message || "Cargo criado.", true);
                hideModal("modalEditarCargo");
                await carregarCargos();
                return true;
            } else {
                const msg = data ? (data.message || JSON.stringify(data)) : "Erro ao criar cargo";
                showMessage(msg, false);
                console.error("criarCargo erro:", data);
                return false;
            }
        }

        async function atualizarCargo(idCargo, payload) {
            const { ok, data } = await apiFetch(`/cargos/${idCargo}`, { method: "PUT", body: JSON.stringify(payload) });
            if (ok && data && data.status === true) {
                showMessage(data.message || "Cargo atualizado.", true);
                hideModal("modalEditarCargo");
                await carregarCargos();
                return true;
            } else {
                const msg = data ? (data.message || JSON.stringify(data)) : "Erro ao atualizar cargo";
                showMessage(msg, false);
                console.error("atualizarCargo erro:", data);
                return false;
            }
        }

        async function excluirCargo(idCargo) {
            const cargo = cargosCache.find(c => String(c.idCargo) === String(idCargo));
            const nomeCargo = cargo ? cargo.nomeCargo : `ID ${idCargo}`;

            abrirModalConfirmacao(
                `Deseja realmente excluir o cargo "${nomeCargo}"? Esta ação não pode ser desfeita.`,
                async () => {
                    const { ok, data } = await apiFetch(`/cargos/${idCargo}`, { method: "DELETE" });
                    if (ok && data && data.status === true) {
                        showMessage(data.message || "Cargo excluído.", true);
                        await carregarCargos();
                        return true;
                    } else {
                        const msg = data ? (data.message || JSON.stringify(data)) : "Erro ao excluir cargo";
                        showMessage(msg, false);
                        console.error("excluirCargo erro:", data);
                        return false;
                    }
                }
            );
        }

        /* ---------- Event Delegation ---------- */
        document.addEventListener("click", async (ev) => {
            const createUserBtn = ev.target.closest("[data-action='create-user']");
            if (createUserBtn) {
                limparFormCriarUsuario();
                await carregarCargos();
                popularSelectsCargos();
                showModal("modalCriarUsuario");
                return;
            }

            const createCargoBtn = ev.target.closest("[data-action='create-cargo']");
            if (createCargoBtn) {
                const idEl = document.getElementById("editarCargoId");
                const nomeEl = document.getElementById("editarNomeCargo");
                const priorEl = document.getElementById("editarPrioridadeCargo");
                if (idEl) idEl.value = "";
                if (nomeEl) nomeEl.value = "";
                if (priorEl) priorEl.value = "";
                showModal("modalEditarCargo");
                return;
            }

            const btnEditUser = ev.target.closest(".btn-edit-user");
            if (btnEditUser) {
                const id = btnEditUser.dataset.id;
                const usuario = usuariosCache.find(u => String(u.idUsuario) === String(id));
                const idEl = document.getElementById("editarUsuarioId");
                const nomeEl = document.getElementById("editarNome");
                const emailEl = document.getElementById("editarEmail");
                const senhaEl = document.getElementById("editarSenha");
                const cargoEl = document.getElementById("editarCargo");

                if (usuario) {
                    if (idEl) idEl.value = usuario.idUsuario;
                    if (nomeEl) nomeEl.value = usuario.nomeUsuario || "";
                    if (emailEl) emailEl.value = usuario.emailUsuario || "";
                    if (senhaEl) senhaEl.value = "";
                    if (cargoEl) cargoEl.value = usuario.idCargo || "";
                    await carregarCargos();
                    popularSelectsCargos();
                    showModal("modalEditarUsuario");
                } else {
                    const { ok, data } = await apiFetch(`/usuarios/${id}`, { method: "GET" });
                    if (ok && data && data.status === true && data.data) {
                        const u = data.data;
                        if (idEl) idEl.value = u.idUsuario;
                        if (nomeEl) nomeEl.value = u.nomeUsuario || "";
                        if (emailEl) emailEl.value = u.emailUsuario || "";
                        if (senhaEl) senhaEl.value = "";
                        if (cargoEl) cargoEl.value = u.idCargo || "";
                        await carregarCargos();
                        popularSelectsCargos();
                        showModal("modalEditarUsuario");
                    } else {
                        showMessage("Usuário não encontrado.", false);
                    }
                }
                return;
            }

            const btnDeleteUser = ev.target.closest(".btn-delete-user");
            if (btnDeleteUser) {
                const id = btnDeleteUser.dataset.id;
                await excluirUsuario(id);
                return;
            }

            const btnEditCargo = ev.target.closest(".btn-edit-cargo");
            if (btnEditCargo) {
                const id = btnEditCargo.dataset.id;
                const cargo = cargosCache.find(c => String(c.idCargo) === String(id));
                const idEl = document.getElementById("editarCargoId");
                const nomeEl = document.getElementById("editarNomeCargo");
                const priorEl = document.getElementById("editarPrioridadeCargo");

                if (cargo) {
                    if (idEl) idEl.value = cargo.idCargo;
                    if (nomeEl) nomeEl.value = cargo.nomeCargo || "";
                    if (priorEl) priorEl.value = cargo.prioridadeCargo ?? cargo.prioridade ?? "";
                    showModal("modalEditarCargo");
                } else {
                    const { ok, data } = await apiFetch(`/cargos/${id}`, { method: "GET" });
                    if (ok && data && data.status === true && data.data) {
                        const c = data.data;
                        if (idEl) idEl.value = c.idCargo;
                        if (nomeEl) nomeEl.value = c.nomeCargo || "";
                        if (priorEl) priorEl.value = c.prioridadeCargo ?? c.prioridade ?? "";
                        showModal("modalEditarCargo");
                    } else {
                        showMessage("Cargo não encontrado.", false);
                    }
                }
                return;
            }

            const btnDeleteCargo = ev.target.closest(".btn-delete-cargo");
            if (btnDeleteCargo) {
                const id = btnDeleteCargo.dataset.id;
                await excluirCargo(id);
                return;
            }
        });

        /* ---------- Forms handling ---------- */
        const formCriarUsuario = document.getElementById("formCriarUsuario");
        if (formCriarUsuario) {
            formCriarUsuario.addEventListener("submit", async (ev) => {
                ev.preventDefault();
                const nome = (document.getElementById("criarNome") || {}).value?.trim() || "";
                const email = (document.getElementById("criarEmail") || {}).value?.trim() || "";
                const senha = (document.getElementById("criarSenha") || {}).value || "";
                const idCargo = (document.getElementById("criarCargo") || {}).value || null;

                if (!nome) { showMessage("Nome obrigatório.", false); return; }
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showMessage("Email inválido.", false); return; }
                if (!senha || senha.length < 6) { showMessage("Senha deve ter ao menos 6 caracteres.", false); return; }

                const payload = { nomeUsuario: nome, emailUsuario: email, senhaUsuario: senha, idCargo: idCargo };
                await criarUsuario(payload);
            });
        }

        const formEditarUsuario = document.getElementById("formEditarUsuario");
        if (formEditarUsuario) {
            formEditarUsuario.addEventListener("submit", async (ev) => {
                ev.preventDefault();
                const id = (document.getElementById("editarUsuarioId") || {}).value;
                const nome = (document.getElementById("editarNome") || {}).value?.trim() || "";
                const email = (document.getElementById("editarEmail") || {}).value?.trim() || "";
                const senha = (document.getElementById("editarSenha") || {}).value || "";
                const idCargo = (document.getElementById("editarCargo") || {}).value || null;

                if (!id) { showMessage("ID do usuário ausente.", false); return; }
                if (!nome) { showMessage("Nome obrigatório.", false); return; }
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showMessage("Email inválido.", false); return; }

                const payload = { nomeUsuario: nome, emailUsuario: email, idCargo: idCargo };
                if (senha && senha.trim()) payload.senhaUsuario = senha.trim();

                await atualizarUsuario(id, payload);
            });
        }

        const formEditarCargo = document.getElementById("formEditarCargo");
        if (formEditarCargo) {
            formEditarCargo.addEventListener("submit", async (ev) => {
                ev.preventDefault();
                const id = (document.getElementById("editarCargoId") || {}).value;
                const nome = (document.getElementById("editarNomeCargo") || {}).value?.trim() || "";
                const prioridade = (document.getElementById("editarPrioridadeCargo") || {}).value || 0;

                if (!nome) { showMessage("Nome do cargo obrigatório.", false); return; }

                const payload = { nomeCargo: nome, prioridadeCargo: Number(prioridade) };

                if (id && String(id).length > 0) {
                    await atualizarCargo(id, payload);
                } else {
                    await criarCargo(payload);
                }
            });
        }

        /* ---------- Modal control ---------- */
        function setupModalControls() {
            document.addEventListener("click", (ev) => {
                const dismiss = ev.target.closest("[data-dismiss='modal'], .modal .close");
                if (dismiss) {
                    const modal = ev.target.closest(".modal");
                    if (modal) hideModal(modal);
                }
                if (ev.target.classList && ev.target.classList.contains("backdrop")) {
                    const modal = ev.target.closest(".modal");
                    if (modal) hideModal(modal);
                }
            });

            document.addEventListener("keydown", (ev) => {
                if (ev.key === "Escape") {
                    ["modalCriarUsuario", "modalEditarUsuario", "modalEditarCargo", "modalConfirmarExclusao"].forEach(id => {
                        const m = document.getElementById(id);
                        if (m && m.classList.contains("active")) hideModal(m);
                    });
                }
            });
        }

        /* ---------- Navigation ---------- */
        function clearActiveNav() {
            navItems.forEach(n => n.classList.remove("active"));
        }

        function showSection(sectionId) {
            clearActiveNav();
            const navItem = document.querySelector(`.nav .nav-item[data-section="${sectionId}"]`);
            if (navItem) navItem.classList.add("active");

            const overviewEl = document.getElementById("overview");
            const usuariosEl = document.getElementById("usuarios");
            const cargosEl = document.getElementById("cargos");

            [overviewEl, usuariosEl, cargosEl].forEach(el => {
                if (el) el.classList.add("oculto");
            });

            const sel = document.getElementById(sectionId);
            if (sel) sel.classList.remove("oculto");

            (async () => {
                if (sectionId === "usuarios") {
                    await carregarCargos();
                    popularSelectsCargos();
                    await carregarUsuarios();
                } else if (sectionId === "cargos") {
                    await carregarCargos();
                }
            })();
        }

        /* ---------- Setup Filtros ---------- */
        function setupFiltros() {
            const seletorUsuarios = document.getElementById("seletorFiltroUsuarios");
            if (seletorUsuarios) {
                seletorUsuarios.addEventListener('change', (e) => {
                    if (e.target.value) {
                        adicionarFiltro('usuarios', e.target.value);
                        e.target.value = '';
                    }
                });
            }

            const btnLimparUsuarios = document.getElementById("btnLimparFiltrosUsuarios");
            if (btnLimparUsuarios) {
                btnLimparUsuarios.addEventListener('click', () => {
                    limparFiltros('usuarios');
                });
            }

            const seletorCargos = document.getElementById("seletorFiltroCargos");
            if (seletorCargos) {
                seletorCargos.addEventListener('change', (e) => {
                    if (e.target.value) {
                        adicionarFiltro('cargos', e.target.value);
                        e.target.value = '';
                    }
                });
            }

            const btnLimparCargos = document.getElementById("btnLimparFiltrosCargos");
            if (btnLimparCargos) {
                btnLimparCargos.addEventListener('click', () => {
                    limparFiltros('cargos');
                });
            }
        }

        /* ---------- Verificar autenticação ---------- */
        function verificarAutenticacao() {
            const token = pegarToken();

            if (!token) {
                showMessage("Você precisa estar logado para acessar esta página.", false);
                setTimeout(() => {
                    window.location.href = "../../html/login.html";
                }, 2000);
                return false;
            }

            return true;
        }

        /* ---------- Initialization ---------- */
        async function inicializarTudo() {
            if (!verificarAutenticacao()) {
                return;
            }

            garantirModaisFechados();
            showSection("overview");
            await carregarCargos();
            await carregarUsuarios();
        }

        // Attach navigation listeners
        navItems.forEach(item => {
            item.addEventListener("click", () => {
                const sectionId = item.getAttribute("data-section");
                if (sectionId) showSection(sectionId);
            });
        });

        // Refresh button
        if (btnRefresh) {
            btnRefresh.addEventListener("click", async () => {
                await inicializarTudo();
                showMessage("Dados atualizados.", true);
            });
        }

        // Logout button
        const btnLogout = document.getElementById("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                realizarLogoutSeguro();
            });
        }

        // Setup modal controls
        setupModalControls();

        // Setup filtros
        setupFiltros();

        // Iniciar monitoramento de inatividade
        iniciarMonitoramentoInatividade();

        // Iniciar verificação periódica do token
        iniciarVerificacaoToken();

        // Start
        inicializarTudo();
    });
})();