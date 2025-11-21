# Arquitectura del Sistema de Gestión de Eventos

## 1. Visión General

Sistema full-stack desarrollado con arquitectura cliente-servidor, utilizando Supabase como backend-as-a-service para base de datos, autenticación, almacenamiento y funcionalidades en tiempo real.

### 1.1 Stack Tecnológico

**Backend:**
- Node.js + Express.js
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- JavaScript ES6+

**Frontend:**
- HTML5 + CSS3 + JavaScript Vanilla
- Arquitectura modular basada en componentes

## 2. Arquitectura Backend

### 2.1 Estructura de Capas

```
┌─────────────────────────────────────┐
│         Capa de Rutas (API)         │
│      /api/usuarios, /api/eventos    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Capa de Middlewares              │
│   Autenticación, Autorización       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Capa de Controladores            │
│    Lógica de negocio                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Capa de Servicios                │
│    Interacción con Supabase         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Supabase                     │
│  Base de datos + Auth + Storage     │
└──────────────────────────────────────┘
```

### 2.2 Responsabilidades por Capa

#### Capa de Rutas (`/rutas`)
- Define endpoints del API
- Mapea HTTP methods a controladores
- Aplica middlewares específicos
- No contiene lógica de negocio

**Ejemplo:**
```javascript
router.post('/eventos', 
	autenticacion, 
	autorizacion(['administrador', 'organizador']),
	controladorEventos.crear
);
```

#### Capa de Middlewares (`/middlewares`)
- **autenticacion.js:** Verifica token JWT de Supabase
- **autorizacion.js:** Valida roles y permisos
- **validacion.js:** Valida datos de entrada
- **manejo-errores.js:** Captura y formatea errores

#### Capa de Controladores (`/controladores`)
- Recibe requests, extrae datos
- Valida lógica de negocio
- Llama a servicios
- Formatea respuestas
- Maneja errores específicos

**Patrón:**
```javascript
async crear(req, res) {
	try {
		// Validar datos
		// Llamar servicio
		// Responder
	} catch (error) {
		// Manejar error
	}
}
```

#### Capa de Servicios (`/servicios`)
- Interactúa directamente con Supabase
- Operaciones CRUD
- Lógica de datos
- Transacciones
- No conoce HTTP

**Patrón:**
```javascript
async crearEvento(datosEvento) {
	const { data, error } = await supabase
		.from('eventos')
		.insert(datosEvento);
	
	if (error) throw error;
	return data;
}
```

#### Capa de Utilidades (`/utils`)
- Funciones auxiliares reutilizables
- Generación de QR
- Generación de PDF
- Validaciones personalizadas
- Helpers generales

### 2.3 Flujo de una Request

```
1. Cliente hace request → /api/eventos [POST]
2. Express recibe y enruta → rutas/eventos.js
3. Middleware de autenticación → Valida token
4. Middleware de autorización → Verifica rol
5. Middleware de validación → Valida datos
6. Controlador → controladorEventos.crear()
7. Servicio → servicioEventos.crear()
8. Supabase → INSERT en base de datos
9. Servicio devuelve resultado
10. Controlador formatea respuesta
11. Cliente recibe JSON response
```

## 3. Arquitectura Frontend

### 3.1 Estructura Modular

```
frontend/
├── paginas/           # Vistas completas HTML
├── componentes/       # Componentes reutilizables
├── scripts/           # Lógica JavaScript por página
├── estilos/           # CSS modular
└── assets/            # Recursos estáticos
```

### 3.2 Patrón de Componentes

Aunque usamos JavaScript vanilla, seguimos patrón de componentes:

**Estructura de un componente:**
```javascript
// componentes/tarjeta-evento.js
function crearTarjetaEvento(evento) {
	return `
		<div class="tarjeta-evento">
			<img src="${evento.imagen_url}" alt="${evento.nombre}">
			<h3>${evento.nombre}</h3>
			<p>${evento.descripcion}</p>
		</div>
	`;
}
```

