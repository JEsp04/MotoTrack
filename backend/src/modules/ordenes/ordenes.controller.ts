import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import {
  agregarServicioSchema,
  cambiarEstadoSchema,
  crearOrdenSchema,
  diagnosticoSchema,
  fechaEntregaSchema,
  actividadSchema,
  listarOrdenesSchema,
  retiroSchema,
} from './ordenes.schemas.js';
import * as ordenesService from './ordenes.service.js';

type ConId = Request<{ id: string }>;

export async function listar(req: Request, res: Response) {
  const query = listarOrdenesSchema.parse(req.query);
  res.json(await ordenesService.listarOrdenes(usuarioActual(req), query));
}

/** HU-85 · Últimos cambios de estado de las órdenes visibles, en una sola consulta */
export async function actividad(req: Request, res: Response) {
  const { limit } = actividadSchema.parse(req.query);
  res.json({ data: await ordenesService.actividadReciente(usuarioActual(req), limit) });
}

/** HU-90 · Seguimiento público de la orden (sin sesión) */
export async function seguimiento(req: ConId, res: Response) {
  res.json({ data: await ordenesService.seguimientoPublico(req.params.id) });
}

export async function obtener(req: ConId, res: Response) {
  res.json({ data: await ordenesService.obtenerOrden(usuarioActual(req), req.params.id) });
}

export async function crear(req: Request, res: Response) {
  const input = crearOrdenSchema.parse(req.body);
  res.status(201).json({ data: await ordenesService.crearOrden(usuarioActual(req), input) });
}

export async function cambiarEstado(req: ConId, res: Response) {
  const input = cambiarEstadoSchema.parse(req.body);
  res.json({
    data: await ordenesService.cambiarEstado(usuarioActual(req), req.params.id, input),
  });
}

export async function fechaEntrega(req: ConId, res: Response) {
  const input = fechaEntregaSchema.parse(req.body);
  res.json({
    data: await ordenesService.cambiarFechaEntrega(usuarioActual(req), req.params.id, input),
  });
}

export async function diagnostico(req: ConId, res: Response) {
  const input = diagnosticoSchema.parse(req.body);
  const { creado, orden } = await ordenesService.guardarDiagnostico(
    usuarioActual(req),
    req.params.id,
    input,
  );
  res.status(creado ? 201 : 200).json({ data: orden });
}

export async function agregarServicio(req: ConId, res: Response) {
  const input = agregarServicioSchema.parse(req.body);
  res.status(201).json({
    data: await ordenesService.agregarServicio(usuarioActual(req), req.params.id, input),
  });
}

export async function quitarServicio(
  req: Request<{ id: string; detalleId: string }>,
  res: Response,
) {
  res.json({
    data: await ordenesService.quitarServicio(
      usuarioActual(req),
      req.params.id,
      req.params.detalleId,
    ),
  });
}

export async function retiro(req: ConId, res: Response) {
  const input = retiroSchema.parse(req.body);
  res.json({
    data: await ordenesService.registrarRetiro(usuarioActual(req), req.params.id, input),
  });
}
