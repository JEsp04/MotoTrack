const notFound = (res) =>
  res.status(404).json({ message: "Recurso no encontrado" });

const sendError = (res, error) => {
  if (error.name === "SequelizeUniqueConstraintError")
    return res.status(409).json({
      message: "Ya existe un recurso con ese valor único",
      errors: error.errors,
    });
  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeForeignKeyConstraintError"
  )
    return res
      .status(400)
      .json({ message: "Datos inválidos", errors: error.errors });
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const createCrudController = (
  Model,
  { idField, include = [], attributes } = {},
) => {
  const options = attributes ? { attributes } : {};
  const findOptions = { ...options, include };
  const getById = (id) => Model.findByPk(id, findOptions);
  return {
    listar: async (_req, res) => {
      try {
        res.json(
          await Model.findAll({ ...findOptions, order: [[idField, "DESC"]] }),
        );
      } catch (error) {
        sendError(res, error);
      }
    },

    obtenerPorId: async (req, res) => {
      try {
        const item = await getById(req.params.id);
        return item ? res.json(item) : notFound(res);
      } catch (error) {
        sendError(res, error);
      }
    },

    crear: async (req, res) => {
      try {
        const item = await Model.create(req.body);
        res.status(201).json(await getById(item[idField]));
      } catch (error) {
        sendError(res, error);
      }
    },

    actualizar: async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return notFound(res);
        await item.update(req.body);
        res.json(await getById(item[idField]));
      } catch (error) {
        sendError(res, error);
      }
    },

    eliminar: async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return notFound(res);
        await item.destroy();
        res.status(204).send();
      } catch (error) {
        sendError(res, error);
      }
    },
  };
};
