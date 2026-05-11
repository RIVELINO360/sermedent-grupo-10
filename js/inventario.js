if (localStorage.getItem("login") !== "true") window.location.href = "login.html";

const API = "http://localhost:3000";

document.getElementById("nombreUsuario").textContent = localStorage.getItem("usuario") || "-";
document.getElementById("rolUsuario").textContent = localStorage.getItem("rol") || "-";
document.getElementById("btnLogout").addEventListener("click", () => localStorage.clear());

let todosProductos = [];

function cargarInventario() {
    fetch(`${API}/inventario`)
        .then(r => r.json())
        .then(data => {
            todosProductos = data;
            renderTabla(data);
        });
}

function renderTabla(lista) {
    const tbody = document.getElementById("tablaInventario");
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;">Sin productos</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => {
        // Color según nivel de stock
        let estadoClass, estadoLabel;
        if (p.stock_actual <= p.stock_minimo) {
            estadoClass = "cancelled"; estadoLabel = "Crítico";
        } else if (p.stock_actual <= p.stock_minimo * 2) {
            estadoClass = "pending"; estadoLabel = "Bajo";
        } else {
            estadoClass = "confirmed"; estadoLabel = "OK";
        }

        // Barra de nivel (máximo visual = 3x el mínimo)
        const pct = Math.min(100, Math.round((p.stock_actual / (p.stock_minimo * 3 || 1)) * 100));
        const colorBarra = p.stock_actual <= p.stock_minimo ? "red" : p.stock_actual <= p.stock_minimo * 2 ? "orange" : "green";

        return `<tr>
            <td>${p.nombre_producto}</td>
            <td>${p.categoria || "-"}</td>
            <td>${p.stock_actual}</td>
            <td>${p.stock_minimo}</td>
            <td>${p.unidad_medida || "-"}</td>
            <td><span class="status ${estadoClass}">${estadoLabel}</span></td>
            <td style="min-width:80px;">
                <div class="bar"><div class="fill ${colorBarra}" style="width:${pct}%;"></div></div>
            </td>
        </tr>`;
    }).join("");
}

cargarInventario();

// Búsqueda local
document.getElementById("buscar").addEventListener("input", function () {
    const q = this.value.toLowerCase();
    renderTabla(todosProductos.filter(p => p.nombre_producto.toLowerCase().includes(q) || (p.categoria || "").toLowerCase().includes(q)));
});
