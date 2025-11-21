# 🔐 SEGURIDAD IMPLEMENTADA - DOCUMENTACIÓN PARA PARCIAL

**Proyecto:** Sistema de Gestión de Eventos  
**Características de Seguridad:** ✅ TODAS IMPLEMENTADAS

---

## ✅ 1. CONTRASEÑAS SEGURAS (Hash y Salt)

### Implementación
Las contraseñas se manejan mediante **Supabase Auth**, que implementa automáticamente:

- **Hash:** Algoritmo bcrypt
- **Salt:** Generación automática única por contraseña
- **Costo:** Factor de trabajo adaptativo
- **Las contraseñas NUNCA se almacenan en texto plano**

### Código: Registro de Usuario

**Archivo:** `backend/controladores/controlador-auth.js` (líneas 14-70)

```javascript
async function registro(req, res) {
	try {
		const { email, password, nombre, apellido, telefono } = req.body;

		// Validar que el email no esté ya registrado
		const usuarioExistente = await servicioUsuarios.obtenerUsuarioPorEmail(email);
		if (usuarioExistente) {
			throw new ErrorValidacion('El email ya está registrado');
		}

		// Crear usuario en Supabase Auth
		// Supabase hace automáticamente:
		// 1. Genera un salt único
		// 2. Hashea la contraseña con bcrypt
		// 3. Almacena solo el hash (NUNCA la contraseña en texto plano)
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email,
			password,  // ← Se envía en texto plano pero Supabase la hashea
			options: {
				data: {
					nombre,
					apellido
				}
			}
		});

		if (authError) {
			throw new ErrorAutenticacion(authError.message);
		}

		// Crear registro complementario en tabla usuarios
		const nuevoUsuario = await servicioUsuarios.crearUsuario({
			auth_id: authData.user.id,
			nombre,
			apellido,
			email,
			telefono: telefono || null,
			rol: 'asistente',
			activo: true
		});

		return res.status(201).json({
			exito: true,
			mensaje: 'Usuario registrado exitosamente',
			datos: {
				usuario: {
					id: nuevoUsuario.id,
					nombre: nuevoUsuario.nombre,
					apellido: nuevoUsuario.apellido,
					email: nuevoUsuario.email,
					rol: nuevoUsuario.rol
				},
				sesion: authData.session  // ← Incluye el JWT
			}
		});

	} catch (error) {
		console.error('Error en registro:', error);
		throw error;
	}
}
```

### Proceso de Hashing:
1. Usuario envía: `password: "miPassword123"`
2. Supabase genera salt único: `$2a$10$randomsaltstring`
3. Supabase hashea: `bcrypt(password + salt)` = `$2a$10$randomsaltstring$hashedpasswordstring`
4. Se almacena SOLO el hash en la base de datos
5. La contraseña original **NUNCA** se guarda

### Verificación en Base de Datos:
En Supabase, la tabla `auth.users` almacena:
```sql
-- En auth.users
id: uuid
email: 'usuario@example.com'
encrypted_password: '$2a$10$N9qo8uLOickgx2ZMRZoMye/IjwfKDBrEYJM4Q/rBgOHRYzlYi6L2u'
                    ↑ Hash bcrypt (NO es la contraseña real)
```

### Cambio de Contraseña Seguro

**Archivo:** `backend/controladores/controlador-auth.js` (líneas 233-266)

```javascript
async function cambiarPassword(req, res) {
	try {
		const { passwordActual, passwordNuevo } = req.body;
		const usuario = req.usuario;

		// Verificar contraseña actual
		// Supabase compara el hash almacenado con el hash de la contraseña proporcionada
		const { error: errorVerificacion } = await supabase.auth.signInWithPassword({
			email: usuario.email,
			password: passwordActual
		});

		if (errorVerificacion) {
			throw new ErrorAutenticacion('Contraseña actual incorrecta');
		}

		// Actualizar contraseña
		// Supabase genera nuevo salt y nuevo hash
		const { error } = await supabase.auth.updateUser({
			password: passwordNuevo
		});

		if (error) {
			throw new ErrorAutenticacion(error.message);
		}

		return res.json({
			exito: true,
			mensaje: 'Contraseña actualizada exitosamente'
		});

	} catch (error) {
		console.error('Error al cambiar contraseña:', error);
		throw error;
	}
}
```

---

## ✅ 2. LOGIN CON TOKEN JWT (JSON Web Token)

### Implementación
El sistema usa **JWT (JSON Web Token)** para autenticación stateless y segura.

### Flujo Completo:

```
1. Usuario → POST /api/auth/login
            { email, password }

2. Backend → Verifica con Supabase Auth

3. Supabase → Genera JWT firmado

4. Backend → Retorna JWT al cliente
            { 
              session: {
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refresh_token: "...",
                expires_in: 3600
              }
            }

5. Cliente → Almacena JWT en localStorage

6. Cliente → Incluye JWT en cada request:
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

7. Backend → Verifica JWT en cada request
```

