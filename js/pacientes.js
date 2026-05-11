if (localStorage.getItem("login") !== "true") window.location.href = "login.html";

const API = "http://localhost:3000";

document.getElementById("nombreUsuario").textContent = localStorage.getItem("usuario") || "-";
document.getElementById("rolUsuario").textContent = localStorage.getItem("rol") || "-";
document.getElementById("btnLogout").addEventListener("click", () => localStorage.clear());

let todosPacientes = [];

// --- Cargar pacientes ---
function cargarPacientes() {
    fetch(`${API}/pacientes/lista`)
        .then(r => r.json())
        .then(data => {
            todosPacientes = data;
            renderTabla(data);
        });
}

function renderTabla(lista) {
    const tbody = document.getElementById("tablaPacientes");
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">Sin pacientes registrados</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => {
        const fecha = p.fecha_registro ? p.fecha_registro.substring(0, 10) : "";
        return `<tr>
            <td>${p.dni}</td>
            <td>${p.nombres}</td>
            <td>${p.apellidos}</td>
            <td>${p.telefono || "-"}</td>
            <td>${p.email || "-"}</td>
            <td>${fecha}</td>
        </tr>`;
    }).join("");
}

cargarPacientes();

// Búsqueda en tiempo real (filtra el arreglo local)
document.getElementById("buscar").addEventListener("input", function () {
    const q = this.value.toLowerCase();
    const filtrados = todosPacientes.filter(p =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.dni.toLowerCase().includes(q)
    );
    renderTabla(filtrados);
});

// --- Modal ---
const modal = document.getElementById("modal");
document.getElementById("btnNuevoPaciente").addEventListener("click", () => modal.style.display = "block");
document.getElementById("btnFlotante").addEventListener("click", () => modal.style.display = "block");
document.querySelector(".close").addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

document.getElementById("formPaciente").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("mensajePaciente");
    msg.textContent = "";

    const body = {
        dni:       document.getElementById("dni").value.trim(),
        nombres:   document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        telefono:  document.getElementById("telefono").value.trim(),
        // email se envía aparte, hay que actualizar server si se quiere guardar
    };

    try {
        const r = await fetch(`${API}/pacientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const d = await r.json();
        if (d.success) {
            msg.style.color = "green"; msg.textContent = "Paciente registrado";
            document.getElementById("formPaciente").reset();
            setTimeout(() => { modal.style.display = "none"; msg.textContent = ""; }, 1000);
            cargarPacientes();
        } else {
            msg.style.color = "red";
            msg.textContent = d.error && d.error.includes("Duplicate") ? "Ya existe un paciente con ese DNI" : "Error al registrar";
        }
    } catch { msg.style.color = "red"; msg.textContent = "Error de conexión"; }
});
