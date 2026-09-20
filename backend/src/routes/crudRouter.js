import { Router } from "express";

export const createCrudRouter = (controller) => {
  const router = Router();

  router.route("/").get(controller.listar).post(controller.crear);

  router
    .route("/:id")
    .get(controller.obtenerPorId)
    .put(controller.actualizar)
    .patch(controller.actualizar)
    .delete(controller.eliminar);

  return router;
};
