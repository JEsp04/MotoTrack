import controller from "../controllers/recomendacionIAController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
