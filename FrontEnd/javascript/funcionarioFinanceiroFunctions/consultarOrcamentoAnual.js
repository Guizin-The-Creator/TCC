const tabelaOrcamentos = document.getElementById("tabelaOrcamentos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
    buscarTodosOrcamentos();
});

function buscarTodosOrcamentos() {
    fetch("http://localhost:3000/orcamentosanuais", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.status) {
           
            preencherTabela(data.orcamentos);
        } else {
            mostrarRespostaPopup(data.message || "Erro ao buscar orçamentos.");
        }
    })
    .catch(err => {
        mostrarRespostaPopup("Erro inesperado: " + err.message);
    });
}

function preencherTabela(lista) {
    tabelaOrcamentos.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        mostrarRespostaPopup("Nenhum orçamento anual encontrado.", "#FFA726");
        return;
    }

    lista.forEach(o => {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.innerText = o.idOrcamentoAnual;
        tr.appendChild(tdId);

        const tdValor = document.createElement("td");
        const valor = parseFloat(o.valorOrcamentoAnual);
        tdValor.innerText = isNaN(valor) ? "-" : `R$ ${valor.toFixed(2)}`;
        tr.appendChild(tdValor);

        const tdAno = document.createElement("td");
        tdAno.innerText = o.anoOrcamentoAnual;
        tr.appendChild(tdAno);

        const tdCategoria = document.createElement("td");
        tdCategoria.innerText = o.idCategoria;
        tr.appendChild(tdCategoria);

        tabelaOrcamentos.appendChild(tr);
    });
}


function mostrarRespostaPopup(mensagem, corFundo = "#f44336") {
    divResposta.innerText = mensagem;
    divResposta.style.backgroundColor = corFundo;
    divResposta.style.display = "block";
    setTimeout(() => {
        divResposta.style.display = "none";
    }, 5000);
}
