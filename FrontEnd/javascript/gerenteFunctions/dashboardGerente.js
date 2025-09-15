function atualizarResumoTarefasAtr(atribuicoes) {
    const normalizar = txt => (txt || "").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    document.getElementById("cardTotal").textContent = atribuicoes.length;
    document.getElementById("cardConcluidas").textContent =
        atribuicoes.filter(a => normalizar(a.status) === "concluida").length;
    document.getElementById("cardPendentes").textContent =
        atribuicoes.filter(a => normalizar(a.status) === "pendente").length;
    document.getElementById("cardAndamento").textContent =
        atribuicoes.filter(a => normalizar(a.status) === "em andamento").length;
}

function atualizarResumoTarefas(tarefas) {
    document.getElementById("cardTotal").textContent = tarefas.length;
    document.getElementById("cardConcluidas").textContent =
        tarefas.filter(t => t.statusTarefa?.toLowerCase() === "concluída").length;
    document.getElementById("cardPendentes").textContent =
        tarefas.filter(t => t.statusTarefa?.toLowerCase() === "pendente").length;
    document.getElementById("cardAndamento").textContent =
        tarefas.filter(t => t.statusTarefa?.toLowerCase() === "em andamento").length;
}

// Arquivo: dashboardGerente.js
// Painel Gerente Unificado - Backend + Visual com métodos em português

// --- Autenticação ---
const token = localStorage.getItem("token");
if (!token) {
    alert("Você precisa estar logado.");
    window.location.href = "../../html/login.html";
}

// --- Utilitários Visuais ---
function escaparHTML(texto) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Elementos de modais
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

// Elementos de navegação
const navBtns = document.querySelectorAll(".btn-nav");
const paineis = document.querySelectorAll(".content-section");

// Elementos de tabelas
const tabelaTarefasBody = document.querySelector("#tabelaTarefas tbody");
const tabelaAtribuicoesBody = document.querySelector("#tabelaAtribuicoes tbody");
const respostaTarefas = document.getElementById("respostaTarefas");
const respostaAtribuicoes = document.getElementById("respostaAtribuicoes");

// Elementos de formulários
const modalTarefa = document.getElementById("modalTarefa");
const modalTituloTarefa = document.getElementById("modalTituloTarefa");
const formTarefa = document.getElementById("formTarefa");
const inputIdTarefa = document.getElementById("inputIdTarefa");
const inputTituloTarefa = document.getElementById("inputTituloTarefa");
const inputDescricaoTarefa = document.getElementById("inputDescricaoTarefa");
const selectPrioridadeTarefa = document.getElementById("selectPrioridadeTarefa");
const inputDataInicio = document.getElementById("inputDataInicio");
const inputDataFim = document.getElementById("inputDataFim");
const inputValorOpc = document.getElementById("inputValorOpc");
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
const btnLogout = document.getElementById("logoutBtn"); // ID corrigido

// Instância do calendário
let calendarioInstancia = null;

// --- Funções de Utilitários ---
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

// --- Funções de Tarefas ---
function limparFormTarefa() {
    if (inputIdTarefa) inputIdTarefa.value = "";
    if (inputTituloTarefa) inputTituloTarefa.value = "";
    if (inputDescricaoTarefa) inputDescricaoTarefa.value = "";
    if (selectPrioridadeTarefa) selectPrioridadeTarefa.value = "Baixa";
    if (inputDataInicio) inputDataInicio.value = "";
    if (inputDataFim) inputDataFim.value = "";
    if (inputValorOpc) inputValorOpc.value = "0.00";
    if (document.getElementById("respostaTarefasModal")) 
        document.getElementById("respostaTarefasModal").textContent = "";
}

async function carregarTarefas() {
    try {
        const res = await fetch("http://localhost:3000/tarefas", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status) {
            preencherTabelaTarefas(data.tarefas);
        atualizarResumoTarefas(data.tarefas);
        } else {
            if (respostaTarefas) respostaTarefas.textContent = "Erro ao carregar tarefas.";
        }
    } catch (error) {
        if (respostaTarefas) respostaTarefas.textContent = "Erro na requisição: " + error.message;
    }
}

