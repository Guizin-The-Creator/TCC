
function existesessao(){
    const token = localStorage.getItem("token");
    if (!token) {
        console.log("Nenhum token encontrado. Redirecionando para login...");
        window.location.href = "login.html";
        return;
    }
}
existesessao()