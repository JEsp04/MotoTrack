import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import sequelize from "./src/config/database.js";
import "./src/models/relations/index.js";

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos.");

    app.listen(PORT, () =>
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`),
    );
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  }
}

startServer();
