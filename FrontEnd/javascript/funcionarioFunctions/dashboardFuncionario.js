const tbodyTarefas = document.getElementById("tbodyTarefas");
const postit = document.getElementById("postit");
const formEditar = document.getElementById("formEditarRelacao");
const idTarefaSelecionada = document.getElementById("idTarefaSelecionada");
const txtStatusEditar = document.getElementById("txtStatusEditar");

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

const userId = pegarUserIdDoToken();
let dataCadastroAtual = null;
let idCargoAtual = null;
let calendarioInstancia = null;

window.addEventListener("DOMContentLoaded", () => {
  carregarTarefas();
  carregarPostit();
  carregarPerfil();
  document.getElementById("formPerfil").addEventListener("submit", atualizarPerfil);

  // Adiciona os modais ao body ao carregar a página
  document.body.appendChild(modalConfirmacao);
  document.body.appendChild(modalRecado);
  document.body.appendChild(modalConclusao); // Adiciona o modal de conclusão
});

formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = idTarefaSelecionada.value;
  const status = txtStatusEditar.value;

  // Lógica para o popup de confirmação de conclusão
  if (status === "Concluída") {
    // Busca o título da tarefa diretamente do servidor
    const tarefa = await buscarTarefa(id);
    const tituloTarefa = tarefa.tituloTarefa;

    mostrarModalConclusao(tituloTarefa, async () => {
      await updateTaskStatus(id, status);
    });
  } else {
    await updateTaskStatus(id, status);
  }
});

async function updateTaskStatus(id, status) {
  await fetch(`http://localhost:3000/usuariostarefas/${userId}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ idUsuario: userId, idTarefa: id, status }),
  });
  carregarTarefas();
  document.getElementById("formEditarContainer").classList.add("oculto");
}

function mostrarPainel(secao) {
  document.getElementById("painel-tarefas").classList.toggle("oculto", secao !== "tarefas");
  document.getElementById("painel-perfil").classList.toggle("oculto", secao !== "perfil");
  document.getElementById("painel-calendario").classList.toggle("oculto", secao !== "calendario");
  document.getElementById("painel-visao-geral").classList.toggle("oculto", secao !== "visao-geral");
  if (secao === "calendario") inicializarCalendario();
  if (secao === "visao-geral") {
    carregarTarefas();
  }
}

async function carregarTarefas() {
  const res = await fetch(`http://localhost:3000/usuariostarefas/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const data = await res.json();
  const tarefas = data.associacoes || [];

  tbodyTarefas.innerHTML = "";
  let contadores = { Pendente: 0, "Em andamento": 0, "Concluída": 0 };

  for (const rel of tarefas) {
    const tarefa = await buscarTarefa(rel.tarefas_idTarefa);
    const statusFormatado = formatarStatus(rel.status);
    contadores[statusFormatado]++;

    // Mapeia a prioridade para uma cor
    let corPrioridade = "";
    switch ((tarefa.prioridadeTarefa || "").toLowerCase()) {
      case "alta":
        corPrioridade = "vermelha";
        break;
      case "media":
      case "média":
        corPrioridade = "amarela";
        break;
      case "baixa":
        corPrioridade = "verde";
        break;
      default:
        corPrioridade = "cinza"; // caso não tenha prioridade definida
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tarefa.tituloTarefa}</td>
      <td class="status-${statusFormatado.toLowerCase().replace(" ", "")}">${statusFormatado}</td>
      <td><input type="text" class="data" value="${formatarData(tarefa.dataInicio)}" disabled></td>
      <td><input type="text" class="data" value="${formatarData(tarefa.dataFim)}" disabled></td>
      <td><span class="bandeirinha ${corPrioridade}" title="Prioridade: ${tarefa.prioridadeTarefa || 'N/A'}"></span></td>
      <td>
        <button onclick="editarStatus(${rel.tarefas_idTarefa}, '${statusFormatado}')">Editar</button>
        <button onclick="fixarPostit('${tarefa.tituloTarefa}')">Fixar</button>
      </td>
    `;
    tbodyTarefas.appendChild(tr);
  }

  gerarGrafico(contadores);
  flatpickr(".data", { enableTime: true, dateFormat: "d/m/Y H:i" });
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
  const res = await fetch(`http://localhost:3000/tarefas/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const data = await res.json();
  return data.tarefa || {};
}

function formatarData(dataISO) {
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
  // Destroy existing chart instance to prevent duplicates
  if (window.myPieChart) {
    window.myPieChart.destroy();
  }
  window.myPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pendente", "Em andamento", "Concluída"],
      datasets: [{
        data: [Pendente, EmAndamento, Concluida],
        backgroundColor: ["#f39c12", "#2980b9", "#27ae60"],
      }]
    },
    options: {
      plugins: { legend: { position: "bottom" } }
    }
  });
}

