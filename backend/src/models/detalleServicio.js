import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DetalleServicio = sequelize.define(
  "DetalleServicio",
  {
    detalleServicioId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ordenServicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    servicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "detalle_servicios",
    timestamps: true,
  },
);

export default DetalleServicio;
