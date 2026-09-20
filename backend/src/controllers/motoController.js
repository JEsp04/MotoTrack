import {
  Motocicleta,
  Cliente,
  Cita,
  OrdenServicio,
  RecomendacionIA,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Motocicleta, {
  idField: "motocicletaId",
  include: [
    { model: Cliente, as: "propietario" },
    { model: Cita, as: "citas" },
    { model: OrdenServicio, as: "ordenesServicio" },
    { model: RecomendacionIA, as: "recomendaciones" },
  ],
});
