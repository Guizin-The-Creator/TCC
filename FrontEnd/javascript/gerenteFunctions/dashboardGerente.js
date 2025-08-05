const token = localStorage.getItem("token");
if (!token) {
    alert("Você precisa estar logado.");
    window.location.href = "../../html/login.html";
}

// Global variables for elements to avoid 'ReferenceError'
const modalDetalhesTarefa = document.createElement("div"); // Declared globally
// O HTML do modal agora é adicionado imediatamente após a criação do elemento div
modalDetalhesTarefa.id = "modalDetalhesTarefa";
modalDetalhesTarefa.classList.add("modal", "oculto");
modalDetalhesTarefa.innerHTML = `
    <div class="modal-content">
        <h3 id="detalhesTituloTarefa"></h3>
        <p id="detalhesDescricaoTarefa"></p>
        <div class="modal-actions">
            <button id="fecharDetalhesTarefa">Fechar</button>
        </div>
    </div>
`;
// O modal é anexado ao corpo do documento assim que é criado e populado
document.body.appendChild(modalDetalhesTarefa);

// Agora podemos selecionar os elementos filhos do modal com segurança
const tituloDetalhes = modalDetalhesTarefa.querySelector("#detalhesTituloTarefa");
const descricaoDetalhes = modalDetalhesTarefa.querySelector("#detalhesDescricaoTarefa");
const btnFecharDetalhes = modalDetalhesTarefa.querySelector("#fecharDetalhesTarefa");

const navBtns = document.querySelectorAll(".sidebar button.btn-nav");
const paineis = document.querySelectorAll(".main-content .painel");

const tabelaTarefasBody = document.querySelector("#tabelaTarefas tbody");
const tabelaAtribuicoesBody = document.querySelector("#tabelaAtribuicoes tbody");

const respostaTarefas = document.getElementById("respostaTarefas");
const respostaAtribuicoes = document.getElementById("respostaAtribuicoes");

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
const btnLogout = document.getElementById("btnLogout");

let calendarioInstancia = null; // Para armazenar a instância do FullCalendar

// --- Controle de Navegação entre Painéis ---
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        // Remove 'ativo' e adiciona 'oculto' a todos os painéis
        navBtns.forEach(b => b.classList.remove("ativo"));
        paineis.forEach(p => {
            p.classList.remove("ativo");
            p.classList.add("oculto");
        });

        // Adiciona 'ativo' ao botão clicado
        btn.classList.add("ativo");

        // Mostra o painel correspondente
        const secao = btn.getAttribute("data-secao");
        const painelCorrespondente = document.getElementById(`painel-${secao}`);
        if (painelCorrespondente) {
            painelCorrespondente.classList.remove("oculto");
            painelCorrespondente.classList.add("ativo");
        }

        if (secao === "calendario") {
            inicializarCalendario();
        }
    });
});

// Logout
if (btnLogout) { // Adicionada verificação: garante que o botão existe antes de adicionar o listener
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../../html/login.html"; // Ajuste o caminho conforme sua estrutura
    });
}

// Abrir modais
if (btnNovaTarefa) { // Adicionada verificação
    btnNovaTarefa.addEventListener("click", () => {
        limparFormTarefa();
        if (modalTituloTarefa && modalTarefa) { // Adicionada verificação
            modalTituloTarefa.textContent = "Nova Tarefa";
            modalTarefa.classList.remove("oculto");
        }
    });
}

if (btnCancelarTarefa) { // Adicionada verificação
    btnCancelarTarefa.addEventListener("click", () => {
        if (modalTarefa) { // Adicionada verificação
            modalTarefa.classList.add("oculto");
        }
    });
}

if (btnNovaAtribuicao) { // Adicionada verificação
    btnNovaAtribuicao.addEventListener("click", async () => {
        limparFormAtribuicao();
        if (modalTituloAtribuicao && modalAtribuicao) { // Adicionada verificação
            modalTituloAtribuicao.textContent = "Nova Atribuição";
            await popularSelectsUsuariosTarefas();
            modalAtribuicao.classList.remove("oculto");
        }
    });
}

if (btnCancelarAtribuicao) { // Adicionada verificação
    btnCancelarAtribuicao.addEventListener("click", () => {
        if (modalAtribuicao) { // Adicionada verificação
            modalAtribuicao.classList.add("oculto");
        }
    });
}

