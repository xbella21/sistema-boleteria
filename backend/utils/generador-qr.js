/**
 * Utilidad para generar códigos QR
 */

const QRCode = require('qrcode');
const { QR_CONFIG } = require('../config/constantes');

/**
 * Genera un código QR como buffer de imagen
 * @param {Object} datos - Datos a codificar en el QR
 * @returns {Promise<Buffer>} - Buffer de la imagen QR
 */
async function generarQRBuffer(datos) {
	try {
		const datosJSON = JSON.stringify(datos);
		
		const opciones = {
			errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION,
			type: 'png',
			quality: QR_CONFIG.QUALITY,
			margin: QR_CONFIG.MARGIN,
			width: QR_CONFIG.WIDTH,
			color: {
				dark: '#000000',
				light: '#FFFFFF'
			}
		};

		const buffer = await QRCode.toBuffer(datosJSON, opciones);
		return buffer;
	} catch (error) {
		console.error('Error al generar QR:', error);
		throw new Error('No se pudo generar el código QR');
	}
}

/**
 * Genera un código QR como Data URL (base64)
 * @param {Object} datos - Datos a codificar en el QR
 * @returns {Promise<string>} - Data URL del QR
 */
async function generarQRDataURL(datos) {
	try {
		const datosJSON = JSON.stringify(datos);
		
		const opciones = {
			errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION,
			type: QR_CONFIG.TYPE,
			quality: QR_CONFIG.QUALITY,
			margin: QR_CONFIG.MARGIN,
			width: QR_CONFIG.WIDTH
		};

		const dataURL = await QRCode.toDataURL(datosJSON, opciones);
		return dataURL;
	} catch (error) {
		console.error('Error al generar QR:', error);
		throw new Error('No se pudo generar el código QR');
	}
}

/**
 * Genera un código único para el boleto
 * @param {string} boletoId - ID del boleto
 * @param {string} eventoId - ID del evento
 * @returns {string} - Código único
 */
function generarCodigoUnico(boletoId, eventoId) {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 15);
	return `${boletoId.substring(0, 8)}-${eventoId.substring(0, 8)}-${timestamp}-${random}`;
}

/**
 * Genera los datos completos para el QR del boleto
 * @param {Object} boleto - Información del boleto
 * @returns {Object} - Datos estructurados para el QR
 */
function generarDatosQRBoleto(boleto) {
	return {
		boleto_id: boleto.id,
		evento_id: boleto.evento_id,
		usuario_id: boleto.usuario_id,
		codigo: boleto.codigo_qr,
		timestamp: new Date().toISOString()
	};
}

module.exports = {
	generarQRBuffer,
	generarQRDataURL,
	generarCodigoUnico,
	generarDatosQRBoleto
};

