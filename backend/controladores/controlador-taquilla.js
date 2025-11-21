/**
 * Controlador de taquilla
 * Maneja validación de boletos y registro de ingresos
 */

const servicioBoletos = require('../servicios/servicio-boletos');
const servicioRegistros = require('../servicios/servicio-registros');
const servicioEventos = require('../servicios/servicio-eventos');
const { ErrorValidacion, ErrorNoEncontrado } = require('../middlewares/manejo-errores');
const { CODIGOS_ERROR, ESTADOS_BOLETO } = require('../config/constantes');

/**
 * Validar código QR de boleto
 * POST /api/taquilla/validar
 */
async function validarBoleto(req, res) {
	try {
		const { codigo_qr } = req.body;
		const usuarioTaquilla = req.usuario;

		// Buscar boleto por código QR
		let boleto;
		try {
			boleto = await servicioBoletos.obtenerBoletoPorCodigoQR(codigo_qr);
		} catch (error) {
			return res.status(400).json({
				exito: false,
				valido: false,
				codigo: CODIGOS_ERROR.BOLETO_INVALIDO,
				mensaje: 'Código QR inválido o boleto no encontrado'
			});
		}

		// Verificar estado del boleto
		if (boleto.estado === ESTADOS_BOLETO.CANCELADO) {
			return res.status(400).json({
				exito: false,
				valido: false,
				codigo: CODIGOS_ERROR.BOLETO_INVALIDO,
				mensaje: 'Este boleto ha sido cancelado'
			});
		}

		if (boleto.estado === ESTADOS_BOLETO.USADO) {
			return res.status(400).json({
				exito: false,
				valido: false,
				codigo: CODIGOS_ERROR.BOLETO_YA_USADO,
				mensaje: 'Este boleto ya fue utilizado',
				datos: {
					fecha_uso: boleto.fecha_uso
				}
			});
		}

		// Verificar que el evento no haya alcanzado aforo máximo
		const evento = boleto.eventos;
		if (evento.aforo_actual >= evento.aforo_maximo) {
			return res.status(400).json({
				exito: false,
				valido: false,
				codigo: CODIGOS_ERROR.AFORO_COMPLETO,
				mensaje: 'El evento ha alcanzado su capacidad máxima'
			});
		}

		// Boleto válido - retornar información
		return res.json({
			exito: true,
			valido: true,
			mensaje: 'Boleto válido',
			datos: {
				boleto_id: boleto.id,
				evento: {
					nombre: evento.nombre,
					fecha_inicio: evento.fecha_inicio,
					ubicacion: evento.ubicacion
				},
				asistente: {
					nombre: boleto.usuarios.nombre,
					apellido: boleto.usuarios.apellido,
					email: boleto.usuarios.email
				},
				categoria: boleto.categorias_entradas.nombre,
				aforo: {
					actual: evento.aforo_actual,
					maximo: evento.aforo_maximo,
					disponible: evento.aforo_maximo - evento.aforo_actual
				}
			}
		});

	} catch (error) {
		console.error('Error al validar boleto:', error);
		throw error;
	}
}

/**
 * Registrar ingreso al evento (marcar boleto como usado)
 * POST /api/taquilla/registrar-ingreso
 */
