import {
  Cita,
  Taller,
  Cliente,
  Motocicleta,
  Usuario,
  OrdenServicio,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Cita, {
  idField: "citaId",
  include: [
    { model: Taller, as: "taller" },
    { model: Cliente, as: "cliente" },
    { model: Motocicleta, as: "motocicleta" },
    {
      model: Usuario,
      as: "mecanico",
      attributes: { exclude: ["passwordHash"] },
    },
    { model: OrdenServicio, as: "ordenServicio" },
  ],
});
