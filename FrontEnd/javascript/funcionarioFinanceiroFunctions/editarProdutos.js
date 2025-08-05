const tabelaProdutosBody = document.getElementById("tabelaProdutos").getElementsByTagName("tbody")[0];
const formEditar = document.getElementById("formEditarProduto");
const formEditarContainer = document.getElementById("formEditarContainer");
const divResposta = document.getElementById("divResposta");

const txtId = document.getElementById("txtId");
const txtNome = document.getElementById("txtNome");
const txtCusto = document.getElementById("txtCusto");
const txtSegmento = document.getElementById("txtSegmento");
const txtSubsegmento = document.getElementById("txtSubsegmento");

window.addEventListener("DOMContentLoaded", () => {
  buscarTodosProdutos();
});

function buscarTodosProdutos() {
  fetch("http://localhost:3000/produtos", {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
  .then(async res => {
    const data = await res.json();
    if (res.ok && data.status) {
      preencherTabela(data.produtos);
    } else {
      mostrarRespostaPopup(data.message || "Erro ao buscar produtos.");
    }
  });
}

function preencherTabela(lista) {
  tabelaProdutosBody.innerHTML = "";

  lista.forEach(p => {
    const tr = document.createElement("tr");

    const btnSelecionar = document.createElement("button");
    btnSelecionar.innerText = "Selecionar";
    btnSelecionar.classList.add("btnSelecionar");
    btnSelecionar.addEventListener("click", () => {
      carregarFormulario(p.idProduto, p.nomeProduto, p.custoProduto, p.idSegmento, p.idSubsegmento);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.appendChild(btnSelecionar);

    tr.innerHTML = `
      <td>${p.idProduto}</td>
      <td>${p.nomeProduto}</td>
      <td>R$ ${parseFloat(p.custoProduto).toFixed(2)}</td>
      <td>${p.idSegmento}</td>
      <td>${p.idSubsegmento}</td>
    `;
    tr.appendChild(tdAcoes);

    tabelaProdutosBody.appendChild(tr);
  });
}

function carregarFormulario(id, nome, custo, segmento, subsegmento) {
  txtId.value = id;
  txtNome.value = nome;
  txtCusto.value = custo;
  txtSegmento.value = segmento;
  txtSubsegmento.value = subsegmento;
  formEditarContainer.classList.remove("oculto");
  window.scrollTo({ top: formEditarContainer.offsetTop, behavior: 'smooth' });
}

formEditar.addEventListener("submit", function(e) {
  e.preventDefault();

  const obj = {
    nomeProduto: txtNome.value.trim(),
    custoProduto: parseFloat(txtCusto.value),
    idSegmento: parseInt(txtSegmento.value),
    idSubsegmento: parseInt(txtSubsegmento.value)
  };

  const id = parseInt(txtId.value);

  fetch(`http://localhost:3000/produtos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
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
      buscarTodosProdutos();
    } else {
      mostrarRespostaPopup(data.message || "Erro ao atualizar produto.");
    }
  });
});

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.classList.remove("sucesso", "erro");
  divResposta.classList.add(sucesso ? "sucesso" : "erro");
  divResposta.style.display = "block";
  setTimeout(() => {
    divResposta.style.display = "none";
  }, 5000);
}
