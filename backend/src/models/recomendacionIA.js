import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RecomendacionIA = sequelize.define(
  "RecomendacionIA",
  {
    recomendacionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motocicletaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ordenServicioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipoDestinatario: {
      type: DataTypes.ENUM("mecanico", "cliente"),
      allowNull: false,
    },
    consultaOrigen: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recomendacion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    modeloIa: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "recomendaciones_ia",
    timestamps: true,
  },
);

export default RecomendacionIA;