// Limpar formulários
function limparFormTarefa() {
    if (inputIdTarefa) inputIdTarefa.value = "";
    if (inputTituloTarefa) inputTituloTarefa.value = "";
    if (inputDescricaoTarefa) inputDescricaoTarefa.value = "";
    if (selectPrioridadeTarefa) selectPrioridadeTarefa.value = "Baixa";
    if (inputDataInicio) inputDataInicio.value = "";
    if (inputDataFim) inputDataFim.value = "";
    if (inputValorOpc) inputValorOpc.value = "0.00";
    if (document.getElementById("respostaTarefasModal")) document.getElementById("respostaTarefasModal").textContent = "";
}

function limparFormAtribuicao() {
    if (selectUsuario) selectUsuario.innerHTML = "";
    if (selectTarefa) selectTarefa.innerHTML = "";
    if (selectStatusAtribuicao) selectStatusAtribuicao.value = "pendente";
    if (document.getElementById("respostaAtribuicoesModal")) document.getElementById("respostaAtribuicoesModal").textContent = "";
}

// Preencher tabela tarefas
async function carregarTarefas() {
    try {
        const res = await fetch("http://localhost:3000/tarefas", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status) {
            preencherTabelaTarefas(data.tarefas);
        } else {
            if (respostaTarefas) respostaTarefas.textContent = "Erro ao carregar tarefas.";
        }
    } catch (error) {
        if (respostaTarefas) respostaTarefas.textContent = "Erro na requisição: " + error.message;
    }
}

async function preencherTabelaTarefas(tarefas) {
    if (tabelaTarefasBody) { // Adicionada verificação
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
    const editButton = tr.querySelector("button.editar");
    if (editButton) {
        editButton.addEventListener("click", (e) => {
            e.stopPropagation(); // Evita disparar o clique da linha
            abrirEditarTarefa(tarefa.idTarefa);
        });
    }

    const deleteButton = tr.querySelector("button.excluir");
    if (deleteButton) {
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation(); // Evita disparar o clique da linha
            excluirTarefa(tarefa.idTarefa);
        });
    }

    // Clicar na linha = abrir modal de detalhes
    tr.addEventListener("click", (e) => {
        // Ignora se clicou nos botões
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


// Preencher tabela atribuições
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
    if (tabelaAtribuicoesBody) { // Adicionada verificação
        tabelaAtribuicoesBody.innerHTML = "";
        if (!associacoes.length) {
            tabelaAtribuicoesBody.innerHTML = `<tr><td colspan="4">Nenhuma atribuição encontrada.</td></tr>`;
            return;
        }

        // Carregar nomes de usuários e títulos das tarefas em cache para performance
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

// Abrir edição tarefa
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

            if (modalTituloTarefa && modalTarefa) {
                modalTituloTarefa.textContent = `Editar Tarefa #${idTarefa}`;
                modalTarefa.classList.remove("oculto");
            }
            if (document.getElementById("respostaTarefasModal")) {
                document.getElementById("respostaTarefasModal").textContent = "";
            }
        } else {
            if (respostaTarefas) respostaTarefas.textContent = "Erro ao buscar tarefa para edição.";
        }
    } catch (error) {
        if (respostaTarefas) respostaTarefas.textContent = "Erro na requisição: " + error.message;
    }
}

// Submeter tarefa (criar/editar)
if (formTarefa) { // Adicionada verificação
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
            if (idTarefa) {
                res = await fetch(`http://localhost:3000/tarefas/${idTarefa}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (res.ok) {
                    if (respostaTarefas) respostaTarefas.textContent = "Tarefa atualizada com sucesso.";
                } else {
                    if (respostaTarefas) respostaTarefas.textContent = data.message || "Erro ao atualizar tarefa.";
                }
            } else {
                res = await fetch("http://localhost:3000/tarefas", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (res.ok) {
                    if (respostaTarefas) respostaTarefas.textContent = "Tarefa criada com sucesso.";
                } else {
                    if (respostaTarefas) respostaTarefas.textContent = data.message || "Erro ao criar tarefa.";
                }
            }
            if (modalTarefa) {
                modalTarefa.classList.add("oculto");
            }
            carregarTarefas();
            // Se o calendário estiver ativo, recarregá-lo para mostrar as mudanças
            const painelCalendario = document.getElementById("painel-calendario");
            if (painelCalendario && painelCalendario.classList.contains("ativo")) {
                inicializarCalendario();
            }
        } catch (error) {
            if (respostaTarefas) respostaTarefas.textContent = "Erro na requisição: " + error.message;
        }
    });
}

// Excluir tarefa
async function excluirTarefa(idTarefa) {
    if (!confirm("Deseja realmente excluir esta tarefa?")) return;

    try {
        const res = await fetch(`http://localhost:3000/tarefas/${idTarefa}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.status) {
            mostrarRespostaPopup("Tarefa excluída com sucesso!", true);
            await carregarTarefas(); // atualiza a tabela e cards
        } else {
            // Trata erro de foreign key ou outro erro do servidor
            if (data.sqlMessage && data.sqlMessage.includes("foreign key constraint fails")) {
                mostrarRespostaPopup("Não é possível excluir a tarefa: ela está atribuída a um ou mais usuários.", false);
            } else {
                mostrarRespostaPopup(data.message || "Erro ao excluir tarefa.", false);
            }
        }
    } catch (erro) {
        console.error("Erro ao deletar tarefa:", erro);
        mostrarRespostaPopup("Erro inesperado ao excluir tarefa. Verifique a conexão com o servidor.", false);
    }
}


