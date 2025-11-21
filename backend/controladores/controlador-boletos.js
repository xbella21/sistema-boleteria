/**
 * Controlador de boletos
 * Maneja compra, consulta y gestión de boletos
 */

const servicioBoletos = require('../servicios/servicio-boletos');
const servicioCategorias = require('../servicios/servicio-categorias');
const servicioEventos = require('../servicios/servicio-eventos');
const { generarQRDataURL, generarDatosQRBoleto } = require('../utils/generador-qr');
const { generarBoletoPDF } = require('../utils/generador-pdf');
const { generarQRBuffer } = require('../utils/generador-qr');
const { ErrorValidacion, ErrorNoEncontrado } = require('../middlewares/manejo-errores');
const { CODIGOS_ERROR } = require('../config/constantes');

/**
 * Obtener boletos del usuario autenticado
 * GET /api/boletos/mis-boletos
 */
async function obtenerMisBoletos(req, res) {
	try {
		const usuario = req.usuario;
		const boletos = await servicioBoletos.obtenerBoletosPorUsuario(usuario.id);

		// Transformar los datos para que coincidan con lo que espera el frontend
		const boletosTransformados = boletos.map(boleto => ({
			...boleto,
			evento_nombre: boleto.eventos?.nombre || 'Evento desconocido',
			evento_fecha_inicio: boleto.eventos?.fecha_inicio || null,
			evento_ubicacion: boleto.eventos?.ubicacion || 'Ubicación no disponible',
			evento_imagen_url: boleto.eventos?.imagen_url || null,
			categoria_nombre: boleto.categorias_entradas?.nombre || 'Categoría desconocida',
			categoria_descripcion: boleto.categorias_entradas?.descripcion || null
		}));

		return res.json({
			exito: true,
			datos: boletosTransformados
		});

	} catch (error) {
		console.error('Error al obtener boletos del usuario:', error);
		throw error;
	}
}

/**
 * Obtener boletos de un evento (organizador o admin)
 * GET /api/boletos/evento/:eventoId
 */
async function obtenerBoletosPorEvento(req, res) {
	try {
		const { eventoId } = req.params;
		const boletos = await servicioBoletos.obtenerBoletosPorEvento(eventoId);

		return res.json({
			exito: true,
			datos: boletos
		});

	} catch (error) {
		console.error('Error al obtener boletos del evento:', error);
		throw error;
	}
}

/**
 * Obtener un boleto por ID
 * GET /api/boletos/:id
 */
async function obtenerBoletoPorId(req, res) {
	try {
		const { id } = req.params;
		const boleto = await servicioBoletos.obtenerBoletoPorId(id);

		if (!boleto) {
			throw new ErrorNoEncontrado('Boleto no encontrado');
		}

		// Verificar que el boleto pertenece al usuario o es admin/organizador
		const usuario = req.usuario;
		if (boleto.usuario_id !== usuario.id && usuario.rol !== 'administrador' && usuario.rol !== 'organizador') {
			throw new ErrorValidacion('No tiene permiso para ver este boleto');
		}

		// Generar código QR para el boleto
		const datosQR = generarDatosQRBoleto(boleto);
		const qrDataURL = await generarQRDataURL(datosQR);

		// Transformar los datos para que coincidan con lo que espera el frontend
		const boletoTransformado = {
			...boleto,
			evento_nombre: boleto.eventos?.nombre || 'Evento desconocido',
			evento_fecha_inicio: boleto.eventos?.fecha_inicio || null,
			evento_ubicacion: boleto.eventos?.ubicacion || 'Ubicación no disponible',
			evento_imagen_url: boleto.eventos?.imagen_url || null,
			categoria_nombre: boleto.categorias_entradas?.nombre || 'Categoría desconocida',
			categoria_descripcion: boleto.categorias_entradas?.descripcion || null,
			qr_data_url: qrDataURL
		};

		return res.json({
			exito: true,
			datos: boletoTransformado
		});

	} catch (error) {
		console.error('Error al obtener boleto:', error);
		throw error;
	}
}

/**
 * Comprar boletos
 * POST /api/boletos/comprar
 */
