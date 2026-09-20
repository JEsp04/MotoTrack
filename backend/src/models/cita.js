import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cita = sequelize.define(
  "Cita",
  {
    citaId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    motocicletaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tallerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fechaHora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "confirmada",
        "cancelada",
        "completada",
      ),
      defaultValue: "pendiente",
    },
  },
  {
    tableName: "citas",
    timestamps: true,
  },
);

export default Cita;
