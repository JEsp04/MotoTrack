import controller from "../controllers/ordenServicioController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
