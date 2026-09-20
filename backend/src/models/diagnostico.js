import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Diagnostico = sequelize.define(
  "Diagnostico",
  {
    diagnosticoId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ordenServicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    descripcionReportada: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosticoTecnico: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    recomendaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "diagnosticos",
    timestamps: true,
  },
);

export default Diagnostico;
