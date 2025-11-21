/**
 * Utilidad para generar documentos PDF
 */

const PDFDocument = require('pdfkit');
const { PDF_CONFIG } = require('../config/constantes');

/**
 * Genera un boleto digital en formato PDF
 * @param {Object} boleto - Información del boleto
 * @param {Object} evento - Información del evento
 * @param {Object} usuario - Información del usuario
 * @param {Buffer} qrBuffer - Buffer del código QR
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generarBoletoPDF(boleto, evento, usuario, qrBuffer) {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({
				size: PDF_CONFIG.TAMANO_PAGINA,
				margins: PDF_CONFIG.MARGENES
			});

			const buffers = [];
			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => {
				const pdfBuffer = Buffer.concat(buffers);
				resolve(pdfBuffer);
			});
			doc.on('error', reject);

			// Encabezado
			doc.fontSize(24)
				.font('Helvetica-Bold')
				.text('BOLETO DE EVENTO', { align: 'center' })
				.moveDown();

			// Línea divisoria
			doc.moveTo(50, doc.y)
				.lineTo(550, doc.y)
				.stroke()
				.moveDown();

			// Información del evento
			doc.fontSize(18)
				.font('Helvetica-Bold')
				.text(evento.nombre, { align: 'center' })
				.moveDown(0.5);

			doc.fontSize(12)
				.font('Helvetica')
				.text(`Fecha: ${new Date(evento.fecha_inicio).toLocaleString('es-ES')}`, { align: 'center' })
				.text(`Ubicación: ${evento.ubicacion}`, { align: 'center' })
				.moveDown(2);

			// Información del asistente
			doc.fontSize(14)
				.font('Helvetica-Bold')
				.text('Información del Asistente')
				.moveDown(0.5);

			doc.fontSize(11)
				.font('Helvetica')
				.text(`Nombre: ${usuario.nombre} ${usuario.apellido}`)
				.text(`Email: ${usuario.email}`)
				.moveDown(2);

			// Información del boleto
			doc.fontSize(14)
				.font('Helvetica-Bold')
				.text('Información del Boleto')
				.moveDown(0.5);

			doc.fontSize(11)
				.font('Helvetica')
				.text(`Código: ${boleto.codigo_qr}`)
				.text(`Precio: $${parseFloat(boleto.precio_pagado).toFixed(2)}`)
				.text(`Fecha de compra: ${new Date(boleto.fecha_compra).toLocaleString('es-ES')}`)
				.moveDown(2);

			// Código QR centrado
			if (qrBuffer) {
				const qrWidth = 200;
				const qrX = (doc.page.width - qrWidth) / 2;
				
				doc.image(qrBuffer, qrX, doc.y, {
					width: qrWidth,
					align: 'center'
				});
				doc.moveDown(10);
			}

			// Pie de página
			doc.fontSize(9)
				.font('Helvetica')
				.text('Este boleto es personal e intransferible. Presente este código QR en la entrada del evento.', {
					align: 'center'
				})
				.moveDown(0.5)
				.text('Sistema de Gestión de Eventos', { align: 'center' });

			doc.end();

		} catch (error) {
			console.error('Error al generar PDF del boleto:', error);
			reject(new Error('No se pudo generar el PDF del boleto'));
		}
	});
}

/**
 * Genera un reporte de ventas en PDF
 * @param {Object} evento - Información del evento
 * @param {Array} ventas - Lista de ventas
 * @param {Object} estadisticas - Estadísticas del evento
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generarReporteVentasPDF(evento, ventas, estadisticas) {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({
				size: PDF_CONFIG.TAMANO_PAGINA,
				margins: PDF_CONFIG.MARGENES
			});

			const buffers = [];
			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => {
				const pdfBuffer = Buffer.concat(buffers);
				resolve(pdfBuffer);
			});
			doc.on('error', reject);

			// Encabezado
			doc.fontSize(20)
				.font('Helvetica-Bold')
				.text('REPORTE DE VENTAS', { align: 'center' })
				.moveDown();

			// Información del evento
			doc.fontSize(14)
				.font('Helvetica-Bold')
				.text(evento.nombre)
				.moveDown(0.5);

			doc.fontSize(10)
				.font('Helvetica')
				.text(`Fecha del evento: ${new Date(evento.fecha_inicio).toLocaleString('es-ES')}`)
				.text(`Fecha del reporte: ${new Date().toLocaleString('es-ES')}`)
				.moveDown();

			// Línea divisoria
			doc.moveTo(50, doc.y)
				.lineTo(550, doc.y)
				.stroke()
				.moveDown();

			// Estadísticas generales
			const totalBoletos = estadisticas.total_boletos_vendidos ??
				estadisticas.total_boletos ?? 0;
			const ingresosTotales = parseFloat(estadisticas.ingresos_totales || 0);
			const aforoMaximo = estadisticas.aforo_maximo ?? evento.aforo_maximo ?? 0;
			const aforoActual = estadisticas.aforo_actual ?? evento.aforo_actual ?? 0;
	const aforoRegistrado = estadisticas.aforo_registrado ?? aforoActual;
	const porcentajeOcupacion = aforoMaximo > 0
		? ((aforoRegistrado / aforoMaximo) * 100).toFixed(2)
		: '0.00';

			doc.fontSize(12)
				.font('Helvetica-Bold')
				.text('Resumen General')
				.moveDown(0.5);

			doc.fontSize(10)
				.font('Helvetica')
				.text(`Total de boletos vendidos: ${totalBoletos}`)
				.text(`Ingresos totales: $${ingresosTotales.toFixed(2)}`)
				.text(`Aforo máximo: ${aforoMaximo}`)
				.text(`Aforo actual: ${aforoActual}`)
				.text(`Ingresos registrados (usados): ${aforoRegistrado}`)
				.text(`Porcentaje de ocupación: ${porcentajeOcupacion}%`)
				.moveDown(2);

			// Tabla de ventas
			doc.fontSize(12)
				.font('Helvetica-Bold')
				.text('Detalle de Ventas por Categoría')
				.moveDown(0.5);

			// Encabezados de tabla
			const tableTop = doc.y;
			const col1 = 50;
			const col2 = 250;
			const col3 = 400;

			doc.fontSize(10)
				.font('Helvetica-Bold')
				.text('Categoría', col1, tableTop)
				.text('Cantidad', col2, tableTop)
				.text('Total', col3, tableTop);

			doc.moveTo(50, tableTop + 15)
				.lineTo(550, tableTop + 15)
				.stroke();

			// Filas de datos
			let y = tableTop + 25;
			doc.font('Helvetica');

			ventas.forEach((venta) => {
				doc.text(venta.categoria, col1, y)
					.text(venta.cantidad.toString(), col2, y)
					.text(`$${parseFloat(venta.total).toFixed(2)}`, col3, y);
				y += 20;
			});

			// Pie de página
			doc.fontSize(8)
				.font('Helvetica')
				.text(`Sistema de Gestión de Eventos - ${new Date().toLocaleDateString('es-ES')}`, 50, 750, {
					align: 'center'
				});

			doc.end();

		} catch (error) {
			console.error('Error al generar reporte PDF:', error);
			reject(new Error('No se pudo generar el reporte PDF'));
		}
	});
}

/**
 * Genera un reporte general de eventos en PDF
 * @param {Object} resumen - Datos resumidos
 * @param {Array} resumen.eventos - Lista de eventos con métricas
 * @param {Object} resumen.totales - Totales globales
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generarReporteGeneralPDF(resumen) {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({
				size: PDF_CONFIG.TAMANO_PAGINA,
				margins: PDF_CONFIG.MARGENES
			});

			const buffers = [];
			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => resolve(Buffer.concat(buffers)));
			doc.on('error', reject);

			// Encabezado
			doc.fontSize(20)
				.font('Helvetica-Bold')
				.text('REPORTE GENERAL DE EVENTOS', { align: 'center' })
				.moveDown();

			doc.fontSize(10)
				.font('Helvetica')
				.text(`Generado: ${new Date().toLocaleString('es-ES')}`)
				.moveDown();

			// Totales globales
			const totales = resumen.totales || {};
			doc.fontSize(12)
				.font('Helvetica-Bold')
				.text('Resumen global')
				.moveDown(0.5);

			doc.font('Helvetica')
				.fontSize(10)
				.text(`Eventos analizados: ${totales.eventos || 0}`)
				.text(`Boletos vendidos: ${totales.boletos || 0}`)
				.text(`Ingresos totales: $${(totales.ingresos || 0).toFixed(2)}`)
				.text(`Aforo utilizado: ${totales.aforo_actual || 0} de ${totales.aforo_maximo || 0}`)
				.moveDown();

			doc.moveTo(50, doc.y)
				.lineTo(550, doc.y)
				.stroke()
				.moveDown();

			// Tabla por evento
			doc.fontSize(12)
				.font('Helvetica-Bold')
				.text('Detalle por evento')
				.moveDown(0.5);

			const col = {
				evento: 50,
				organizador: 160,
				estado: 280,
				boletos: 340,
				aforo: 410,
				ingresos: 480
			};

			function dibujarEncabezadosTabla() {
				doc.fontSize(9).font('Helvetica-Bold');
				doc.text('Evento', col.evento, doc.y);
				doc.text('Organizador', col.organizador, doc.y);
				doc.text('Estado', col.estado, doc.y);
				doc.text('Boletos', col.boletos, doc.y);
				doc.text('Aforo', col.aforo, doc.y);
				doc.text('Ingresos', col.ingresos, doc.y);

				doc.moveTo(50, doc.y + 12)
					.lineTo(550, doc.y + 12)
					.stroke();

				return doc.y + 18;
			}

			let y = dibujarEncabezadosTabla();
			doc.font('Helvetica').fontSize(9);

			resumen.eventos.forEach((evento) => {
				if (y > 720) {
					doc.addPage();
					y = dibujarEncabezadosTabla();
					doc.font('Helvetica').fontSize(9);
				}

				doc.text(evento.nombre, col.evento, y, { width: 100 });
				doc.text(evento.organizador || 'N/D', col.organizador, y, { width: 110 });
				doc.text(evento.estado || '-', col.estado, y);
				doc.text(evento.total_boletos.toString(), col.boletos, y);
				const porcentajeAforo = evento.aforo_maximo > 0
					? ((evento.aforo_actual / evento.aforo_maximo) * 100).toFixed(1) + '%'
					: '0%';
				doc.text(porcentajeAforo, col.aforo, y);
				doc.text(`$${evento.ingresos.toFixed(2)}`, col.ingresos, y);

				y += 18;
			});

			doc.end();
		} catch (error) {
			console.error('Error al generar reporte general PDF:', error);
			reject(new Error('No se pudo generar el reporte general PDF'));
		}
	});
}

module.exports = {
	generarBoletoPDF,
	generarReporteVentasPDF,
	generarReporteGeneralPDF
};

