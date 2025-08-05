// AUTENTICAÇÃO
const token = localStorage.getItem("token");
if (!token) {
  alert("Você precisa estar logado.");
  window.location.href = "login.html";
}
document.getElementById("btnLogout").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// NAVEGAÇÃO
const navBtns = document.querySelectorAll(".btn-nav");
const secoes = document.querySelectorAll("main section");

function mostrarPainel(id) {
  secoes.forEach(s => s.classList.add("oculto"));
  document.getElementById(`painel-${id}`)?.classList.remove("oculto");

  if (id === "calendario") inicializarCalendario();

  // Chame as funções de carregamento de dados para cada painel
  if (id === "tarefa-criar") carregarTarefas();
  if (id === "tarefa-atribuir") carregarAtribuicoes();
  if (id === "visao-financeira") carregarKPIsFinanceiros();
  if (id === "lancamentos") carregarLancamentos();
  if (id === "extratos") carregarExtratos();
  if (id === "indices") carregarIndices();
  if (id === "produtos") carregarProdutos();
  if (id === "perfil") carregarPerfil();
  if (id === "orcamentos-anuais") carregarOrcAnuais();
  if (id === "orcamentos-tri") carregarOrcTri();
}

navBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const secaoId = btn.dataset.secao;
    mostrarPainel(secaoId);
  });
});

// Funções utilitárias para modais e confirmações
async function handleResponse(res, successMessage, errorMessage, responseElementId = "respostaGeral") {
  const data = await res.json();
  const responseDiv = document.getElementById(responseElementId);

  if (responseDiv) {
    if (res.ok) {
      responseDiv.textContent = successMessage;
      responseDiv.classList.remove("popup-erro");
      responseDiv.classList.add("popup-sucesso");
    } else {
      responseDiv.textContent = `${errorMessage}: ${data.message || res.statusText}`;
      responseDiv.classList.remove("popup-sucesso");
      responseDiv.classList.add("popup-erro");
    }
    responseDiv.classList.add("mostrar");
    setTimeout(() => responseDiv.classList.remove("mostrar"), 3000);
  } else {
    console.warn(`Elemento de resposta com ID '${responseElementId}' não encontrado para exibir mensagem.`);
    alert(res.ok ? successMessage : `${errorMessage}: ${data.message || res.statusText}`);
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('oculto');
  } else {
    console.warn(`Modal com ID '${modalId}' não encontrado.`);
  }
}

// Utility function for fetching data (Added)
async function fetchData(url) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Erro ao carregar dados de ${url}`);
    }
    const data = await res.json();
    if (!data.status) { // Assuming 'status: false' indicates an error even if res.ok is true
      throw new Error(data.message || `Erro de lógica na API para ${url}`);
    }
    // Assuming 'data' property holds the array, or 'lancamentos', 'extratos' depending on endpoint
    return { data: data.data || data.lancamentos || data.extratos || [], status: true };
  } catch (error) {
    console.error(`Erro em fetchData para ${url}:`, error);
    alert(`Erro ao carregar dados: ${error.message}`);
    return { data: [], status: false, error: error.message }; // Return empty array and error status
  }
}

// --- MÓDULO TAREFAS ---
async function carregarTarefas() {
  const corpoTabela = document.getElementById("tabelaTarefasCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaTarefasCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/tarefas", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Erro ao carregar tarefas: ${res.statusText}`);
    const data = await res.json();
    if (data.status && Array.isArray(data.tarefas)) {
      preencherTabelaTarefas(data.tarefas);
    } else {
      console.error("Dados de tarefas inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar tarefas ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
    corpoTabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar tarefas.</td></tr>";
  }
}

function preencherTabelaTarefas(tarefas) {
  const corpoTabela = document.getElementById("tabelaTarefasCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (tarefas.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='7'>Nenhuma tarefa encontrada.</td></tr>";
    return;
  }
  tarefas.forEach(t => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = t.idTarefa;
    row.insertCell(1).textContent = t.tituloTarefa;
    row.insertCell(2).textContent = t.prioridadeTarefa;
    row.insertCell(3).textContent = new Date(t.dataInicio).toLocaleDateString();
    row.insertCell(4).textContent = new Date(t.dataFim).toLocaleDateString();
    const valorOpcional = parseFloat(t.valorOpc);
    row.insertCell(5).textContent = isNaN(valorOpcional) ? '0.00' : valorOpcional.toFixed(2);
    const acoesCell = row.insertCell(6);
    acoesCell.innerHTML = `
            <button class="btn btn-editar" onclick="abrirModalEdicaoTarefa(${t.idTarefa})">Editar</button>
            <button class="btn btn-excluir" onclick="confirmarExclusaoTarefa(${t.idTarefa})">Excluir</button>
        `;
  });
}

