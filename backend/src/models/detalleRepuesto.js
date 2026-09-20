import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DetalleRepuesto = sequelize.define(
  "DetalleRepuesto",
  {
    detalleRepuestoId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ordenServicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    repuestoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: "detalle_repuestos",
    timestamps: true,
  },
);

export default DetalleRepuesto;
