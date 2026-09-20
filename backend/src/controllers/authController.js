import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Cliente, sequelize, Usuario } from "../models/relations/index.js";

const JWT_EXPIRATION = process.env.JWT_EXPIRES_IN || "8h";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado");
  }
  return process.env.JWT_SECRET;
};

const usuarioPublico = (usuario) => {
  const { passwordHash, ...datos } = usuario.toJSON();
  return datos;
};

const crearToken = (usuario, secret) =>
  jwt.sign(
    {
      usuarioId: usuario.usuarioId,
      rol: usuario.rol,
      tallerId: usuario.tallerId,
    },
    secret,
    { expiresIn: JWT_EXPIRATION },
  );

export const registro = async (req, res) => {
  const { nombre, email, password, telefono, documentoIdentidad, direccion } =
    req.body;
  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (error) {
    console.error("Error de configuración JWT:", error.message);
    return res
      .status(500)
      .json({ message: "El servidor no tiene JWT_SECRET configurado" });
  }

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ message: "nombre, email y password son obligatorios" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      const usuario = await Usuario.create(
        {
          nombre,
          email: email.toLowerCase().trim(),
          passwordHash: await bcrypt.hash(password, 12),
          telefono,
          rol: "cliente",
        },
        { transaction },
      );

      const cliente = await Cliente.create(
        {
          usuarioId: usuario.usuarioId,
          documentoIdentidad,
          direccion,
        },
        { transaction },
      );

      return { usuario, cliente };
    });

    return res.status(201).json({
      message: "Registro completado",
      token: crearToken(resultado.usuario, jwtSecret),
      usuario: usuarioPublico(resultado.usuario),
      cliente: resultado.cliente,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "El correo o documento ya está registrado" });
    }
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ message: "Datos de registro inválidos", errors: error.errors });
    }
    console.error("Error en registro:", error.message);
    return res
      .status(500)
      .json({ message: "No fue posible completar el registro" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (error) {
    console.error("Error de configuración JWT:", error.message);
    return res
      .status(500)
      .json({ message: "El servidor no tiene JWT_SECRET configurado" });
  }
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "email y password son obligatorios" });
  }

  try {
    const usuario = await Usuario.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
      return res.status(401).json({ message: "Correo o contraseña inválidos" });
    }
    if (usuario.estado !== "activo") {
      return res.status(403).json({ message: "La cuenta está inactiva" });
    }

    await usuario.update({ ultimoAcceso: new Date() });
    return res.json({
      token: crearToken(usuario, jwtSecret),
      usuario: usuarioPublico(usuario),
    });
  } catch (error) {
    console.error("Error en login:", error.message);
    return res.status(500).json({ message: "No fue posible iniciar sesión" });
  }
};

export const perfil = async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.usuarioId, {
    attributes: { exclude: ["passwordHash"] },
    include: [{ model: Cliente, as: "perfilCliente" }],
  });
  return usuario
    ? res.json(usuario)
    : res.status(404).json({ message: "Usuario no encontrado" });
};
