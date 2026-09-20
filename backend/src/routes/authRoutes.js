import { Router } from "express";
import { login, perfil, registro } from "../controllers/authController.js";
import { validarJWT } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/registro", registro);
router.post("/login", login);
router.get("/perfil", validarJWT, perfil);

export default router;
