import controller from "../controllers/usuarioController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
