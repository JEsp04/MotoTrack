import { Servicio, DetalleServicio } from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Servicio, {
  idField: "servicioId",
  include: [{ model: DetalleServicio, as: "detalles" }],
});