### 3.3 Gestión de Estado

**Estado Local:**
- Variables en cada script
- LocalStorage para persistencia
- SessionStorage para datos temporales

**Estado Global:**
```javascript
// scripts/estado-global.js
const estadoGlobal = {
	usuario: null,
	sesion: null,
	cargarUsuario() { },
	cerrarSesion() { }
};
```

### 3.4 Comunicación con API

```javascript
// scripts/api-cliente.js
class APICliente {
	constructor() {
		this.baseURL = 'http://localhost:3000/api';
		this.token = localStorage.getItem('token');
	}

	async get(endpoint) { }
	async post(endpoint, data) { }
	async put(endpoint, data) { }
	async delete(endpoint) { }
}
```

## 4. Base de Datos

### 4.1 Modelo Entidad-Relación

```
usuarios (1) ────── (N) eventos
                        │
                        │ (1)
                        │
                        ▼ (N)
                  categorias_entradas
                        │
                        │ (1)
                        │
                        ▼ (N)
usuarios (1) ────── (N) boletos ────── (N) registro_ingresos
                        │
                        └──────────────▶ eventos (N:1)
```

### 4.2 Normalización

- Tercera Forma Normal (3NF)
- Sin redundancia de datos
- Integridad referencial con FK
- Constraints para validaciones

### 4.3 Índices

Optimización de consultas frecuentes:
- `usuarios.auth_id`
- `usuarios.email`
- `eventos.organizador_id`
- `boletos.codigo_qr`
- `boletos.usuario_id`

### 4.4 Triggers y Funciones

**Automatizaciones:**
- Actualizar `aforo_actual` al registrar ingreso
- Actualizar `cantidad_vendida` al comprar boleto
- Actualizar `fecha_actualizacion` en cambios

## 5. Seguridad

### 5.1 Autenticación

**Flujo de autenticación:**
```
1. Usuario envía credenciales
2. Frontend llama a Supabase Auth
3. Supabase valida y retorna JWT
4. Frontend guarda token en localStorage
5. Requests incluyen token en header Authorization
6. Backend valida token con Supabase
```

### 5.2 Autorización

**Niveles de control:**

1. **Row Level Security (RLS)** en Supabase
	- Políticas a nivel de base de datos
	- Control granular por fila
	- Independiente del backend

2. **Middlewares en Backend**
	- Validación de roles
	- Verificación de propiedad de recursos
	- Control de acceso a endpoints

3. **Validación en Frontend**
	- Ocultar opciones no permitidas
	- Validación cosmética (no de seguridad)

### 5.3 Validación de Datos

**Capas de validación:**
1. Frontend (UX)
2. Backend middlewares (Seguridad)
3. Base de datos constraints (Integridad)

### 5.4 Protección contra Ataques

- **SQL Injection:** Queries parametrizadas (Supabase)
- **XSS:** Sanitización de inputs, CSP headers
- **CSRF:** Tokens CSRF en formularios
- **Rate Limiting:** Límite de requests por IP
- **CORS:** Configuración restrictiva

## 6. Comunicación en Tiempo Real

### 6.1 Supabase Realtime

**Uso para aforo en vivo:**
```javascript
// Suscripción a cambios en registro_ingresos
const suscripcion = supabase
	.channel('registro_ingresos')
	.on('postgres_changes', 
		{ event: 'INSERT', schema: 'public', table: 'registro_ingresos' },
		(payload) => {
			// Actualizar UI con nuevo ingreso
			actualizarAforoEnPantalla(payload.new);
		}
	)
	.subscribe();
```

### 6.2 Eventos en Tiempo Real

- Nuevo ingreso registrado
- Boleto vendido
- Actualización de aforo
- Cambio de estado de evento

## 7. Almacenamiento de Archivos

### 7.1 Supabase Storage

**Buckets:**
- `eventos-imagenes`: Imágenes de eventos
- `usuarios-avatares`: Fotos de perfil

