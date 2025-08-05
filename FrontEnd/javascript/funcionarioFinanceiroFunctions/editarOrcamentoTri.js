const tabelaBody = document.getElementById("tabelaOrcamentos").getElementsByTagName("tbody")[0];
const formEditar = document.getElementById("formEditarOrcamento");
const formContainer = document.getElementById("formEditarContainer");
const divResposta = document.getElementById("divResposta");

const txtId = document.getElementById("txtId");
const txtValor = document.getElementById("txtValor");
const txtTrimestre = document.getElementById("txtTrimestre");
const txtAnual = document.getElementById("txtAnual");
const txtCategoria = document.getElementById("txtCategoria");

window.addEventListener("DOMContentLoaded", () => {
    buscarTodosOrcamentos();
});

function buscarTodosOrcamentos() {
    fetch("http://localhost:3000/orcamentostri", {
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
    tabelaBody.innerHTML = "";

    lista.forEach(o => {
        const tr = document.createElement("tr");
        const valorFormatado = `R$ ${parseFloat(o.valorOrcamentoTri).toFixed(2)}`;

        tr.innerHTML = `
            <td>${o.idOrcamentoTri}</td>
            <td>${valorFormatado}</td>
            <td>${o.trimestreOrcamentoTri}</td>
            <td>${o.idOrcamentoAnual}</td>
            <td>${o.idCategoria}</td>
        `;

        const btn = document.createElement("button");
        btn.innerText = "Selecionar";
        btn.addEventListener("click", () => {
            carregarFormulario(o);
        });

        const tdAcoes = document.createElement("td");
        tdAcoes.appendChild(btn);
        tr.appendChild(tdAcoes);

        tabelaBody.appendChild(tr);
    });
}

function carregarFormulario(o) {
    txtId.value = o.idOrcamentoTri;
    txtValor.value = o.valorOrcamentoTri;
    txtTrimestre.value = o.trimestreOrcamentoTri;
    txtAnual.value = o.idOrcamentoAnual;
    txtCategoria.value = o.idCategoria;
    formContainer.classList.remove("oculto");
    window.scrollTo({ top: formContainer.offsetTop, behavior: 'smooth' });
}

formEditar.addEventListener("submit", function(e) {
    e.preventDefault();

    const id = parseInt(txtId.value);
    const valor = parseFloat(txtValor.value);
    const trimestre = parseInt(txtTrimestre.value);
    const anual = parseInt(txtAnual.value);
    const categoria = parseInt(txtCategoria.value);

    if (!id || ![1, 2, 3, 4].includes(trimestre) || isNaN(valor) || isNaN(anual) || isNaN(categoria)) {
        return mostrarRespostaPopup("Dados inválidos para atualização.");
    }

    const obj = {
        valorOrcamentoTri: valor,
        trimestreOrcamentoTri: trimestre,
        idOrcamentoAnual: anual,
        idCategoria: categoria
    };

    fetch(`http://localhost:3000/orcamentostri/${id}`, {
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
            formContainer.classList.add("oculto");
            buscarTodosOrcamentos();
        } else {
            mostrarRespostaPopup(data.message || "Erro ao atualizar.");
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
