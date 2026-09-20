import controller from "../controllers/motoController.js";
import { createCrudRouter } from "./crudRouter.js";
export default createCrudRouter(controller);