function abrirModalNovaTarefa() {
  const modal = document.getElementById("modalTarefa");
  document.getElementById("modalTituloTarefa").textContent = "Nova Tarefa";
  document.getElementById("txtIdTarefa").value = "";
  document.getElementById("txtTituloTarefa").value = "";
  document.getElementById("txtDescricaoTarefa").value = "";
  document.getElementById("selectPrioridadeTarefa").value = "Média";
  document.getElementById("txtDataInicioTarefa").value = "";
  document.getElementById("txtDataFimTarefa").value = "";
  document.getElementById("txtValorOpcionalTarefa").value = "";
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoTarefa(idTarefa) {
  const modal = document.getElementById("modalTarefa");
  document.getElementById("modalTituloTarefa").textContent = `Editar Tarefa ${idTarefa}`;
  try {
    const res = await fetch(`http://localhost:3000/tarefas/${idTarefa}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao buscar detalhes da tarefa: ${res.statusText}`);
    const data = await res.json();
    if (data.status && data.tarefa) {
      const t = data.tarefa;
      document.getElementById("txtIdTarefa").value = t.idTarefa;
      document.getElementById("txtTituloTarefa").value = t.tituloTarefa;
      document.getElementById("txtDescricaoTarefa").value = t.descricaoTarefa;
      document.getElementById("selectPrioridadeTarefa").value = t.prioridadeTarefa;
      document.getElementById("txtDataInicioTarefa").value = t.dataInicio ? new Date(t.dataInicio).toISOString().split('T')[0] : '';
      document.getElementById("txtDataFimTarefa").value = t.dataFim ? new Date(t.dataFim).toISOString().split('T')[0] : '';
      document.getElementById("txtValorOpcionalTarefa").value = parseFloat(t.valorOpc || 0).toFixed(2);
      modal.classList.remove('oculto');
    } else {
      alert("Tarefa não encontrada.");
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes da tarefa:", error);
    alert("Erro ao carregar detalhes da tarefa.");
  }
}

async function salvarTarefa() {
  const id = document.getElementById("txtIdTarefa").value;
  const titulo = document.getElementById("txtTituloTarefa").value;
  const descricao = document.getElementById("txtDescricaoTarefa").value;
  const prioridade = document.getElementById("selectPrioridadeTarefa").value;
  const dataInicio = document.getElementById("txtDataInicioTarefa").value;
  const dataFim = document.getElementById("txtDataFimTarefa").value;
  const valorOpc = document.getElementById("txtValorOpcionalTarefa").value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/tarefas/${id}` : "http://localhost:3000/tarefas";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tituloTarefa: titulo, descricaoTarefa: descricao, prioridadeTarefa: prioridade, dataInicio: dataInicio, dataFim: dataFim, valorOpc: valorOpc })
    });
    await handleResponse(res, id ? "Tarefa atualizada" : "Tarefa criada", id ? "Erro ao atualizar tarefa" : "Erro ao criar tarefa", "respostaTarefa");
    fecharModal('modalTarefa');
    carregarTarefas();
  } catch (error) {
    console.error('Erro ao salvar tarefa:', error);
  }
}

async function excluirTarefa(id) {
  try {
    const res = await fetch(`http://localhost:3000/tarefas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Tarefa excluída", "Erro ao excluir tarefa", "respostaGeral");
    carregarTarefas();
  }
  catch (error) {
    console.error('Erro ao excluir tarefa:', error);
  }
}

// --- MÓDULO ATRIBUIÇÕES ---
async function carregarAtribuicoes() {
  const corpoTabela = document.getElementById("tabelaAtribuicoesCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaAtribuicoesCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/usuariostarefas", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Erro ao carregar atribuições: ${res.statusText}`);
    const data = await res.json();
    if (data.status && Array.isArray(data.associacoes)) {
      // Para obter nome da tarefa e do usuário, precisaria de JOIN no backend ou requisições adicionais
      // Por simplicidade, exibiremos os IDs e faremos as requisições para o modal de edição
      preencherTabelaAtribuicoes(data.associacoes);
    } else {
      console.error("Dados de atribuições inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar atribuições ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar atribuições:", error);
    corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar atribuições.</td></tr>";
  }
}

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("oculto");
  } else {
    console.warn(`Modal com ID '${modalId}' não encontrado.`);
  }
}


async function preencherTabelaAtribuicoes(associacoes) {
  const corpoTabela = document.getElementById("tabelaAtribuicoesCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (associacoes.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='6'>Nenhuma atribuição encontrada.</td></tr>";
    return;
  }

  for (const a of associacoes) {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = a.tarefas_idTarefa;
    // Obter nome da tarefa
    let tituloTarefa = `ID ${a.tarefas_idTarefa}`;
    try {
      const resTarefa = await fetch(`http://localhost:3000/tarefas/${a.tarefas_idTarefa}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (resTarefa.ok) {
        const dataTarefa = await resTarefa.json();
        if (dataTarefa.status && dataTarefa.tarefa) {
          tituloTarefa = dataTarefa.tarefa.tituloTarefa;
        }
      }
    } catch (error) { console.warn("Não foi possível obter o título da tarefa:", error); }
    row.insertCell(1).textContent = tituloTarefa;

    row.insertCell(2).textContent = a.usuarios_idUsuario;
    // Obter nome do usuário
    let nomeUsuario = `ID ${a.usuarios_idUsuario}`;
    try {
      const resUsuario = await fetch(`http://localhost:3000/usuarios/${a.usuarios_idUsuario}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (resUsuario.ok) {
        const dataUsuario = await resUsuario.json();
        if (dataUsuario.status && dataUsuario.usuario) {
          nomeUsuario = dataUsuario.usuario.nomeUsuario;
        }
      }
    } catch (error) { console.warn("Não foi possível obter o nome do usuário:", error); }
    row.insertCell(3).textContent = nomeUsuario;
    row.insertCell(4).textContent = a.status;

    const acoesCell = row.insertCell(5);
    acoesCell.innerHTML = `
            <button class="btn btn-editar" onclick="abrirModalEdicaoAtribuicao(${a.tarefas_idTarefa}, ${a.usuarios_idUsuario})">Editar</button>
            <button class="btn btn-excluir" onclick="confirmarExclusaoAtribuicao(${a.tarefas_idTarefa}, ${a.usuarios_idUsuario})">Excluir</button>
        `;
  }
}


async function popularSelectsAtribuicao() {
  const selectUsuarios = document.getElementById("selectUsuarioAtribuicao");
  const selectTarefas = document.getElementById("selectTarefaAtribuicao");
  if (!selectUsuarios || !selectTarefas) {
    console.error("Elementos select de atribuição não encontrados.");
    return;
  }

  selectUsuarios.innerHTML = '<option value="">Selecione um Usuário</option>';
  selectTarefas.innerHTML = '<option value="">Selecione uma Tarefa</option>';

  try {
    // Carregar Usuários
    const resUsuarios = await fetch("http://localhost:3000/usuarios", { headers: { Authorization: `Bearer ${token}` } });
    if (resUsuarios.ok) {
      const dataUsuarios = await resUsuarios.json();
      if (dataUsuarios.status && Array.isArray(dataUsuarios.usuarios)) {
        dataUsuarios.usuarios.forEach(u => {
          const opt = document.createElement("option");
          opt.value = u.idUsuario;
          opt.textContent = u.nomeUsuario;
          selectUsuarios.appendChild(opt);
        });
      }
    }

    // Carregar Tarefas
    const resTarefas = await fetch("http://localhost:3000/tarefas", { headers: { Authorization: `Bearer ${token}` } });
    if (resTarefas.ok) {
      const dataTarefas = await resTarefas.json();
      if (dataTarefas.status && Array.isArray(dataTarefas.tarefas)) {
        dataTarefas.tarefas.forEach(t => {
          const opt = document.createElement("option");
          opt.value = t.idTarefa;
          opt.textContent = t.tituloTarefa;
          selectTarefas.appendChild(opt);
        });
      }
    }
  } catch (error) {
    console.error("Erro ao popular selects de atribuição:", error);
  }
}

function abrirModalNovaAtribuicao() {
  const modal = document.getElementById("modalAtribuicao");
  document.getElementById("modalTituloAtribuicao").textContent = "Nova Atribuição";
  document.getElementById("txtIdAtribuicao").value = "";
  document.getElementById("selectUsuarioAtribuicao").value = "";
  document.getElementById("selectTarefaAtribuicao").value = "";
  document.getElementById("selectStatusAtribuicao").value = "Pendente";
  popularSelectsAtribuicao();
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoAtribuicao(tarefaId, usuarioId) {
  const modal = document.getElementById("modalAtribuicao");
  document.getElementById("modalTituloAtribuicao").textContent = `Editar Atribuição (Tarefa: ${tarefaId}, Usuário: ${usuarioId})`;
  await popularSelectsAtribuicao(); // Popula os selects antes de definir os valores
  try {
    const res = await fetch(`http://localhost:3000/usuariostarefas?idTarefa=${tarefaId}&idUsuario=${usuarioId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao buscar detalhes da atribuição: ${res.statusText}`);
    const data = await res.json();
    // O backend deve retornar uma atribuição específica se existirem parâmetros
    if (data.status && Array.isArray(data.associacoes) && data.associacoes.length > 0) {
      const at = data.associacoes[0]; // Pega a primeira correspondência
      document.getElementById("txtIdAtribuicao").value = `${at.tarefas_idTarefa}-${at.usuarios_idUsuario}`; // Armazena uma chave composta
      document.getElementById("selectUsuarioAtribuicao").value = at.usuarios_idUsuario;
      document.getElementById("selectTarefaAtribuicao").value = at.tarefas_idTarefa;
      document.getElementById("selectStatusAtribuicao").value = at.status;
      modal.classList.remove('oculto');
    } else {
      alert("Atribuição não encontrada.");
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes da atribuição:", error);
    alert("Erro ao carregar detalhes da atribuição.");
  }
}

async function salvarAtribuicao() {
  const idComposto = document.getElementById("txtIdAtribuicao").value; // Pode ser vazio para nova
  const usuarioId = document.getElementById("selectUsuarioAtribuicao").value;
  const tarefaId = document.getElementById("selectTarefaAtribuicao").value;
  const status = document.getElementById("selectStatusAtribuicao").value;

  const method = idComposto ? 'PUT' : 'POST';
  // O endpoint de PUT/DELETE para usuario_tarefas precisa de ambos os IDs na URL ou corpo
  // Assumindo que PUT/DELETE esperam /usuariostarefas/:tarefaId/:usuarioId para PUT/DELETE
  const url = idComposto ? `http://localhost:3000/usuariostarefas/${tarefaId}/${usuarioId}` : "http://localhost:3000/usuariostarefas";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        usuarios_idUsuario: usuarioId,
        tarefas_idTarefa: tarefaId,
        status: status
      })
    });
    await handleResponse(res, idComposto ? "Atribuição atualizada" : "Atribuição criada", idComposto ? "Erro ao atualizar atribuição" : "Erro ao criar atribuição", "respostaAtribuicao");
    fecharModal('modalAtribuicao');
    carregarAtribuicoes();
  } catch (error) {
    console.error('Erro ao salvar atribuição:', error);
  }
}

