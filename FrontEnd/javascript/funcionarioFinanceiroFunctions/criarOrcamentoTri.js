const formCriar = document.getElementById("formCriarOrcamentoTri");
const txtValor = document.getElementById("txtValor");
const txtTrimestre = document.getElementById("txtTrimestre");
const txtAnual = document.getElementById("txtAnual");
const txtCategoria = document.getElementById("txtCategoria");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function(e) {
    e.preventDefault();
    esconderRespostaPopup();

    const valor = parseFloat(txtValor.value);
    const trimestre = parseInt(txtTrimestre.value);
    const idAnual = parseInt(txtAnual.value);
    const idCategoria = parseInt(txtCategoria.value);

    if (isNaN(valor) || valor <= 0) {
        return mostrarRespostaPopup("Valor inválido.");
    }
    if (![1,2,3,4].includes(trimestre)) {
        return mostrarRespostaPopup("Trimestre deve ser 1, 2, 3 ou 4.");
    }
    if (isNaN(idAnual) || idAnual < 1) {
        return mostrarRespostaPopup("ID do orçamento anual inválido.");
    }
    if (isNaN(idCategoria) || idCategoria < 1) {
        return mostrarRespostaPopup("ID de categoria inválido.");
    }

    const obj = {
        valorOrcamentoTri: valor,
        trimestreOrcamentoTri: trimestre,
        idOrcamentoAnual: idAnual,
        idCategoria: idCategoria
    };

    fetch("http://localhost:3000/orcamentostri", {
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
