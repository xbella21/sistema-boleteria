/**
 * Controlador de reportes
 * Maneja generación de reportes en PDF y Excel
 */

const servicioEventos = require('../servicios/servicio-eventos');
const servicioBoletos = require('../servicios/servicio-boletos');
const servicioUsuarios = require('../servicios/servicio-usuarios');
const { generarReporteVentasPDF } = require('../utils/generador-pdf');
const { generarReporteAsistentesExcel, generarReporteVentasExcel } = require('../utils/generador-excel');
const { ErrorNoEncontrado } = require('../middlewares/manejo-errores');

/**
 * Generar reporte de ventas en PDF
 * GET /api/reportes/ventas/:eventoId/pdf
 */
async function generarReporteVentasPDFController(req, res) {
	try {
		const { eventoId } = req.params;

		// Obtener información del evento
		const evento = await servicioEventos.obtenerEventoPorId(eventoId);
		if (!evento) {
			throw new ErrorNoEncontrado('Evento no encontrado');
		}

		// Obtener estadísticas del evento
		const estadisticas = await servicioEventos.obtenerEstadisticasEvento(eventoId);

		// Obtener ventas por categoría (simulado - ajustar según datos reales)
		const boletos = await servicioBoletos.obtenerBoletosPorEvento(eventoId);
		
		// Agrupar boletos por categoría
		const ventasPorCategoria = {};
		boletos.forEach(boleto => {
			const catId = boleto.categoria_id;
			const catNombre = boleto.categorias_entradas?.nombre || 'Sin categoría';
			
			if (!ventasPorCategoria[catId]) {
				ventasPorCategoria[catId] = {
					categoria: catNombre,
					cantidad: 0,
					total: 0
				};
			}
			
			ventasPorCategoria[catId].cantidad++;
			ventasPorCategoria[catId].total += parseFloat(boleto.precio_pagado);
		});

		const ventas = Object.values(ventasPorCategoria);

		// Generar PDF
		const pdfBuffer = await generarReporteVentasPDF(evento, ventas, estadisticas);

		// Configurar headers para descarga
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename=reporte-ventas-${evento.nombre}.pdf`);
		res.setHeader('Content-Length', pdfBuffer.length);

		return res.send(pdfBuffer);

	} catch (error) {
		console.error('Error al generar reporte de ventas PDF:', error);
		throw error;
	}
}

/**
 * Generar reporte de asistentes en Excel
 * GET /api/reportes/asistentes/:eventoId/excel
 */
async function generarReporteAsistentesExcelController(req, res) {
	try {
		const { eventoId } = req.params;

		// Obtener información del evento
		const evento = await servicioEventos.obtenerEventoPorId(eventoId);
		if (!evento) {
			throw new ErrorNoEncontrado('Evento no encontrado');
		}

		// Obtener boletos del evento
		const boletos = await servicioBoletos.obtenerBoletosPorEvento(eventoId);

		// Formatear datos de asistentes
		const asistentes = boletos.map(boleto => ({
			nombre: boleto.usuarios?.nombre || '',
			apellido: boleto.usuarios?.apellido || '',
			email: boleto.usuarios?.email || '',
			categoria: boleto.categorias_entradas?.nombre || '',
			codigo_qr: boleto.codigo_qr,
			fecha_compra: boleto.fecha_compra,
			estado: boleto.estado
		}));

		// Generar Excel
		const excelBuffer = await generarReporteAsistentesExcel(evento, asistentes);

		// Configurar headers para descarga
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename=asistentes-${evento.nombre}.xlsx`);
		res.setHeader('Content-Length', excelBuffer.length);

		return res.send(excelBuffer);

	} catch (error) {
		console.error('Error al generar reporte de asistentes Excel:', error);
		throw error;
	}
}

/**
 * Generar reporte de ventas en Excel
 * GET /api/reportes/ventas/:eventoId/excel
 */
