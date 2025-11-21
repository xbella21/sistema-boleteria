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
			doc.fontSize(12)
				.font('Helvetica-Bold')
				.text('Resumen General')
				.moveDown(0.5);

			doc.fontSize(10)
				.font('Helvetica')
				.text(`Total de boletos vendidos: ${estadisticas.total_boletos}`)
				.text(`Ingresos totales: $${parseFloat(estadisticas.ingresos_totales).toFixed(2)}`)
				.text(`Aforo máximo: ${evento.aforo_maximo}`)
				.text(`Aforo actual: ${evento.aforo_actual}`)
				.text(`Porcentaje de ocupación: ${((evento.aforo_actual / evento.aforo_maximo) * 100).toFixed(2)}%`)
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

module.exports = {
	generarBoletoPDF,
	generarReporteVentasPDF
};