async function excluirAtribuicao(tarefaId, usuarioId) {
  try {
    const res = await fetch(`http://localhost:3000/usuariostarefas/${tarefaId}/${usuarioId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Atribuição excluída", "Erro ao excluir atribuição", "respostaGeral");
    carregarAtribuicoes();
  } catch (error) {
    console.error('Erro ao excluir atribuição:', error);
  }
}


// --- MÓDULO VISÃO FINANCEIRA / KPIs ---
let receitasDespesasChart;
let orcamentoRealizadoChart;

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

  document.getElementById("kpiReceitas").textContent = `R$ ${totalReceitas.toFixed(2)}`;
  document.getElementById("kpiDespesas").textContent = `R$ ${totalDespesas.toFixed(2)}`;
  document.getElementById("kpiSaldo").textContent = `R$ ${saldo.toFixed(2)}`;
  document.getElementById("kpiOrcamentoRestante").textContent = `R$ ${(totalReceitas - totalDespesas).toFixed(2)}`;

  const kpiAberto = document.getElementById("kpiLancamentosEmAberto");
  if (kpiAberto) {
    kpiAberto.textContent = lancamentosAbertos;
  }

  atualizarGraficoReceitasDespesas(totalReceitas, totalDespesas);
  atualizarGraficoOrcamentoRealizado(totalReceitas, totalDespesas);
}


function atualizarGraficoReceitasDespesas(receitas, despesas) {
  const ctx = document.getElementById('receitasDespesasChart').getContext('2d');
  if (receitasDespesasChart) {
    receitasDespesasChart.destroy();
  }
  receitasDespesasChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        data: [receitas, despesas],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Visão Geral: Receitas vs. Despesas'
        }
      }
    }
  });
}

function atualizarGraficoOrcamentoRealizado(orcamentoTotal, orcamentoRealizado) {
  const ctx = document.getElementById('orcamentoRealizadoChart')?.getContext('2d');
  if (!ctx) return;
  if (orcamentoRealizadoChart) {
    orcamentoRealizadoChart.destroy();
  }
  const orcamentoRestante = orcamentoTotal - orcamentoRealizado;
  orcamentoRealizadoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Orçamento Total', 'Orçamento Realizado', 'Orçamento Restante'],
      datasets: [{
        label: 'Valores (R$)',
        data: [
          orcamentoTotal,
          orcamentoRealizado,
          orcamentoRestante > 0 ? orcamentoRestante : 0
        ],
        backgroundColor: ['#3498db', '#9b59b6', '#f39c12'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Orçamento Anual: Realizado vs. Orçado'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}




// --- MÓDULO CALENDÁRIO ---
let calendar; // Variável global para a instância do calendário
async function inicializarCalendario() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.error("Elemento do calendário não encontrado.");
    return;
  }

  if (calendar) {
    calendar.destroy(); // Destroi a instância anterior se existir
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br', // Define o idioma para português do Brasil
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: async function (fetchInfo, successCallback, failureCallback) {
      try {
        // Fetch de Tarefas
        const resTarefas = await fetch("http://localhost:3000/tarefas", { headers: { Authorization: `Bearer ${token}` } });
        const dataTarefas = await resTarefas.json();
        let events = [];
        if (dataTarefas.status && Array.isArray(dataTarefas.tarefas)) {
          events = events.concat(dataTarefas.tarefas.map(t => ({
            title: t.tituloTarefa,
            start: t.dataInicio,
            end: t.dataFim,
            color: '#3498db', // Cor para tarefas
            extendedProps: {
              type: 'tarefa',
              id: t.idTarefa,
              descricao: t.descricaoTarefa,
              prioridade: t.prioridadeTarefa
            }
          })));
        }

        // Fetch de Lançamentos
        const resLancamentos = await fetch("http://localhost:3000/lancamentos", { headers: { Authorization: `Bearer ${token}` } });
        const dataLancamentos = await resLancamentos.json();
        if (dataLancamentos.status && Array.isArray(dataLancamentos.lancamentos)) {
          events = events.concat(dataLancamentos.lancamentos.map(l => ({
            title: `${l.tipo} R$ ${parseFloat(l.valor).toFixed(2)} - ${l.descricao}`,
            start: l.dataLancamento,
            allDay: true, // Lançamentos geralmente são eventos de um dia inteiro
            color: l.tipo === 'Receita' ? '#2ecc71' : '#e74c3c', // Verde para receita, Vermelho para despesa
            extendedProps: {
              type: 'lancamento',
              id: l.idLancamento,
              categoria: l.idCategoria,
              valor: l.valor,
              tipo: l.tipo
            }
          })));
        }
        successCallback(events);
      } catch (error) {
        console.error("Erro ao carregar eventos do calendário:", error);
        failureCallback(error);
      }
    },
    eventClick: function (info) {
      // Exibe informações do evento clicado
      const event = info.event;
      let details = `
        <strong>${event.title}</strong><br>
        Tipo: ${event.extendedProps.type === 'tarefa' ? 'Tarefa' : 'Lançamento'}<br>
      `;
      if (event.extendedProps.type === 'tarefa') {
        details += `
          Descrição: ${event.extendedProps.descricao || 'N/A'}<br>
          Prioridade: ${event.extendedProps.prioridade || 'N/A'}<br>
          Início: ${event.start ? event.start.toLocaleDateString() : 'N/A'}<br>
          Fim: ${event.end ? event.end.toLocaleDateString() : 'N/A'}<br>
        `;
      } else if (event.extendedProps.type === 'lancamento') {
        details += `
          Valor: R$ ${parseFloat(event.extendedProps.valor).toFixed(2)}<br>
          Categoria ID: ${event.extendedProps.categoria || 'N/A'}<br>
          Data: ${event.start ? event.start.toLocaleDateString() : 'N/A'}<br>
        `;
      }
      alert(details);
    }
  });
  calendar.render();
}

// --- MÓDULO LANÇAMENTOS ---
async function carregarLancamentos() {
  const corpoTabela = document.getElementById("tabelaLancamentosCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaLancamentosCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/lancamentos", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao carregar lançamentos: ${res.statusText}`);
    const data = await res.json();
    if (data.status && Array.isArray(data.lancamentos)) {
      preencherTabelaLancamentos(data.lancamentos);
    } else {
      console.error("Dados de lançamentos inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar lançamentos ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar lançamentos:", error);
    corpoTabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar lançamentos.</td></tr>";
  }
}

function preencherTabelaLancamentos(lancamentos) {
  const corpoTabela = document.getElementById("tabelaLancamentosCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (lancamentos.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='7'>Nenhum lançamento encontrado.</td></tr>";
    return;
  }
  lancamentos.forEach(l => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = l.idLancamento;
    row.insertCell(1).textContent = l.descricao;
    row.insertCell(2).textContent = l.tipo;
    row.insertCell(3).textContent = parseFloat(l.valor).toFixed(2);
    row.insertCell(4).textContent = new Date(l.dataLancamento).toLocaleDateString();
    row.insertCell(5).textContent = l.idCategoria;
    const acoesCell = row.insertCell(6);
    acoesCell.innerHTML = `
            <button class="btn btn-editar" onclick="abrirModalEdicaoLancamento(${l.idLancamento})">Editar</button>
            <button class="btn btn-excluir" onclick="confirmarExclusaoLancamento(${l.idLancamento})">Excluir</button>
        `;
  });
}

