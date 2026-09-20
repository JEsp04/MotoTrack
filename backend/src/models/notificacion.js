import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Notificacion = sequelize.define(
  "Notificacion",
  {
    notificacionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM(
        "cita",
        "orden_servicio",
        "recomendacion_ia",
        "inventario",
        "general",
      ),
      allowNull: false,
      defaultValue: "general",
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    referenciaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notificaciones",
    timestamps: true,
  },
);

export default Notificacion;
