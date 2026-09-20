import controller from "../controllers/detalleServicioController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
