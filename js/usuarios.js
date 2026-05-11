if (localStorage.getItem("login") !== "true") window.location.href = "login.html";

const API = "http://localhost:3000";

document.getElementById("nombreUsuario").textContent = localStorage.getItem("usuario") || "-";
document.getElementById("rolUsuario").textContent = localStorage.getItem("rol") || "-";
document.getElementById("btnLogout").addEventListener("click", () => localStorage.clear());

// --- Cargar tabla de usuarios ---
function cargarUsuarios() {
    fetch(`${API}/usuarios`)
        .then(r => r.json())
        .then(data => {
            const tbody = document.getElementById("tablaUsuarios");
            if (!data.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;">Sin usuarios</td></tr>`;
                return;
            }
            tbody.innerHTML = data.map(u => {
                const estadoClass = u.estado === "activo" ? "confirmed" : "cancelled";
                return `<tr>
                    <td>${u.nombre_usuario}</td>
                    <td>${u.email}</td>
                    <td>${u.rol}</td>
                    <td><span class="status ${estadoClass}">${u.estado}</span></td>
                    <td>
                        <button onclick="toggleEstado(${u.id_usuario}, '${u.estado}')"
                            style="padding:4px 8px;border-radius:4px;border:1px solid #ccc;cursor:pointer;font-size:12px;">
                            ${u.estado === "activo" ? "Desactivar" : "Activar"}
                        </button>
                    </td>
                </tr>`;
            }).join("");
        });
}
cargarUsuarios();

// Activar / desactivar usuario
function toggleEstado(id, estadoActual) {
    const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";
    fetch(`${API}/usuarios/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
    }).then(() => cargarUsuarios());
}

// --- Modal ---
const modal = document.getElementById("modal");
document.getElementById("btnNuevoUsuario").addEventListener("click", () => modal.style.display = "block");
document.getElementById("btnFlotante").addEventListener("click", () => modal.style.display = "block");
document.querySelector(".close").addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

document.getElementById("formUsuario").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("mensajeUsuario");
    msg.textContent = "";

    const body = {
        usuario:  document.getElementById("nuevoUsuario").value.trim(),
        email:    document.getElementById("nuevoEmail").value.trim(),
        password: document.getElementById("nuevoPassword").value,
        rol:      document.getElementById("nuevoRol").value,
    };

    try {
        const r = await fetch(`${API}/registrar-usuario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const d = await r.json();
        if (d.success) {
            msg.style.color = "green"; msg.textContent = "Usuario registrado";
            document.getElementById("formUsuario").reset();
            setTimeout(() => { modal.style.display = "none"; msg.textContent = ""; }, 1000);
            cargarUsuarios();
        } else {
            msg.style.color = "red"; msg.textContent = "Error al registrar (usuario o email duplicado)";
        }
    } catch { msg.style.color = "red"; msg.textContent = "Error de conexión"; }
});