function abrirModalNovoLancamento() {
  const modal = document.getElementById("modalLancamento");
  document.getElementById("modalTituloLancamento").textContent = "Novo Lançamento";
  document.getElementById("txtIdLancamentoModal").value = "";
  document.getElementById("txtDescricaoLancamentoModal").value = "";
  document.getElementById("selectTipoLancamentoModal").value = "Receita";
  document.getElementById("txtValorLancamentoModal").value = "";
  document.getElementById("txtDataLancamentoModal").value = "";
  document.getElementById("txtIdCategoriaLancamentoModal").value = "";
  document.getElementById("txtDataPagamentoLancamentoModal").value = ""; // Adicionado
  document.getElementById("selectStatusLancamentoModal").value = "Em aberto"; // Adicionado
  document.getElementById("txtIdSubcategoriaLancamentoModal").value = ""; // Adicionado
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoLancamento(idLancamento) {
  const modal = document.getElementById("modalLancamento");
  document.getElementById("modalTituloLancamento").textContent = `Editar Lançamento ${idLancamento}`;
  try {
    const res = await fetch(`http://localhost:3000/lancamentos/${idLancamento}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao buscar detalhes do lançamento: ${res.statusText}`);
    const data = await res.json();
    if (data.status && data.lancamento) {
      const l = data.lancamento;
      document.getElementById("txtIdLancamentoModal").value = l.idLancamento;
      document.getElementById("txtDescricaoLancamentoModal").value = l.descricao;
      document.getElementById("selectTipoLancamentoModal").value = l.tipo;
      document.getElementById("txtValorLancamentoModal").value = parseFloat(l.valor).toFixed(2);
      document.getElementById("txtDataLancamentoModal").value = l.dataLancamento ? new Date(l.dataLancamento).toISOString().split('T')[0] : '';
      document.getElementById("txtIdCategoriaLancamentoModal").value = l.idCategoria;
      document.getElementById("txtDataPagamentoLancamentoModal").value = l.dataPagamento ? new Date(l.dataPagamento).toISOString().split('T')[0] : ''; // Adicionado
      document.getElementById("selectStatusLancamentoModal").value = l.statusLancamento; // Adicionado
      document.getElementById("txtIdSubcategoriaLancamentoModal").value = l.idSubcategoria || ''; // Adicionado
      modal.classList.remove('oculto');
    } else {
      alert("Lançamento não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes do lançamento:", error);
    alert("Erro ao carregar detalhes do lançamento.");
  }
}

async function salvarLancamento() {
  const id = document.getElementById("txtIdLancamentoModal").value;
  const descricao = document.getElementById("txtDescricaoLancamentoModal").value;
  const tipo = document.getElementById("selectTipoLancamentoModal").value;
  const valor = document.getElementById("txtValorLancamentoModal").value;
  const dataLancamento = document.getElementById("txtDataLancamentoModal").value;
  const idCategoria = document.getElementById("txtIdCategoriaLancamentoModal").value;
  const dataPagamento = document.getElementById("txtDataPagamentoLancamentoModal").value; // Adicionado
  const statusLancamento = document.getElementById("selectStatusLancamentoModal").value; // Adicionado
  const idSubcategoria = document.getElementById("txtIdSubcategoriaLancamentoModal").value; // Adicionado

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/lancamentos/${id}` : "http://localhost:3000/lancamentos";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        descricao: descricao,
        tipo: tipo,
        valor: parseFloat(valor),
        dataLancamento: dataLancamento,
        idCategoria: idCategoria,
        dataPagamento: dataPagamento, // Adicionado
        statusLancamento: statusLancamento, // Adicionado
        idSubcategoria: idSubcategoria || null // Adicionado, use null se vazio
      })
    });
    await handleResponse(res, id ? "Lançamento atualizado" : "Lançamento criado", id ? "Erro ao atualizar lançamento" : "Erro ao criar lançamento", "respostaLancamento");
    fecharModal('modalLancamento');
    carregarLancamentos();
  } catch (error) {
    console.error('Erro ao salvar lançamento:', error);
  }
}

async function excluirLancamento(id) {
  try {
    const res = await fetch(`http://localhost:3000/lancamentos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Lançamento excluído", "Erro ao excluir lançamento", "respostaGeral");
    carregarLancamentos();
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error);
  }
}