async function generarReporteVentasExcelController(req, res) {
	try {
		const { eventoId } = req.params;

		// Obtener información del evento
		const evento = await servicioEventos.obtenerEventoPorId(eventoId);
		if (!evento) {
			throw new ErrorNoEncontrado('Evento no encontrado');
		}

		// Obtener boletos del evento
		const boletos = await servicioBoletos.obtenerBoletosPorEvento(eventoId);

		// Agrupar por categoría
		const ventasPorCategoria = {};
		boletos.forEach(boleto => {
			const catId = boleto.categoria_id;
			const catNombre = boleto.categorias_entradas?.nombre || 'Sin categoría';
			const precio = parseFloat(boleto.precio_pagado);
			
			if (!ventasPorCategoria[catId]) {
				ventasPorCategoria[catId] = {
					categoria: catNombre,
					precio: precio,
					cantidad: 0,
					total: 0
				};
			}
			
			ventasPorCategoria[catId].cantidad++;
			ventasPorCategoria[catId].total += precio;
		});

		const ventas = Object.values(ventasPorCategoria);

		// Generar Excel
		const excelBuffer = await generarReporteVentasExcel(evento, ventas);

		// Configurar headers para descarga
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename=ventas-${evento.nombre}.xlsx`);
		res.setHeader('Content-Length', excelBuffer.length);

		return res.send(excelBuffer);

	} catch (error) {
		console.error('Error al generar reporte de ventas Excel:', error);
		throw error;
	}
}

/**
 * Obtener dashboard con métricas generales (administrador)
 * GET /api/reportes/dashboard
 */
async function obtenerDashboard(req, res) {
	try {
		// Obtener todos los eventos activos
		const eventosResult = await servicioEventos.obtenerEventos({ pagina: 1, limite: 1000 });
		const eventos = eventosResult.eventos;

		// Obtener total de usuarios
		const totalUsuarios = await servicioUsuarios.obtenerTotalUsuarios();
		console.log('Dashboard - totalUsuarios recibido:', totalUsuarios);
		console.log('Dashboard - tipo de totalUsuarios:', typeof totalUsuarios);

		// Calcular métricas generales
		const totalEventos = eventos.length;
		const eventosActivos = eventos.filter(e => e.estado === 'activo').length;
		const eventosPasados = eventos.filter(e => e.estado === 'finalizado').length;

		// Obtener estadísticas de todos los eventos
		let totalBoletos = 0;
		let ingresosTotales = 0;
		let aforoTotalOcupado = 0;
		let aforoTotalMaximo = 0;

		for (const evento of eventos) {
			const estadisticas = await servicioEventos.obtenerEstadisticasEvento(evento.id);
			totalBoletos += estadisticas.total_boletos_vendidos || 0;
			ingresosTotales += parseFloat(estadisticas.ingresos_totales || 0);
			aforoTotalOcupado += evento.aforo_actual || 0;
			aforoTotalMaximo += evento.aforo_maximo || 0;
		}

		const respuesta = {
			exito: true,
			datos: {
				total_eventos: totalEventos,
				total_usuarios: totalUsuarios,
				total_boletos: totalBoletos,
				ingresos_totales: ingresosTotales.toFixed(2),
				eventos: {
					total: totalEventos,
					activos: eventosActivos,
					finalizados: eventosPasados
				},
				ventas: {
					total_boletos: totalBoletos,
					ingresos_totales: ingresosTotales.toFixed(2)
				},
				aforo: {
					ocupado: aforoTotalOcupado,
					maximo: aforoTotalMaximo,
					porcentaje: aforoTotalMaximo > 0 
						? ((aforoTotalOcupado / aforoTotalMaximo) * 100).toFixed(2)
						: 0
				}
			}
		};
		
		console.log('Dashboard - respuesta completa:', JSON.stringify(respuesta, null, 2));
		console.log('Dashboard - total_usuarios en respuesta:', respuesta.datos.total_usuarios);
		
		return res.json(respuesta);

	} catch (error) {
		console.error('Error al obtener dashboard:', error);
		throw error;
	}
}

module.exports = {
	generarReporteVentasPDFController,
	generarReporteAsistentesExcelController,
	generarReporteVentasExcelController,
	obtenerDashboard
};

