import {
  DetalleServicio,
  OrdenServicio,
  Servicio,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(DetalleServicio, {
  idField: "detalleServicioId",
  include: [
    { model: OrdenServicio, as: "ordenServicio" },
    { model: Servicio, as: "servicio" },
  ],
});
