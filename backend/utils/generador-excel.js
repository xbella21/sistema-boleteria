/**
 * Utilidad para generar reportes en formato Excel
 */

const ExcelJS = require('exceljs');

/**
 * Genera un reporte de asistentes en formato Excel
 * @param {Object} evento - Información del evento
 * @param {Array} asistentes - Lista de asistentes
 * @returns {Promise<Buffer>} - Buffer del archivo Excel
 */
async function generarReporteAsistentesExcel(evento, asistentes) {
	try {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'Sistema de Gestión de Eventos';
		workbook.created = new Date();

		const worksheet = workbook.addWorksheet('Asistentes');

		// Título del reporte
		worksheet.mergeCells('A1:F1');
		const titleCell = worksheet.getCell('A1');
		titleCell.value = `Reporte de Asistentes - ${evento.nombre}`;
		titleCell.font = { size: 16, bold: true };
		titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
		worksheet.getRow(1).height = 30;

		// Información del evento
		worksheet.getCell('A2').value = 'Fecha del evento:';
		worksheet.getCell('B2').value = new Date(evento.fecha_inicio).toLocaleString('es-ES');
		worksheet.getCell('A3').value = 'Ubicación:';
		worksheet.getCell('B3').value = evento.ubicacion;
		worksheet.addRow([]);

		// Encabezados de la tabla
		const headerRow = worksheet.addRow([
			'Nombre',
			'Apellido',
			'Email',
			'Categoría',
			'Código Boleto',
			'Fecha de Compra',
			'Estado'
		]);

		headerRow.font = { bold: true };
		headerRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF2B6CB0' }
		};
		headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
		headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

		// Datos de asistentes
		asistentes.forEach((asistente) => {
			worksheet.addRow([
				asistente.nombre,
				asistente.apellido,
				asistente.email,
				asistente.categoria,
				asistente.codigo_qr,
				new Date(asistente.fecha_compra).toLocaleString('es-ES'),
				asistente.estado
			]);
		});

		// Ajustar ancho de columnas
		worksheet.columns = [
			{ width: 20 },
			{ width: 20 },
			{ width: 30 },
			{ width: 15 },
			{ width: 30 },
			{ width: 20 },
			{ width: 15 }
		];

		// Aplicar bordes a todas las celdas con datos
		const lastRow = worksheet.lastRow.number;
		for (let i = 5; i <= lastRow; i++) {
			for (let j = 1; j <= 7; j++) {
				const cell = worksheet.getRow(i).getCell(j);
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
			}
		}

		// Generar buffer
		const buffer = await workbook.xlsx.writeBuffer();
		return buffer;

	} catch (error) {
		console.error('Error al generar Excel:', error);
		throw new Error('No se pudo generar el archivo Excel');
	}
}

/**
 * Genera un reporte de ventas por categoría en Excel
 * @param {Object} evento - Información del evento
 * @param {Array} ventas - Ventas por categoría
 * @returns {Promise<Buffer>} - Buffer del archivo Excel
 */
async function generarReporteVentasExcel(evento, ventas) {
	try {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'Sistema de Gestión de Eventos';
		workbook.created = new Date();

		const worksheet = workbook.addWorksheet('Ventas por Categoría');

		// Título
		worksheet.mergeCells('A1:E1');
		const titleCell = worksheet.getCell('A1');
		titleCell.value = `Reporte de Ventas - ${evento.nombre}`;
		titleCell.font = { size: 16, bold: true };
		titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
		worksheet.getRow(1).height = 30;

		// Información del evento
		worksheet.getCell('A2').value = 'Fecha del evento:';
		worksheet.getCell('B2').value = new Date(evento.fecha_inicio).toLocaleString('es-ES');
		worksheet.getCell('A3').value = 'Fecha del reporte:';
		worksheet.getCell('B3').value = new Date().toLocaleString('es-ES');
		worksheet.addRow([]);

		// Encabezados
		const headerRow = worksheet.addRow([
			'Categoría',
			'Precio Unitario',
			'Cantidad Vendida',
			'Total Ingresos',
			'% del Total'
		]);

		headerRow.font = { bold: true };
		headerRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF2B6CB0' }
		};
		headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
		headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

		// Calcular total de ingresos
		const totalIngresos = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);

		// Datos de ventas
		ventas.forEach((venta) => {
			const porcentaje = (parseFloat(venta.total) / totalIngresos * 100).toFixed(2);
			worksheet.addRow([
				venta.categoria,
				parseFloat(venta.precio).toFixed(2),
				venta.cantidad,
				parseFloat(venta.total).toFixed(2),
				`${porcentaje}%`
			]);
		});

		// Fila de totales
		const totalRow = worksheet.addRow([
			'TOTAL',
			'',
			ventas.reduce((sum, v) => sum + v.cantidad, 0),
			totalIngresos.toFixed(2),
			'100%'
		]);
		totalRow.font = { bold: true };
		totalRow.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFE2E8F0' }
		};

		// Ajustar ancho de columnas
		worksheet.columns = [
			{ width: 25 },
			{ width: 18 },
			{ width: 18 },
			{ width: 18 },
			{ width: 15 }
		];

		// Aplicar bordes
		const lastRow = worksheet.lastRow.number;
		for (let i = 5; i <= lastRow; i++) {
			for (let j = 1; j <= 5; j++) {
				const cell = worksheet.getRow(i).getCell(j);
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
			}
		}

		// Generar buffer
		const buffer = await workbook.xlsx.writeBuffer();
		return buffer;

	} catch (error) {
		console.error('Error al generar Excel de ventas:', error);
		throw new Error('No se pudo generar el archivo Excel');
	}
}

module.exports = {
	generarReporteAsistentesExcel,
	generarReporteVentasExcel
};

