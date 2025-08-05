const tabelaProdutosBody = document.getElementById("tabelaProdutos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
  buscarTodosProdutos();
});

function buscarTodosProdutos() {
  fetch("http://localhost:3000/produtos", {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    }
  })
  .then(async res => {
    const data = await res.json();
    if (res.ok && data.status) {
      preencherTabela(data.produtos);
    } else {
      mostrarRespostaPopup(data.message || "Erro ao buscar produtos.");
    }
  })
  .catch(err => {
    mostrarRespostaPopup("Erro inesperado: " + err.message);
  });
}

function preencherTabela(lista) {
  tabelaProdutosBody.innerHTML = "";

  lista.forEach(p => {
    const custo = parseFloat(p.custoProduto);
    const custoFormatado = isNaN(custo) ? "-" : `R$ ${custo.toFixed(2)}`;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.idProduto}</td>
      <td>${p.nomeProduto}</td>
      <td>${custoFormatado}</td>
      <td>${p.idSegmento}</td>
      <td>${p.idSubsegmento}</td>
      <td><button onclick="confirmarExclusao(${p.idProduto})">Excluir</button></td>
    `;

    tabelaProdutosBody.appendChild(tr);
  });
}

function confirmarExclusao(id) {
  const confirmar = window.confirm(`Deseja realmente excluir o produto de ID ${id}?`);
  if (!confirmar) return;

  fetch(`http://localhost:3000/produtos/${id}`, {
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
      buscarTodosProdutos();
    } else {
      mostrarRespostaPopup(data.message || "Erro ao excluir produto.");
    }
  });
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