async function registrarIngreso(req, res) {
	try {
		const { codigo_qr, ubicacion_escaneo } = req.body;
		const usuarioTaquilla = req.usuario;

		// Buscar boleto
		const boleto = await servicioBoletos.obtenerBoletoPorCodigoQR(codigo_qr);

		// Verificar que el boleto esté válido
		if (boleto.estado !== ESTADOS_BOLETO.VALIDO) {
			throw new ErrorValidacion('El boleto no está válido para ingreso');
		}

		// Verificar que no tenga ya un ingreso registrado
		const ingresoExistente = await servicioRegistros.verificarIngresoExistente(boleto.id);
		if (ingresoExistente) {
			throw new ErrorValidacion('Este boleto ya tiene un ingreso registrado', {
				codigo: CODIGOS_ERROR.BOLETO_YA_USADO
			});
		}

		// Verificar aforo
		const evento = boleto.eventos;
		if (evento.aforo_actual >= evento.aforo_maximo) {
			throw new ErrorValidacion('El evento ha alcanzado su capacidad máxima', {
				codigo: CODIGOS_ERROR.AFORO_COMPLETO
			});
		}

		// Registrar ingreso
		const nuevoIngreso = await servicioRegistros.registrarIngreso({
			boleto_id: boleto.id,
			evento_id: boleto.evento_id,
			usuario_taquilla_id: usuarioTaquilla.id,
			ubicacion_escaneo: ubicacion_escaneo || null
		});

		// Marcar boleto como usado
		await servicioBoletos.marcarBoletoUsado(boleto.id);

		return res.status(201).json({
			exito: true,
			mensaje: 'Ingreso registrado exitosamente',
			datos: {
				ingreso_id: nuevoIngreso.id,
				fecha_ingreso: nuevoIngreso.fecha_ingreso,
				asistente: `${boleto.usuarios.nombre} ${boleto.usuarios.apellido}`,
				categoria: boleto.categorias_entradas.nombre
			}
		});

	} catch (error) {
		console.error('Error al registrar ingreso:', error);
		throw error;
	}
}

/**
 * Obtener ingresos de un evento
 * GET /api/taquilla/ingresos/:eventoId
 */
async function obtenerIngresosPorEvento(req, res) {
	try {
		const { eventoId } = req.params;
		const ingresos = await servicioRegistros.obtenerIngresosPorEvento(eventoId);

		return res.json({
			exito: true,
			datos: ingresos
		});

	} catch (error) {
		console.error('Error al obtener ingresos:', error);
		throw error;
	}
}

/**
 * Obtener ingresos recientes de un evento
 * GET /api/taquilla/ingresos-recientes/:eventoId
 */
async function obtenerIngresosRecientes(req, res) {
	try {
		const { eventoId } = req.params;
		const { limite = 50 } = req.query;

		const ingresos = await servicioRegistros.obtenerIngresosRecientes(
			eventoId,
			parseInt(limite)
		);

		return res.json({
			exito: true,
			datos: ingresos
		});

	} catch (error) {
		console.error('Error al obtener ingresos recientes:', error);
		throw error;
	}
}

/**
 * Obtener aforo actual de un evento
 * GET /api/taquilla/aforo/:eventoId
 */
async function obtenerAforoActual(req, res) {
	try {
		const { eventoId } = req.params;

		const evento = await servicioEventos.obtenerEventoPorId(eventoId);
		const cantidadIngresos = await servicioRegistros.obtenerCantidadIngresos(eventoId);

		return res.json({
			exito: true,
			datos: {
				aforo_actual: evento.aforo_actual,
				aforo_maximo: evento.aforo_maximo,
				ingresos_registrados: cantidadIngresos,
				disponible: evento.aforo_maximo - evento.aforo_actual,
				porcentaje_ocupacion: ((evento.aforo_actual / evento.aforo_maximo) * 100).toFixed(2)
			}
		});

	} catch (error) {
		console.error('Error al obtener aforo actual:', error);
		throw error;
	}
}

/**
 * Obtener estadísticas de ingresos por categoría
 * GET /api/taquilla/estadisticas-ingresos/:eventoId
 */
async function obtenerEstadisticasIngresos(req, res) {
	try {
		const { eventoId } = req.params;
		const estadisticas = await servicioRegistros.obtenerEstadisticasIngresosPorCategoria(eventoId);

		return res.json({
			exito: true,
			datos: estadisticas
		});

	} catch (error) {
		console.error('Error al obtener estadísticas de ingresos:', error);
		throw error;
	}
}

module.exports = {
	validarBoleto,
	registrarIngreso,
	obtenerIngresosPorEvento,
	obtenerIngresosRecientes,
	obtenerAforoActual,
	obtenerEstadisticasIngresos
};

