# Sistema de Gestión de Eventos

Sistema completo de gestión de eventos con venta de boletos digitales, control de acceso mediante QR, y reportes en tiempo real.

## 📋 Características

- ✅ **Gestión de eventos** completa (CRUD)
- 🎟️ **Boletos digitales** con código QR único
- 📱 **Validación de acceso** mediante escaneo QR
- 👥 **Sistema de roles** (Administrador, Organizador, Taquilla, Asistente)
- 📊 **Reportes y estadísticas** en PDF y Excel
- ⚡ **Aforo en tiempo real** con Supabase Realtime
- 🔐 **Autenticación segura** con Supabase Auth
- 📦 **Gestión de categorías** de entradas
- 💳 **Compra de boletos** con gestión de disponibilidad

## 🏗️ Arquitectura

### Stack Tecnológico

**Backend:**
- Node.js + Express.js
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- JavaScript ES6+

**Frontend:**
- HTML5 + CSS3 + JavaScript Vanilla
- Arquitectura modular basada en componentes

## 📁 Estructura del Proyecto

```
sistema-de-gestión-de-eventos/
│
├── backend/
│   ├── config/           # Configuración de Supabase y constantes
│   ├── controladores/    # Lógica de negocio
│   ├── servicios/        # Interacción con Supabase
│   ├── middlewares/      # Autenticación, autorización, validación
│   ├── rutas/            # Endpoints del API
│   ├── utils/            # Utilidades (QR, PDF, validaciones)
│   ├── package.json
│   └── servidor.js       # Servidor principal
│
├── frontend/
│   ├── paginas/          # Vistas HTML
│   ├── componentes/      # Componentes reutilizables
│   ├── estilos/          # CSS global y de componentes
│   ├── scripts/          # JavaScript del frontend
│   └── assets/           # Recursos estáticos
│
├── documentacion/
│   ├── requerimientos.md
│   ├── ui_ux.md
│   ├── arquitectura.md
│   └── base_de_datos.sql
│
└── README.md
```

## 🚀 Instalación

### Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta de Supabase (gratuita)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd sistema-de-gestión-de-eventos
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. En el dashboard de Supabase, ir a **SQL Editor**
3. Ejecutar el script `documentacion/base_de_datos.sql` completo
4. Copiar las credenciales:
   - URL del proyecto
   - Clave anónima (anon/public)
   - Clave de servicio (service_role)

### 3. Configurar el Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anonima
SUPABASE_SERVICE_KEY=tu-clave-de-servicio

# Servidor
PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5500

# Logs
LOG_LEVEL=info
```

### 4. Iniciar el Backend

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

### 5. Configurar el Frontend

Editar `frontend/scripts/config.js` y ajustar la URL del API si es necesario:

```javascript
const CONFIG = {
	API_URL: 'http://localhost:3000/api',
	// ... resto de configuración
};
```

### 6. Servir el Frontend

Puedes usar cualquier servidor estático:

**Opción 1: Live Server (VS Code)**
1. Instalar extensión "Live Server"
2. Click derecho en `frontend/paginas/index.html`
3. Seleccionar "Open with Live Server"

**Opción 2: http-server (Node)**
```bash
npx http-server frontend -p 5500
```

**Opción 3: Python**
```bash
cd frontend
python -m http.server 5500
```

El frontend estará disponible en `http://localhost:5500`

## 👤 Crear Usuario Administrador Inicial

Después de ejecutar el script SQL, debes crear el primer usuario administrador:

### Opción 1: Desde Supabase Dashboard

1. Ir a **Authentication** > **Users** en Supabase
2. Crear un nuevo usuario con email y contraseña
3. Copiar el UUID del usuario
4. Ir a **Table Editor** > **usuarios**
5. Insertar un registro:
   ```sql
   INSERT INTO usuarios (auth_id, nombre, apellido, email, rol, activo)
   VALUES ('uuid-del-usuario', 'Admin', 'Sistema', 'admin@eventos.com', 'administrador', true);
   ```

### Opción 2: Desde SQL Editor

```sql
-- Primero crear el usuario en Auth (desde el dashboard)
-- Luego ejecutar:
INSERT INTO usuarios (auth_id, nombre, apellido, email, rol, activo)
VALUES ('uuid-del-usuario-auth', 'Admin', 'Sistema', 'admin@eventos.com', 'administrador', true);
```

## 📖 Uso del Sistema

### Roles y Permisos

#### 👨‍💼 Administrador
- Acceso total al sistema
- CRUD de usuarios, eventos, categorías
- Visualizar reportes globales
- Gestionar configuración del sistema

#### 🎭 Organizador
- Crear y gestionar sus propios eventos
- Ver estadísticas de sus eventos
- Exportar reportes de sus eventos
- Gestionar categorías de sus eventos