// --- MÓDULO EXTRATOS ---
async function carregarExtratos() {
  const corpoTabela = document.getElementById("tabelaExtratosCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaExtratosCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/extratos", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao carregar extratos: ${res.statusText}`);
    const data = await res.json();
    if (data.status && Array.isArray(data.extratos)) {
      preencherTabelaExtratos(data.extratos);
    } else {
      console.error("Dados de extratos inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar extratos ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar extratos:", error);
    corpoTabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar extratos.</td></tr>";
  }
}

function preencherTabelaExtratos(extratos) {
  const corpoTabela = document.getElementById("tabelaExtratosCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (extratos.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='7'>Nenhum extrato encontrado.</td></tr>";
    return;
  }
  extratos.forEach(e => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = e.idExtrato;
    row.insertCell(1).textContent = new Date(e.dataExtrato).toLocaleDateString();
    row.insertCell(2).textContent = e.descricaoExtrato;
    row.insertCell(3).textContent = e.tipoExtrato;
    row.insertCell(4).textContent = parseFloat(e.valorExtrato).toFixed(2);
    row.insertCell(5).textContent = parseFloat(e.saldoResultante).toFixed(2);
    const acoesCell = row.insertCell(6);
    acoesCell.innerHTML = `
            <button class="btn btn-editar" onclick="abrirModalEdicaoExtrato(${e.idExtrato})">Editar</button>
            <button class="btn btn-excluir" onclick="confirmarExclusaoExtrato(${e.idExtrato})">Excluir</button>
        `;
  });
}

function abrirModalNovoExtrato() {
  const modal = document.getElementById("modalExtrato");
  document.getElementById("modalTituloExtrato").textContent = "Novo Extrato";
  document.getElementById("txtIdExtratoModal").value = "";
  document.getElementById("txtDataExtratoModal").value = "";
  document.getElementById("txtDescricaoExtratoModal").value = "";
  document.getElementById("selectTipoExtratoModal").value = "Entrada";
  document.getElementById("txtValorExtratoModal").value = "";
  document.getElementById("txtSaldoExtratoModal").value = "";
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoExtrato(idExtrato) {
  const modal = document.getElementById("modalExtrato");
  document.getElementById("modalTituloExtrato").textContent = `Editar Extrato ${idExtrato}`;
  try {
    const res = await fetch(`http://localhost:3000/extratos/${idExtrato}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao buscar detalhes do extrato: ${res.statusText}`);
    const data = await res.json();
    if (data.status && data.extrato) {
      const e = data.extrato;
      document.getElementById("txtIdExtratoModal").value = e.idExtrato;
      document.getElementById("txtDataExtratoModal").value = e.dataExtrato ? new Date(e.dataExtrato).toISOString().split('T')[0] : '';
      document.getElementById("txtDescricaoExtratoModal").value = e.descricaoExtrato;
      document.getElementById("selectTipoExtratoModal").value = e.tipoExtrato;
      document.getElementById("txtValorExtratoModal").value = parseFloat(e.valorExtrato).toFixed(2);
      document.getElementById("txtSaldoExtratoModal").value = parseFloat(e.saldoResultante).toFixed(2);
      modal.classList.remove('oculto');
    } else {
      alert("Extrato não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes do extrato:", error);
    alert("Erro ao carregar detalhes do extrato.");
  }
}

async function salvarExtrato() {
  const id = document.getElementById("txtIdExtratoModal").value;
  const dataExtrato = document.getElementById("txtDataExtratoModal").value;
  const descricaoExtrato = document.getElementById("txtDescricaoExtratoModal").value;
  const tipoExtrato = document.getElementById("selectTipoExtratoModal").value;
  const valorExtrato = document.getElementById("txtValorExtratoModal").value;
  const saldoResultante = document.getElementById("txtSaldoExtratoModal").value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/extratos/${id}` : "http://localhost:3000/extratos";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        dataExtrato: dataExtrato,
        descricaoExtrato: descricaoExtrato,
        tipoExtrato: tipoExtrato,
        valorExtrato: parseFloat(valorExtrato),
        saldoResultante: parseFloat(saldoResultante)
      })
    });
    await handleResponse(res, id ? "Extrato atualizado" : "Extrato criado", id ? "Erro ao atualizar extrato" : "Erro ao criar extrato", "respostaExtrato");
    fecharModal('modalExtrato');
    carregarExtratos();
  } catch (error) {
    console.error('Erro ao salvar extrato:', error);
  }
}

async function excluirExtrato(id) {
  try {
    const res = await fetch(`http://localhost:3000/extratos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Extrato excluído", "Erro ao excluir extrato", "respostaGeral");
    carregarExtratos();
  } catch (error) {
    console.error('Erro ao excluir extrato:', error);
  }
}


// --- MÓDULO ÍNDICES ---
async function carregarIndices() {
  const corpoTabela = document.getElementById("tabelaIndicesCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaIndicesCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/indices", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao carregar índices: ${res.statusText}`);
    const data = await res.json();
    if (data.status && Array.isArray(data.indices)) {
      preencherTabelaIndices(data.indices);
    } else {
      console.error("Dados de índices inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar índices ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar índices:", error);
    corpoTabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar índices.</td></tr>";
  }
}

function preencherTabelaIndices(indices) {
  const corpoTabela = document.getElementById("tabelaIndicesCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (indices.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='5'>Nenhum índice encontrado.</td></tr>";
    return;
  }
  indices.forEach(i => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = i.idIndice;
    row.insertCell(1).textContent = i.nomeIndice;
    row.insertCell(2).textContent = parseFloat(i.valorIndice).toFixed(4);
    row.insertCell(3).textContent = new Date(i.dataIndice).toLocaleDateString();
    const acoesCell = row.insertCell(4);
    acoesCell.innerHTML = `
            <button class="btn btn-editar" onclick="abrirModalEdicaoIndice(${i.idIndice})">Editar</button>
            <button class="btn btn-excluir" onclick="confirmarExclusaoIndice(${i.idIndice})">Excluir</button>
        `;
  });
}

function abrirModalNovoIndice() {
  const modal = document.getElementById("modalIndice");
  document.getElementById("modalTituloIndice").textContent = "Novo Índice Financeiro";
  document.getElementById("txtIdIndiceModal").value = "";
  document.getElementById("txtNomeIndiceModal").value = "";
  document.getElementById("txtValorIndiceModal").value = "";
  document.getElementById("txtDataIndiceModal").value = "";
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoIndice(idIndice) {
  const modal = document.getElementById("modalIndice");
  document.getElementById("modalTituloIndice").textContent = `Editar Índice ${idIndice}`;
  try {
    const res = await fetch(`http://localhost:3000/indices/${idIndice}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao buscar detalhes do índice: ${res.statusText}`);
    const data = await res.json();
    if (data.status && data.indice) {
      const i = data.indice;
      document.getElementById("txtIdIndiceModal").value = i.idIndice;
      document.getElementById("txtNomeIndiceModal").value = i.nomeIndice;
      document.getElementById("txtValorIndiceModal").value = parseFloat(i.valorIndice).toFixed(4);
      document.getElementById("txtDataIndiceModal").value = i.dataIndice ? new Date(i.dataIndice).toISOString().split('T')[0] : '';
      modal.classList.remove('oculto');
    } else {
      alert("Índice não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes do índice:", error);
    alert("Erro ao carregar detalhes do índice.");
  }
}

async function salvarIndice() {
  const id = document.getElementById("txtIdIndiceModal").value;
  const nome = document.getElementById("txtNomeIndiceModal").value;
  const valor = document.getElementById("txtValorIndiceModal").value;
  const data = document.getElementById("txtDataIndiceModal").value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/indices/${id}` : "http://localhost:3000/indices";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nomeIndice: nome, valorIndice: parseFloat(valor), dataIndice: data })
    });
    await handleResponse(res, id ? "Índice atualizado" : "Índice criado", id ? "Erro ao atualizar índice" : "Erro ao criar índice", "respostaIndice");
    fecharModal('modalIndice');
    carregarIndices();
  } catch (error) {
    console.error('Erro ao salvar índice:', error);
  }
}

async function excluirIndice(id) {
  try {
    const res = await fetch(`http://localhost:3000/indices/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Índice excluído", "Erro ao excluir índice", "respostaGeral");
    carregarIndices();
  } catch (error) {
    console.error('Erro ao excluir índice:', error);
  }
}