// Abrir edição atribuição
async function abrirEditarAtribuicao(idUsuario, idTarefa) {
    try {
        await popularSelectsUsuariosTarefas();

        // Ajustar selects para valores da atribuição
        if (selectUsuario) selectUsuario.value = idUsuario;
        if (selectTarefa) selectTarefa.value = idTarefa;

        // Buscar status da associação
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
            if (selectStatusAtribuicao && modalTituloAtribuicao && modalAtribuicao) {
                selectStatusAtribuicao.value = assoc.status;
                modalTituloAtribuicao.textContent = `Editar Atribuição Usuário ${idUsuario} - Tarefa ${idTarefa}`;
                modalAtribuicao.classList.remove("oculto");
            }
            if (document.getElementById("respostaAtribuicoesModal")) {
                document.getElementById("respostaAtribuicoesModal").textContent = "";
            }
        } else {
            if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro ao buscar atribuição para edição.";
        }
    } catch (error) {
        if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro na requisição: " + error.message;
    }
}

function mostrarRespostaPopup(mensagem, sucesso = true) {
    const popup = document.getElementById("respostaTarefas") || document.getElementById("respostaTarefasModal") || document.createElement("div");
    popup.className = "resposta";
    popup.textContent = mensagem;
    popup.style.backgroundColor = sucesso ? "#d4edda" : "#f8d7da";
    popup.style.color = sucesso ? "#155724" : "#721c24";
    popup.style.padding = "1rem";
    popup.style.marginTop = "1rem";
    popup.style.borderRadius = "5px";
    popup.style.border = "1px solid " + (sucesso ? "#c3e6cb" : "#f5c6cb");

    popup.classList.remove("oculto");
    setTimeout(() => popup.classList.add("oculto"), 4000);
}


// Popular selects usuário e tarefa para criar/editar atribuições
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

// Submeter atribuição (criar/editar)
if (formAtribuicao) { // Adicionada verificação
    formAtribuicao.addEventListener("submit", async (e) => {
        e.preventDefault();

        const idUsuario = selectUsuario ? parseInt(selectUsuario.value) : null;
        const idTarefa = selectTarefa ? parseInt(selectTarefa.value) : null;
        const status = selectStatusAtribuicao ? selectStatusAtribuicao.value : "";

        if (idUsuario === null || idTarefa === null) {
            if (document.getElementById("respostaAtribuicoesModal")) {
                document.getElementById("respostaAtribuicoesModal").textContent = "Selecione usuário e tarefa.";
            }
            return;
        }


        try {
            // Verificar se associação existe
            const resGet = await fetch("http://localhost:3000/usuariostarefas", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dataGet = await resGet.json();
            const assocExiste = dataGet.associacoes.some(
                a => a.usuarios_idUsuario === idUsuario && a.tarefas_idTarefa === idTarefa
            );

            if (assocExiste) {
                // Atualizar
                const resPut = await fetch(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ idUsuario, idTarefa, status })
                });
                const dataPut = await resPut.json();
                if (resPut.ok) {
                    if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Atribuição atualizada com sucesso.";
                } else {
                    if (respostaAtribuicoes) respostaAtribuicoes.textContent = dataPut.message || "Erro ao atualizar atribuição.";
                }
            } else {
                // Criar
                const resPost = await fetch("http://localhost:3000/usuariostarefas", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ idUsuario, idTarefa, status })
                });
                const dataPost = await resPost.json();
                if (resPost.ok) {
                    if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Atribuição criada com sucesso.";
                } else {
                    if (respostaAtribuicoes) respostaAtribuicoes.textContent = dataPost.message || "Erro ao criar atribuição.";
                }
            }
            if (modalAtribuicao) {
                modalAtribuicao.classList.add("oculto");
            }
            carregarAtribuicoes();
            // Se o calendário estiver ativo, recarregá-lo para mostrar as mudanças
            const painelCalendario = document.getElementById("painel-calendario");
            if (painelCalendario && painelCalendario.classList.contains("ativo")) {
                inicializarCalendario();
            }
        } catch (error) {
            if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro na requisição: " + error.message;
        }
    });
}

