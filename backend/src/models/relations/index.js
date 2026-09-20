import sequelize from "../../config/database.js";
import Taller from "../taller.js";
import Usuario from "../usuario.js";
import Cliente from "../cliente.js";
import Motocicleta from "../moto.js";
import Cita from "../cita.js";
import OrdenServicio from "../ordenServicio.js";
import Diagnostico from "../diagnostico.js";
import Servicio from "../servicio.js";
import DetalleServicio from "../detalleServicio.js";
import Repuesto from "../repuesto.js";
import DetalleRepuesto from "../detalleRepuesto.js";
import MovimientoInventario from "../movimientoInventario.js";
import RecomendacionIA from "../recomendacionIA.js";
import Notificacion from "../notificacion.js";

Taller.hasMany(Usuario, { foreignKey: "tallerId", as: "usuarios" });

Usuario.belongsTo(Taller, { foreignKey: "tallerId", as: "taller" });

Taller.hasMany(Cita, { foreignKey: "tallerId", as: "citas" });

Cita.belongsTo(Taller, { foreignKey: "tallerId", as: "taller" });

Taller.hasMany(OrdenServicio, { foreignKey: "tallerId", as: "ordenes" });

OrdenServicio.belongsTo(Taller, { foreignKey: "tallerId", as: "taller" });

Usuario.hasOne(Cliente, { foreignKey: "usuarioId", as: "perfilCliente" });

Cliente.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

Cliente.hasMany(Motocicleta, { foreignKey: "clienteId", as: "motocicletas" });

Motocicleta.belongsTo(Cliente, { foreignKey: "clienteId", as: "propietario" });

Cliente.hasMany(Cita, { foreignKey: "clienteId", as: "citas" });

Cita.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });

Motocicleta.hasMany(Cita, { foreignKey: "motocicletaId", as: "citas" });

Cita.belongsTo(Motocicleta, { foreignKey: "motocicletaId", as: "motocicleta" });

Usuario.hasMany(Cita, { foreignKey: "usuarioId", as: "citasAsignadas" });

Cita.belongsTo(Usuario, { foreignKey: "usuarioId", as: "mecanico" });

Cita.hasOne(OrdenServicio, { foreignKey: "citaId", as: "ordenServicio" });

OrdenServicio.belongsTo(Cita, { foreignKey: "citaId", as: "cita" });

Motocicleta.hasMany(OrdenServicio, {
  foreignKey: "motocicletaId",
  as: "ordenesServicio",
});

OrdenServicio.belongsTo(Motocicleta, {
  foreignKey: "motocicletaId",
  as: "motocicleta",
});

Usuario.hasMany(OrdenServicio, {
  foreignKey: "usuarioId",
  as: "ordenesAsignadas",
});

OrdenServicio.belongsTo(Usuario, { foreignKey: "usuarioId", as: "mecanico" });
OrdenServicio.hasOne(Diagnostico, {
  foreignKey: "ordenServicioId",
  as: "diagnostico",
});

Diagnostico.belongsTo(OrdenServicio, {
  foreignKey: "ordenServicioId",
  as: "ordenServicio",
});

Usuario.hasMany(Diagnostico, {
  foreignKey: "usuarioId",
  as: "diagnosticosRealizados",
});

Diagnostico.belongsTo(Usuario, { foreignKey: "usuarioId", as: "mecanico" });
OrdenServicio.hasMany(DetalleServicio, {
  foreignKey: "ordenServicioId",
  as: "detallesServicio",
});

DetalleServicio.belongsTo(OrdenServicio, {
  foreignKey: "ordenServicioId",
  as: "ordenServicio",
});

Servicio.hasMany(DetalleServicio, { foreignKey: "servicioId", as: "detalles" });
DetalleServicio.belongsTo(Servicio, {
  foreignKey: "servicioId",
  as: "servicio",
});

OrdenServicio.hasMany(DetalleRepuesto, {
  foreignKey: "ordenServicioId",
  as: "detallesRepuesto",
});

DetalleRepuesto.belongsTo(OrdenServicio, {
  foreignKey: "ordenServicioId",
  as: "ordenServicio",
});

Repuesto.hasMany(DetalleRepuesto, {
  foreignKey: "repuestoId",
  as: "usosEnOrdenes",
});

DetalleRepuesto.belongsTo(Repuesto, {
  foreignKey: "repuestoId",
  as: "repuesto",
});

Repuesto.hasMany(MovimientoInventario, {
  foreignKey: "repuestoId",
  as: "movimientos",
});

MovimientoInventario.belongsTo(Repuesto, {
  foreignKey: "repuestoId",
  as: "repuesto",
});

Usuario.hasMany(MovimientoInventario, {
  foreignKey: "usuarioId",
  as: "movimientosRegistrados",
});

MovimientoInventario.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});

OrdenServicio.hasMany(MovimientoInventario, {
  foreignKey: "ordenServicioId",
  as: "movimientosInventario",
});

MovimientoInventario.belongsTo(OrdenServicio, {
  foreignKey: "ordenServicioId",
  as: "ordenServicio",
});

Motocicleta.hasMany(RecomendacionIA, {
  foreignKey: "motocicletaId",
  as: "recomendaciones",
});

RecomendacionIA.belongsTo(Motocicleta, {
  foreignKey: "motocicletaId",
  as: "motocicleta",
});

OrdenServicio.hasMany(RecomendacionIA, {
  foreignKey: "ordenServicioId",
  as: "recomendaciones",
});

RecomendacionIA.belongsTo(OrdenServicio, {
  foreignKey: "ordenServicioId",
  as: "ordenServicio",
});

Cliente.hasMany(RecomendacionIA, {
  foreignKey: "clienteId",
  as: "recomendacionesChatbot",
});

RecomendacionIA.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });
Usuario.hasMany(Notificacion, {
  foreignKey: "usuarioId",
  as: "notificaciones",
});

Notificacion.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

export {
  sequelize,
  Taller,
  Usuario,
  Cliente,
  Motocicleta,
  Cita,
  OrdenServicio,
  Diagnostico,
  Servicio,
  DetalleServicio,
  Repuesto,
  DetalleRepuesto,
  MovimientoInventario,
  RecomendacionIA,
  Notificacion,
};
