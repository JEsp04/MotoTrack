import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OrdenServicio = sequelize.define(
  "OrdenServicio",
  {
    ordenServicioId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    citaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fechaIngreso: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fechaEntregaEstimada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaEntregaReal: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(
        "recibido",
        "diagnostico",
        "en_proceso",
        "finalizado",
        "entregado",
        "cancelado",
      ),
      defaultValue: "recibido",
    },
    costoTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "ordenes_servicio",
    timestamps: true,
  },
);

export default OrdenServicio;
