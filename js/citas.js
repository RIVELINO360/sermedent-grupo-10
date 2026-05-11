if (localStorage.getItem("login") !== "true") window.location.href = "login.html";

const API = "http://localhost:3000";

document.getElementById("nombreUsuario").textContent = localStorage.getItem("usuario") || "-";
document.getElementById("rolUsuario").textContent = localStorage.getItem("rol") || "-";
document.getElementById("btnLogout").addEventListener("click", () => localStorage.clear());

// --- Cargar tabla de citas ---
function cargarCitas(fecha) {
    const url = fecha ? `${API}/citas?fecha=${fecha}` : `${API}/citas`;
    fetch(url)
        .then(r => r.json())
        .then(citas => {
            const tbody = document.getElementById("tablaCitas");
            if (!citas.length) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;">Sin citas</td></tr>`;
                return;
            }
            tbody.innerHTML = citas.map(c => {
                const hora = c.hora_cita ? c.hora_cita.substring(0, 5) : "";
                const fecha = c.fecha_cita ? c.fecha_cita.substring(0, 10) : "";
                const claseEstado = { pendiente:"pending", confirmada:"confirmed", cancelada:"cancelled", atendida:"confirmed" }[c.estado] || "pending";
                return `<tr>
                    <td>${c.paciente}</td>
                    <td>${c.servicio}</td>
                    <td>${c.medico}</td>
                    <td>${fecha}</td>
                    <td>${hora}</td>
                    <td><span class="status ${claseEstado}">${c.estado}</span></td>
                    <td>
                        <select onchange="cambiarEstado(${c.id_cita}, this.value)" style="padding:4px;border-radius:4px;border:1px solid #ccc;font-size:12px;">
                            <option value="">Cambiar...</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="atendida">Atendida</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </td>
                </tr>`;
            }).join("");
        });
}
cargarCitas();

// Cambiar estado de una cita
function cambiarEstado(id, estado) {
    if (!estado) return;
    fetch(`${API}/citas/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
    }).then(() => cargarCitas(document.getElementById("filtroFecha").value || null));
}

// Filtro por fecha
document.getElementById("filtroFecha").addEventListener("change", function () { cargarCitas(this.value); });
document.getElementById("btnLimpiar").addEventListener("click", () => {
    document.getElementById("filtroFecha").value = "";
    cargarCitas();
});

// --- Modal ---
const modal = document.getElementById("modal");
document.getElementById("btnNuevaCita").addEventListener("click", () => { modal.style.display = "block"; cargarSelectores(); });
document.getElementById("btnFlotante").addEventListener("click", () => { modal.style.display = "block"; cargarSelectores(); });
document.querySelector(".close").addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// Toggle paciente existente / nuevo
let modoNuevo = false;
document.getElementById("tabExistente").addEventListener("click", () => {
    modoNuevo = false;
    document.getElementById("panelExistente").style.display = "block";
    document.getElementById("panelNuevo").style.display = "none";
    document.getElementById("tabExistente").classList.add("active");
    document.getElementById("tabNuevo").classList.remove("active");
});
document.getElementById("tabNuevo").addEventListener("click", () => {
    modoNuevo = true;
    document.getElementById("panelExistente").style.display = "none";
    document.getElementById("panelNuevo").style.display = "block";
    document.getElementById("tabNuevo").classList.add("active");
    document.getElementById("tabExistente").classList.remove("active");
});

function cargarSelectores() {
    fetch(`${API}/pacientes`).then(r => r.json()).then(p => {
        document.getElementById("selectPaciente").innerHTML =
            `<option value="">-- Seleccionar Paciente --</option>` +
            p.map(x => `<option value="${x.id_paciente}">${x.nombre_completo}</option>`).join("");
    });
    fetch(`${API}/servicios`).then(r => r.json()).then(s => {
        document.getElementById("selectServicio").innerHTML =
            `<option value="">-- Seleccionar Servicio --</option>` +
            s.map(x => `<option value="${x.id_servicio}">${x.nombre_servicio}</option>`).join("");
    });
    fetch(`${API}/medicos`).then(r => r.json()).then(m => {
        document.getElementById("selectMedico").innerHTML =
            `<option value="">-- Seleccionar Médico --</option>` +
            m.map(x => `<option value="${x.id_usuario}">${x.nombre_usuario}</option>`).join("");
    });
}

document.getElementById("formCita").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("mensajeCita");
    msg.textContent = "";
    let id_paciente;

    try {
        if (modoNuevo) {
            const dni = document.getElementById("nuevoDni").value.trim();
            const nombres = document.getElementById("nuevoNombres").value.trim();
            const apellidos = document.getElementById("nuevoApellidos").value.trim();
            const telefono = document.getElementById("nuevoTelefono").value.trim();
            if (!dni || !nombres || !apellidos) { msg.style.color="red"; msg.textContent="DNI, nombres y apellidos son obligatorios"; return; }
            const r = await fetch(`${API}/pacientes`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({dni,nombres,apellidos,telefono}) });
            const d = await r.json();
            if (!d.success) { msg.style.color="red"; msg.textContent = d.error.includes("Duplicate") ? "Ya existe un paciente con ese DNI" : "Error al registrar paciente"; return; }
            id_paciente = d.id_paciente;
        } else {
            id_paciente = document.getElementById("selectPaciente").value;
            if (!id_paciente) { msg.style.color="red"; msg.textContent="Selecciona un paciente"; return; }
        }

        const r = await fetch(`${API}/citas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_paciente,
                id_servicio: document.getElementById("selectServicio").value,
                id_medico:   document.getElementById("selectMedico").value,
                fecha_cita:  document.getElementById("fechaCita").value,
                hora_cita:   document.getElementById("horaCita").value,
            })
        });
        const d = await r.json();
        if (d.success) {
            msg.style.color = "green"; msg.textContent = "Cita registrada";
            document.getElementById("formCita").reset();
            document.getElementById("tabExistente").click();
            setTimeout(() => { modal.style.display = "none"; msg.textContent = ""; }, 1000);
            cargarCitas(document.getElementById("filtroFecha").value || null);
        } else { msg.style.color="red"; msg.textContent="Error al guardar"; }
    } catch { msg.style.color="red"; msg.textContent="Error de conexión"; }
});
