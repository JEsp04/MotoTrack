import {
  Diagnostico,
  OrdenServicio,
  Usuario,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Diagnostico, {
  idField: "diagnosticoId",
  include: [
    { model: OrdenServicio, as: "ordenServicio" },
    {
      model: Usuario,
      as: "mecanico",
      attributes: { exclude: ["passwordHash"] },
    },
  ],
});
