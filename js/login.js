document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("login", "true");
            // Guardar info del usuario para mostrarlo en el sidebar
            localStorage.setItem("usuario", data.user.nombre_usuario);
            localStorage.setItem("rol", data.user.rol);
            window.location.href = "index.html";
        } else {
            error.textContent = "Usuario o contraseña incorrectos";
        }

    } catch (err) {
        error.textContent = "Error al conectar con el servidor";
        console.log(err);
    }
});