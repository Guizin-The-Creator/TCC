const tbodyTarefas = document.getElementById("tbodyTarefas");
const postit = document.getElementById("postit");
const formEditar = document.getElementById("formEditarRelacao");
const idTarefaSelecionada = document.getElementById("idTarefaSelecionada");
const txtStatusEditar = document.getElementById("txtStatusEditar");

// Elementos para as novas seções financeiras
const tbodyLancamentos = document.getElementById("tbodyLancamentos");
const tbodyExtratos = document.getElementById("tbodyExtratos");
const tbodyIndices = document.getElementById("tbodyIndices");
const tbodyProdutos = document.getElementById("tbodyProdutos");

// KPIs da Visão Geral Financeira
const totalReceitasMes = document.getElementById("totalReceitasMes");
const totalDespesasMes = document.getElementById("totalDespesasMes");
const saldoAtual = document.getElementById("saldoAtual");
const lancamentosEmAbertoCount = document.getElementById("lancamentosEmAbertoCount");

// Filtros
const filtroLancamentoStatus = document.getElementById("filtroLancamentoStatus");
const filtroLancamentoClassificacao = document.getElementById("filtroLancamentoClassificacao");
const filtroExtratoTipo = document.getElementById("filtroExtratoTipo");
const filtroExtratoDataInicio = document.getElementById("filtroExtratoDataInicio");
const filtroExtratoDataFim = document.getElementById("filtroExtratoDataFim");
const filtroIndiceAno = document.getElementById("filtroIndiceAno");
const filtroProdutoSegmento = document.getElementById("filtroProdutoSegmento");

// Botão de Exportar XML
const btnExportarXML = document.getElementById("btnExportarXML");

// Modais Financeiros
const modalLancamento = document.getElementById("modalLancamento");
const modalExtrato = document.getElementById("modalExtrato");
const modalProduto = document.getElementById("modalProduto");
const modalIndice = document.getElementById("modalIndice");


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

// Variáveis para guardar os dados financeiros brutos
let todosLancamentos = [];
let todosExtratos = [];
let todosIndices = [];
let todosProdutos = [];

// Instâncias dos gráficos para destruí-las antes de recriar
let graficoTarefasInstance = null;
let graficoFluxoCaixaInstance = null;
let graficoLancamentosStatusInstance = null;
let graficoLancamentosClassificacaoInstance = null;
let graficoExtratosTipoInstance = null;
let graficoIndicesTaxasInstance = null;
let graficoProdutosCustoInstance = null;