async function preencherTabelaTarefas(tarefas) {
    if (tabelaTarefasBody) {
        tabelaTarefasBody.innerHTML = "";

        for (const tarefa of tarefas) {
            const dtInicio = new Date(tarefa.dataInicio).toLocaleDateString();
            const dtFim = new Date(tarefa.dataFim).toLocaleDateString();
            let nomesUsuarios = "—";

            try {
                const resAssoc = await fetch(`http://localhost:3000/usuariostarefas?tarefa=${tarefa.idTarefa}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const dataAssoc = await resAssoc.json();

                if (dataAssoc.status && dataAssoc.associacoes.length) {
                    const nomes = await Promise.all(dataAssoc.associacoes.map(async (a) => {
                        try {
                            const resUser = await fetch(`http://localhost:3000/usuarios/${a.usuarios_idUsuario}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const userData = await resUser.json();
                            return userData.usuario?.nomeUsuario || `Usuário ${a.usuarios_idUsuario}`;
                        } catch {
                            return `Usuário ${a.usuarios_idUsuario}`;
                        }
                    }));
                    nomesUsuarios = nomes.join(", ");
                }
            } catch (error) {
                console.error("Erro ao buscar usuários atribuídos:", error);
            }

            preencherLinhaTarefa(tarefa, dtInicio, dtFim, nomesUsuarios);
        }
    }
}

function preencherLinhaTarefa(tarefa, dtInicio, dtFim, nomesUsuarios) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${tarefa.idTarefa}</td>
        <td>${tarefa.tituloTarefa}</td>
        <td>${tarefa.descricaoTarefa}</td>
        <td>${tarefa.prioridadeTarefa}</td>
        <td>${dtInicio}</td>
        <td>${dtFim}</td>
        <td>R$ ${parseFloat(tarefa.valorOpc).toFixed(2)}</td>
        <td title="Usuários: ${nomesUsuarios}">
            <button class="editar" data-id="${tarefa.idTarefa}">Editar</button>
            <button class="excluir" data-id="${tarefa.idTarefa}">Excluir</button>
        </td>
    `;
    
    if (tabelaTarefasBody) {
        tabelaTarefasBody.appendChild(tr);
    }

    // Botões "Editar" e "Excluir"
    tr.querySelector("button.editar").addEventListener("click", (e) => {
        e.stopPropagation();
        abrirEditarTarefa(tarefa.idTarefa);
    });

    tr.querySelector("button.excluir").addEventListener("click", (e) => {
        e.stopPropagation();
        excluirTarefa(tarefa.idTarefa);
    });

    // Clicar na linha = abrir modal de detalhes
    tr.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "button") return;

        mostrarModalDetalhes(
            tarefa.tituloTarefa,
            `Descrição: ${tarefa.descricaoTarefa || "—"}
Prioridade: ${tarefa.prioridadeTarefa}
Valor: R$ ${parseFloat(tarefa.valorOpc).toFixed(2)}
Início: ${dtInicio}
Fim: ${dtFim}
Usuários atribuídos: ${nomesUsuarios}`
        );
    });
}

async function abrirEditarTarefa(idTarefa) {
    try {
        const res = await fetch(`http://localhost:3000/tarefas/${idTarefa}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            const t = data.tarefa;
            if (inputIdTarefa) inputIdTarefa.value = t.idTarefa;
            if (inputTituloTarefa) inputTituloTarefa.value = t.tituloTarefa;
            if (inputDescricaoTarefa) inputDescricaoTarefa.value = t.descricaoTarefa;
            if (selectPrioridadeTarefa) selectPrioridadeTarefa.value = t.prioridadeTarefa;
            if (inputDataInicio) inputDataInicio.value = t.dataInicio.slice(0, 10);
            if (inputDataFim) inputDataFim.value = t.dataFim.slice(0, 10);
            if (inputValorOpc) inputValorOpc.value = parseFloat(t.valorOpc).toFixed(2);

            if (modalTituloTarefa) modalTituloTarefa.textContent = `Editar Tarefa #${idTarefa}`;
            if (modalTarefa) modalTarefa.classList.remove("oculto");
            if (document.getElementById("respostaTarefasModal")) 
                document.getElementById("respostaTarefasModal").textContent = "";
        } else {
            if (respostaTarefas) respostaTarefas.textContent = "Erro ao buscar tarefa para edição.";
        }
    } catch (error) {
        if (respostaTarefas) respostaTarefas.textContent = "Erro na requisição: " + error.message;
    }
}

