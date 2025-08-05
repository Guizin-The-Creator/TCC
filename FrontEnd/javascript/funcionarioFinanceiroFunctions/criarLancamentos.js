const formCriar = document.getElementById("formCriarLancamento");
const txtVencimento = document.getElementById("txtVencimento");
const txtValor = document.getElementById("txtValor");
const txtClassificacao = document.getElementById("txtClassificacao");
const txtPagamento = document.getElementById("txtPagamento");
const txtStatus = document.getElementById("txtStatus");
const txtCategoria = document.getElementById("txtCategoria");
const txtSubcategoria = document.getElementById("txtSubcategoria");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function(e) {
  e.preventDefault();
  esconderRespostaPopup();

  const vencimento = txtVencimento.value;
  const pagamento = txtPagamento.value;
  const valor = parseFloat(txtValor.value);
  const classificacao = txtClassificacao.value;
  const status = txtStatus.value;
  const idCategoria = parseInt(txtCategoria.value);
  const idSubcategoria = parseInt(txtSubcategoria.value);

  if (!vencimento || !pagamento || isNaN(valor) || !classificacao || !status || isNaN(idCategoria) || isNaN(idSubcategoria)) {
    mostrarRespostaPopup("Preencha todos os campos corretamente.");
    return;
  }

  const obj = {
    vencimentoLancamento: vencimento,
    valorLancamento: valor,
    classificacaoLancamento: classificacao,
    pagamentoLancamento: pagamento,
    statusLancamento: status,
    idCategoria,
    idSubcategoria
  };

  fetch("http://localhost:3000/lancamentos", {
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
      mostrarRespostaPopup(data.message || "Erro ao criar lançamento.");
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