window.addEventListener("DOMContentLoaded", () => {
  // Chamadas iniciais para o dashboard comum
  carregarTarefas();
  carregarPostit();
  carregarPerfil();
  document.getElementById("formPerfil").addEventListener("submit", atualizarPerfil);

  // Adiciona os modais ao body ao carregar a página
  document.body.appendChild(modalConfirmacao);
  document.body.appendChild(modalRecado);
  document.body.appendChild(modalConclusao);
  document.body.appendChild(modalDetalhesTarefa); // Já estava, mas garantindo

  // Event listeners para filtros financeiros
  filtroLancamentoStatus.addEventListener("change", () => carregarLancamentos());
  filtroLancamentoClassificacao.addEventListener("change", () => carregarLancamentos());
  filtroExtratoTipo.addEventListener("change", () => carregarExtratos());
  filtroExtratoDataInicio.addEventListener("change", () => carregarExtratos());
  filtroExtratoDataFim.addEventListener("change", () => carregarExtratos());
  filtroIndiceAno.addEventListener("change", () => carregarIndices());
  filtroProdutoSegmento.addEventListener("change", () => carregarProdutos());

  // Event listener para exportar XML
  btnExportarXML.addEventListener("click", gerarXMLFinanceiro);

  // Carrega os anos para o filtro de índices
  popularFiltroAnosIndices();

  // Event listeners para modais financeiros
  document.getElementById("formLancamento").addEventListener("submit", salvarLancamento);
  document.getElementById("formExtrato").addEventListener("submit", salvarExtrato);
  document.getElementById("formProduto").addEventListener("submit", salvarProduto);
  document.getElementById("formIndice").addEventListener("submit", salvarIndice);

  // Definir painel inicial (Tarefas)
  mostrarPainel('tarefas');
});

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
  document.querySelectorAll('.main-content section').forEach(section => {
    section.classList.add('oculto');
  });

  const painel = document.getElementById(`painel-${secao}`);
  if (painel) {
    painel.classList.remove("oculto");

    switch (secao) {
      case "calendario":
        inicializarCalendario();
        break;
      case "visao-geral":
        carregarTarefas();
        break;
      case "visao-geral-financeira":
        carregarKPIsFinanceiros();
        carregarFluxoCaixaMensal();
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
      case "tarefas":
        carregarTarefas();
        break;
      case "perfil":
        carregarPerfil();
        break;
    }
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
        corPrioridade = "cinza";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${tarefa.tituloTarefa}</td>
    <td class="status-${statusFormatado.toLowerCase().replace(" ", "")}">${statusFormatado}</td>
    <td><input type="text" class="data" value="${formatarData(tarefa.dataInicio)}" disabled></td>
    <td><input type="text" class="data" value="${formatarData(tarefa.dataFim)}" disabled></td>
    <td><span class="bandeirinha ${corPrioridade}" title="Prioridade: ${tarefa.prioridadeTarefa || 'N/A'}"></span></td>
    <td>
      <button class="btn-editar" onclick="editarStatus(${rel.tarefas_idTarefa}, '${statusFormatado}')">Editar</button>
      <button class="btn-fixar" onclick="fixarPostit('${tarefa.tituloTarefa}')">Fixar</button>
    </td>
    `;
    tbodyTarefas.appendChild(tr);
  }

  gerarGraficoTarefas(contadores);
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
  if (!dataISO) return '';
  const d = new Date(dataISO);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function gerarGraficoTarefas({ Pendente, "Em andamento": EmAndamento, "Concluída": Concluida }) {
  const ctx = document.getElementById("graficoTarefas").getContext("2d");
  if (graficoTarefasInstance) {
    graficoTarefasInstance.destroy();
  }
  graficoTarefasInstance = new Chart(ctx, {
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

// --- MODAIS (mantidos) ---
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
  txtRecadoInput.value = "";
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
        title: tarefa.tituloTarefa,
        descricao: tarefa.descricaoTarefa,
        date: dataISO
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
      const isTask = info.event.id && info.event.id.startsWith("task-");
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
        title: t.title,
        date: t.date,
        extendedProps: {
          descricao: t.descricao
        },
        id: `task-${t.title}-${t.date}`
      });
    });
    const eventosSalvos = JSON.parse(localStorage.getItem("eventosUsuario") || "[]");
    eventosSalvos.forEach(e => calendarioInstancia.addEvent(e));
    calendarioInstancia.render();
  });
}

// --- FUNÇÕES FINANCEIRAS ---
async function fetchData(url) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error(`Erro ao buscar ${url}:`, errorData.message || res.statusText);
      return { status: false, message: errorData.message || "Erro desconhecido", data: [] };
    }
    const data = await res.json();
    if (url.includes('/indices')) return { status: true, data: data.indices || [] };
    if (url.includes('/produtos')) return { status: true, data: data.produtos || [] };
    if (url.includes('/lancamentos')) return { status: true, data: data.lancamentos || [] };
    if (url.includes('/extratos')) return { status: true, data: data.extratos || [] };
    return { status: true, data: data };
  } catch (err) {
    console.error(`Erro de rede ao buscar ${url}:`, err);
    return { status: false, message: "Erro de rede", data: [] };
  }
}

// Carregar KPIs
async function carregarKPIsFinanceiros() {
  const lancamentosRes = await fetchData(`http://localhost:3000/lancamentos`);
  const extratosRes = await fetchData(`http://localhost:3000/extratos`);

  const lancamentos = lancamentosRes.data;
  const extratos = extratosRes.data;

  let totalReceitas = 0;
  let totalDespesas = 0;
  let saldo = 0;
  let lancamentosAbertos = 0;

  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  lancamentos.forEach(l => {
    const vencimento = new Date(l.vencimentoLancamento);
    if (vencimento.getMonth() === mesAtual && vencimento.getFullYear() === anoAtual) {
      if (l.classificacaoLancamento === "Receita") {
        totalReceitas += parseFloat(l.valorLancamento);
      } else if (l.classificacaoLancamento === "Despesa") {
        totalDespesas += parseFloat(l.valorLancamento);
      }
    }
    if (l.statusLancamento === "Em aberto" || l.statusLancamento === "Pendente") {
      lancamentosAbertos++;
    }
  });

  extratos.forEach(e => {
    if (e.tipoExtrato === "Entrada") {
      saldo += parseFloat(e.valorExtrato);
    } else if (e.tipoExtrato === "Saida") {
      saldo -= parseFloat(e.valorExtrato);
    }
  });

  totalReceitasMes.textContent = `R$ ${totalReceitas.toFixed(2)}`;
  totalDespesasMes.textContent = `R$ ${totalDespesas.toFixed(2)}`;
  saldoAtual.textContent = `R$ ${saldo.toFixed(2)}`;
  lancamentosEmAbertoCount.textContent = lancamentosAbertos;
}