// Excluir atribuição
async function excluirAtribuicao(idUsuario, idTarefa) {
    if (!confirm(`Confirma excluir atribuição do Usuário ${idUsuario} para a Tarefa ${idTarefa}?`)) return;
    try {
        const res = await fetch(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Atribuição excluída com sucesso.";
            carregarAtribuicoes();
            // Se o calendário estiver ativo, recarregá-lo para mostrar as mudanças
            const painelCalendario = document.getElementById("painel-calendario");
            if (painelCalendario && painelCalendario.classList.contains("ativo")) {
                inicializarCalendario();
            }
        } else {
            if (respostaAtribuicoes) respostaAtribuicoes.textContent = data.message || "Erro ao excluir atribuição.";
        }
    } catch (error) {
        if (respostaAtribuicoes) respostaAtribuicoes.textContent = "Erro na requisição: " + error.message;
    }
}

// --- Funções Auxiliares para Modals do Calendário ---

// Modal de Confirmação (Excluir)
const modalConfirmacao = document.createElement("div");
modalConfirmacao.id = "modalConfirmacao";
modalConfirmacao.classList.add("modal", "oculto");
modalConfirmacao.innerHTML = `
    <div class="modal-content">
        <p id="modal-text-confirmacao"></p>
        <div class="modal-actions">
            <button id="confirmarAcao">Confirmar</button>
            <button id="cancelarAcao">Cancelar</button>
        </div>
    </div>
`;
document.body.appendChild(modalConfirmacao);

const textoModalConfirmacao = modalConfirmacao.querySelector("#modal-text-confirmacao");
const btnConfirmarAcao = modalConfirmacao.querySelector("#confirmarAcao");
const btnCancelarAcao = modalConfirmacao.querySelector("#cancelarAcao");