async function carregarPerfil() {
  if (!userId) {
    console.error("userId não definido no token");
    return;
  }
  try {
    const res = await fetch(`http://localhost:3000/usuarios/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    const user = data.data || data.usuario || data;
    document.getElementById("nomeUsuario").value = user.nomeUsuario || "";
    document.getElementById("emailUsuario").value = user.emailUsuario || "";
    dataCadastroAtual = user.dataCadastro || null;
    idCargoAtual = user.idCargo || null;
  } catch (err) {
    console.error(err);
  }
}

function atualizarPerfil(ev) {
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

  // Somente adiciona se existir valor
  if (dataCadastroAtual) corpo.dataCadastro = dataCadastroAtual;
  if (idCargoAtual) corpo.idCargo = idCargoAtual;
  if (senha.trim() !== "") corpo.senhaUsuario = senha;

  fetch(`http://localhost:3000/usuarios/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(corpo),
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao atualizar perfil");
      return res.json();
    })
    .then(data => alert(data.message || "Perfil atualizado."))
    .catch(err => {
      console.error(err);
      alert("Erro ao atualizar perfil.");
    });
}

// --- MODAIS ---

// Modal de Confirmação (Excluir)
const modalConfirmacao = document.createElement("div");
modalConfirmacao.id = "modalConfirmacao";
modalConfirmacao.innerHTML = `
  <div class="modal-overlay"></div>
  <div class="modal-box">
    <p id="modal-text"></p>
    <div class="modal-actions">
      <button id="confirmarExcluir">Excluir</button>
      <button id="cancelarExcluir">Cancelar</button>
    </div>
  </div>
`;

const overlayConfirmacao = modalConfirmacao.querySelector(".modal-overlay");
const modalBoxConfirmacao = modalConfirmacao.querySelector(".modal-box");
const textoModalConfirmacao = modalConfirmacao.querySelector("#modal-text");
const btnConfirmarExcluir = modalConfirmacao.querySelector("#confirmarExcluir");
const btnCancelarExcluir = modalConfirmacao.querySelector("#cancelarExcluir");


function mostrarModalConfirmacao(titulo, onConfirmar) {
  textoModalConfirmacao.textContent = `Deseja apagar a anotação: '${titulo}'?`;
  modalConfirmacao.style.display = "block";
  overlayConfirmacao.style.display = "block";
  modalBoxConfirmacao.style.display = "block";

  btnConfirmarExcluir.onclick = () => {
    modalConfirmacao.style.display = "none";
    overlayConfirmacao.style.display = "none";
    modalBoxConfirmacao.style.display = "none";
    onConfirmar();
  };

  btnCancelarExcluir.onclick = () => {
    modalConfirmacao.style.display = "none";
    overlayConfirmacao.style.display = "none";
    modalBoxConfirmacao.style.display = "none";
  };
}

// Modal para Escrever Recado
const modalRecado = document.createElement("div");
modalRecado.id = "modalRecado";
modalRecado.innerHTML = `
  <div class="modal-overlay"></div>
  <div class="modal-box">
    <h3>Adicionar Recado</h3>
    <p>Para o dia: <strong id="dataRecado"></strong></p>
    <textarea id="txtRecado" placeholder="Escreva seu recado aqui..." rows="5"></textarea>
    <div class="modal-actions">
      <button id="salvarRecado">Salvar</button>
      <button id="cancelarRecado">Cancelar</button>
    </div>
  </div>
`;

const overlayRecado = modalRecado.querySelector(".modal-overlay");
const modalBoxRecado = modalRecado.querySelector(".modal-box");
const dataRecadoSpan = modalRecado.querySelector("#dataRecado");
const txtRecadoInput = modalRecado.querySelector("#txtRecado");
const btnSalvarRecado = modalRecado.querySelector("#salvarRecado");
const btnCancelarRecado = modalRecado.querySelector("#cancelarRecado");

function mostrarModalRecado(dateStr, onSave) {
  dataRecadoSpan.textContent = dateStr;
  txtRecadoInput.value = ""; // Limpa o campo ao abrir
  modalRecado.style.display = "block";
  overlayRecado.style.display = "block";
  modalBoxRecado.style.display = "block";

  btnSalvarRecado.onclick = () => {
    const anotacao = txtRecadoInput.value.trim();
    if (anotacao) {
      onSave(anotacao);
    }
    modalRecado.style.display = "none";
    overlayRecado.style.display = "none";
    modalBoxRecado.style.display = "none";
  };

  btnCancelarRecado.onclick = () => {
    modalRecado.style.display = "none";
    overlayRecado.style.display = "none";
    modalBoxRecado.style.display = "none";
  };
}


