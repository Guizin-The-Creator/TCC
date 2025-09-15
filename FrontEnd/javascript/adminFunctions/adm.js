

const API_BASE = "http://localhost:3000";

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        /* Elementos Globais */
        const navItems = document.querySelectorAll(".nav .nav-item");
        const btnRefresh = document.getElementById("btnRefresh");

        // Modais / forms (refs reconsultadas quando necessário)
        let modalCriarUsuario = document.getElementById("modalCriarUsuario");
        let modalEditarUsuario = document.getElementById("modalEditarUsuario");
        let modalEditarCargo = document.getElementById("modalEditarCargo");
        const btnCreateUserHeader = document.getElementById("btnCreateUserHeader");

        // Feedback
        const divResposta = document.getElementById("divResposta");
        const toastContainer = document.getElementById("toastContainer");

        // counters (these exist in overview)
        const countUsuarios = document.getElementById("countUsuarios");
        const countCargos = document.getElementById("countCargos");

        // references to table bodies (will be updated after moving cards)
        let tabelaUsuariosBody = document.querySelector("#tabelaUsuarios tbody");
        let tabelaCargosBody = document.querySelector("#tabelaCargos tbody");
        let usuariosCard = null;
        let cargosCard = null;

        let cargosCache = [];
        let usuariosCache = [];

        /* ---------- Helpers ---------- */
        function showMessage(msg, sucesso = true, timeout = 4000) {
            if (!divResposta) {
                if (sucesso) console.log("OK:", msg);
                else console.error("ERRO:", msg);
                return;
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

        function apiFetch(path, options = {}) {
            const token = localStorage.getItem("token");
            const headers = options.headers || {};
            headers["Accept"] = "application/json";
            if (options.body) headers["Content-Type"] = "application/json";
            if (token) headers["Authorization"] = `Bearer ${token}`;
            options.headers = headers;

            return fetch(`${API_BASE}${path}`, options)
                .then(async (resp) => {
                    const data = await resp.json().catch(() => null);
                    if (resp.status === 401) {
                        showMessage("Token inválido ou expirado. Faça login novamente.", false);
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

        /* ---------- Modal utilities (CORREÇÃO PRINCIPAL) ---------- */
        function getModal(idOrEl) {
            if (!idOrEl) return null;
            if (typeof idOrEl === "string") return document.getElementById(idOrEl);
            return idOrEl;
        }

        function showModal(modalElement) {
            const m = getModal(modalElement);
            if (!m) return;
            // Remove any "oculto" (usado para sections) só por segurança e adicionar a classe ativa do modal
            m.classList.remove("oculto");
            m.classList.add("active");
            // foco no primeiro campo
            const first = m.querySelector("input, select, textarea, button");
            if (first) first.focus();
        }

        function hideModal(modalElement) {
            const m = getModal(modalElement);
            if (!m) return;
            m.classList.remove("active");
            // não forçar .oculto aqui — sections usam .oculto globalmente
        }

        function garantirModaisFechados() {
            // Garante que nenhum modal esteja com a classe .active ao iniciar
            ["modalCriarUsuario", "modalEditarUsuario", "modalEditarCargo"].forEach(id => {
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

        /* ---------- Move cards para suas seções ---------- */
        function moverCardsParaSecoes() {
            const tabelaUsuarios = document.querySelector("#tabelaUsuarios");
            const tabelaCargos = document.querySelector("#tabelaCargos");
            const overview = document.getElementById("overview");
            const mainContent = document.getElementById("mainContent");

            let usuariosSection = document.getElementById("usuarios");
            if (!usuariosSection) {
                usuariosSection = document.createElement("section");
                usuariosSection.id = "usuarios";
                usuariosSection.className = "oculto";
                if (overview && overview.parentNode) overview.parentNode.insertBefore(usuariosSection, overview.nextSibling);
                else if (mainContent) mainContent.appendChild(usuariosSection);
                else document.body.appendChild(usuariosSection);
            }

            let cargosSection = document.getElementById("cargos");
            if (!cargosSection) {
                cargosSection = document.createElement("section");
                cargosSection.id = "cargos";
                cargosSection.className = "oculto";
                if (usuariosSection && usuariosSection.parentNode) usuariosSection.parentNode.insertBefore(cargosSection, usuariosSection.nextSibling);
                else if (mainContent) mainContent.appendChild(cargosSection);
                else document.body.appendChild(cargosSection);
            }

            function moverTabelaParaSecao(tabelaEl, secaoDestino) {
                if (!tabelaEl || !secaoDestino) return;
                const cardPai = tabelaEl.closest(".card");
                if (!cardPai) return;
                if (cardPai.parentNode === secaoDestino) return;
                secaoDestino.appendChild(cardPai);
            }

            moverTabelaParaSecao(tabelaUsuarios, usuariosSection);
            moverTabelaParaSecao(tabelaCargos, cargosSection);

            atualizarReferenciasAposMovimento();
        }

        function atualizarReferenciasAposMovimento() {
            const tabelaUsuarios = document.querySelector("#tabelaUsuarios");
            const tabelaCargos = document.querySelector("#tabelaCargos");
            tabelaUsuariosBody = tabelaUsuarios ? tabelaUsuarios.querySelector("tbody") : null;
            tabelaCargosBody = tabelaCargos ? tabelaCargos.querySelector("tbody") : null;
            usuariosCard = tabelaUsuarios ? tabelaUsuarios.closest(".card") : document.getElementById("usuarios");
            cargosCard = tabelaCargos ? tabelaCargos.closest(".card") : document.getElementById("cargos");
        }

        /* ---------- Render Tabelas ---------- */
        function renderTabelaUsuarios() {
            if (!tabelaUsuariosBody) {
                console.error("Erro: <tbody> da tabela de usuários não encontrado.");
                return;
            }

            tabelaUsuariosBody.innerHTML = "";
            if (!Array.isArray(usuariosCache) || usuariosCache.length === 0) {
                tabelaUsuariosBody.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
                return;
            }

            usuariosCache.forEach(usuario => {
                const tr = document.createElement("tr");
                const cargoNome = getCargoNome(usuario.idCargo);
                const dataCadastroFormatada = formatDate(usuario.dataCadastro);

                const acoes = `
                    <button class="btn-inline primary btn-edit-user" data-id="${usuario.idUsuario}" title="Editar usuário">
                        <span class="btn-icon" aria-hidden="true">✎</span>
                        <span class="btn-text">Editar</span>
                    </button>
                    <button class="btn-inline danger btn-delete-user" data-id="${usuario.idUsuario}" title="Excluir usuário">
                        <span class="btn-icon" aria-hidden="true">🗑</span>
                        <span class="btn-text">Excluir</span>
                    </button>
                `;

                tr.innerHTML = `
                    <td>${usuario.nomeUsuario ?? "-"}</td>
                    <td>${usuario.emailUsuario ?? "-"}</td>
                    <td>${dataCadastroFormatada}</td>
                    <td>${cargoNome}</td>
                    <td>${acoes}</td>
                `;
                tabelaUsuariosBody.appendChild(tr);
            });
        }

        function renderTabelaCargos() {
            if (!tabelaCargosBody) {
                console.error("Erro: <tbody> da tabela de cargos não encontrado.");
                return;
            }

            tabelaCargosBody.innerHTML = "";
            if (!Array.isArray(cargosCache) || cargosCache.length === 0) {
                tabelaCargosBody.innerHTML = '<tr><td colspan="3">Nenhum cargo encontrado.</td></tr>';
                return;
            }

            cargosCache.forEach(cargo => {
                const tr = document.createElement("tr");
                const prioridade = cargo.prioridadeCargo ?? cargo.prioridade ?? "-";
                const acoes = `
                    <button class="btn-inline ghost btn-edit-cargo" data-id="${cargo.idCargo}" title="Editar cargo">
                        <span class="btn-icon" aria-hidden="true">✎</span>
                        <span class="btn-text">Editar</span>
                    </button>
                    <button class="btn-inline danger btn-delete-cargo" data-id="${cargo.idCargo}" title="Excluir cargo">
                        <span class="btn-icon" aria-hidden="true">🗑</span>
                        <span class="btn-text">Excluir</span>
                    </button>
                `;
                tr.innerHTML = `
                    <td>${cargo.nomeCargo ?? "-"}</td>
                    <td>${prioridade}</td>
                    <td>${acoes}</td>
                `;
                tabelaCargosBody.appendChild(tr);
            });
        }

        /* ---------- Requisições / Cache ---------- */
        async function carregarCargos() {
            const { ok, data } = await apiFetch("/cargos", { method: "GET" });
            if (!ok || !data) {
                showMessage("Falha ao carregar cargos.", false);
                cargosCache = [];
                if (countCargos) countCargos.textContent = 0;
                renderTabelaCargos();
                return;
            }
            if (data.status !== true) {
                showMessage(data.message || "Erro ao obter cargos", false);
                cargosCache = [];
                if (countCargos) countCargos.textContent = 0;
                renderTabelaCargos();
                return;
            }
            cargosCache = Array.isArray(data.data) ? data.data : [];
            if (countCargos) countCargos.textContent = cargosCache.length;
            renderTabelaCargos();
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
                renderTabelaUsuarios();
                return;
            }
            if (data.status !== true) {
                showMessage(data.message || "Erro ao obter usuários", false);
                usuariosCache = [];
                if (countUsuarios) countUsuarios.textContent = 0;
                renderTabelaUsuarios();
                return;
            }
            usuariosCache = Array.isArray(data.data) ? data.data : [];
            if (countUsuarios) countUsuarios.textContent = usuariosCache.length;
            renderTabelaUsuarios();
        }

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
            if (!confirm(`Deseja realmente excluir o usuário de ID ${idUsuario}?`)) return false;
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
            if (!confirm(`Deseja realmente excluir o cargo de ID ${idCargo}?`)) return false;
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

        /* ---------- Event Delegation (create/edit/delete) ---------- */
        document.addEventListener("click", async (ev) => {
            // CREATE: header button (id) or injected section buttons (data-action)
            const createUserBtn = ev.target.closest("#btnCreateUserHeader, [data-action='create-user']");
            if (createUserBtn) {
                limparFormCriarUsuario();
                await carregarCargos();
                popularSelectsCargos();
                showModal("modalCriarUsuario");
                return;
            }

            const createCargoBtn = ev.target.closest("[data-action='create-cargo']");
            if (createCargoBtn) {
                // limpar modal de cargo (edit used as create)
                const idEl = document.getElementById("editarCargoId");
                const nomeEl = document.getElementById("editarNomeCargo");
                const priorEl = document.getElementById("editarPrioridadeCargo");
                if (idEl) idEl.value = "";
                if (nomeEl) nomeEl.value = "";
                if (priorEl) priorEl.value = "";
                showModal("modalEditarCargo");
                return;
            }

            // Edit user
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

            // Delete user
            const btnDeleteUser = ev.target.closest(".btn-delete-user");
            if (btnDeleteUser) {
                const id = btnDeleteUser.dataset.id;
                await excluirUsuario(id);
                return;
            }

            // Edit cargo
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

            // Delete cargo
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

                const payload = { nomeUsuario: nome, emailUsuario: email, idCargo: idCargo, senhaUsuario: senha };
                if (senha && senha.trim()) payload.senha = senha.trim();

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

        /* ---------- Modal control (dismiss/backdrop/ESC) ---------- */
        function setupModalControls() {
            // Adiciona data-action ao botão header para delegação consistente (não remove o botão)
            if (btnCreateUserHeader) btnCreateUserHeader.setAttribute("data-action", "create-user");

            // fecha ao clicar no botão com data-dismiss ou no '✕'
            document.addEventListener("click", (ev) => {
                const dismiss = ev.target.closest("[data-dismiss='modal'], .modal .close");
                if (dismiss) {
                    // fecha o modal pai
                    const modal = ev.target.closest(".modal");
                    if (modal) hideModal(modal);
                }
                // clique no backdrop
                if (ev.target.classList && ev.target.classList.contains("backdrop")) {
                    const modal = ev.target.closest(".modal");
                    if (modal) hideModal(modal);
                }
            });

            // ESC para fechar
            document.addEventListener("keydown", (ev) => {
                if (ev.key === "Escape") {
                    ["modalCriarUsuario", "modalEditarUsuario", "modalEditarCargo"].forEach(id => {
                        const m = document.getElementById(id);
                        if (m && m.classList.contains("active")) hideModal(m);
                    });
                }
            });
        }

        /* ---------- Inject section buttons ---------- */
        function injectSectionButtons(section) {
            // remove existentes
            const existingUserBtn = document.getElementById("btnCreateUserSection");
            if (existingUserBtn && existingUserBtn.parentNode) existingUserBtn.parentNode.removeChild(existingUserBtn);
            const existingCargoBtn = document.getElementById("btnCreateCargoSection");
            if (existingCargoBtn && existingCargoBtn.parentNode) existingCargoBtn.parentNode.removeChild(existingCargoBtn);

            atualizarReferenciasAposMovimento();

            if (section === "usuarios" && usuariosCard) {
                const header = usuariosCard.querySelector(":scope > div") || usuariosCard.firstElementChild;
                if (!header) return;
                const btn = document.createElement("button");
                btn.id = "btnCreateUserSection";
                btn.className = "btn primary";
                btn.setAttribute("data-action", "create-user");
                btn.innerHTML = `<span class="btn-icon" aria-hidden="true">＋</span><span class="btn-text">Criar usuário</span>`;
                header.appendChild(btn);
            }

            if (section === "cargos" && cargosCard) {
                const header = cargosCard.querySelector(":scope > div") || cargosCard.firstElementChild;
                if (!header) return;
                const btn = document.createElement("button");
                btn.id = "btnCreateCargoSection";
                btn.className = "btn primary";
                btn.setAttribute("data-action", "create-cargo");
                btn.innerHTML = `<span class="btn-icon" aria-hidden="true">＋</span><span class="btn-text">Criar cargo</span>`;
                header.appendChild(btn);
            }
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
            const auditoriaEl = document.getElementById("auditoria");

            [overviewEl, usuariosEl, cargosEl, auditoriaEl].forEach(el => { if (el) el.classList.add("oculto"); });

            const sel = document.getElementById(sectionId);
            if (sel) sel.classList.remove("oculto");

            (async () => {
                if (sectionId === "usuarios") {
                    await carregarCargos();
                    popularSelectsCargos();
                    await carregarUsuarios();
                    injectSectionButtons("usuarios");
                } else if (sectionId === "cargos") {
                    await carregarCargos();
                    injectSectionButtons("cargos");
                }
            })();
        }

        /* ---------- Initialization ---------- */
        async function inicializarTudo() {
            garantirModaisFechados();
            moverCardsParaSecoes();
            showSection("overview");
            await carregarCargos();
        }

        // attach navigation listeners
        navItems.forEach(item => {
            item.addEventListener("click", () => {
                const sectionId = item.getAttribute("data-section");
                if (sectionId) showSection(sectionId);
            });
        });

        // refresh
        if (btnRefresh) btnRefresh.addEventListener("click", async () => {
            await inicializarTudo();
            showMessage("Dados atualizados.", true);
        });

        // setup modals controls
        setupModalControls();

        // start
        inicializarTudo();
    });
})();
