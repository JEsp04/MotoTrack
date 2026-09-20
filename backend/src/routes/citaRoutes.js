import controller from "../controllers/citaController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