// --- MÓDULO PRODUTOS ---
async function carregarProdutos() {
  const corpoTabela = document.getElementById("tabelaProdutosCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaProdutosCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/produtos", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao carregar produtos: ${res.statusText}`);
    const data = await res.json();
    if (data.status && Array.isArray(data.produtos)) {
      preencherTabelaProdutos(data.produtos);
    } else {
      console.error("Dados de produtos inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar produtos ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar produtos.</td></tr>";
  }
}

function preencherTabelaProdutos(produtos) {
  const corpoTabela = document.getElementById("tabelaProdutosCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (produtos.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='6'>Nenhum produto encontrado.</td></tr>";
    return;
  }
  produtos.forEach(p => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = p.idProduto;
    row.insertCell(1).textContent = p.nomeProduto;
    row.insertCell(2).textContent = p.descricaoProduto;
    row.insertCell(3).textContent = parseFloat(p.precoProduto).toFixed(2);
    row.insertCell(4).textContent = p.estoqueProduto;
    const acoesCell = row.insertCell(5);
    acoesCell.innerHTML = `
            <button class="btn btn-editar" onclick="abrirModalEdicaoProduto(${p.idProduto})">Editar</button>
            <button class="btn btn-excluir" onclick="confirmarExclusaoProduto(${p.idProduto})">Excluir</button>
        `;
  });
}

function abrirModalNovoProduto() {
  const modal = document.getElementById("modalProduto");
  document.getElementById("modalTituloProduto").textContent = "Novo Produto/Serviço";
  document.getElementById("txtIdProdutoModal").value = "";
  document.getElementById("txtNomeProdutoModal").value = "";
  document.getElementById("txtDescricaoProdutoModal").value = "";
  document.getElementById("txtPrecoProdutoModal").value = "";
  document.getElementById("txtEstoqueProdutoModal").value = "";
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoProduto(idProduto) {
  const modal = document.getElementById("modalProduto");
  document.getElementById("modalTituloProduto").textContent = `Editar Produto ${idProduto}`;
  try {
    const res = await fetch(`http://localhost:3000/produtos/${idProduto}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao buscar detalhes do produto: ${res.statusText}`);
    const data = await res.json();
    if (data.status && data.produto) {
      const p = data.produto;
      document.getElementById("txtIdProdutoModal").value = p.idProduto;
      document.getElementById("txtNomeProdutoModal").value = p.nomeProduto;
      document.getElementById("txtDescricaoProdutoModal").value = p.descricaoProduto;
      document.getElementById("txtPrecoProdutoModal").value = parseFloat(p.precoProduto).toFixed(2);
      document.getElementById("txtEstoqueProdutoModal").value = p.estoqueProduto;
      modal.classList.remove('oculto');
    } else {
      alert("Produto não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes do produto:", error);
    alert("Erro ao carregar detalhes do produto.");
  }
}

async function salvarProduto() {
  const id = document.getElementById("txtIdProdutoModal").value;
  const nome = document.getElementById("txtNomeProdutoModal").value;
  const descricao = document.getElementById("txtDescricaoProdutoModal").value;
  const preco = document.getElementById("txtPrecoProdutoModal").value;
  const estoque = document.getElementById("txtEstoqueProdutoModal").value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/produtos/${id}` : "http://localhost:3000/produtos";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nomeProduto: nome, descricaoProduto: descricao, precoProduto: parseFloat(preco), estoqueProduto: parseInt(estoque) })
    });
    await handleResponse(res, id ? "Produto atualizado" : "Produto criado", id ? "Erro ao atualizar produto" : "Erro ao criar produto", "respostaProduto");
    fecharModal('modalProduto');
    carregarProdutos();
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
  }
}

async function excluirProduto(id) {
  try {
    const res = await fetch(`http://localhost:3000/produtos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Produto excluído", "Erro ao excluir produto", "respostaGeral");
    carregarProdutos();
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
  }
}

// --- MÓDULO PERFIL ---
async function carregarPerfil() {
  const userId = "seuIdDeUsuario"; // Substitua pelo ID do usuário logado, se disponível no token ou sessionStorage/localStorage
  try {
    const res = await fetch(`http://localhost:3000/usuarios/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao carregar perfil: ${res.statusText}`);
    const data = await res.json();
    if (data.status && data.usuario) {
      document.getElementById("perfilNome").textContent = data.usuario.nomeUsuario;
      document.getElementById("perfilEmail").textContent = data.usuario.emailUsuario;
      document.getElementById("perfilId").textContent = data.usuario.idUsuario;
    } else {
      console.error("Dados de perfil inválidos:", data);
      document.getElementById("perfilNome").textContent = "N/A";
      document.getElementById("perfilEmail").textContent = "N/A";
      document.getElementById("perfilId").textContent = "N/A";
    }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    document.getElementById("perfilNome").textContent = "Erro";
    document.getElementById("perfilEmail").textContent = "Erro";
    document.getElementById("perfilId").textContent = "Erro";
  }
}

function abrirModalEdicaoPerfil() {
  const modal = document.getElementById("modalPerfil");
  // Preencher os campos com os dados atuais do perfil antes de abrir
  document.getElementById("txtIdPerfilModal").value = document.getElementById("perfilId").textContent;
  document.getElementById("txtNomePerfilModal").value = document.getElementById("perfilNome").textContent;
  document.getElementById("txtEmailPerfilModal").value = document.getElementById("perfilEmail").textContent;
  modal.classList.remove("oculto");
}

async function salvarPerfil() {
  const id = document.getElementById("txtIdPerfilModal").value;
  const nome = document.getElementById("txtNomePerfilModal").value;
  const email = document.getElementById("txtEmailPerfilModal").value;

  try {
    const res = await fetch(`http://localhost:3000/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nomeUsuario: nome, emailUsuario: email })
    });
    await handleResponse(res, "Perfil atualizado", "Erro ao atualizar perfil", "respostaGeral");
    fecharModal('modalPerfil');
    carregarPerfil(); // Recarregar dados do perfil para refletir as mudanças
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
  }
}
// --- MÓDULO ORÇAMENTOS ANUAIS ---
async function carregarOrcAnuais() {
  const corpoTabela = document.getElementById("tabelaOrcamentosAnuaisCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaOrcamentosAnuaisCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/orcamentosanuais", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Erro ao carregar orçamentos anuais: ${res.statusText}`);

    const data = await res.json();
    const orcamentos = data.orcamentosAnuais || data.orcamentos;

    if (data.status && Array.isArray(orcamentos)) {
      preencherTabelaOrcAnuais(orcamentos);
    } else {
      console.error("Dados de orçamentos anuais inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar orçamentos anuais ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar orçamentos anuais:", error);
    corpoTabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar orçamentos anuais.</td></tr>";
  }
}

function preencherTabelaOrcAnuais(orcamentos) {
  const corpoTabela = document.getElementById("tabelaOrcamentosAnuaisCorpo");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";
  if (orcamentos.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='5'>Nenhum orçamento anual encontrado.</td></tr>";
    return;
  }
  orcamentos.forEach(o => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = o.idOrcamentoAnual;
    row.insertCell(1).textContent = o.anoOrcamentoAnual;
    row.insertCell(2).textContent = parseFloat(o.valorOrcamentoAnual).toFixed(2);
    row.insertCell(3).textContent = o.idCategoria;
    const acoesCell = row.insertCell(4);
    acoesCell.innerHTML = `
      <button class="btn btn-editar" onclick="abrirModalEdicaoOrcAnual(${o.idOrcamentoAnual})">Editar</button>
      <button class="btn btn-excluir" onclick="confirmarExclusaoOrcAnual(${o.idOrcamentoAnual})">Excluir</button>
    `;
  });
}