// Funções para Lançamentos
function abrirModalCriarLancamento() {
  document.getElementById("formLancamento").reset();
  document.getElementById("idLancamento").value = "";
  document.getElementById("tituloModalLancamento").textContent = "Novo Lançamento";
  modalLancamento.classList.remove("oculto");
}

async function editarLancamento(id) {
  const l = todosLancamentos.find(lanc => lanc.idLancamento === id);
  if (!l) return alert("Lançamento não encontrado.");

  document.getElementById("idLancamento").value = l.idLancamento;
  document.getElementById("descLancamento").value = l.descricaoLancamento;
  document.getElementById("valorLancamento").value = l.valorLancamento;
  document.getElementById("vencimentoLancamento").value = l.vencimentoLancamento.split("T")[0];
  document.getElementById("pagamentoLancamento").value = l.pagamentoLancamento ? l.pagamentoLancamento.split("T")[0] : "";
  document.getElementById("statusLancamento").value = l.statusLancamento;
  document.getElementById("classificacaoLancamento").value = l.classificacaoLancamento;
  document.getElementById("categoriaLancamento").value = l.idCategoria;
  document.getElementById("subcategoriaLancamento").value = l.idSubcategoria;

  document.getElementById("tituloModalLancamento").textContent = "Editar Lançamento";
  modalLancamento.classList.remove("oculto");
}

function fecharModalLancamento() {
  modalLancamento.classList.add("oculto");
}

async function salvarLancamento(e) {
  e.preventDefault();
  const id = document.getElementById("idLancamento").value;
  const dados = {
    descricaoLancamento: document.getElementById("descLancamento").value,
    valorLancamento: parseFloat(document.getElementById("valorLancamento").value),
    vencimentoLancamento: document.getElementById("vencimentoLancamento").value,
    pagamentoLancamento: document.getElementById("pagamentoLancamento").value || null,
    statusLancamento: document.getElementById("statusLancamento").value,
    classificacaoLancamento: document.getElementById("classificacaoLancamento").value,
    idCategoria: parseInt(document.getElementById("categoriaLancamento").value),
    idSubcategoria: parseInt(document.getElementById("subcategoriaLancamento").value)
  };

  const url = id
    ? `http://localhost:3000/lancamentos/${id}`
    : `http://localhost:3000/lancamentos`;

  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(dados)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Erro ao salvar lançamento");
    }

    alert("Lançamento salvo com sucesso!");
    fecharModalLancamento();
    carregarLancamentos();
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro: " + error.message);
  }
}

