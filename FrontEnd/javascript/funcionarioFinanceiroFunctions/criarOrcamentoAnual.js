const formCriar = document.getElementById("formCriarOrcamento");
const txtValor = document.getElementById("txtValor");
const txtAno = document.getElementById("txtAno");
const txtCategoria = document.getElementById("txtCategoria");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function(e) {
    e.preventDefault();
    esconderRespostaPopup();

    const valor = parseFloat(txtValor.value);
    const ano = parseInt(txtAno.value);
    const idCategoria = parseInt(txtCategoria.value);

    if (isNaN(valor) || valor <= 0) {
        mostrarRespostaPopup("Valor do orçamento inválido.");
        return;
    }
    if (isNaN(ano) || ano < 2000 || ano > 2100) {
        mostrarRespostaPopup("Ano inválido.");
        return;
    }
    if (isNaN(idCategoria) || idCategoria < 1) {
        mostrarRespostaPopup("ID de categoria inválido.");
        return;
    }

    const obj = {
        valorOrcamentoAnual: valor,
        anoOrcamentoAnual: ano,
        idCategoria: idCategoria
    };

    fetch("http://localhost:3000/orcamentosanuais", {
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
            mostrarRespostaPopup(data.message || "Erro ao criar orçamento.");
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
