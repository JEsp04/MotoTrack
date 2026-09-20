import controller from "../controllers/diagnosticoController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