### Código: Login

**Archivo:** `backend/controladores/controlador-auth.js` (líneas 72-117)

```javascript
async function login(req, res) {
	try {
		const { email, password } = req.body;

		// Autenticar con Supabase
		// Supabase:
		// 1. Busca el usuario por email
		// 2. Obtiene el hash almacenado
		// 3. Hashea la contraseña proporcionada con el mismo salt
		// 4. Compara los hashes
		// 5. Si coinciden, genera un JWT
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			throw new ErrorAutenticacion('Credenciales inválidas');
		}

		// Obtener información completa del usuario
		const usuario = await servicioUsuarios.obtenerUsuarioPorAuthId(data.user.id);

		// Verificar que el usuario esté activo
		if (!usuario.activo) {
			throw new ErrorAutenticacion('Usuario inactivo. Contacte al administrador.');
		}

		// Retornar JWT y datos del usuario
		return res.json({
			exito: true,
			mensaje: 'Inicio de sesión exitoso',
			datos: {
				usuario: {
					id: usuario.id,
					nombre: usuario.nombre,
					apellido: usuario.apellido,
					email: usuario.email,
					rol: usuario.rol
				},
				sesion: data.session  // ← Contiene el JWT
			}
		});

	} catch (error) {
		console.error('Error en login:', error);
		throw error;
	}
}
```

### Estructura del JWT Retornado:

```json
{
  "exito": true,
  "mensaje": "Inicio de sesión exitoso",
  "datos": {
    "usuario": {
      "id": "uuid-del-usuario",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "rol": "asistente"
    },
    "sesion": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzAwMDAwMDAwLCJzdWIiOiJ1dWlkLWRlbC11c3VhcmlvIiwiaWF0IjoxNzAwMDAwMDAwfQ.signature",
      "token_type": "bearer",
      "expires_in": 3600,
      "refresh_token": "refresh-token-string"
    }
  }
}
```

### Decodificación del JWT:

Un JWT tiene 3 partes separadas por puntos: `header.payload.signature`

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "aud": "authenticated",
  "exp": 1700000000,
  "sub": "uuid-del-usuario",
  "iat": 1700000000,
  "role": "authenticated"
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

### Almacenamiento en el Cliente:

**Archivo:** `frontend/scripts/auth.js` (líneas 33-36)

```javascript
/**
 * Guardar sesión
 */
guardarSesion(sesion, usuario) {
	// Almacena el JWT en localStorage
	localStorage.setItem(CONFIG.STORAGE_KEYS.SESION, JSON.stringify(sesion));
	localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
}
```

---

## ✅ 3. CONSUMO DE APIs SEGURAS (Authorization Bearer Token)

### Implementación
Todas las peticiones a endpoints protegidos incluyen el JWT en el header `Authorization`.

### Flujo de Petición Segura:

```
Cliente → GET /api/boletos/mis-boletos
          Headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
          
Backend → Middleware autenticacion.js
          1. Extrae el token del header
          2. Verifica la firma del JWT
          3. Valida que no esté expirado
          4. Extrae el user_id del payload
          5. Busca el usuario en la base de datos
          6. Verifica que esté activo
          7. Adjunta el usuario al request
          
Controlador → Accede a req.usuario
              Procesa la petición con permisos verificados
```

### Código Frontend: Cliente API

**Archivo:** `frontend/scripts/api-cliente.js` (líneas 10-60)

```javascript
class APICliente {
	constructor() {
		this.baseURL = CONFIG.API_URL;
	}

	/**
	 * Obtener token de autenticación desde localStorage
	 */
	obtenerToken() {
		const sesion = localStorage.getItem(CONFIG.STORAGE_KEYS.SESION);
		if (sesion) {
			try {
				const sesionData = JSON.parse(sesion);
				return sesionData.access_token;  // ← JWT
			} catch (error) {
				return null;
			}
		}
		return null;
	}

	/**
	 * Realizar petición HTTP con token JWT
	 */
	async request(endpoint, opciones = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.obtenerToken();  // ← Obtiene el JWT

		const headers = {
			'Content-Type': 'application/json',
			...opciones.headers
		};

		// Si hay token, lo incluye en el header Authorization
		if (token) {
			headers.Authorization = `Bearer ${token}`;  // ← CLAVE: Bearer Token
		}

		const config = {
			...opciones,
			headers
		};

		try {
			// Envía la petición con el token JWT
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
	 * Métodos HTTP que usan request() y por lo tanto incluyen el token
	 */
	async get(endpoint) {
		return this.request(endpoint, { method: 'GET' });
	}

	async post(endpoint, data) {
		return this.request(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async put(endpoint, data) {
		return this.request(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async delete(endpoint) {
		return this.request(endpoint, { method: 'DELETE' });
	}
}

// Instancia global
const apiCliente = new APICliente();
```

