import controller from "../controllers/servicioController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
