console.log("Servidor iniciando...");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// SERVIR ARCHIVOS HTML/CSS/JS
app.use(express.static(__dirname));

// CONEXIÓN A MYSQL
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

// LOGIN
app.post("/login", (req, res) => {

    const { usuario, password } = req.body;

    const sql = `
        SELECT * 
        FROM usuarios 
        WHERE nombre_usuario = ? 
        AND password = ? 
        AND estado = 'activo'
    `;

    db.query(sql, [usuario, password], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Error en servidor"
            });
        }

        if (result.length > 0) {

            res.json({
                success: true,
                user: result[0]
            });

        } else {

            res.json({
                success: false
            });

        }

    });

});

// REGISTRAR USUARIO
app.post("/registrar-usuario", (req, res) => {

    const { usuario, email, password, rol } = req.body;

    const sql = `
        INSERT INTO usuarios 
        (nombre_usuario, email, password, rol) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql,
        [usuario, email, password, rol],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true
            });

        });

});

// OBTENER USUARIOS
app.get("/usuarios", (req, res) => {

    const sql = `
        SELECT 
        id_usuario,
        nombre_usuario,
        email,
        rol,
        estado,
        fecha_creacion
        FROM usuarios
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// DASHBOARD
app.get("/dashboard/stats", (req, res) => {

    const queries = [

        "SELECT COUNT(*) AS total FROM citas WHERE fecha_cita = CURDATE()",

        "SELECT COUNT(*) AS total FROM pacientes",

        "SELECT COUNT(*) AS total FROM inventario WHERE stock_actual <= stock_minimo",

        `SELECT COUNT(*) AS total 
         FROM citas 
         WHERE MONTH(fecha_cita)=MONTH(CURDATE()) 
         AND YEAR(fecha_cita)=YEAR(CURDATE()) 
         AND estado='atendida'`

    ];

    Promise.all(

        queries.map(q =>
            new Promise((resolve, reject) => {

                db.query(q, (err, result) => {

                    if (err) reject(err);
                    else resolve(result[0].total);

                });

            })
        )

    ).then(([citasHoy, pacientesActivos, alertasStock, atendidosMes]) => {

        res.json({
            citasHoy,
            pacientesActivos,
            alertasStock,
            atendidosMes
        });

    }).catch(err => {

        console.error(err);

        res.status(500).json({
            error: "Error en consulta"
        });

    });

});

// CITAS DEL DÍA
app.get("/citas/hoy", (req, res) => {

    const sql = `
        SELECT * 
        FROM v_citas_detalle 
        WHERE fecha_cita = CURDATE() 
        ORDER BY hora_cita
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// RESUMEN INVENTARIO
app.get("/inventario/resumen", (req, res) => {

    const sql = `
        SELECT nombre_producto, stock_actual, stock_minimo
        FROM inventario
        ORDER BY (stock_actual / (stock_minimo + 1)) ASC
        LIMIT 5
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// REGISTRAR PACIENTE
app.post("/pacientes", (req, res) => {

    const {
        dni,
        nombres,
        apellidos,
        telefono
    } = req.body;

    const sql = `
        INSERT INTO pacientes
        (dni, nombres, apellidos, telefono)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql,
        [dni, nombres, apellidos, telefono || null],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });

            }

            res.json({
                success: true,
                id_paciente: result.insertId
            });

        });

});

// OBTENER PACIENTES
app.get("/pacientes", (req, res) => {

    const sql = `
        SELECT 
        id_paciente,
        CONCAT(nombres,' ',apellidos) AS nombre_completo
        FROM pacientes
        ORDER BY apellidos
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// OBTENER MÉDICOS
app.get("/medicos", (req, res) => {

    const sql = `
        SELECT 
        id_usuario,
        nombre_usuario
        FROM usuarios
        WHERE rol='médico'
        AND estado='activo'
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// OBTENER SERVICIOS
app.get("/servicios", (req, res) => {

    const sql = `
        SELECT 
        id_servicio,
        nombre_servicio,
        especialidad
        FROM servicios
        ORDER BY nombre_servicio
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// REGISTRAR CITA
app.post("/citas", (req, res) => {

    const {
        id_paciente,
        id_medico,
        id_servicio,
        fecha_cita,
        hora_cita
    } = req.body;

    const sql = `
        INSERT INTO citas
        (id_paciente, id_medico, id_servicio, fecha_cita, hora_cita)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql,
        [
            id_paciente,
            id_medico,
            id_servicio,
            fecha_cita,
            hora_cita
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });

            }

            res.json({
                success: true
            });

        });

});

// LISTAR CITAS
app.get("/citas", (req, res) => {

    const { fecha } = req.query;

    let sql = "SELECT * FROM v_citas_detalle";

    const params = [];

    if (fecha) {

        sql += " WHERE fecha_cita = ?";
        params.push(fecha);

    }

    sql += " ORDER BY fecha_cita DESC, hora_cita";

    db.query(sql, params, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// CAMBIAR ESTADO CITA
app.put("/citas/:id/estado", (req, res) => {

    const { estado } = req.body;

    db.query(
        "UPDATE citas SET estado = ? WHERE id_cita = ?",
        [estado, req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true
            });

        });

});

// LISTA PACIENTES
app.get("/pacientes/lista", (req, res) => {

    db.query(
        "SELECT * FROM pacientes ORDER BY apellidos",
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: "Error en consulta"
                });
            }

            res.json(result);

        });

});

// INVENTARIO
app.get("/inventario", (req, res) => {

    db.query(
        "SELECT * FROM inventario ORDER BY nombre_producto",
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: "Error en consulta"
                });
            }

            res.json(result);

        });

});

// HISTORIAL
app.get("/historial", (req, res) => {

    const sql = `
        SELECT 
        h.id_historial,
        CONCAT(p.nombres,' ',p.apellidos) AS paciente,
        u.nombre_usuario AS medico,
        s.nombre_servicio AS servicio,
        h.fecha_registro,
        h.diagnostico,
        h.tratamiento

        FROM historial_clinico h

        JOIN pacientes p
        ON h.id_paciente = p.id_paciente

        JOIN usuarios u
        ON h.id_medico = u.id_usuario

        JOIN servicios s
        ON h.id_servicio = s.id_servicio

        ORDER BY h.fecha_registro DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: "Error en consulta"
            });
        }

        res.json(result);

    });

});

// CAMBIAR ESTADO USUARIO
app.put("/usuarios/:id/estado", (req, res) => {

    const { estado } = req.body;

    db.query(
        "UPDATE usuarios SET estado = ? WHERE id_usuario = ?",
        [estado, req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true
            });

        });

});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("Servidor corriendo en puerto " + PORT);

});