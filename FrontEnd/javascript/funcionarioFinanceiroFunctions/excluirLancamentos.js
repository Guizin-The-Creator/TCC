const tabelaLancamentosBody = document.getElementById("tabelaLancamentos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

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
  })
  .catch(err => {
    mostrarRespostaPopup("Erro inesperado: " + err.message);
  });
}

function preencherTabela(lista) {
  tabelaLancamentosBody.innerHTML = "";

  lista.forEach(l => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${l.idLancamento}</td>
      <td>${formatarData(l.vencimentoLancamento)}</td>
      <td>R$ ${parseFloat(l.valorLancamento).toFixed(2)}</td>
      <td>${l.classificacaoLancamento}</td>
      <td>${formatarData(l.pagamentoLancamento)}</td>
      <td>${l.statusLancamento}</td>
      <td>${l.idCategoria}</td>
      <td>${l.idSubcategoria}</td>
      <td><button onclick="confirmarExclusao(${l.idLancamento})">Excluir</button></td>
    `;

    tabelaLancamentosBody.appendChild(tr);
  });
}

function confirmarExclusao(id) {
  const confirmar = window.confirm(`Deseja realmente excluir o lançamento de ID ${id}?`);
  if (!confirmar) return;

  fetch(`http://localhost:3000/lancamentos/${id}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
  .then(async res => {
    const data = await res.json();
    if (res.ok && data.status) {
      mostrarRespostaPopup(data.message, true);
      buscarTodosLancamentos();
    } else {
      mostrarRespostaPopup(data.message || "Erro ao excluir lançamento.");
    }
  });
}

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
