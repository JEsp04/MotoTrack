import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Motocicleta = sequelize.define(
  "Motocicleta",
  {
    motocicletaId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    referencia: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    modelo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    placa: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    color: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    kilometraje: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "motocicletas",
    timestamps: true,
  },
);

export default Motocicleta;