### Código Backend: Middleware de Autenticación

**Archivo:** `backend/middlewares/autenticacion.js` (líneas 14-76)

```javascript
async function autenticacion(req, res, next) {
	try {
		// 1. EXTRAER TOKEN del header Authorization
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTENTICADO,
				mensaje: MENSAJES_ERROR[CODIGOS_ERROR.NO_AUTENTICADO]
			});
		}

		// 2. REMOVER "Bearer " del header
		const token = authHeader.substring(7);
		// Ahora token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

		// 3. VERIFICAR TOKEN con Supabase
		// Supabase:
		// - Verifica la firma del JWT
		// - Verifica que no esté expirado
		// - Extrae el user_id del payload
		const { data: { user }, error } = await supabase.auth.getUser(token);

		if (error || !user) {
			return res.status(401).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTENTICADO,
				mensaje: 'Token inválido o expirado'
			});
		}

		// 4. OBTENER INFORMACIÓN COMPLETA del usuario
		try {
			const usuarioCompleto = await servicioUsuarios.obtenerUsuarioPorAuthId(user.id);
			
			// 5. VERIFICAR que el usuario esté activo
			if (!usuarioCompleto.activo) {
				return res.status(403).json({
					error: true,
					codigo: CODIGOS_ERROR.NO_AUTORIZADO,
					mensaje: 'Usuario inactivo'
				});
			}

			// 6. ADJUNTAR USUARIO al request
			// Ahora todos los controladores pueden acceder a req.usuario
			req.usuario = usuarioCompleto;
			req.authId = user.id;

		} catch (error) {
			return res.status(401).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTENTICADO,
				mensaje: 'Usuario no encontrado en el sistema'
			});
		}

		// 7. CONTINUAR al siguiente middleware/controlador
		next();

	} catch (error) {
		console.error('Error en middleware de autenticación:', error);
		return res.status(500).json({
			error: true,
			codigo: CODIGOS_ERROR.ERROR_INTERNO,
			mensaje: MENSAJES_ERROR[CODIGOS_ERROR.ERROR_INTERNO]
		});
	}
}
```

### Ejemplo: Uso en Rutas Protegidas

**Archivo:** `backend/rutas/rutas-boletos.js` (líneas 13-17)

```javascript
/**
 * GET /api/boletos/mis-boletos
 * Obtener boletos del usuario autenticado
 * ← Este endpoint REQUIERE autenticación (middleware)
 */
router.get('/mis-boletos', 
	autenticacion,  // ← MIDDLEWARE: Verifica JWT antes de ejecutar el controlador
	asyncHandler(controladorBoletos.obtenerMisBoletos)
);
```

**Archivo:** `backend/controladores/controlador-boletos.js`

```javascript
async function obtenerMisBoletos(req, res) {
	try {
		// req.usuario ya está disponible gracias al middleware de autenticación
		const usuarioId = req.usuario.id;  // ← Obtenido del JWT verificado

		// Obtener solo los boletos de ESTE usuario
		const boletos = await servicioBoletos.obtenerBoletosPorUsuario(usuarioId);

		return res.json({
			exito: true,
			datos: boletos
		});

	} catch (error) {
		console.error('Error al obtener boletos:', error);
		throw error;
	}
}
```

### Ejemplo Real de Petición:

**Cliente (JavaScript):**
```javascript
// En frontend/paginas/mis-boletos.html
async function cargarBoletos() {
	try {
		// apiCliente automáticamente incluye el JWT en el header
		const response = await apiCliente.get('/boletos/mis-boletos');
		const boletos = response.datos;
		
		mostrarBoletos(boletos);
	} catch (error) {
		console.error('Error:', error);
	}
}
```

**Request HTTP real:**
```http
GET http://localhost:3000/api/boletos/mis-boletos HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzAwMDAwMDAwLCJzdWIiOiJ1dWlkLWRlbC11c3VhcmlvIn0.signature
```

**Backend procesa:**
1. Middleware `autenticacion` intercepta
2. Extrae el token del header
3. Verifica con Supabase
4. Adjunta `req.usuario`
5. Ejecuta controlador `obtenerMisBoletos`
6. Retorna solo los boletos del usuario autenticado

---

## 🔒 SEGURIDAD ADICIONAL IMPLEMENTADA

### 1. Rate Limiting
**Archivo:** `backend/servidor.js` (líneas 43-55)

