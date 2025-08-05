const tabelaLancamentos = document.getElementById("tabelaLancamentos").getElementsByTagName("tbody")[0];
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
  tabelaLancamentos.innerHTML = "";

  if (!Array.isArray(lista) || lista.length === 0) {
    mostrarRespostaPopup("Nenhum lançamento encontrado.", "#FFA726");
    return;
  }

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
    `;

    tabelaLancamentos.appendChild(tr);
  });
}

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function mostrarRespostaPopup(mensagem, corFundo = "#f44336") {
  divResposta.innerText = mensagem;
  divResposta.style.backgroundColor = corFundo;
  divResposta.style.display = "block";
  setTimeout(() => {
    divResposta.style.display = "none";
  }, 5000);
}
