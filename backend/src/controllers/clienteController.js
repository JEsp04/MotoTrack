import {
  Cliente,
  Usuario,
  Motocicleta,
  Cita,
  RecomendacionIA,
} from "../models/relations/index.js";

import { createCrudController } from "./crudController.js";

export default createCrudController(Cliente, {
  idField: "clienteId",
  include: [
    {
      model: Usuario,
      as: "usuario",
      attributes: { exclude: ["passwordHash"] },
    },
    { model: Motocicleta, as: "motocicletas" },
    { model: Cita, as: "citas" },
    { model: RecomendacionIA, as: "recomendacionesChatbot" },
  ],
});