async function excluirTarefa(idTarefa) {
    mostrarModalConfirmacao("Deseja realmente excluir esta tarefa?", async () => {
        try {
            const res = await fetch(`http://localhost:3000/tarefas/${idTarefa}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            if (data.status) {
                exibirToast("Sucesso", "Tarefa excluída com sucesso!", 'success');
                await carregarTarefas();
            } else {
                exibirToast("Erro", data.message || "Erro ao excluir tarefa", 'error');
            }
        } catch (erro) {
            exibirToast("Erro", "Erro inesperado ao excluir tarefa", 'error');
        }
    });
}

// --- Funções de Atribuições ---
function limparFormAtribuicao() {
    if (selectUsuario) selectUsuario.innerHTML = "";
    if (selectTarefa) selectTarefa.innerHTML = "";
    if (selectStatusAtribuicao) selectStatusAtribuicao.value = "pendente";
    if (document.getElementById("respostaAtribuicoesModal")) 
        document.getElementById("respostaAtribuicoesModal").textContent = "";
}

async function carregarAtribuicoes() {
    try {
        const res = await fetch("http://localhost:3000/usuariostarefas", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status) {
            preencherTabelaAtribuicoes(data.associacoes);
        } else {
            if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro ao carregar atribuições.";
        }
    } catch (error) {
        if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro na requisição: " + error.message;
    }
}

async function preencherTabelaAtribuicoes(associacoes) {
    if (tabelaAtribuicoesBody) {
        tabelaAtribuicoesBody.innerHTML = "";
        if (!associacoes.length) {
            tabelaAtribuicoesBody.innerHTML = `<tr><td colspan="4">Nenhuma atribuição encontrada.</td></tr>`;
            return;
        }

        // Cache de nomes de usuários e tarefas
        const cacheUsuarios = {};
        const cacheTarefas = {};

        for (const assoc of associacoes) {
            if (!cacheUsuarios[assoc.usuarios_idUsuario]) {
                try {
                    const resU = await fetch(`http://localhost:3000/usuarios/${assoc.usuarios_idUsuario}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const dU = await resU.json();
                    cacheUsuarios[assoc.usuarios_idUsuario] = dU.data?.nomeUsuario || `Usuário ${assoc.usuarios_idUsuario}`;
                } catch {
                    cacheUsuarios[assoc.usuarios_idUsuario] = `Usuário ${assoc.usuarios_idUsuario}`;
                }
            }
            if (!cacheTarefas[assoc.tarefas_idTarefa]) {
                try {
                    const resT = await fetch(`http://localhost:3000/tarefas/${assoc.tarefas_idTarefa}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const dT = await resT.json();
                    cacheTarefas[assoc.tarefas_idTarefa] = dT.tarefa?.tituloTarefa || `Tarefa ${assoc.tarefas_idTarefa}`;
                } catch {
                    cacheTarefas[assoc.tarefas_idTarefa] = `Tarefa ${assoc.tarefas_idTarefa}`;
                }
            }
        }

        for (const assoc of associacoes) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${cacheUsuarios[assoc.usuarios_idUsuario]}</td>
                <td>${cacheTarefas[assoc.tarefas_idTarefa]}</td>
                <td>${assoc.status}</td>
                <td>
                    <button class="editar" data-usuario="${assoc.usuarios_idUsuario}" data-tarefa="${assoc.tarefas_idTarefa}">Editar</button>
                    <button class="excluir" data-usuario="${assoc.usuarios_idUsuario}" data-tarefa="${assoc.tarefas_idTarefa}">Excluir</button>
                </td>
            `;
            tabelaAtribuicoesBody.appendChild(tr);
        }

        tabelaAtribuicoesBody.querySelectorAll("button.editar").forEach(btn => {
            btn.addEventListener("click", () => abrirEditarAtribuicao(btn.dataset.usuario, btn.dataset.tarefa));
        });

        tabelaAtribuicoesBody.querySelectorAll("button.excluir").forEach(btn => {
            btn.addEventListener("click", () => excluirAtribuicao(btn.dataset.usuario, btn.dataset.tarefa));
        });
    }
}

async function abrirEditarAtribuicao(idUsuario, idTarefa) {
    try {
        await popularSelectsUsuariosTarefas();

        if (selectUsuario) selectUsuario.value = idUsuario;
        if (selectTarefa) selectTarefa.value = idTarefa;

        const res = await fetch("http://localhost:3000/usuariostarefas", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.status) {
            const assoc = data.associacoes.find(
                a => a.usuarios_idUsuario == idUsuario && a.tarefas_idTarefa == idTarefa
            );
            if (!assoc) {
                if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Associação não encontrada.";
                return;
            }
            if (selectStatusAtribuicao) selectStatusAtribuicao.value = assoc.status;
            if (modalTituloAtribuicao) modalTituloAtribuicao.textContent = `Editar Atribuição Usuário ${idUsuario} - Tarefa ${idTarefa}`;
            if (modalAtribuicao) modalAtribuicao.classList.remove("oculto");
            if (document.getElementById("respostaAtribuicoesModal")) 
                document.getElementById("respostaAtribuicoesModal").textContent = "";
        } else {
            if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro ao buscar atribuição para edição.";
        }
    } catch (error) {
        if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro na requisição: " + error.message;
    }
}

async function popularSelectsUsuariosTarefas() {
    // Popular usuários
    try {
        const resU = await fetch("http://localhost:3000/usuarios", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dataU = await resU.json();
        if (dataU.status && Array.isArray(dataU.data) && selectUsuario) {
            selectUsuario.innerHTML = dataU.data.map(u => `<option value="${u.idUsuario}">${u.nomeUsuario}</option>`).join("");
        }
        else if (selectUsuario) {
            selectUsuario.innerHTML = '<option value="">Erro ao carregar usuários</option>';
        }
    } catch {
        if (selectUsuario) selectUsuario.innerHTML = '<option value="">Erro ao carregar usuários</option>';
    }

    // Popular tarefas
    try {
        const resT = await fetch("http://localhost:3000/tarefas", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dataT = await resT.json();
        if (dataT.status && selectTarefa) {
            selectTarefa.innerHTML = dataT.tarefas.map(t => `<option value="${t.idTarefa}">${t.tituloTarefa}</option>`).join("");
        } else if (selectTarefa) {
            selectTarefa.innerHTML = '<option value="">Erro ao carregar tarefas</option>';
        }
    } catch {
        if (selectTarefa) selectTarefa.innerHTML = '<option value="">Erro ao carregar tarefas</option>';
    }
}

async function excluirAtribuicao(idUsuario, idTarefa) {
    mostrarModalConfirmacao(`Confirma excluir atribuição do Usuário ${idUsuario} para a Tarefa ${idTarefa}?`, async () => {
        try {
            const res = await fetch(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                exibirToast("Sucesso", "Atribuição excluída com sucesso!", 'success');
                carregarAtribuicoes();
                // Recarregar calendário se estiver ativo
                const painelCalendario = document.getElementById("painel-calendario");
                if (painelCalendario && !painelCalendario.classList.contains("oculto")) {
                    inicializarCalendario();
                }
            } else {
                exibirToast("Erro", data.message || "Erro ao excluir atribuição", 'error');
            }
        } catch (error) {
            exibirToast("Erro", "Erro na requisição: " + error.message, 'error');
        }
    });
}

// --- Funções do Calendário ---
async function buscarTodasAsTarefasEAtribuicoes() {
    try {
        const [resTarefas, resAtrib, resUsuarios] = await Promise.all([
            fetch("http://localhost:3000/tarefas", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:3000/usuariostarefas", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:3000/usuarios", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const dataTarefas = await resTarefas.json();
        const dataAtrib = await resAtrib.json();
        const dataUsuarios = await resUsuarios.json();

        if (!dataTarefas.status || !dataAtrib.status || !dataUsuarios.status) {
            exibirToast("Erro", "Dados incompletos para o calendário", 'error');
            return [];
        }

        const tarefas = dataTarefas.tarefas || [];
        const atribuicoes = dataAtrib.associacoes || [];
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
            const atribuicoesDaTarefa = atribuicoes.filter(a => a.tarefas_idTarefa === tarefa.idTarefa);
            const textoAtribuicoes = atribuicoesDaTarefa.map(atrib => {
                const nomeUsuario = mapaUsuarios.get(atrib.usuarios_idUsuario) || `Usuário ${atrib.usuarios_idUsuario}`;
                return `${nomeUsuario} (${atrib.status})`;
            }).join(", ");

            // Atribuir cor única por usuário
            let corEvento = "#6c757d";
            if (atribuicoesDaTarefa.length > 0) {
                const primeiroUsuario = atribuicoesDaTarefa[0].usuarios_idUsuario;
                
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
                    valor: parseFloat(tarefa.valorOpc || 0).toFixed(2),
                    atribuicoes: textoAtribuicoes || 'Não atribuída'
                },
                backgroundColor: corEvento,
                borderColor: corEvento,
                id: `task-${tarefa.idTarefa}`
            });
        });

        return events;
    } catch (erro) {
        exibirToast("Erro", "Falha ao carregar dados do calendário", 'error');
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
                exibirToast("Sucesso", "Recado adicionado ao calendário", 'success');
            });
        },
        eventClick(info) {
            const evento = info.event;
            const props = evento.extendedProps;
            
            if (evento.id.startsWith("task-")) {
                const detalhes = 
                    `Descrição: ${props.descricao || '—'}\n` +
                    `Prioridade: ${props.prioridade || '—'}\n` +
                    `Valor: R$ ${props.valor || '0.00'}\n` +
                    `Atribuído a: ${props.atribuicoes || '—'}`;
                mostrarModalDetalhes(evento.title, detalhes);
            } else {
                mostrarModalConfirmacao(`Deseja apagar o recado: "${evento.title}"?`, () => {
                    evento.remove();
                    const eventos = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                    const atualizados = eventos.filter(e => e.id !== evento.id);
                    localStorage.setItem("eventosGerente", JSON.stringify(atualizados));
                    exibirToast("Sucesso", "Recado removido", 'success');
                });
            }
        },
        events: async function (fetchInfo, successCallback, failureCallback) {
            try {
                const eventosTarefas = await buscarTodasAsTarefasEAtribuicoes();
                const eventosNotas = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                successCallback([...eventosTarefas, ...eventosNotas]);
            } catch (e) {
                exibirToast("Erro", "Falha ao carregar eventos do calendário", 'error');
                failureCallback(e);
            }
        }
    });

    calendarioInstancia.render();
}

