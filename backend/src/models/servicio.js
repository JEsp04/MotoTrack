import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Servicio = sequelize.define(
  "Servicio",
  {
    servicioId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precioBase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tiempoEstimadoMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM("activo", "inactivo"),
      defaultValue: "activo",
    },
  },
  {
    tableName: "servicios",
    timestamps: true,
  },
);

export default Servicio;
