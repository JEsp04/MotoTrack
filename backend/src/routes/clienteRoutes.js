import controller from "../controllers/clienteController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
