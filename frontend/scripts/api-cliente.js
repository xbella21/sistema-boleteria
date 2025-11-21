/**
 * Cliente API para comunicación con el backend
 */

class APICliente {
	constructor() {
		this.baseURL = CONFIG.API_URL;
	}

	/**
	 * Obtener token de autenticación
	 */
	obtenerToken() {
		const sesion = localStorage.getItem(CONFIG.STORAGE_KEYS.SESION);
		if (sesion) {
			try {
				const sesionData = JSON.parse(sesion);
				return sesionData.access_token;
			} catch (error) {
				return null;
			}
		}
		return null;
	}

	/**
	 * Realizar petición HTTP
	 */
	async request(endpoint, opciones = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.obtenerToken();

		const headers = {
			'Content-Type': 'application/json',
			...opciones.headers
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const config = {
			...opciones,
			headers
		};

		try {
			const response = await fetch(url, config);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.mensaje || 'Error en la petición');
			}

			return data;
		} catch (error) {
			console.error('Error en petición API:', error);
			throw error;
		}
	}

	/**
	 * GET
	 */
	async get(endpoint) {
		return this.request(endpoint, {
			method: 'GET'
		});
	}

	/**
	 * POST
	 */
	async post(endpoint, data) {
		return this.request(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	/**
	 * PUT
	 */
	async put(endpoint, data) {
		return this.request(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	/**
	 * DELETE
	 */
	async delete(endpoint) {
		return this.request(endpoint, {
			method: 'DELETE'
		});
	}

	/**
	 * PATCH
	 */
	async patch(endpoint, data) {
		return this.request(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	/**
	 * Descargar archivo
	 */
	async descargar(endpoint, nombreArchivo) {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.obtenerToken();

		const headers = {};
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, { headers });
			
			if (!response.ok) {
				throw new Error('Error al descargar archivo');
			}

			const blob = await response.blob();
			const urlBlob = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = urlBlob;
			a.download = nombreArchivo;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(urlBlob);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error al descargar:', error);
			throw error;
		}
	}
}

// Instancia global del cliente API
const apiCliente = new APICliente();