function cadastrarOrcAnual(event) {
  event.preventDefault();

  const valor = document.getElementById("txtValorOrcamentoAnualModal").value;
  const ano = document.getElementById("txtAnoOrcamentoAnualModal").value;
  const idCategoria = document.getElementById("txtIdCategoriaOrcAnualModal").value;
  const token = localStorage.getItem("token");

  const dados = {
    valorOrcamentoAnual: parseFloat(valor),
    anoOrcamentoAnual: parseInt(ano),
    idCategoria: parseInt(idCategoria)
  };

  fetch("http://localhost:3000/orcamentosanuais", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(dados)
  })
    .then(response => response.json())
    .then(resposta => {
      if (resposta.status) {
        alert("Orçamento Anual cadastrado com sucesso!");
        fecharModal("modalOrcamentoAnual");
        carregarOrcAnuais();
      } else {
        alert("Erro ao cadastrar Orçamento Anual: " + resposta.message);
      }
    })
    .catch(error => {
      console.error("Erro ao enviar Orçamento Anual:", error);
      alert("Erro ao cadastrar Orçamento Anual.");
    });
}



function abrirModalNovoOrcamentoAnual() {
  const titulo = document.getElementById("tituloModalOrcAnual");
  if (titulo) {
    titulo.textContent = "Novo Orçamento Anual";
  } else {
    console.warn("Elemento #tituloModalOrcAnual não encontrado!");
  }

  const campoValor = document.getElementById("txtValorOrcamentoAnualModal");
  const campoAno = document.getElementById("txtAnoOrcamentoAnualModal");
  const campoCategoria = document.getElementById("txtIdCategoriaOrcAnualModal");

  if (campoValor && campoAno && campoCategoria) {
    campoValor.value = "";
    campoAno.value = "";
    campoCategoria.value = "";
    abrirModal("modalOrcamentoAnual");
  } else {
    console.warn("Campos do modal orçamento anual não encontrados.");
  }
}

function abrirModalNovoOrcamentoAnual() {
  const modal = document.getElementById("modalOrcamentoAnual");
  document.getElementById("tituloModalOrcAnual").textContent = "Novo Orçamento Anual";
  // Resetar campos
  document.getElementById("txtIdOrcamentoAnualModal").value = "";
  document.getElementById("txtValorOrcamentoAnualModal").value = "";
  document.getElementById("txtAnoOrcamentoAnualModal").value = "";
  document.getElementById("txtIdCategoriaOrcAnualModal").value = "";
  modal.classList.remove("oculto");
}

// Abrir modal para editar orçamento anual
async function abrirModalEdicaoOrcAnual(id) {
  const modal = document.getElementById("modalOrcamentoAnual");
  document.getElementById("tituloModalOrcAnual").textContent = `Editar Orçamento Anual ${id}`;

  try {
    const res = await fetch(`http://localhost:3000/orcamentosanuais/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Erro ao carregar dados");
    const data = await res.json();

    if (data.status && data.orcamentoAnual) {
      const o = data.orcamentoAnual;
      document.getElementById("txtIdOrcamentoAnualModal").value = o.idOrcamentoAnual;
      document.getElementById("txtValorOrcamentoAnualModal").value = o.valorOrcamentoAnual;
      document.getElementById("txtAnoOrcamentoAnualModal").value = o.anoOrcamentoAnual;
      document.getElementById("txtIdCategoriaOrcAnualModal").value = o.idCategoria;
      modal.classList.remove("oculto");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao carregar orçamento");
  }
}

async function salvarOrcAnual() {
  const id = document.getElementById("txtIdOrcamentoAnualModal").value;
  const valor = document.getElementById("txtValorOrcamentoAnualModal").value;
  const ano = document.getElementById("txtAnoOrcamentoAnualModal").value;
  const idCategoria = document.getElementById("txtIdCategoriaOrcAnualModal").value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/orcamentosanuais/${id}` : "http://localhost:3000/orcamentosanuais";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        valorOrcamentoAnual: parseFloat(valor),
        anoOrcamentoAnual: parseInt(ano),
        idCategoria: parseInt(idCategoria)
      })
    });
    await handleResponse(res, id ? "Orçamento atualizado" : "Orçamento criado", "Erro ao salvar orçamento", "respostaOrcamentoAnual");
    fecharModal('modalOrcamentoAnual');
    carregarOrcAnuais();
  } catch (error) {
    console.error('Erro ao salvar orçamento anual:', error);
  }
}

async function excluirOrcAnual(id) {
  try {
    const res = await fetch(`http://localhost:3000/orcamentosanuais/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Orçamento Anual excluído", "Erro ao excluir orçamento anual", "respostaOrcamentoAnual");
    carregarOrcAnuais();
  } catch (error) {
    console.error('Erro ao excluir orçamento anual:', error);
  }
}

// --- MÓDULO ORÇAMENTOS TRIMESTRAIS ---
// --- MÓDULO ORÇAMENTOS TRIMESTRAIS ---
async function carregarOrcTri() {
  const corpoTabela = document.getElementById("tabelaOrcamentosTrimestraisCorpo");
  if (!corpoTabela) {
    console.error("Erro: Elemento com ID 'tabelaOrcamentosTrimestraisCorpo' não encontrado no HTML.");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/orcamentostri", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Erro ao carregar orçamentos trimestrais: ${res.statusText}`);

    const data = await res.json();
    const orcamentos = data.orcamentosTrimestrais || data.orcamentos;

    if (data.status && Array.isArray(orcamentos)) {
      preencherTabelaOrcTri(orcamentos);
    } else {
      console.error("Dados de orçamentos trimestrais inválidos:", data);
      corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar orçamentos trimestrais ou nenhum dado.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar orçamentos trimestrais:", error);
    corpoTabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar orçamentos trimestrais.</td></tr>";
  }
}

function preencherTabelaOrcTri(orcamentos) {
  const corpoTabela = document.getElementById("tabelaOrcamentosTrimestraisCorpo");
  corpoTabela.innerHTML = "";

  orcamentos.forEach(o => {
    const row = corpoTabela.insertRow();
    row.insertCell(0).textContent = o.idOrcamentoTri;
    row.insertCell(1).textContent = o.anoOrcamentoTri;
    row.insertCell(2).textContent = o.trimestreOrcamentoTri;

    // Corrigido: Converter para número antes de usar toFixed()
    const valor = parseFloat(o.valorOrcamentoTri) || 0;
    row.insertCell(3).textContent = valor.toFixed(2);

    row.insertCell(4).textContent = o.idCategoria;

    const acoesCell = row.insertCell(5);
    acoesCell.innerHTML = `
      <button class="btn btn-editar" onclick="abrirModalEdicaoOrcTri(${o.idOrcamentoTri})">Editar</button>
      <button class="btn btn-excluir" onclick="confirmarExclusaoOrcTri(${o.idOrcamentoTri})">Excluir</button>
    `;
  });
}
function cadastrarOrcTri(event) {
  event.preventDefault();

  const valor = document.getElementById("txtValorOrcamentoTriModal").value;
  const trimestre = document.getElementById("txtTrimestreOrcamentoTriModal").value;
  const idOrcamentoAnual = document.getElementById("txtIdOrcamentoAnualModal").value;
  const idCategoria = document.getElementById("txtIdCategoriaOrcTriModal").value;

  const dados = {
    valorOrcamentoTri: parseFloat(valor),
    trimestreOrcamentoTri: parseInt(trimestre),
    idOrcamentoAnual: parseInt(idOrcamentoAnual),
    idCategoria: parseInt(idCategoria)
  };

  fetch("http://localhost:3000/orcamentostri", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // Adicionado o cabeçalho de autorização
    },
    body: JSON.stringify(dados)
  })
    .then(response => response.json())
    .then(resposta => {
      if (resposta.status) {
        alert("Orçamento Trimestral cadastrado com sucesso!");
        fecharModal("modalOrcamentoTrimestral");
        carregarOrcTri(); // Corrigido o nome da função (era carregarOrcTrimestrais)
      } else {
        alert("Erro ao cadastrar Orçamento Trimestral: " + resposta.message);
      }
    })
    .catch(error => {
      console.error("Erro ao enviar Orçamento Trimestral:", error);
      alert("Erro ao cadastrar Orçamento Trimestral.");
    });
}



