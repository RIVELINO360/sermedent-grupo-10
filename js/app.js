if (localStorage.getItem("login") !== "true") {
    window.location.href = "login.html";
}

const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {

    // Mostrar usuario en sidebar
    document.getElementById("nombreUsuario").textContent = localStorage.getItem("usuario") || "-";
    document.getElementById("rolUsuario").textContent = localStorage.getItem("rol") || "-";
    document.getElementById("btnLogout").addEventListener("click", () => { localStorage.clear(); });

    // Calendario dinámico con el mes actual
    const hoy = new Date();
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    document.getElementById("calTitulo").textContent = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const calDias = document.getElementById("calDias");
    for (let d = 1; d <= diasEnMes; d++) {
        const span = document.createElement("span");
        span.textContent = d;
        if (d === hoy.getDate()) span.style.background = "var(--primary)", span.style.color = "white";
        calDias.appendChild(span);
    }

    // --- Modal ---
    const modal = document.getElementById("modal");
    const btnPlus = document.querySelector(".floating-btn");
    const btnCita = document.querySelector(".btn-cita");
    const closeBtn = document.querySelector(".close");

    function abrirModal() {
        modal.style.display = "block";
        cargarSelectores();
    }

    if (btnPlus) btnPlus.addEventListener("click", abrirModal);
    if (btnCita) btnCita.addEventListener("click", abrirModal);
    if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    // --- Toggle paciente existente / nuevo ---
    let modoNuevoPaciente = false;

    document.getElementById("tabExistente").addEventListener("click", () => {
        modoNuevoPaciente = false;
        document.getElementById("panelExistente").style.display = "block";
        document.getElementById("panelNuevo").style.display = "none";
        document.getElementById("tabExistente").classList.add("active");
        document.getElementById("tabNuevo").classList.remove("active");
    });

    document.getElementById("tabNuevo").addEventListener("click", () => {
        modoNuevoPaciente = true;
        document.getElementById("panelExistente").style.display = "none";
        document.getElementById("panelNuevo").style.display = "block";
        document.getElementById("tabNuevo").classList.add("active");
        document.getElementById("tabExistente").classList.remove("active");
    });

    // --- Cargar estadísticas ---
    fetch(`${API}/dashboard/stats`)
        .then(r => r.json())
        .then(data => {
            document.getElementById("statCitasHoy").textContent = data.citasHoy;
            document.getElementById("statPacientes").textContent = data.pacientesActivos;
            document.getElementById("statAlertas").textContent = data.alertasStock;
            document.getElementById("statAtendidos").textContent = data.atendidosMes;
        })
        .catch(() => {
            ["statCitasHoy", "statPacientes", "statAlertas", "statAtendidos"].forEach(id => {
                document.getElementById(id).textContent = "—";
            });
        });

    // --- Cargar citas del día ---
    function cargarCitas() {
        fetch(`${API}/citas/hoy`)
            .then(r => r.json())
            .then(citas => {
                const tbody = document.getElementById("tablaCitas");
                if (!citas.length) {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;">No hay citas para hoy</td></tr>`;
                    return;
                }
                tbody.innerHTML = citas.map(c => {
                    const hora = c.hora_cita ? c.hora_cita.substring(0, 5) : "";
                    const estadoClass = { pendiente: "pending", confirmada: "confirmed", cancelada: "cancelled", atendida: "confirmed" }[c.estado] || "pending";
                    const estadoLabel = c.estado.charAt(0).toUpperCase() + c.estado.slice(1);
                    return `<tr>
                        <td>${c.paciente}</td>
                        <td>${c.servicio}</td>
                        <td>${c.medico}</td>
                        <td>${hora}</td>
                        <td><span class="status ${estadoClass}">${estadoLabel}</span></td>
                    </tr>`;
                }).join("");
            })
            .catch(() => {
                document.getElementById("tablaCitas").innerHTML =
                    `<tr><td colspan="5" style="text-align:center;color:#999;">Error al cargar citas</td></tr>`;
            });
    }
    cargarCitas();

    // --- Cargar inventario ---
    fetch(`${API}/inventario/resumen`)
        .then(r => r.json())
        .then(items => {
            const contenedor = document.getElementById("listaInventario");
            if (!items.length) {
                contenedor.innerHTML = `<p style="color:#999;font-size:13px;">Sin datos de inventario</p>`;
                return;
            }
            contenedor.innerHTML = items.map(item => {
                const ratio = item.stock_actual / (item.stock_minimo * 3 || 1);
                const pct = Math.min(100, Math.round(ratio * 100));
                const color = item.stock_actual <= item.stock_minimo ? "red"
                            : item.stock_actual <= item.stock_minimo * 2 ? "orange"
                            : "green";
                return `<div class="item">
                    <p>${item.nombre_producto} <small style="color:#999;">(${item.stock_actual} uds)</small></p>
                    <div class="bar"><div class="fill ${color}" style="width:${pct}%;"></div></div>
                </div>`;
            }).join("");
        })
        .catch(() => {
            document.getElementById("listaInventario").innerHTML =
                `<p style="color:#999;font-size:13px;">Error al cargar inventario</p>`;
        });

    // --- Cargar selects del modal ---
    function cargarSelectores() {
        fetch(`${API}/pacientes`)
            .then(r => r.json())
            .then(pacientes => {
                const sel = document.getElementById("selectPaciente");
                sel.innerHTML = `<option value="">-- Seleccionar Paciente --</option>` +
                    pacientes.map(p => `<option value="${p.id_paciente}">${p.nombre_completo}</option>`).join("");
            });

        fetch(`${API}/servicios`)
            .then(r => r.json())
            .then(servicios => {
                const sel = document.getElementById("selectServicio");
                sel.innerHTML = `<option value="">-- Seleccionar Servicio --</option>` +
                    servicios.map(s => `<option value="${s.id_servicio}">${s.nombre_servicio}</option>`).join("");
            });

        fetch(`${API}/medicos`)
            .then(r => r.json())
            .then(medicos => {
                const sel = document.getElementById("selectMedico");
                sel.innerHTML = `<option value="">-- Seleccionar Médico --</option>` +
                    medicos.map(m => `<option value="${m.id_usuario}">${m.nombre_usuario}</option>`).join("");
            });
    }

    // --- Guardar nueva cita ---
    document.getElementById("formCita").addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("mensajeCita");
        msg.textContent = "";

        let id_paciente;

        try {
            if (modoNuevoPaciente) {
                // Crear paciente primero
                const dni       = document.getElementById("nuevoDni").value.trim();
                const nombres   = document.getElementById("nuevoNombres").value.trim();
                const apellidos = document.getElementById("nuevoApellidos").value.trim();
                const telefono  = document.getElementById("nuevoTelefono").value.trim();

                if (!dni || !nombres || !apellidos) {
                    msg.style.color = "red";
                    msg.textContent = "DNI, nombres y apellidos son obligatorios";
                    return;
                }

                const resPac = await fetch(`${API}/pacientes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dni, nombres, apellidos, telefono })
                });
                const dataPac = await resPac.json();
                if (!dataPac.success) {
                    msg.style.color = "red";
                    msg.textContent = dataPac.error.includes("Duplicate") ? "Ya existe un paciente con ese DNI" : "Error al registrar paciente";
                    return;
                }
                id_paciente = dataPac.id_paciente;
            } else {
                id_paciente = document.getElementById("selectPaciente").value;
                if (!id_paciente) {
                    msg.style.color = "red";
                    msg.textContent = "Selecciona un paciente";
                    return;
                }
            }

            // Guardar cita
            const resCita = await fetch(`${API}/citas`, {
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
            const dataCita = await resCita.json();

            if (dataCita.success) {
                msg.style.color = "green";
                msg.textContent = "Cita registrada correctamente";
                document.getElementById("formCita").reset();
                // Volver al tab de existente
                document.getElementById("tabExistente").click();
                setTimeout(() => { modal.style.display = "none"; msg.textContent = ""; }, 1200);
                cargarCitas();
                fetch(`${API}/dashboard/stats`).then(r => r.json()).then(d => {
                    document.getElementById("statCitasHoy").textContent = d.citasHoy;
                    document.getElementById("statPacientes").textContent = d.pacientesActivos;
                });
            } else {
                msg.style.color = "red";
                msg.textContent = "Error al guardar la cita";
            }
        } catch {
            msg.style.color = "red";
            msg.textContent = "Error al conectar con el servidor";
        }
    });

});