#### 🎫 Taquilla
- Escanear códigos QR
- Validar boletos
- Registrar ingresos al evento
- Ver aforo en tiempo real

#### 👤 Usuario Asistente
- Ver catálogo de eventos
- Comprar boletos
- Descargar boletos con QR
- Ver historial de compras

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/registro` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/perfil` - Actualizar perfil

### Eventos
- `GET /api/eventos` - Listar eventos
- `GET /api/eventos/activos` - Eventos activos (público)
- `GET /api/eventos/proximos` - Eventos próximos
- `GET /api/eventos/:id` - Obtener evento
- `POST /api/eventos` - Crear evento (Organizador/Admin)
- `PUT /api/eventos/:id` - Actualizar evento
- `DELETE /api/eventos/:id` - Eliminar evento
- `GET /api/eventos/:id/estadisticas` - Estadísticas del evento

### Boletos
- `GET /api/boletos/mis-boletos` - Boletos del usuario
- `POST /api/boletos/comprar` - Comprar boletos
- `GET /api/boletos/:id` - Obtener boleto
- `GET /api/boletos/:id/descargar` - Descargar boleto PDF
- `PATCH /api/boletos/:id/cancelar` - Cancelar boleto

### Taquilla
- `POST /api/taquilla/validar` - Validar código QR
- `POST /api/taquilla/registrar-ingreso` - Registrar ingreso
- `GET /api/taquilla/aforo/:eventoId` - Aforo actual
- `GET /api/taquilla/ingresos/:eventoId` - Ingresos del evento

### Reportes
- `GET /api/reportes/dashboard` - Dashboard general (Admin)
- `GET /api/reportes/ventas/:eventoId/pdf` - Reporte PDF
- `GET /api/reportes/ventas/:eventoId/excel` - Reporte Excel
- `GET /api/reportes/asistentes/:eventoId/excel` - Lista de asistentes

Ver documentación completa en `/documentacion/arquitectura.md`

## 🎨 Diseño UI/UX

El sistema utiliza un diseño profesional y responsive con:

- **Colores:** Azul primario (#2B6CB0), Verde secundario (#2F855A)
- **Tipografía:** Inter, sistema fonts
- **Componentes:** Tarjetas, botones, formularios, modales, tablas
- **Mobile-first:** Totalmente responsive

Ver guía completa en `/documentacion/ui_ux.md`

## 🔒 Seguridad

- **Autenticación:** JWT via Supabase Auth
- **Autorización:** Middlewares de rol y permisos
- **Row Level Security (RLS):** Políticas en base de datos
- **Validación:** En frontend, backend y base de datos
- **Protección:** CORS, Helmet, Rate Limiting

## 📊 Base de Datos

### Tablas Principales
- `usuarios` - Información de usuarios
- `eventos` - Eventos del sistema
- `categorias_entradas` - Tipos de entradas por evento
- `boletos` - Boletos comprados
- `registro_ingresos` - Ingresos al evento

### Triggers Automáticos
- Actualización de aforo al registrar ingreso
- Actualización de cantidad vendida al comprar boleto
- Actualización de fecha_actualizacion en cambios

Ver esquema completo en `/documentacion/base_de_datos.sql`

## 🧪 Testing

```bash
# Backend tests (futuro)
cd backend
npm test

# Linting
npm run lint
```

## 📦 Dependencias Principales

### Backend
- `express` - Framework web
- `@supabase/supabase-js` - Cliente de Supabase
- `cors` - Middleware CORS
- `helmet` - Seguridad HTTP
- `express-validator` - Validación de datos
- `qrcode` - Generación de códigos QR
- `pdfkit` - Generación de PDFs
- `exceljs` - Generación de Excel

### Frontend
- JavaScript Vanilla (sin dependencias externas)

## 🚢 Deployment

### Backend
Recomendado: Railway, Heroku, Render, o DigitalOcean

```bash
# Variables de entorno en producción
NODE_ENV=production
PORT=3000
SUPABASE_URL=<tu-url>
SUPABASE_KEY=<tu-key>
SUPABASE_SERVICE_KEY=<tu-service-key>
FRONTEND_URL=<url-de-tu-frontend>
```

### Frontend
Recomendado: Vercel, Netlify, o Cloudflare Pages

Actualizar `frontend/scripts/config.js` con la URL de producción del API.

### Base de Datos
Ya está en Supabase (managed)

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit cambios (`git commit -m 'Agregar NuevaCaracteristica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia ISC.

## 👨‍💻 Autor

Sistema de Gestión de Eventos - 2024

## 📞 Soporte

Para reportar bugs o solicitar características, por favor abre un issue en el repositorio.

---

**¡Disfruta gestionando tus eventos! 🎉**