function abrirModalNovoOrcamentoTrimestral() {
  const modal = document.getElementById("modalOrcamentoTrimestral");
  document.getElementById("modalTituloOrcamentoTrimestral").textContent = "Novo Orçamento Trimestral";
  document.getElementById("txtIdOrcamentoTrimestralModal").value = "";
  document.getElementById("txtTrimestreOrcamentoTriModal").value = "";
  document.getElementById("txtValorOrcamentoTriModal").value = "";
  document.getElementById("txtIdCategoriaOrcTriModal").value = "";
  modal.classList.remove("oculto");
}

async function abrirModalEdicaoOrcTri(idOrcamentoTrimestral) {
  const modal = document.getElementById("modalOrcamentoTrimestral");
  try {
    const res = await fetch(`http://localhost:3000/orcamentostri/${idOrcamentoTrimestral}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status && data.orcamentoTrimestral) {
        const o = data.orcamentoTrimestral;
        document.getElementById("txtIdOrcamentoTrimestralModal").value = o.idOrcamentoTri;
        document.getElementById("txtTrimestreOrcamentoTriModal").value = o.trimestreOrcamentoTri;
        document.getElementById("txtValorOrcamentoTriModal").value = o.valorOrcamentoTri;
        document.getElementById("txtIdOrcamentoAnualTriModal").value = o.idOrcamentoAnual; // ID ATUALIZADO
        document.getElementById("txtIdCategoriaOrcTriModal").value = o.idCategoria;
        modal.classList.remove('oculto');
      }
    }
  } catch (error) {
    console.error("Erro ao carregar orçamento:", error);
    alert("Erro ao carregar dados do orçamento.");
  }
}

// Na função salvarOrcTri(), atualize os IDs para corresponder ao HTML:
async function salvarOrcTri() {
  const id = document.getElementById("txtIdOrcamentoTrimestralModal").value;
  const valor = document.getElementById("txtValorOrcamentoTriModal").value; // ID corrigido
  const trimestre = document.getElementById("txtTrimestreOrcamentoTriModal").value;
  const idOrcamentoAnual = document.getElementById("txtIdOrcamentoAnualTriModal").value;
  const idCategoria = document.getElementById("txtIdCategoriaOrcTriModal").value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `http://localhost:3000/orcamentostri/${id}` : "http://localhost:3000/orcamentostri";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        valorOrcamentoTri: parseFloat(valor),
        trimestreOrcamentoTri: parseInt(trimestre),
        idOrcamentoAnual: parseInt(idOrcamentoAnual),
        idCategoria: parseInt(idCategoria)
      })
    });
    await handleResponse(res, id ? "Orçamento Trimestral atualizado" : "Orçamento Trimestral criado",
      id ? "Erro ao atualizar orçamento trimestral" : "Erro ao criar orçamento trimestral",
      "respostaOrcamentoTrimestral");
    fecharModal('modalOrcamentoTrimestral');
    carregarOrcTri();
  } catch (error) {
    console.error('Erro ao salvar orçamento trimestral:', error);
  }
}

async function excluirOrcTri(id) {
  try {
    const res = await fetch(`http://localhost:3000/orcamentostri/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await handleResponse(res, "Orçamento Trimestral excluído", "Erro ao excluir orçamento trimestral", "respostaOrcamentoTrimestral");
    carregarOrcTri();
  } catch (error) {
    console.error('Erro ao excluir orçamento trimestral:', error);
  }
}

// Submissão dos Formulários (event listeners)
document.addEventListener("DOMContentLoaded", () => {
  const forms = [
    { id: "formTarefaModal", handler: salvarTarefa },
    { id: "formAtribuicaoModal", handler: salvarAtribuicao },
    { id: "formLancamentoModal", handler: salvarLancamento },
    { id: "formExtratoModal", handler: salvarExtrato },
    { id: "formIndiceModal", handler: salvarIndice },
    { id: "formProdutoModal", handler: salvarProduto },
    { id: "formPerfilModal", handler: salvarPerfil },
    { id: "formOrcamentoAnualModal", handler: salvarOrcAnual },
    { id: "formOrcamentoTrimestralModal", handler: salvarOrcTri }
  ];

  forms.forEach(f => {
    const formElement = document.getElementById(f.id);
    if (formElement) {
      formElement.addEventListener("submit", async (e) => {
        e.preventDefault();
        await f.handler();
      });
    }
  });

  // Adicionar ao final do DOMContentLoaded
  document.getElementById("formOrcamentoAnual").addEventListener("submit", (e) => {
    e.preventDefault();
    salvarOrcAnual();
  });

  

  // Mostra o painel inicial (ex: Visão Financeira) ao carregar a página
  mostrarPainel("visao-financeira");
});


// Funções de confirmação para exclusão (melhorar UX)
function confirmarExclusaoTarefa(id) {
  if (confirm(`Tem certeza que deseja excluir a Tarefa ${id}?`)) {
    excluirTarefa(id);
  }
}

function confirmarExclusaoAtribuicao(tarefaId, usuarioId) {
  if (confirm(`Tem certeza que deseja excluir a Atribuição da Tarefa ${tarefaId} para o Usuário ${usuarioId}?`)) {
    excluirAtribuicao(tarefaId, usuarioId);
  }
}

function confirmarExclusaoLancamento(id) {
  if (confirm(`Tem certeza que deseja excluir o Lançamento ${id}?`)) {
    excluirLancamento(id);
  }
}

function confirmarExclusaoExtrato(id) {
  if (confirm(`Tem certeza que deseja excluir o Extrato ${id}?`)) {
    excluirExtrato(id);
  }
}

function confirmarExclusaoIndice(id) {
  if (confirm(`Tem certeza que deseja excluir o Índice ${id}?`)) {
    excluirIndice(id);
  }
}

function confirmarExclusaoProduto(id) {
  if (confirm(`Tem certeza que deseja excluir o Produto ${id}?`)) {
    excluirProduto(id);
  }
}

function confirmarExclusaoOrcAnual(id) {
  if (confirm(`Tem certeza que deseja excluir o Orçamento Anual ${id}?`)) {
    excluirOrcAnual(id);
  }
}

function confirmarExclusaoOrcTri(id) {
  if (confirm(`Tem certeza que deseja excluir o Orçamento Trimestral ${id}?`)) {
    excluirOrcTri(id);
  }
}