async function excluirLancamento(id) {
  if (confirm(`Tem certeza que deseja excluir o lançamento ${id}?`)) {
    try {
      const res = await fetch(`http://localhost:3000/lancamentos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Erro ao excluir lançamento");
      alert("Lançamento excluído com sucesso.");
      carregarLancamentos();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir lançamento.");
    }
  }
}

// Funções para Extratos
function abrirModalCriarExtrato() {
  document.getElementById("formExtrato").reset();
  document.getElementById("idExtrato").value = "";
  document.getElementById("tituloModalExtrato").textContent = "Novo Extrato";
  modalExtrato.classList.remove("oculto");
}

function editarExtrato(id) {
  const e = todosExtratos.find(ex => ex.idExtrato === id);
  if (!e) return alert("Extrato não encontrado.");

  document.getElementById("idExtrato").value = e.idExtrato;
  document.getElementById("tipoExtrato").value = e.tipoExtrato;
  document.getElementById("valorExtrato").value = e.valorExtrato;
  document.getElementById("dataExtrato").value = e.dataExtrato.split("T")[0];
  document.getElementById("idTarefaExtrato").value = e.idTarefa || "";
  document.getElementById("idLancamentoExtrato").value = e.idLancamento || "";
  document.getElementById("idCategoriaExtrato").value = e.idCategoria;
  document.getElementById("idSubcategoriaExtrato").value = e.idSubcategoria;
  document.getElementById("idProdutoExtrato").value = e.idProduto;

  document.getElementById("tituloModalExtrato").textContent = "Editar Extrato";
  modalExtrato.classList.remove("oculto");
}

function fecharModalExtrato() {
  modalExtrato.classList.add("oculto");
}

async function salvarExtrato(e) {
  e.preventDefault();
  const id = document.getElementById("idExtrato").value;
  const dados = {
    tipoExtrato: document.getElementById("tipoExtrato").value,
    valorExtrato: parseFloat(document.getElementById("valorExtrato").value),
    dataExtrato: document.getElementById("dataExtrato").value,
    idTarefa: parseInt(document.getElementById("idTarefaExtrato").value) || null,
    idLancamento: parseInt(document.getElementById("idLancamentoExtrato").value) || null,
    idCategoria: parseInt(document.getElementById("idCategoriaExtrato").value),
    idSubcategoria: parseInt(document.getElementById("idSubcategoriaExtrato").value),
    idProduto: parseInt(document.getElementById("idProdutoExtrato").value)
  };

  const url = id
    ? `http://localhost:3000/extratos/${id}`
    : `http://localhost:3000/extratos`;

  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(dados)
  });

  if (!res.ok) {
    const erro = await res.json();
    alert("Erro: " + erro.message);
  } else {
    alert("Extrato salvo!");
    fecharModalExtrato();
    carregarExtratos();
  }
}

async function excluirExtrato(id) {
  if (!confirm("Deseja excluir este extrato?")) return;
  const res = await fetch(`http://localhost:3000/extratos/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  if (res.ok) {
    alert("Extrato excluído.");
    carregarExtratos();
  } else {
    alert("Erro ao excluir extrato.");
  }
}

// Funções para Produtos
function abrirModalCriarProduto() {
  document.getElementById("formProduto").reset();
  document.getElementById("idProduto").value = "";
  document.getElementById("tituloModalProduto").textContent = "Novo Produto";
  modalProduto.classList.remove("oculto");
}

function editarProduto(id) {
  const p = todosProdutos.find(p => p.idProduto === id);
  if (!p) return alert("Produto não encontrado.");

  document.getElementById("idProduto").value = p.idProduto;
  document.getElementById("nomeProduto").value = p.nomeProduto;
  document.getElementById("custoProduto").value = p.custoProduto;
  document.getElementById("idSegmentoProduto").value = p.idSegmento;
  document.getElementById("idSubsegmentoProduto").value = p.idSubsegmento;

  document.getElementById("tituloModalProduto").textContent = "Editar Produto";
  modalProduto.classList.remove("oculto");
}

function fecharModalProduto() {
  modalProduto.classList.add("oculto");
}

async function salvarProduto(e) {
  e.preventDefault();
  const id = document.getElementById("idProduto").value;
  const dados = {
    nomeProduto: document.getElementById("nomeProduto").value,
    custoProduto: parseFloat(document.getElementById("custoProduto").value),
    idSegmento: parseInt(document.getElementById("idSegmentoProduto").value),
    idSubsegmento: parseInt(document.getElementById("idSubsegmentoProduto").value)
  };

  const url = id
    ? `http://localhost:3000/produtos/${id}`
    : `http://localhost:3000/produtos`;

  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(dados)
  });

  if (!res.ok) {
    const erro = await res.json();
    alert("Erro: " + erro.message);
  } else {
    alert("Produto salvo!");
    fecharModalProduto();
    carregarProdutos();
  }
}

