import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cliente = sequelize.define(
  "Cliente",
  {
    clienteId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    documentoIdentidad: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true,
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fechaRegistro: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "clientes",
    timestamps: true,
  },
);

export default Cliente;