async function comprarBoletos(req, res) {
	try {
		const usuario = req.usuario;
		const { evento_id, categoria_id, cantidad } = req.body;

		console.log('=== INICIO COMPRA DE BOLETOS ===');
		console.log('Usuario:', usuario.id);
		console.log('Evento ID:', evento_id);
		console.log('Categoría ID:', categoria_id);
		console.log('Cantidad:', cantidad);

		// Validar cantidad
		if (cantidad < 1 || cantidad > 10) {
			throw new ErrorValidacion('La cantidad debe estar entre 1 y 10');
		}

		// Verificar que el evento existe y está activo
		console.log('Obteniendo evento...');
		const evento = await servicioEventos.obtenerEventoPorId(evento_id);
		console.log('Evento obtenido:', evento.nombre, 'Estado:', evento.estado);
		
		if (evento.estado !== 'activo') {
			throw new ErrorValidacion('El evento no está disponible para compra');
		}

		// Verificar disponibilidad de la categoría
		console.log('Obteniendo categoría...');
		const categoria = await servicioCategorias.obtenerCategoriaPorId(categoria_id);
		console.log('Categoría obtenida:', categoria.nombre, 'Precio:', categoria.precio);
		
		console.log('Verificando disponibilidad...');
		const disponibilidadOk = await servicioCategorias.verificarDisponibilidad(categoria_id, cantidad);
		console.log('Disponibilidad OK:', disponibilidadOk);

		if (!disponibilidadOk) {
			throw new ErrorValidacion('No hay suficientes entradas disponibles', {
				codigo: CODIGOS_ERROR.ENTRADAS_AGOTADAS
			});
		}

		// Verificar aforo del evento
		const aforoDisponible = evento.aforo_maximo - evento.aforo_actual;
		console.log('Aforo disponible:', aforoDisponible, 'de', evento.aforo_maximo);
		
		if (aforoDisponible < cantidad) {
			throw new ErrorValidacion('El evento no tiene capacidad suficiente', {
				codigo: CODIGOS_ERROR.AFORO_COMPLETO
			});
		}

		// Crear boletos
		console.log('Preparando boletos para crear...');
		const precioPagado = parseFloat(categoria.precio);
		if (isNaN(precioPagado) || precioPagado < 0) {
			throw new ErrorValidacion('El precio de la categoría no es válido');
		}
		console.log('Precio a pagar por boleto:', precioPagado);
		
		const boletos = [];
		for (let i = 0; i < cantidad; i++) {
			boletos.push({
				evento_id,
				usuario_id: usuario.id,
				categoria_id,
				precio_pagado: precioPagado
			});
		}
		console.log('Boletos preparados:', boletos.length);

		console.log('Creando boletos en base de datos...');
		const boletosCreados = await servicioBoletos.crearBoletos(boletos);
		console.log('Boletos creados exitosamente:', boletosCreados.length);

		// Actualizar aforo del evento
		console.log('Actualizando aforo del evento...');
		await servicioEventos.actualizarAforoEvento(evento_id, cantidad);
		console.log('Aforo actualizado exitosamente');

		// Generar QR para cada boleto
		const boletosConQR = await Promise.all(
			boletosCreados.map(async (boleto) => {
				const datosQR = generarDatosQRBoleto(boleto);
				const qrDataURL = await generarQRDataURL(datosQR);
				return {
					...boleto,
					qr_data_url: qrDataURL
				};
			})
		);

		return res.status(201).json({
			exito: true,
			mensaje: 'Compra realizada exitosamente',
			datos: {
				boletos: boletosConQR,
				total: parseFloat(categoria.precio) * cantidad
			}
		});

	} catch (error) {
		console.error('Error al comprar boletos:', error);
		throw error;
	}
}

/**
 * Descargar boleto en PDF
 * GET /api/boletos/:id/descargar
 */
async function descargarBoletoPDF(req, res) {
	try {
		const { id } = req.params;
		const usuario = req.usuario;

		const boleto = await servicioBoletos.obtenerBoletoPorId(id);

		if (!boleto) {
			throw new ErrorNoEncontrado('Boleto no encontrado');
		}

		// Verificar que el boleto pertenece al usuario (a menos que sea admin)
		if (usuario.rol !== 'administrador' && boleto.usuario_id !== usuario.id) {
			throw new ErrorValidacion('No tiene permisos para descargar este boleto');
		}

		// Generar QR
		const datosQR = generarDatosQRBoleto(boleto);
		const qrBuffer = await generarQRBuffer(datosQR);

		// Generar PDF
		const pdfBuffer = await generarBoletoPDF(
			boleto,
			boleto.eventos,
			boleto.usuarios,
			qrBuffer
		);

		// Configurar headers para descarga
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename=boleto-${boleto.codigo_qr}.pdf`);
		res.setHeader('Content-Length', pdfBuffer.length);

		return res.send(pdfBuffer);

	} catch (error) {
		console.error('Error al descargar boleto PDF:', error);
		throw error;
	}
}

/**
 * Cancelar un boleto
 * PATCH /api/boletos/:id/cancelar
 */
async function cancelarBoleto(req, res) {
	try {
		const { id } = req.params;
		const usuario = req.usuario;

		const boleto = await servicioBoletos.obtenerBoletoPorId(id);

		if (!boleto) {
			throw new ErrorNoEncontrado('Boleto no encontrado');
		}

		// Verificar permisos
		if (usuario.rol !== 'administrador' && boleto.usuario_id !== usuario.id) {
			throw new ErrorValidacion('No tiene permisos para cancelar este boleto');
		}

		// Verificar que el boleto no esté ya usado
		if (boleto.estado === 'usado') {
			throw new ErrorValidacion('No se puede cancelar un boleto ya utilizado');
		}

		const boletoCancelado = await servicioBoletos.cancelarBoleto(id);

		return res.json({
			exito: true,
			mensaje: 'Boleto cancelado exitosamente',
			datos: boletoCancelado
		});

	} catch (error) {
		console.error('Error al cancelar boleto:', error);
		throw error;
	}
}

/**
 * Obtener estadísticas de boletos de un evento
 * GET /api/boletos/evento/:eventoId/estadisticas
 */
async function obtenerEstadisticasBoletos(req, res) {
	try {
		const { eventoId } = req.params;
		const estadisticas = await servicioBoletos.obtenerEstadisticasBoletos(eventoId);

		return res.json({
			exito: true,
			datos: estadisticas
		});

	} catch (error) {
		console.error('Error al obtener estadísticas de boletos:', error);
		throw error;
	}
}

module.exports = {
	obtenerMisBoletos,
	obtenerBoletosPorEvento,
	obtenerBoletoPorId,
	comprarBoletos,
	descargarBoletoPDF,
	cancelarBoleto,
	obtenerEstadisticasBoletos
};