async function excluirProduto(id) {
  if (!confirm("Excluir produto?")) return;
  const res = await fetch(`http://localhost:3000/produtos/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  if (res.ok) {
    alert("Produto excluído.");
    carregarProdutos();
  } else {
    alert("Erro ao excluir produto.");
  }
}

// Funções para Índices
function abrirModalCriarIndice() {
  document.getElementById("formIndice").reset();
  document.getElementById("idIndice").value = "";
  document.getElementById("tituloModalIndice").textContent = "Novo Índice";
  modalIndice.classList.remove("oculto");
}

function editarIndice(id) {
  const i = todosIndices.find(i => i.idIndice === id);
  if (!i) return alert("Índice não encontrado.");

  document.getElementById("idIndice").value = i.idIndice;
  document.getElementById("nomeIndice").value = i.nomeIndice;
  document.getElementById("taxaIndice").value = i.taxaIndice;
  document.getElementById("anoIndice").value = i.anoIndice;
  document.getElementById("idSubsegmentoIndice").value = i.idSubsegmento;

  document.getElementById("tituloModalIndice").textContent = "Editar Índice";
  modalIndice.classList.remove("oculto");
}

function fecharModalIndice() {
  modalIndice.classList.add("oculto");
}

async function salvarIndice(e) {
  e.preventDefault();
  const id = document.getElementById("idIndice").value;
  const dados = {
    nomeIndice: document.getElementById("nomeIndice").value,
    taxaIndice: parseFloat(document.getElementById("taxaIndice").value),
    anoIndice: document.getElementById("anoIndice").value,
    idSubsegmento: parseInt(document.getElementById("idSubsegmentoIndice").value)
  };

  const url = id
    ? `http://localhost:3000/indices/${id}`
    : `http://localhost:3000/indices`;

  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(dados)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Erro ao salvar índice");
    }

    alert("Índice salvo com sucesso!");
    fecharModalIndice();
    carregarIndices();
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro: " + error.message);
  }
}

