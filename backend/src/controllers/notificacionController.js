import { Notificacion, Usuario } from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Notificacion, {
  idField: "notificacionId",
  include: [
    {
      model: Usuario,
      as: "usuario",
      attributes: { exclude: ["passwordHash"] },
    },
  ],
});