// Novo Modal de Confirmação de Conclusão
const modalConclusao = document.createElement("div");
modalConclusao.id = "modalConclusao";
modalConclusao.innerHTML = `
  <div class="modal-overlay"></div>
  <div class="modal-box">
    <p id="modal-conclusao-text"></p>
    <div class="modal-actions">
      <button id="confirmarConclusao">Sim</button>
      <button id="cancelarConclusao">Não</button>
    </div>
  </div>
`;

const overlayConclusao = modalConclusao.querySelector(".modal-overlay");
const modalBoxConclusao = modalConclusao.querySelector(".modal-box");
const textoModalConclusao = modalConclusao.querySelector("#modal-conclusao-text");
const btnConfirmarConclusao = modalConclusao.querySelector("#confirmarConclusao");
const btnCancelarConclusao = modalConclusao.querySelector("#cancelarConclusao");

function mostrarModalConclusao(tituloTarefa, onConfirmar) {
  textoModalConclusao.textContent = `Deseja marcar a tarefa '${tituloTarefa}' como Concluída?`;
  modalConclusao.style.display = "block";
  overlayConclusao.style.display = "block";
  modalBoxConclusao.style.display = "block";

  btnConfirmarConclusao.onclick = () => {
    modalConclusao.style.display = "none";
    overlayConclusao.style.display = "none";
    modalBoxConclusao.style.display = "none";
    onConfirmar();
  };

  btnCancelarConclusao.onclick = () => {
    modalConclusao.style.display = "none";
    overlayConclusao.style.display = "none";
    modalBoxConclusao.style.display = "none";
  };
}

const modalDetalhesTarefa = document.createElement("div");
modalDetalhesTarefa.id = "modalDetalhesTarefa";
modalDetalhesTarefa.innerHTML = `
  <div class="modal-overlay"></div>
  <div class="modal-box">
    <h3 id="detalhesTituloTarefa"></h3>
    <p id="detalhesDescricaoTarefa"></p>
    <div class="modal-actions">
      <button id="fecharDetalhesTarefa">Fechar</button>
    </div>
  </div>
`;
document.body.appendChild(modalDetalhesTarefa);

const overlayDetalhes = modalDetalhesTarefa.querySelector(".modal-overlay");
const tituloDetalhes = modalDetalhesTarefa.querySelector("#detalhesTituloTarefa");
const descricaoDetalhes = modalDetalhesTarefa.querySelector("#detalhesDescricaoTarefa");
const btnFecharDetalhes = modalDetalhesTarefa.querySelector("#fecharDetalhesTarefa");

function mostrarModalDetalhes(titulo, descricao) {
  tituloDetalhes.textContent = titulo;
  descricaoDetalhes.textContent = descricao || "Nenhuma descrição disponível.";
  modalDetalhesTarefa.style.display = "block";
  overlayDetalhes.style.display = "block";
}

btnFecharDetalhes.onclick = () => {
  modalDetalhesTarefa.style.display = "none";
  overlayDetalhes.style.display = "none";
};



// --- FUNÇÕES DO CALENDÁRIO ---

async function buscarTarefasDoUsuario() {
  const res = await fetch(`http://localhost:3000/usuariostarefas/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const data = await res.json();
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
        date: t.dataInicio, // <-- NÃO use split() aqui!
        extendedProps: { descricao: t.descricao },
        id: `task-${t.titulo}-${t.dataInicio}`
      });
    });

    const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
    eventosSalvos.forEach(e => calendarioInstancia.addEvent(e));

    calendarioInstancia.render();
  });
}

// Estilo inline para modal (pode mover para o CSS externo)
const estiloModal = document.createElement("style");
estiloModal.innerHTML = `
#modalDetalhesTarefa {
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

#modalConfirmacao, #modalRecado, #modalConclusao { /* Adicionado #modalConclusao */
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}
.modal-overlay {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  top: 0;
  left: 0;
}
.modal-box {
  background: white;
  padding: 20px;
  width: 300px;
  max-width: 80vw;
  border-radius: 10px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  text-align: center;
  display: flex; /* Para flexbox no conteúdo */
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  width: 100%; /* Garante que os botões se espalhem */
  gap: 15px; /* adicione isso */
}
.modal-actions button {
  padding: 10px 20px;
  cursor: pointer;
}
#modalRecado textarea {
  width: 90%;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
}
`;
document.head.appendChild(estiloModal);