// Complementando a função de exclusão
async function excluirIndice(id) {
  if (!confirm("Excluir índice?")) return;
  try {
    const res = await fetch(`http://localhost:3000/indices/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) throw new Error("Erro ao excluir índice");

    alert("Índice excluído.");
    carregarIndices();
  } catch (error) {
    console.error("Erro ao excluir:", error);
    alert("Erro ao excluir índice: " + error.message);
  }
}

// --- FUNÇÕES ADICIONAIS FINANCEIRAS ---

// Gráfico de Fluxo de Caixa
async function carregarFluxoCaixaMensal() {
  const extratosRes = await fetchData(`http://localhost:3000/extratos`);
  const extratos = extratosRes.data;

  const fluxoCaixaMensal = {};

  extratos.forEach(e => {
    const data = new Date(e.dataExtrato);
    const anoMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    if (!fluxoCaixaMensal[anoMes]) {
      fluxoCaixaMensal[anoMes] = { receitas: 0, despesas: 0 };
    }
    if (e.tipoExtrato === "Entrada") {
      fluxoCaixaMensal[anoMes].receitas += parseFloat(e.valorExtrato);
    } else if (e.tipoExtrato === "Saida") {
      fluxoCaixaMensal[anoMes].despesas += parseFloat(e.valorExtrato);
    }
  });

  const sortedMonths = Object.keys(fluxoCaixaMensal).sort();
  const labels = sortedMonths.map(month => {
    const [year, mon] = month.split('-');
    return `${mon}/${year}`;
  });
  const receitasData = sortedMonths.map(month => fluxoCaixaMensal[month].receitas);
  const despesasData = sortedMonths.map(month => fluxoCaixaMensal[month].despesas);

  const ctx = document.getElementById("graficoFluxoCaixa").getContext("2d");
  if (graficoFluxoCaixaInstance) {
    graficoFluxoCaixaInstance.destroy();
  }
  graficoFluxoCaixaInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Receitas',
          data: receitasData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          type: 'bar'
        },
        {
          label: 'Despesas',
          data: despesasData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          type: 'bar'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Fluxo de Caixa Mensal'
        }
      },
      scales: {
        x: {
          beginAtZero: true
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Carregar Lançamentos e gerar gráficos
async function carregarLancamentos() {
  let url = `http://localhost:3000/lancamentos`;
  const statusFiltro = filtroLancamentoStatus.value;
  const classificacaoFiltro = filtroLancamentoClassificacao.value;

  const lancamentosRes = await fetchData(url);
  todosLancamentos = lancamentosRes.data.filter(l => {
    const matchesStatus = statusFiltro ? l.statusLancamento === statusFiltro : true;
    const matchesClassificacao = classificacaoFiltro ? l.classificacaoLancamento === classificacaoFiltro : true;
    return matchesStatus && matchesClassificacao;
  });

  tbodyLancamentos.innerHTML = "";
  if (todosLancamentos.length === 0) {
    tbodyLancamentos.innerHTML = '<tr><td colspan="6">Nenhum lançamento encontrado.</td></tr>';
  } else {

    todosLancamentos.forEach(l => {
      const tr = document.createElement("tr");
      const statusClass = `status-${l.statusLancamento.toLowerCase().replace(" ", "")}`;
      tr.innerHTML = `
      <td>${l.descricaoLancamento}</td>
      <td>R$ ${parseFloat(l.valorLancamento).toFixed(2)}</td>
      <td>${formatarData(l.vencimentoLancamento)}</td>
      <td class="${statusClass}">${l.statusLancamento}</td>
      <td>${l.classificacaoLancamento}</td>
      <td>
        <button class="btn-editar" onclick="editarLancamento(${l.idLancamento})">Editar</button>
        <button class="btn-excluir" onclick="excluirLancamento(${l.idLancamento})">Excluir</button>
      </td>
      `;
      tbodyLancamentos.appendChild(tr);
    });
  }

  gerarGraficoLancamentosStatus(todosLancamentos);
  gerarGraficoLancamentosClassificacao(todosLancamentos);
}

function gerarGraficoLancamentosStatus(lancamentos) {
  const statusCounts = lancamentos.reduce((acc, l) => {
    acc[l.statusLancamento] = (acc[l.statusLancamento] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const backgroundColors = labels.map(label => {
    switch (label) {
      case "Em aberto": return "#f39c12";
      case "Pago": return "#27ae60";
      case "Vencido": return "#e74c3c";
      default: return "#7f8c8d";
    }
  });

  const ctx = document.getElementById("graficoLancamentosStatus").getContext("2d");
  if (graficoLancamentosStatusInstance) {
    graficoLancamentosStatusInstance.destroy();
  }
  graficoLancamentosStatusInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        title: {
          display: true,
          text: 'Lançamentos por Status'
        }
      }
    }
  });
}

function gerarGraficoLancamentosClassificacao(lancamentos) {
  const classificacaoCounts = lancamentos.reduce((acc, l) => {
    acc[l.classificacaoLancamento] = (acc[l.classificacaoLancamento] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(classificacaoCounts);
  const data = Object.values(classificacaoCounts);
  const backgroundColors = labels.map(label => {
    switch (label) {
      case "Receita": return "#28a745";
      case "Despesa": return "#dc3545";
      default: return "#7f8c8d";
    }
  });

  const ctx = document.getElementById("graficoLancamentosClassificacao").getContext("2d");
  if (graficoLancamentosClassificacaoInstance) {
    graficoLancamentosClassificacaoInstance.destroy();
  }
  graficoLancamentosClassificacaoInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade',
        data: data,
        backgroundColor: backgroundColors,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Lançamentos por Classificação'
        }
      },
      scales: {
        x: {
          beginAtZero: true
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

async function carregarExtratos() {
  let url = `http://localhost:3000/extratos`;
  const tipoFiltro = filtroExtratoTipo.value;
  const dataInicioFiltro = filtroExtratoDataInicio.value;
  const dataFimFiltro = filtroExtratoDataFim.value;

  const extratosRes = await fetchData(url);
  todosExtratos = extratosRes.data.filter(e => {
    const matchesTipo = tipoFiltro ? e.tipoExtrato === tipoFiltro : true;
    const dataExtrato = new Date(e.dataExtrato);
    const matchesDataInicio = dataInicioFiltro ? dataExtrato >= new Date(dataInicioFiltro) : true;
    const matchesDataFim = dataFimFiltro ? dataExtrato <= new Date(dataFimFiltro) : true;
    return matchesTipo && matchesDataInicio && matchesDataFim;
  });

  tbodyExtratos.innerHTML = "";
  if (todosExtratos.length === 0) {
    tbodyExtratos.innerHTML = '<tr><td colspan="6">Nenhum extrato encontrado.</td></tr>';
  } else {
    todosExtratos.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.descricaoExtrato}</td>
        <td>R$ ${parseFloat(e.valorExtrato).toFixed(2)}</td>
        <td>${formatarData(e.dataExtrato)}</td>
        <td>${e.tipoExtrato}</td>
        <td>${e.nomeProduto || 'N/A'}</td>
        <td>
          <button class="btn-editar" onclick="editarExtrato(${e.idExtrato})">Editar</button>
          <button class="btn-excluir" onclick="excluirExtrato(${e.idExtrato})">Excluir</button>
        </td>
      `;
      tbodyExtratos.appendChild(tr);
    });
  }

  gerarGraficoExtratosTipo(todosExtratos);
}

function gerarGraficoExtratosTipo(extratos) {
  const tipoCounts = extratos.reduce((acc, e) => {
    acc[e.tipoExtrato] = (acc[e.tipoExtrato] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(tipoCounts);
  const data = Object.values(tipoCounts);
  const backgroundColors = labels.map(label => {
    switch (label) {
      case "Entrada": return "#4CAF50";
      case "Saida": return "#FF5722";
      default: return "#7f8c8d";
    }
  });

  const ctx = document.getElementById("graficoExtratosTipo").getContext("2d");
  if (graficoExtratosTipoInstance) {
    graficoExtratosTipoInstance.destroy();
  }
  graficoExtratosTipoInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        title: {
          display: true,
          text: 'Extratos por Tipo'
        }
      }
    }
  });
}

async function carregarIndices() {
  let url = `http://localhost:3000/indices`;
  const anoFiltro = filtroIndiceAno.value;

  const indicesRes = await fetchData(url);
  todosIndices = indicesRes.data.filter(i => {
    return anoFiltro ? i.anoIndice == anoFiltro : true;
  });

  tbodyIndices.innerHTML = "";
  if (todosIndices.length === 0) {
    tbodyIndices.innerHTML = '<tr><td colspan="5">Nenhum índice encontrado.</td></tr>';
  } else {
    todosIndices.forEach(i => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i.nomeIndice}</td>
        <td>${parseFloat(i.taxaIndice).toFixed(2)}%</td>
        <td>${i.anoIndice}</td>
        <td>${i.idSubsegmento || 'N/A'}</td>
        <td>
          <button class="btn-editar" onclick="editarIndice(${i.idIndice})">Editar</button>
          <button class="btn-excluir" onclick="excluirIndice(${i.idIndice})">Excluir</button>
        </td>
      `;
      tbodyIndices.appendChild(tr);
    });
  }
  gerarGraficoIndicesTaxas(todosIndices);
}

function popularFiltroAnosIndices() {
  const currentYear = new Date().getFullYear();
  let years = new Set();
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.add(i);
  }

  if (todosIndices && todosIndices.length > 0) {
    todosIndices.forEach(i => years.add(i.anoIndice));
  }

  const sortedYears = Array.from(years).sort((a, b) => b - a);

  filtroIndiceAno.innerHTML = '<option value="">Todos</option>';
  sortedYears.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    filtroIndiceAno.appendChild(option);
  });
}

function gerarGraficoIndicesTaxas(indices) {
  const ctx = document.getElementById("graficoIndicesTaxas").getContext("2d");
  if (graficoIndicesTaxasInstance) {
    graficoIndicesTaxasInstance.destroy();
  }

  const dataGrouped = indices.reduce((acc, index) => {
    if (!acc[index.nomeIndice]) {
      acc[index.nomeIndice] = [];
    }
    acc[index.nomeIndice].push({ year: index.anoIndice, taxa: parseFloat(index.taxaIndice) });
    return acc;
  }, {});

  const datasets = Object.keys(dataGrouped).map((nomeIndice, i) => {
    const sortedData = dataGrouped[nomeIndice].sort((a, b) => a.year - b.year);
    const dataPoints = sortedData.map(d => d.taxa);
    const labels = sortedData.map(d => d.year);
    const color = `hsl(${i * 80}, 70%, 50%)`;
    return {
      label: nomeIndice,
      data: dataPoints,
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.1
    };
  });

  const allYears = Array.from(new Set(indices.map(i => i.anoIndice))).sort();

  graficoIndicesTaxasInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: allYears,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top"
        },
        title: {
          display: true,
          text: 'Taxas de Índices ao Longo dos Anos'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Ano'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Taxa (%)'
          },
          beginAtZero: true
        }
      }
    }
  });
}

async function carregarProdutos() {
  let url = `http://localhost:3000/produtos`;
  const segmentoFiltro = filtroProdutoSegmento.value;

  const produtosRes = await fetchData(url);
  todosProdutos = produtosRes.data.filter(p => {
    return segmentoFiltro ? p.IdSegmento === segmentoFiltro : true;
  });

  tbodyProdutos.innerHTML = "";
  if (todosProdutos.length === 0) {
    tbodyProdutos.innerHTML = '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>';
  } else {
    todosProdutos.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nomeProduto}</td>
        <td>R$ ${parseFloat(p.custoProduto).toFixed(2)}</td>
        <td>${p.IdSegmento || 'N/A'}</td>
        <td>${p.IdSubsegmento || 'N/A'}</td>
        <td>
          <button class="btn-editar" onclick="editarProduto(${p.idProduto})">Editar</button>
          <button class="btn-excluir" onclick="excluirProduto(${p.idProduto})">Excluir</button>
        </td>
      `;
      tbodyProdutos.appendChild(tr);
    });
  }
  gerarGraficoProdutosCusto(todosProdutos);
}

function gerarGraficoProdutosCusto(produtos) {
  const ctx = document.getElementById("graficoProdutosCusto").getContext("2d");
  if (graficoProdutosCustoInstance) {
    graficoProdutosCustoInstance.destroy();
  }

  const custoPorSegmento = produtos.reduce((acc, p) => {
    const segmento = p.IdSegmento || 'Outros';
    acc[segmento] = (acc[segmento] || 0) + parseFloat(p.custoProduto);
    return acc;
  }, {});

  const labels = Object.keys(custoPorSegmento);
  const data = Object.values(custoPorSegmento);

  graficoProdutosCustoInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: 'Custo Total por Segmento',
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Custo de Produtos por Segmento'
        }
      },
      scales: {
        x: {
          beginAtZero: true
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Função para gerar o XML financeiro
async function gerarXMLFinanceiro() {
  await carregarLancamentos();
  await carregarExtratos();
  await carregarIndices();
  await carregarProdutos();

  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<RelatorioFinanceiro>
    <Lancamentos>`;

  todosLancamentos.forEach(l => {
    xmlContent += `
        <Lancamento>
            <IdLancamento>${l.idLancamento}</IdLancamento>
            <DescricaoLancamento>${l.descricaoLancamento}</DescricaoLancamento>
            <ValorLancamento>${parseFloat(l.valorLancamento).toFixed(2)}</ValorLancamento>
            <VencimentoLancamento>${formatarData(l.vencimentoLancamento)}</VencimentoLancamento>
            <StatusLancamento>${l.statusLancamento}</StatusLancamento>
            <ClassificacaoLancamento>${l.classificacaoLancamento}</ClassificacaoLancamento>
        </Lancamento>`;
  });
  xmlContent += `
    </Lancamentos>
    <Extratos>`;

  todosExtratos.forEach(e => {
    xmlContent += `
        <Extrato>
            <IdExtrato>${e.idExtrato}</IdExtrato>
            <DescricaoExtrato>${e.descricaoExtrato}</DescricaoExtrato>
            <ValorExtrato>${parseFloat(e.valorExtrato).toFixed(2)}</ValorExtrato>
            <DataExtrato>${formatarData(e.dataExtrato)}</DataExtrato>
            <TipoExtrato>${e.tipoExtrato}</TipoExtrato>
            <IdProduto>${e.idProduto || 'N/A'}</IdProduto>
        </Extrato>`;
  });
  xmlContent += `
    </Extratos>
    <Indices>`;

  todosIndices.forEach(i => {
    xmlContent += `
        <Indice>
            <IdIndice>${i.idIndice}</IdIndice>
            <NomeIndice>${i.nomeIndice}</NomeIndice>
            <TaxaIndice>${parseFloat(i.taxaIndice).toFixed(2)}</TaxaIndice>
            <IdSubsegmento>${i.idSubsegmento || 'N/A'}</IdSubsegmento>
            <AnoIndice>${i.anoIndice}</AnoIndice>
        </Indice>`;
  });
  xmlContent += `
    </Indices>
    <Produtos>`;

  todosProdutos.forEach(p => {
    xmlContent += `
        <Produto>
            <IdProduto>${p.idProduto}</IdProduto>
            <NomeProduto>${p.nomeProduto}</NomeProduto>
            <CustoProduto>${parseFloat(p.custoProduto).toFixed(2)}</CustoProduto>
            <IdSegmento>${p.idSegmento || 'N/A'}</IdSegmento>
            <IdSubsegmento>${p.idSubsegmento || 'N/A'}</IdSubsegmento>
        </Produto>`;
  });
  xmlContent += `
    </Produtos>
</RelatorioFinanceiro>`;

  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio_financeiro.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Dados financeiros exportados para relatorio_financeiro.xml');
}