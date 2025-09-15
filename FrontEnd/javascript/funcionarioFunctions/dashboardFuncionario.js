// Função para decodificar o token JWT e obter o ID do usuário
function pegarUserIdDoToken() {
  const token = localStorage.getItem("token");
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

// Elementos DOM
const tbodyTarefas = document.getElementById("tbodyTarefas");
const postit = document.getElementById("postit");
const formEditar = document.getElementById("formEditarRelacao");
const idTarefaSelecionada = document.getElementById("idTarefaSelecionada");
const txtStatusEditar = document.getElementById("txtStatusEditar");
const divResposta = document.getElementById("divResposta");

// Variáveis globais
const userId = pegarUserIdDoToken();
const baseUrl = 'http://localhost:3000';
let dataCadastroAtual = null;
let idCargoAtual = null;
let calendarioInstancia = null;

// Inicialização quando o DOM estiver carregado
window.addEventListener("DOMContentLoaded", () => {
  carregarTarefas();
  carregarPostit();
  carregarPerfil();
  document.getElementById("formPerfil").addEventListener("submit", atualizarPerfil);

  // Adiciona os modais ao body
  document.body.appendChild(criarModalConfirmacao());
  document.body.appendChild(criarModalRecado());
  document.body.appendChild(criarModalConclusao());
  document.body.appendChild(criarModalDetalhesTarefa());
});

// Event listeners
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

// Funções principais
async function updateTaskStatus(id, status) {
  try {
    await fetchWithAuth(`${baseUrl}/usuariostarefas/tarefa/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    mostrarRespostaPopup("Status atualizado para todos os usuários desta tarefa.", true);
    await carregarTarefas();
    document.getElementById("formEditarContainer").classList.add("oculto");
  } catch (err) {
    console.error(err);
    mostrarRespostaPopup("Erro ao atualizar status.", false);
  }
}


function mostrarPainel(secao) {
  document.getElementById("painel-tarefas").classList.toggle("oculto", secao !== "tarefas");
  document.getElementById("painel-perfil").classList.toggle("oculto", secao !== "perfil");
  document.getElementById("painel-calendario").classList.toggle("oculto", secao !== "calendario");
  document.getElementById("painel-visao-geral").classList.toggle("oculto", secao !== "visao-geral");
  if (secao === "calendario") inicializarCalendario();
  if (secao === "visao-geral") carregarTarefas();
}

async function carregarTarefas() {
  try {
    const data = await fetchWithAuth(`${baseUrl}/usuariostarefas/${userId}`);
    const tarefas = data.associacoes || [];

    tbodyTarefas.innerHTML = "";
    let contadores = { Pendente: 0, "Em andamento": 0, "Concluída": 0 };

    for (const rel of tarefas) {
      const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
      const statusFormatado = formatarStatus(rel.status);
      contadores[statusFormatado]++;

      const corPrioridade = obterCorPrioridade(tarefa.prioridadeTarefa);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${tarefa.tituloTarefa}</td>
        <td class="status-${statusFormatado.toLowerCase().replace(" ", "")}">${statusFormatado}</td>
        <td><input type="text" class="data" value="${formatarData(tarefa.dataInicio)}" disabled></td>
        <td><input type="text" class="data" value="${formatarData(tarefa.dataFim)}" disabled></td>
        <td><span class="bandeirinha ${corPrioridade}" title="Prioridade: ${tarefa.prioridadeTarefa || 'N/A'}"></span></td>
        <td>
          <button onclick="editarStatus(${rel.tarefas_idTarefa}, '${statusFormatado}')">Editar</button>
          <button onclick="fixarPostit('${tarefa.tituloTarefa}')" class="btn-secondary">Fixar</button>
        </td>
      `;
      tbodyTarefas.appendChild(tr);
    }

    gerarGrafico(contadores);
    flatpickr(".data", { enableTime: true, dateFormat: "d/m/Y H:i" });
  } catch (err) {
    console.error('Erro ao carregar tarefas:', err);
    mostrarRespostaPopup('Erro ao carregar tarefas. Veja console.', false);
  }
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

function obterCorPrioridade(prioridade) {
  switch ((prioridade || "").toLowerCase()) {
    case "alta": return "vermelha";
    case "media":
    case "média": return "amarela";
    case "baixa": return "verde";
    default: return "cinza";
  }
}

function editarStatus(id, status) {
  idTarefaSelecionada.value = id;
  txtStatusEditar.value = status;
  document.getElementById("formEditarContainer").classList.remove("oculto");
  document.getElementById("formEditarContainer").scrollIntoView({ behavior: "smooth" });
}

function fixarPostit(titulo) {
  postit.innerHTML = `📌 ${titulo} <button onclick="removerPostit()">×</button>`;
  postit.classList.remove("oculto");
  localStorage.setItem("tarefaFixada", titulo);
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

async function buscarTarefa(id) {
  const data = await fetchWithAuth(`${baseUrl}/tarefas/${id}`);
  return data.tarefa || {};
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

function gerarGrafico({ Pendente, "Em andamento": EmAndamento, "Concluída": Concluida }) {
  const ctx = document.getElementById("graficoTarefas").getContext("2d");
  if (window.myPieChart) window.myPieChart.destroy();

  window.myPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pendente", "Em andamento", "Concluída"],
      datasets: [{
        data: [Pendente, EmAndamento, Concluida],
        backgroundColor: ["#f39c12", "#2980b9", "#27ae60"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1
        }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

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
  }
}

async function atualizarPerfil(ev) {
  ev.preventDefault();
  if (!userId) {
    alert("Usuário não identificado. Faça login novamente.");
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
    mostrarRespostaPopup("Perfil atualizado com sucesso.", true);
  } catch (err) {
    console.error(err);
    mostrarRespostaPopup("Erro ao atualizar perfil.", false);
  }
}

// Funções utilitárias
function fetchWithAuth(url, options = {}) {
  const headers = options.headers || {};
  options.headers = {
    'Content-Type': 'application/json',
    ...headers,
    'Authorization': `Bearer ${localStorage.getItem("token")}`
  };

  return fetch(url, options).then(async res => {
    if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
    return res.json();
  });
}

function mostrarRespostaPopup(mensagem, sucesso = true, tempo = 3000) {
  if (!divResposta) {
    alert(mensagem);
    return;
  }
  divResposta.innerText = mensagem;
  divResposta.className = sucesso ? 'popup sucesso' : 'popup erro';
  divResposta.style.display = 'block';
  setTimeout(() => {
    divResposta.style.display = 'none';
  }, tempo);
}

// Funções para criar modais
function criarModalConfirmacao() {
  const modal = document.createElement("div");
  modal.id = "modalConfirmacao";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-box">
      <p id="modal-text"></p>
      <div class="modal-actions">
        <button id="confirmarExcluir">Excluir</button>
        <button id="cancelarExcluir" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `;
  modal.style.display = "none";

  const textoModal = modal.querySelector("#modal-text");
  const btnConfirmar = modal.querySelector("#confirmarExcluir");
  const btnCancelar = modal.querySelector("#cancelarExcluir");

  btnCancelar.onclick = () => modal.style.display = "none";

  window.mostrarModalConfirmacao = (titulo, onConfirmar) => {
    textoModal.textContent = `Deseja apagar a anotação: '${titulo}'?`;
    modal.style.display = "block";
    btnConfirmar.onclick = () => {
      modal.style.display = "none";
      onConfirmar();
    };
  };

  return modal;
}

function criarModalRecado() {
  const modal = document.createElement("div");
  modal.id = "modalRecado";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-box">
      <h3>Adicionar Recado</h3>
      <p>Para o dia: <strong id="dataRecado"></strong></p>
      <textarea id="txtRecado" placeholder="Escreva seu recado aqui..." rows="5"></textarea>
      <div class="modal-actions">
        <button id="salvarRecado">Salvar</button>
        <button id="cancelarRecado" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `;
  modal.style.display = "none";

  const dataRecadoSpan = modal.querySelector("#dataRecado");
  const txtRecadoInput = modal.querySelector("#txtRecado");
  const btnSalvar = modal.querySelector("#salvarRecado");
  const btnCancelar = modal.querySelector("#cancelarRecado");

  btnCancelar.onclick = () => modal.style.display = "none";

  window.mostrarModalRecado = (dateStr, onSave) => {
    dataRecadoSpan.textContent = dateStr;
    txtRecadoInput.value = "";
    modal.style.display = "block";

    btnSalvar.onclick = () => {
      const anotacao = txtRecadoInput.value.trim();
      if (anotacao) onSave(anotacao);
      modal.style.display = "none";
    };
  };

  return modal;
}

function criarModalConclusao() {
  const modal = document.createElement("div");
  modal.id = "modalConclusao";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-box">
      <p id="modal-conclusao-text"></p>
      <div class="modal-actions">
        <button id="confirmarConclusao">Sim</button>
        <button id="cancelarConclusao" class="btn-secondary">Não</button>
      </div>
    </div>
  `;
  modal.style.display = "none";

  const textoModal = modal.querySelector("#modal-conclusao-text");
  const btnConfirmar = modal.querySelector("#confirmarConclusao");
  const btnCancelar = modal.querySelector("#cancelarConclusao");

  btnCancelar.onclick = () => modal.style.display = "none";

  window.mostrarModalConclusao = (tituloTarefa, onConfirmar) => {
    textoModal.textContent = `Deseja marcar a tarefa '${tituloTarefa}' como Concluída?`;
    modal.style.display = "block";

    btnConfirmar.onclick = () => {
      modal.style.display = "none";
      onConfirmar();
    };
  };

  return modal;
}

function criarModalDetalhesTarefa() {
  const modal = document.createElement("div");
  modal.id = "modalDetalhesTarefa";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-box">
      <h3 id="detalhesTituloTarefa"></h3>
      <p id="detalhesDescricaoTarefa"></p>
      <div class="modal-actions">
        <button id="fecharDetalhesTarefa">Fechar</button>
      </div>
    </div>
  `;
  modal.style.display = "none";

  const tituloDetalhes = modal.querySelector("#detalhesTituloTarefa");
  const descricaoDetalhes = modal.querySelector("#detalhesDescricaoTarefa");
  const btnFechar = modal.querySelector("#fecharDetalhesTarefa");

  btnFechar.onclick = () => modal.style.display = "none";

  window.mostrarModalDetalhes = (titulo, descricao) => {
    tituloDetalhes.textContent = titulo;
    descricaoDetalhes.textContent = descricao || "Nenhuma descrição disponível.";
    modal.style.display = "block";
  };

  return modal;
}

// Funções do calendário
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
    dateClick: function (info) {
      mostrarModalRecado(info.dateStr, (anotacao) => {
        const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
        const novoEvento = {
          title: anotacao,
          date: info.dateStr,
          id: Date.now().toString()
        };
        eventosSalvos.push(novoEvento);
        localStorage.setItem("eventosUsuario", JSON.stringify(eventosSalvos));
        calendarioInstancia.addEvent(novoEvento);
      });
    },
    eventClick: function (info) {
      const props = info.event.extendedProps;
      const isTask = !info.event.id?.startsWith("task-") ? false : true;

      if (isTask) {
        mostrarModalDetalhes(info.event.title, props?.descricao || '');
      } else {
        mostrarModalConfirmacao(info.event.title, () => {
          info.event.remove();
          const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
          const atualizados = eventosSalvos.filter(ev => ev.id !== info.event.id);
          localStorage.setItem("eventosUsuario", JSON.stringify(atualizados));
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
        id: `task-${t.titulo}-${t.dataInicio}`
      });
    });

    const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
    eventosSalvos.forEach(e => calendarioInstancia.addEvent(e));

    calendarioInstancia.render();
  });
}