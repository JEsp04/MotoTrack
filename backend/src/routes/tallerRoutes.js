import controller from "../controllers/tallerController.js";
import { createCrudRouter } from "./crudRouter.js";

export default createCrudRouter(controller);
