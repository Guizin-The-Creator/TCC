const tabelaLancamentosBody = document.getElementById("tabelaLancamentos").getElementsByTagName("tbody")[0];
const formEditar = document.getElementById("formEditarLancamento");
const formEditarContainer = document.getElementById("formEditarContainer");
const divResposta = document.getElementById("divResposta");

const txtId = document.getElementById("txtId");
const txtVencimento = document.getElementById("txtVencimento");
const txtValor = document.getElementById("txtValor");
const txtClassificacao = document.getElementById("txtClassificacao");
const txtPagamento = document.getElementById("txtPagamento");
const txtStatus = document.getElementById("txtStatus");
const txtCategoria = document.getElementById("txtCategoria");
const txtSubcategoria = document.getElementById("txtSubcategoria");

window.addEventListener("DOMContentLoaded", () => {
  buscarTodosLancamentos();
});

function buscarTodosLancamentos() {
  fetch("http://localhost:3000/lancamentos", {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
  .then(async res => {
    const data = await res.json();
    if (res.ok && data.status) {
      preencherTabela(data.lancamentos);
    } else {
      mostrarRespostaPopup(data.message || "Erro ao buscar lançamentos.");
    }
  });
}

function preencherTabela(lista) {
  tabelaLancamentosBody.innerHTML = "";

  lista.forEach(l => {
    const tr = document.createElement("tr");

    const btnSelecionar = document.createElement("button");
    btnSelecionar.innerText = "Selecionar";
    btnSelecionar.classList.add("btnSelecionar");
    btnSelecionar.addEventListener("click", () => {
      carregarFormulario(
        l.idLancamento,
        l.vencimentoLancamento,
        l.valorLancamento,
        l.classificacaoLancamento,
        l.pagamentoLancamento,
        l.statusLancamento,
        l.idCategoria,
        l.idSubcategoria
      );
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.appendChild(btnSelecionar);

    tr.innerHTML = `
      <td>${l.idLancamento}</td>
      <td>${formatarData(l.vencimentoLancamento)}</td>
      <td>R$ ${parseFloat(l.valorLancamento).toFixed(2)}</td>
      <td>${l.classificacaoLancamento}</td>
      <td>${formatarData(l.pagamentoLancamento)}</td>
      <td>${l.statusLancamento}</td>
      <td>${l.idCategoria}</td>
      <td>${l.idSubcategoria}</td>
    `;
    tr.appendChild(tdAcoes);
    tabelaLancamentosBody.appendChild(tr);
  });
}

function carregarFormulario(id, venc, valor, classif, pagto, status, categoria, subcategoria) {
  txtId.value = id;
  txtVencimento.value = venc.slice(0, 10);
  txtValor.value = valor;
  txtClassificacao.value = classif;
  txtPagamento.value = pagto.slice(0, 10);
  txtStatus.value = status;
  txtCategoria.value = categoria;
  txtSubcategoria.value = subcategoria;
  formEditarContainer.classList.remove("oculto");
  window.scrollTo({ top: formEditarContainer.offsetTop, behavior: 'smooth' });
}

formEditar.addEventListener("submit", function(e) {
  e.preventDefault();

  const id = parseInt(txtId.value);
  const obj = {
    vencimentoLancamento: txtVencimento.value,
    valorLancamento: parseFloat(txtValor.value),
    classificacaoLancamento: txtClassificacao.value,
    pagamentoLancamento: txtPagamento.value,
    statusLancamento: txtStatus.value,
    idCategoria: parseInt(txtCategoria.value),
    idSubcategoria: parseInt(txtSubcategoria.value)
  };

  fetch(`http://localhost:3000/lancamentos/${id}`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(obj)
  })
  .then(async res => {
    const data = await res.json();
    if (res.ok && data.status) {
      mostrarRespostaPopup(data.message, true);
      formEditar.reset();
      formEditarContainer.classList.add("oculto");
      buscarTodosLancamentos();
    } else {
      mostrarRespostaPopup(data.message || "Erro ao atualizar lançamento.");
    }
  });
});

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.classList.remove("sucesso", "erro");
  divResposta.classList.add(sucesso ? "sucesso" : "erro");
  divResposta.style.display = "block";
  setTimeout(() => {
    divResposta.style.display = "none";
  }, 5000);
}