**Estructura:**
```
eventos-imagenes/
└── {evento_id}/
    └── portada.jpg
```

### 7.2 Flujo de Upload

```
1. Usuario selecciona imagen
2. Frontend valida tipo/tamaño
3. Upload a Supabase Storage
4. Recibe URL pública
5. Guarda URL en base de datos
```

## 8. Generación de Documentos

### 8.1 Códigos QR

**Librería:** `qrcode`

**Contenido del QR:**
```json
{
	"boleto_id": "uuid",
	"evento_id": "uuid",
	"codigo": "hash-unico",
	"timestamp": "2024-01-01T10:00:00Z"
}
```

### 8.2 PDFs

**Librería:** `pdfkit`

**Tipos de PDFs:**
- Boleto digital con QR
- Reporte de ventas
- Reporte de asistencia
- Estadísticas de evento

### 8.3 Excel

**Librería:** `exceljs`

**Exportaciones:**
- Lista de asistentes
- Ventas por categoría
- Ingresos detallados

## 9. Manejo de Errores

### 9.1 Jerarquía de Errores

```javascript
class ErrorAplicacion extends Error {
	constructor(mensaje, codigo, statusHTTP) {
		super(mensaje);
		this.codigo = codigo;
		this.statusHTTP = statusHTTP;
	}
}

class ErrorAutenticacion extends ErrorAplicacion { }
class ErrorAutorizacion extends ErrorAplicacion { }
class ErrorValidacion extends ErrorAplicacion { }
class ErrorNoEncontrado extends ErrorAplicacion { }
```

### 9.2 Middleware de Manejo de Errores

```javascript
function manejarErrores(error, req, res, next) {
	// Log del error
	console.error(error);
	
	// Respuesta al cliente
	res.status(error.statusHTTP || 500).json({
		error: true,
		mensaje: error.mensaje,
		codigo: error.codigo
	});
}
```

## 10. Logging y Monitoreo

### 10.1 Logs

**Niveles:**
- ERROR: Errores críticos
- WARN: Advertencias
- INFO: Información general
- DEBUG: Información de desarrollo

**Registro:**
```javascript
logger.info(`Usuario ${usuario.id} compró boleto para evento ${evento.id}`);
```

### 10.2 Métricas

**Métricas clave:**
- Requests por segundo
- Tiempo de respuesta promedio
- Tasa de errores
- Usuarios activos

## 11. Testing (Futuro)

### 11.1 Tests Unitarios
- Funciones de utilidades
- Servicios
- Validaciones

### 11.2 Tests de Integración
- Endpoints del API
- Flujos completos
- Interacción con Supabase

### 11.3 Tests E2E
- Flujos de usuario completos
- Casos de uso críticos

## 12. Deployment

### 12.1 Variables de Entorno

```env
# Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=

# Servidor
PORT=3000
NODE_ENV=production

# Frontend
API_URL=https://api.eventos.com
```

### 12.2 Proceso de Deploy

**Backend:**
1. Compilar/optimizar código
2. Configurar variables de entorno
3. Deploy a servidor (Heroku, Railway, etc.)

**Frontend:**
1. Optimizar assets
2. Minificar CSS/JS
3. Deploy a CDN/hosting (Vercel, Netlify)

**Base de Datos:**
1. Ejecutar migraciones en Supabase
2. Configurar RLS policies
3. Crear usuario administrador inicial

## 13. Escalabilidad

### 13.1 Horizontal

- Backend: Múltiples instancias con load balancer
- Frontend: CDN para assets estáticos
- Base de datos: Supabase maneja escalado automático

### 13.2 Vertical

- Aumentar recursos de servidor backend
- Optimizar queries de base de datos
- Implementar caché (Redis)

### 13.3 Optimizaciones

- Paginación en listados
- Lazy loading de imágenes
- Compresión Gzip/Brotli
- CDN para assets
- Queries optimizadas con índices