```javascript
// Limitar número de requests por IP
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,  // 15 minutos
	max: 100,                   // Máximo 100 requests
	message: {
		error: true,
		mensaje: 'Demasiadas solicitudes desde esta IP'
	}
});

app.use('/api', limiter);  // ← Protege todas las rutas /api
```

### 2. Helmet (HTTP Security Headers)
**Archivo:** `backend/servidor.js` (línea 27)

```javascript
// Agrega headers de seguridad HTTP
app.use(helmet());
```

Headers que agrega:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Y más...

### 3. CORS Configurado
**Archivo:** `backend/config/constantes.js` (líneas 97-102)

```javascript
const CORS_CONFIG = {
	origin: process.env.FRONTEND_URL || 'http://localhost:5500',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 4. Validación de Entrada
**Archivo:** `backend/middlewares/validacion.js`

Usa `express-validator` para validar todos los inputs antes de procesarlos.

### 5. Row Level Security (RLS) en Base de Datos
**Archivo:** `documentacion/base_de_datos.sql`

Políticas RLS en PostgreSQL para proteger datos a nivel de base de datos.

---

## 📊 RESUMEN PARA EL PARCIAL

### ✅ Contraseñas Seguras
- **Algoritmo:** bcrypt con salt único
- **Ubicación:** Supabase Auth (automático)
- **Archivos:** `backend/controladores/controlador-auth.js`
- **Demostración:** Las contraseñas NUNCA se almacenan en texto plano

### ✅ Login con Token JWT
- **Tipo:** JSON Web Token (JWT)
- **Algoritmo:** HS256
- **Expiración:** 1 hora (configurable)
- **Ubicación:** 
  - Generación: `backend/controladores/controlador-auth.js` (línea 76-117)
  - Almacenamiento: `frontend/scripts/auth.js` (línea 33-36)
- **Demostración:** Token firmado y verificable

### ✅ Consumo de APIs Seguras
- **Método:** Authorization Bearer Token
- **Header:** `Authorization: Bearer <JWT>`
- **Ubicación:**
  - Cliente: `frontend/scripts/api-cliente.js` (línea 38-40)
  - Servidor: `backend/middlewares/autenticacion.js` (línea 14-76)
- **Demostración:** Todas las rutas protegidas verifican el JWT

---

## 🎯 PUNTOS CLAVE PARA LA PRESENTACIÓN

1. **Contraseñas:**
   - "Las contraseñas se hashean con bcrypt y salt único mediante Supabase Auth"
   - "NUNCA se almacenan en texto plano"
   - Mostrar: `controlador-auth.js` líneas 25-34

2. **JWT:**
   - "Al hacer login, el servidor genera un JWT firmado"
   - "El JWT se almacena en el cliente y se envía en cada petición"
   - Mostrar: `controlador-auth.js` líneas 76-117 y localStorage en navegador

3. **APIs Seguras:**
   - "Todas las rutas protegidas requieren el JWT en el header Authorization"
   - "El middleware verifica el token antes de ejecutar cualquier controlador"
   - Mostrar: `autenticacion.js` y demostrar en Network tab del navegador

---

## 🔍 CÓMO DEMOSTRAR EN EL PARCIAL

### 1. Mostrar Código Fuente
- Abrir `backend/controladores/controlador-auth.js`
- Abrir `backend/middlewares/autenticacion.js`
- Abrir `frontend/scripts/api-cliente.js`

### 2. Demostrar en el Navegador
1. Abrir DevTools (F12)
2. Ir a Application → Local Storage
3. Mostrar el JWT almacenado
4. Ir a Network tab
5. Hacer una petición (ej: ver mis boletos)
6. Mostrar el header `Authorization: Bearer ...`

### 3. Decodificar el JWT
Ir a [jwt.io](https://jwt.io) y pegar el token para mostrar el payload.

### 4. Probar Seguridad
1. Intentar acceder a `/api/boletos/mis-boletos` sin token → Error 401
2. Enviar un token inválido → Error 401
3. Enviar un token válido → Success 200

---

## ✅ CHECKLIST FINAL

- [x] **Contraseñas seguras** con bcrypt y salt
- [x] **Login retorna JWT** válido y firmado
- [x] **JWT se almacena** en el cliente
- [x] **JWT se envía** en cada petición (Authorization Bearer)
- [x] **Backend verifica JWT** en cada endpoint protegido
- [x] **Middleware de autenticación** implementado
- [x] **Rate limiting** para prevenir ataques
- [x] **CORS** configurado correctamente
- [x] **Validación de entrada** en todos los endpoints
- [x] **Headers de seguridad** con Helmet

---

**TODAS LAS CARACTERÍSTICAS DE SEGURIDAD ESTÁN IMPLEMENTADAS Y FUNCIONANDO** ✅

Este documento puede ser usado como referencia técnica para demostrar la implementación en el parcial.

