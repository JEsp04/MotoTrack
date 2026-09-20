import {
  Usuario,
  Taller,
  Cliente,
  Cita,
  OrdenServicio,
  Diagnostico,
  MovimientoInventario,
  Notificacion,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Usuario, {
  idField: "usuarioId",
  attributes: { exclude: ["passwordHash"] },
  include: [
    { model: Taller, as: "taller" },
    { model: Cliente, as: "perfilCliente" },
    { model: Cita, as: "citasAsignadas" },
    { model: OrdenServicio, as: "ordenesAsignadas" },
    { model: Diagnostico, as: "diagnosticosRealizados" },
    { model: MovimientoInventario, as: "movimientosRegistrados" },
    { model: Notificacion, as: "notificaciones" },
  ],
});
