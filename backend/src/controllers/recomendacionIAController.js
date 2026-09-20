import {
  RecomendacionIA,
  Motocicleta,
  OrdenServicio,
  Cliente,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(RecomendacionIA, {
  idField: "recomendacionId",
  include: [
    { model: Motocicleta, as: "motocicleta" },
    { model: OrdenServicio, as: "ordenServicio" },
    { model: Cliente, as: "cliente" },
  ],
});
