import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Repuesto = sequelize.define(
  "Repuesto",
  {
    repuestoId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    marca: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stockActual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stockMinimo: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    unidadMedida: {
      type: DataTypes.STRING(20),
      defaultValue: "unidad",
    },
  },
  {
    tableName: "repuestos",
    timestamps: true,
  },
);

export default Repuesto;
