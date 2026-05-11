console.log("Servidor iniciando...");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// SERVIR ARCHIVOS
app.use(express.static(__dirname));

// CONEXIÓN MYSQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sermedent_db",
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {

    if (err) {
        console.error("Error de conexión:", err.message);
    } else {
        console.log("Conectado a MySQL correctamente");
    }

});

// RUTA PRINCIPAL
app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, "login.html"));

});

// LOGIN TEMPORAL PARA RENDER
app.post("/login", (req, res) => {

    const { usuario, password } = req.body;

    if (usuario === "RIVELINO" && password === "123") {

        return res.json({
            success: true,
            user: {
                nombre_usuario: "RIVELINO",
                rol: "Administrador"
            }
        });

    }

    res.json({
        success: false
    });

});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("Servidor corriendo en puerto " + PORT);

});