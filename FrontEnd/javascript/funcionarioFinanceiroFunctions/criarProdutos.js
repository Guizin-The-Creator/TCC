const formCriar = document.getElementById("formCriarProduto");
const txtNome = document.getElementById("txtNome");
const txtCusto = document.getElementById("txtCusto");
const txtSegmento = document.getElementById("txtSegmento");
const txtSubsegmento = document.getElementById("txtSubsegmento");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function(e) {
  e.preventDefault();
  esconderRespostaPopup();

  const nome = txtNome.value.trim();
  const custo = parseFloat(txtCusto.value);
  const segmento = parseInt(txtSegmento.value);
  const subsegmento = parseInt(txtSubsegmento.value);

  if (nome === "") {
    mostrarRespostaPopup("Nome do produto não pode estar vazio.");
    return;
  }
  if (isNaN(custo) || custo <= 0) {
    mostrarRespostaPopup("Custo do produto inválido.");
    return;
  }
  if (isNaN(segmento) || segmento < 1 || isNaN(subsegmento) || subsegmento < 1) {
    mostrarRespostaPopup("Segmento/Subsegmento inválido.");
    return;
  }

  const obj = {
    nomeProduto: nome,
    custoProduto: custo,
    idSegmento: segmento,
    idSubsegmento: subsegmento
  };

  fetch("http://localhost:3000/produtos", {
    method: "POST",
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
      formCriar.reset();
    } else {
      mostrarRespostaPopup(data.message || "Erro ao criar produto.");
    }
  })
  .catch(err => {
    mostrarRespostaPopup("Erro inesperado: " + err.message);
  });
});

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.classList.remove("sucesso", "erro");
  divResposta.classList.add(sucesso ? "sucesso" : "erro");
  divResposta.style.display = "block";
  setTimeout(() => esconderRespostaPopup(), 5000);
}

function esconderRespostaPopup() {
  divResposta.style.display = "none";
}
