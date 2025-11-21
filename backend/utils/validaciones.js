/**
 * Utilidades de validación personalizadas
 */

const { ARCHIVOS } = require('../config/constantes');

/**
 * Valida que una fecha sea futura
 * @param {string|Date} fecha - Fecha a validar
 * @returns {boolean}
 */
function esFechaFutura(fecha) {
	const fechaObj = new Date(fecha);
	const ahora = new Date();
	return fechaObj > ahora;
}

/**
 * Valida que la fecha de fin sea posterior a la fecha de inicio
 * @param {string|Date} fechaInicio
 * @param {string|Date} fechaFin
 * @returns {boolean}
 */
function validarRangoFechas(fechaInicio, fechaFin) {
	const inicio = new Date(fechaInicio);
	const fin = new Date(fechaFin);
	return fin > inicio;
}

/**
 * Valida el formato de un email
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

/**
 * Valida el formato de un teléfono
 * @param {string} telefono
 * @returns {boolean}
 */
function validarTelefono(telefono) {
	const regex = /^[0-9]{10,15}$/;
	return regex.test(telefono.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Valida que un valor sea un número positivo
 * @param {*} valor
 * @returns {boolean}
 */
function esNumeroPositivo(valor) {
	const numero = parseFloat(valor);
	return !isNaN(numero) && numero > 0;
}

/**
 * Valida que un valor sea un entero positivo
 * @param {*} valor
 * @returns {boolean}
 */
function esEnteroPositivo(valor) {
	const numero = parseInt(valor, 10);
	return Number.isInteger(numero) && numero > 0;
}

/**
 * Valida el tipo y tamaño de una imagen
 * @param {Object} archivo - Objeto con información del archivo
 * @returns {Object} - { valido: boolean, error: string }
 */
function validarImagen(archivo) {
	if (!archivo) {
		return { valido: false, error: 'No se proporcionó ningún archivo' };
	}

	// Validar tipo
	if (!ARCHIVOS.TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
		return {
			valido: false,
			error: `Tipo de archivo no permitido. Solo se aceptan: ${ARCHIVOS.TIPOS_IMAGEN_PERMITIDOS.join(', ')}`
		};
	}

	// Validar tamaño
	if (archivo.size > ARCHIVOS.TAMANO_MAXIMO_IMAGEN) {
		return {
			valido: false,
			error: `El archivo es demasiado grande. Tamaño máximo: ${ARCHIVOS.TAMANO_MAXIMO_IMAGEN / 1024 / 1024}MB`
		};
	}

	return { valido: true };
}

/**
 * Valida que un aforo sea válido
 * @param {number} aforoActual
 * @param {number} aforoMaximo
 * @returns {boolean}
 */
function validarAforo(aforoActual, aforoMaximo) {
	return aforoActual >= 0 && aforoActual <= aforoMaximo;
}

/**
 * Valida que haya disponibilidad de entradas
 * @param {number} cantidadSolicitada
 * @param {number} cantidadDisponible
 * @returns {boolean}
 */
function validarDisponibilidad(cantidadSolicitada, cantidadDisponible) {
	return cantidadSolicitada > 0 && cantidadSolicitada <= cantidadDisponible;
}

/**
 * Sanitiza una cadena de texto eliminando caracteres peligrosos
 * @param {string} texto
 * @returns {string}
 */
function sanitizarTexto(texto) {
	if (typeof texto !== 'string') return '';
	return texto.trim().replace(/[<>]/g, '');
}

/**
 * Valida una UUID
 * @param {string} uuid
 * @returns {boolean}
 */
function validarUUID(uuid) {
	const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return regex.test(uuid);
}

/**
 * Valida los parámetros de paginación
 * @param {number} pagina
 * @param {number} limite
 * @returns {Object} - { pagina: number, limite: number }
 */
function validarPaginacion(pagina, limite) {
	const { PAGINACION } = require('../config/constantes');
	
	const paginaValida = Math.max(1, parseInt(pagina) || 1);
	const limiteValido = Math.min(
		PAGINACION.LIMITE_MAXIMO,
		Math.max(1, parseInt(limite) || PAGINACION.LIMITE_DEFAULT)
	);

	return {
		pagina: paginaValida,
		limite: limiteValido
	};
}

module.exports = {
	esFechaFutura,
	validarRangoFechas,
	validarEmail,
	validarTelefono,
	esNumeroPositivo,
	esEnteroPositivo,
	validarImagen,
	validarAforo,
	validarDisponibilidad,
	sanitizarTexto,
	validarUUID,
	validarPaginacion
};

