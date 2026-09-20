import controller from "../controllers/movimientoInventarioController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
