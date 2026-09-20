import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET;

export const validarJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token de autenticación requerido" });
  }

  try {
    req.usuario = jwt.verify(authorization.slice(7), getJwtSecret());
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token inválido o vencido" });
  }
};

export const autorizarRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ message: "No tienes permisos para esta operación" });
  }
  return next();
};
