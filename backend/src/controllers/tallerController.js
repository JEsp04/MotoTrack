import {
  Taller,
  Usuario,
  Cita,
  OrdenServicio,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Taller, {
  idField: "tallerId",
  include: [
    {
      model: Usuario,
      as: "usuarios",
      attributes: { exclude: ["passwordHash"] },
    },
    { model: Cita, as: "citas" },
    { model: OrdenServicio, as: "ordenes" },
  ],
});
