if (localStorage.getItem("login") !== "true") window.location.href = "login.html";

const API = "http://localhost:3000";

document.getElementById("nombreUsuario").textContent = localStorage.getItem("usuario") || "-";
document.getElementById("rolUsuario").textContent = localStorage.getItem("rol") || "-";
document.getElementById("btnLogout").addEventListener("click", () => localStorage.clear());

let todosRegistros = [];

function cargarHistorial() {
    fetch(`${API}/historial`)
        .then(r => r.json())
        .then(data => {
            todosRegistros = data;
            renderTabla(data);
        });
}

function renderTabla(lista) {
    const tbody = document.getElementById("tablaHistorial");
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">Sin registros en el historial</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(h => {
        const fecha = h.fecha_registro ? h.fecha_registro.substring(0, 10) : "";
        return `<tr>
            <td>${h.paciente}</td>
            <td>${h.medico}</td>
            <td>${h.servicio}</td>
            <td>${fecha}</td>
            <td>${h.diagnostico || "-"}</td>
            <td>${h.tratamiento || "-"}</td>
        </tr>`;
    }).join("");
}

cargarHistorial();

// Búsqueda local por paciente
document.getElementById("buscar").addEventListener("input", function () {
    const q = this.value.toLowerCase();
    renderTabla(todosRegistros.filter(h => h.paciente.toLowerCase().includes(q)));
});