// --- Inicialização da Página ---
document.addEventListener("DOMContentLoaded", () => {
    // Configurar navegação
    navBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Oculta todos os painéis
            paineis.forEach(p => {
                p.classList.add("oculto");
                p.classList.remove("active");
            });
            
            const secao = btn.dataset.secao;
            const painelAlvo = document.getElementById(`painel-${secao}`);
            
            if (painelAlvo) {
                painelAlvo.classList.remove("oculto");
                painelAlvo.classList.add("active");
                
                // Inicializa calendário se necessário
                if (secao === "calendario") inicializarCalendario();
            }
        });
    });

    // Eventos de botões
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.href = "../../html/login.html";
        });
    }

    if (btnNovaTarefa) {
        btnNovaTarefa.addEventListener("click", () => {
            limparFormTarefa();
            if (modalTituloTarefa) modalTituloTarefa.textContent = "Nova Tarefa";
            if (modalTarefa) modalTarefa.classList.remove("oculto");
        });
    }

    if (btnCancelarTarefa) {
        btnCancelarTarefa.addEventListener("click", () => {
            if (modalTarefa) modalTarefa.classList.add("oculto");
        });
    }

    if (btnNovaAtribuicao) {
        btnNovaAtribuicao.addEventListener("click", async () => {
            limparFormAtribuicao();
            if (modalTituloAtribuicao) modalTituloAtribuicao.textContent = "Nova Atribuição";
            await popularSelectsUsuariosTarefas();
            if (modalAtribuicao) modalAtribuicao.classList.remove("oculto");
        });
    }

    if (btnCancelarAtribuicao) {
        btnCancelarAtribuicao.addEventListener("click", () => {
            if (modalAtribuicao) modalAtribuicao.classList.add("oculto");
        });
    }

    if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener("click", () => {
            if (modalDetalhesTarefa) modalDetalhesTarefa.classList.add("oculto");
        });
    }

    // Eventos de formulários
    if (formTarefa) {
        formTarefa.addEventListener("submit", async (e) => {
            e.preventDefault();

            const idTarefa = inputIdTarefa ? inputIdTarefa.value : "";
            const payload = {
                tituloTarefa: inputTituloTarefa ? inputTituloTarefa.value.trim() : "",
                descricaoTarefa: inputDescricaoTarefa ? inputDescricaoTarefa.value.trim() : "",
                prioridadeTarefa: selectPrioridadeTarefa ? selectPrioridadeTarefa.value : "",
                dataInicio: inputDataInicio ? inputDataInicio.value : "",
                dataFim: inputDataFim ? inputDataFim.value : "",
                valorOpc: inputValorOpc ? parseFloat(inputValorOpc.value) : 0
            };

            try {
                let res, data;
                const url = idTarefa 
                    ? `http://localhost:3000/tarefas/${idTarefa}`
                    : "http://localhost:3000/tarefas";
                    
                const method = idTarefa ? "PUT" : "POST";
                
                res = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                
                data = await res.json();
                
                if (res.ok) {
                    exibirToast("Sucesso", idTarefa ? "Tarefa atualizada!" : "Tarefa criada!", 'success');
                    if (modalTarefa) modalTarefa.classList.add("oculto");
                    carregarTarefas();
                    // Recarregar calendário se estiver ativo
                    const painelCalendario = document.getElementById("painel-calendario");
                    if (painelCalendario && painelCalendario.classList.contains("active")) {
                        inicializarCalendario();
                    }
                } else {
                    exibirToast("Erro", data.message || "Operação falhou", 'error');
                }
            } catch (error) {
                exibirToast("Erro", "Erro na requisição: " + error.message, 'error');
            }
        });
    }

    if (formAtribuicao) {
        formAtribuicao.addEventListener("submit", async (e) => {
            e.preventDefault();

            const idUsuario = selectUsuario ? parseInt(selectUsuario.value) : null;
            const idTarefa = selectTarefa ? parseInt(selectTarefa.value) : null;
            const status = selectStatusAtribuicao ? selectStatusAtribuicao.value : "";

            if (!idUsuario || !idTarefa) {
                exibirToast("Erro", "Selecione usuário e tarefa", 'error');
                return;
            }

            try {
                // Verificar se associação existe
                const resGet = await fetch("http://localhost:3000/usuariostarefas", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const dataGet = await resGet.json();
                const assocExiste = dataGet.associacoes?.some(
                    a => a.usuarios_idUsuario === idUsuario && a.tarefas_idTarefa === idTarefa
                );

                let res, data;
                if (assocExiste) {
                    // Atualizar
                    res = await fetch(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ status })
                    });
                } else {
                    // Criar
                    res = await fetch("http://localhost:3000/usuariostarefas", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ idUsuario, idTarefa, status })
                    });
                }
                
                data = await res.json();
                
                if (res.ok) {
                    exibirToast("Sucesso", assocExiste ? "Atribuição atualizada!" : "Atribuição criada!", 'success');
                    if (modalAtribuicao) modalAtribuicao.classList.add("oculto");
                    carregarAtribuicoes();
                    // Recarregar calendário se estiver ativo
                    const painelCalendario = document.getElementById("painel-calendario");
                    if (painelCalendario && painelCalendario.classList.contains("active")) {
                        inicializarCalendario();
                    }
                } else {
                    exibirToast("Erro", data.message || "Operação falhou", 'error');
                }
            } catch (error) {
                exibirToast("Erro", "Erro na requisição: " + error.message, 'error');
            }
        });
    }

    // Carregar dados iniciais
    carregarTarefas();
    carregarAtribuicoes();
    atualizarIconesLucide();

    // Verificar painel ativo inicialmente
    const painelAtivo = document.querySelector(".content-section.active");
    if (painelAtivo && painelAtivo.id === "painel-calendario") {
        inicializarCalendario();
    }
});