function mostrarModalConfirmacao(texto, onConfirmar) {
    if (textoModalConfirmacao && modalConfirmacao && btnConfirmarAcao && btnCancelarAcao) {
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

// Modal para Escrever Recado
const modalRecado = document.createElement("div");
modalRecado.id = "modalRecado";
modalRecado.classList.add("modal", "oculto");
modalRecado.innerHTML = `
    <div class="modal-content">
        <h3>Adicionar Recado</h3>
        <p>Para o dia: <strong id="dataRecado"></strong></p>
        <textarea id="txtRecado" placeholder="Escreva seu recado aqui..." rows="5"></textarea>
        <div class="modal-actions">
            <button id="salvarRecado">Salvar</button>
            <button id="cancelarRecado">Cancelar</button>
        </div>
    </div>
`;
document.body.appendChild(modalRecado);

const dataRecadoSpan = modalRecado.querySelector("#dataRecado");
const txtRecadoInput = modalRecado.querySelector("#txtRecado");
const btnSalvarRecado = modalRecado.querySelector("#salvarRecado");
const btnCancelarRecado = modalRecado.querySelector("#cancelarRecado");

function mostrarModalRecado(dateStr, onSave) {
    if (dataRecadoSpan && txtRecadoInput && modalRecado && btnSalvarRecado && btnCancelarRecado) {
        dataRecadoSpan.textContent = dateStr;
        txtRecadoInput.value = ""; // Limpa o campo ao abrir
        modalRecado.classList.remove("oculto");

        btnSalvarRecado.onclick = () => {
            const anotacao = txtRecadoInput.value.trim();
            if (anotacao) {
                onSave(anotacao);
            }
            modalRecado.classList.add("oculto");
        };

        btnCancelarRecado.onclick = () => {
            modalRecado.classList.add("oculto");
        };
    }
}

// Modal Detalhes da Tarefa (para o calendário) - HTML structure appended earlier
// The modalDetalhesTarefa itself and its child elements (tituloDetalhes, descricaoDetalhes, btnFecharDetalhes)
// are now declared globally at the top and appended to document.body.

// Add event listener to the button declared globally
if (btnFecharDetalhes) { // Adicionada verificação
    btnFecharDetalhes.onclick = () => {
        if (modalDetalhesTarefa) {
            modalDetalhesTarefa.classList.add("oculto");
        }
    };
}

function mostrarModalDetalhes(titulo, descricao) {
    if (tituloDetalhes && descricaoDetalhes && modalDetalhesTarefa) { // Added checks
        tituloDetalhes.textContent = titulo;
        descricaoDetalhes.textContent = descricao || "Nenhuma descrição disponível.";
        modalDetalhesTarefa.classList.remove("oculto");
    } else {
        console.error("Elementos do modal de detalhes da tarefa não encontrados.");
    }
}


// --- Funções do Calendário ---

async function buscarTodasAsTarefasEAtribuicoes() {
    const [resTarefas, resAtribuicoes] = await Promise.all([
        fetch("http://localhost:3000/tarefas", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3000/usuariostarefas", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const dataTarefas = await resTarefas.json();
    const dataAtrib = await resAtribuicoes.json();

    if (!dataTarefas.status || !dataAtrib.status) {
        console.error("Erro ao carregar dados para o calendário.");
        return [];
    }

    const tarefas = dataTarefas.tarefas || [];
    const atribuicoes = dataAtrib.associacoes || [];

    const events = [];

    // Mapear usuários para cores para diferenciar no calendário
    const usuariosUnicos = [...new Set(atribuicoes.map(a => a.usuarios_idUsuario))];
    const cores = ["#FF5733", "#33C1FF", "#33FF7F", "#FFC300", "#DA33FF", "#FF3380", "#3380FF", "#33FFDA"];
    const mapaCores = {};
    usuariosUnicos.forEach((u, i) => mapaCores[u] = cores[i % cores.length]);

    // Cache de nomes de usuários para tooltips
    const cacheNomesUsuarios = {};
    await Promise.all(usuariosUnicos.map(async uId => {
        try {
            const res = await fetch(`http://localhost:3000/usuarios/${uId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            cacheNomesUsuarios[uId] = data.data?.nomeUsuario || `Usuário ${uId}`;
        } catch (e) {
            cacheNomesUsuarios[uId] = `Usuário ${uId}`;
        }
    }));


    tarefas.forEach(tarefa => {
        // Encontrar todas as atribuições para esta tarefa
        const atribuicoesDaTarefa = atribuicoes.filter(a => a.tarefas_idTarefa === tarefa.idTarefa);

        // Concatenar nomes dos usuários atribuídos e seus status
        const assignedUsersInfo = atribuicoesDaTarefa.map(a => {
            const userName = cacheNomesUsuarios[a.usuarios_idUsuario] || `Usuário ${a.usuarios_idUsuario}`;
            return `${userName} (${a.status})`;
        }).join(", ");

        events.push({
            title: tarefa.tituloTarefa,
            start: tarefa.dataInicio.split('T')[0], // Apenas a data
            end: tarefa.dataFim ? new Date(new Date(tarefa.dataFim).setDate(new Date(tarefa.dataFim).getDate() + 1)).toISOString().split('T')[0] : null, // FullCalendar exclui o dia 'end', então adicionamos 1 dia
            extendedProps: {
                descricao: tarefa.descricaoTarefa,
                prioridade: tarefa.prioridadeTarefa,
                valor: parseFloat(tarefa.valorOpc).toFixed(2),
                atribuicoes: assignedUsersInfo
            },
            backgroundColor: atribuicoesDaTarefa.length > 0 ? mapaCores[atribuicoesDaTarefa[0].usuarios_idUsuario] : '#6c757d', // Cor baseada no primeiro usuário atribuído ou cinza
            borderColor: atribuicoesDaTarefa.length > 0 ? mapaCores[atribuicoesDaTarefa[0].usuarios_idUsuario] : '#6c757d',
            id: `task-${tarefa.idTarefa}` // Identificador único para tarefa
        });
    });

    return events;
}


function inicializarCalendario() {
    const calendarioEl = document.getElementById("calendar");

    if (!calendarioEl) {
        console.error("Elemento FullCalendar não encontrado no DOM.");
        return;
    }

    if (calendarioInstancia) {
        calendarioInstancia.destroy(); // Destruir instância anterior se existir
    }

    calendarioInstancia = new FullCalendar.Calendar(calendarioEl, {
        initialView: "dayGridMonth",
        locale: "pt-br",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,listWeek"
        },
        dateClick: function (info) {
            mostrarModalRecado(info.dateStr, (anotacao) => {
                const eventosSalvos = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                const novoEvento = {
                    title: anotacao,
                    date: info.dateStr,
                    id: `note-${Date.now().toString()}`,
                    backgroundColor: '#17a2b8',
                    borderColor: '#17a2b8'
                };
                eventosSalvos.push(novoEvento);
                localStorage.setItem("eventosGerente", JSON.stringify(eventosSalvos));
                if (calendarioInstancia) calendarioInstancia.addEvent(novoEvento);
            });
        },
        eventClick: function (info) {
            const props = info.event.extendedProps;
            const isTask = info.event.id.startsWith("task-");

            if (isTask) {
                let detalhesTexto =
                    `\tDescrição: ${props.descricao || 'N/A'}\n` +
                    `\tPrioridade: ${props.prioridade || 'N/A'}\n` +
                    `\tValor: R$ ${props.valor || '0.00'}\n` +
                    `\tAtribuído a: ${props.atribuicoes || 'N/A'}`;
                mostrarModalDetalhes(info.event.title, detalhesTexto);
            } else {
                mostrarModalConfirmacao(`Deseja apagar o recado: '${info.event.title}'?`, () => {
                    info.event.remove();
                    const eventosSalvos = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                    const atualizados = eventosSalvos.filter(ev => ev.id !== info.event.id);
                    localStorage.setItem("eventosGerente", JSON.stringify(atualizados));
                });
            }
        },
        events: async function (fetchInfo, successCallback, failureCallback) {
            try {
                const tasksEvents = await buscarTodasAsTarefasEAtribuicoes();
                const notesEvents = JSON.parse(localStorage.getItem("eventosGerente") || "[]");
                successCallback([...tasksEvents, ...notesEvents]);
            } catch (error) {
                console.error("Erro ao carregar eventos para o calendário:", error);
                failureCallback(error);
            }
        }
    });

    calendarioInstancia.render();
}


// Function for updating summary cards (defined once)
function atualizarResumo(contadores) {
    if (document.getElementById("cardTotal")) document.getElementById("cardTotal").textContent = contadores.total || 0;
    if (document.getElementById("cardConcluidas")) document.getElementById("cardConcluidas").textContent = contadores.concluida || 0;
    if (document.getElementById("cardPendentes")) document.getElementById("cardPendentes").textContent = contadores.pendente || 0;
    if (document.getElementById("cardAndamento")) document.getElementById("cardAndamento").textContent = contadores.andamento || 0;
}

// Override preencherTabelaTarefas to include summary update
const originalPreencherTabelaTarefas = preencherTabelaTarefas;
preencherTabelaTarefas = async function (tarefas) {
    await originalPreencherTabelaTarefas(tarefas);

    // Agora sim, contar status atualizados após exibição
    let contadores = { total: tarefas.length, pendente: 0, andamento: 0, concluida: 0 };
    for (const t of tarefas) {
        const res = await fetch(`http://localhost:3000/usuariostarefas?tarefa=${t.idTarefa}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dados = await res.json();
        if (dados.status) {
            for (const assoc of dados.associacoes) {
                const s = assoc.status.toLowerCase();
                if (s.includes("pendente")) contadores.pendente++;
                else if (s.includes("andamento")) contadores.andamento++;
                else if (s.includes("concluida")) contadores.concluida++;
            }
        }
    }
    atualizarResumo(contadores);
};



// Adicionar listener após o DOM estar pronto (Único DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
    carregarTarefas();
    carregarAtribuicoes();

    // Initial check for the 'Resumo' panel to be active and load data if so
    const initialActivePanel = document.querySelector(".main-content .painel.ativo");
    if (initialActivePanel && initialActivePanel.id === "painel-resumo") {
        carregarTarefas(); // This should trigger the updated preencherTabelaTarefas to update the summary
    } else if (initialActivePanel && initialActivePanel.id === "painel-calendario") {
        inicializarCalendario();
    }
})