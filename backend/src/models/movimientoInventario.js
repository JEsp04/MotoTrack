import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MovimientoInventario = sequelize.define(
  "MovimientoInventario",
  {
    movimientoInventarioId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    repuestoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ordenServicioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM("entrada", "salida", "ajuste"),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "movimientos_inventario",
    timestamps: true,
  },
);

export default MovimientoInventario;
