# 🎯 GUÍA DE PRESENTACIÓN - SISTEMA DE GESTIÓN DE EVENTOS

## 📋 TABLA DE CONTENIDOS
1. [Arquitectura del Proyecto](#1-arquitectura-del-proyecto)
2. [Conexión a Base de Datos](#2-conexión-a-base-de-datos)
3. [Seguridad](#3-seguridad)
4. [Generación de QR](#4-generación-de-qr)
5. [Modelos de Base de Datos](#5-modelos-de-base-de-datos)
6. [Estructura de la API](#6-estructura-de-la-api)
7. [Flujo de Funcionamiento](#7-flujo-de-funcionamiento)

---

## 1. ARQUITECTURA DEL PROYECTO

### Tecnologías Utilizadas
- **Backend:** Node.js + Express.js
- **Base de Datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth (JWT)
- **Frontend:** HTML5 + JavaScript Vanilla
- **Librerías Clave:**
  - `@supabase/supabase-js` - Cliente de Supabase
  - `qrcode` - Generación de códigos QR
  - `pdfkit` - Generación de PDFs
  - `express-validator` - Validación de datos
  - `helmet` + `cors` - Seguridad HTTP

### Estructura de Carpetas
```
backend/
├── config/          # Configuración (Supabase, constantes)
├── controladores/   # Lógica de endpoints HTTP
├── servicios/       # Lógica de negocio
├── middlewares/     # Autenticación, autorización, validación
├── rutas/           # Definición de rutas
└── utils/           # Utilidades (QR, PDF, Excel)
```

---

## 2. CONEXIÓN A BASE DE DATOS

### Configuración (`backend/config/supabase.js`)

**Dos clientes de Supabase:**

1. **Cliente Normal (`supabase`):** Usa clave pública/anónima
   - Para operaciones que respetan RLS (Row Level Security)
   - Usado por middleware de autenticación

2. **Cliente Admin (`supabaseAdmin`):** Usa clave de servicio
   - Bypasea RLS para operaciones administrativas
   - Solo en backend, NUNCA expuesto al cliente

**Variables de Entorno (.env):**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=clave-anon-public
SUPABASE_SERVICE_KEY=clave-service-role
```

**Conexión:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

---

## 3. SEGURIDAD

### 3.1. Hash de Contraseñas

**Ubicación:** `backend/controladores/controlador-auth.js` (registro y cambio de password)

**Tecnología:** **Supabase Auth con bcrypt** (automático)

**Proceso:**
1. Usuario envía contraseña en texto plano (HTTPS protegido)
2. Supabase genera **salt único** automáticamente
3. Hashea con **bcrypt**: `bcrypt(password + salt)`
4. Almacena SOLO el hash en `auth.users.encrypted_password`
5. **NUNCA** se guarda la contraseña original

**Código Clave:**
```javascript
// Registro
const { data, error } = await supabase.auth.signUp({
  email,
  password  // ← Supabase hashea automáticamente con bcrypt
});

// Cambio de contraseña
await supabase.auth.updateUser({
  password: passwordNuevo  // ← Genera nuevo salt y hash
});
```

### 3.2. Generación de Token JWT

**Ubicación:** `backend/controladores/controlador-auth.js` (función `login`)

**Tecnología:** **JWT (JSON Web Token)** firmado por Supabase

**Proceso:**
1. Usuario envía email/password → `POST /api/auth/login`
2. Supabase verifica hash de contraseña
3. Si correcto, **Supabase genera JWT** automáticamente
4. Backend retorna JWT al cliente
5. Cliente almacena en `localStorage`

**Código Clave:**
```javascript
// Login genera el JWT
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// data.session contiene el JWT
return res.json({
  datos: {
    sesion: data.session  // ← JWT con access_token
  }
});
```

**Estructura del JWT:**
```
Header.Payload.Signature
- Header: { alg: "HS256", typ: "JWT" }
- Payload: { sub: "user-id", exp: timestamp, ... }
- Signature: HMACSHA256(header + payload, secret)
```

### 3.3. Autenticación en Endpoints

**Ubicación:** `backend/middlewares/autenticacion.js`

**Proceso:**
1. Cliente envía: `Authorization: Bearer <JWT>`
2. Middleware extrae token del header
3. Verifica con Supabase: `supabase.auth.getUser(token)`
4. Obtiene usuario completo de tabla `usuarios`
5. Agrega `req.usuario` para usar en controladores

**Código Clave:**
```javascript
async function autenticacion(req, res, next) {
  const token = req.headers.authorization.substring(7); // "Bearer "
  
  // Verificar token con Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  // Obtener usuario completo
  req.usuario = await servicioUsuarios.obtenerUsuarioPorAuthId(user.id);
  next();
}
```

### 3.4. Autorización (Roles)

**Ubicación:** `backend/middlewares/autorizacion.js`

**Roles del Sistema:**
- `administrador` - Acceso total
- `organizador` - Gestiona sus eventos
- `taquilla` - Valida boletos
- `asistente` - Compra boletos

**Ejemplo de Uso:**
```javascript
// Solo administradores
router.get('/admin', autenticacion, esAdministrador, controlador);

// Organizadores o admin
router.post('/eventos', autenticacion, esOrganizadorOAdmin, controlador);
```

### 3.5. Otras Medidas de Seguridad

- **Helmet:** Headers HTTP seguros
- **CORS:** Restringe orígenes permitidos
- **Rate Limiting:** Limita requests por IP (100 req/15min)
- **Validación:** `express-validator` valida todos los inputs
- **RLS (Row Level Security):** Políticas a nivel de base de datos

---

## 4. GENERACIÓN DE QR

### Ubicación
- **Utilidad:** `backend/utils/generador-qr.js`
- **Uso en:** `backend/controladores/controlador-boletos.js` (función `comprarBoletos`)

### Proceso

**1. Generación de Código Único:**
```javascript
// backend/utils/generador-qr.js línea 68
function generarCodigoUnico(usuarioId, eventoId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const microsegundos = process.hrtime.bigint().toString().slice(-6);
  
  return `${usuarioStr}-${eventoStr}-${timestamp}-${microsegundos}-${random}`;
}
```

**2. Almacenamiento en Base de Datos:**
```javascript
// backend/servicios/servicio-boletos.js línea 131
async function crearBoleto(datosBoleto) {
  const codigoUnico = generarCodigoUnico(
    datosBoleto.usuario_id,
    datosBoleto.evento_id
  );
  
  const boletoCompleto = {
    ...datosBoleto,
    codigo_qr: codigoUnico,  // ← Guardado en tabla boletos
    estado: 'valido'
  };
  
  // Insertar en base de datos
  const { data } = await supabase.from('boletos').insert(boletoCompleto);
  return data;
}
```

**3. Generación de Imagen QR:**
```javascript
// backend/utils/generador-qr.js línea 42
async function generarQRDataURL(datos) {
  const datosJSON = JSON.stringify(datos); // Datos del boleto
  
  const dataURL = await QRCode.toDataURL(datosJSON, {
    errorCorrectionLevel: 'H',
    width: 300
  });
  
  return dataURL; // Base64 para mostrar en frontend
}
```

**4. Datos Codificados en QR:**
```javascript
// backend/utils/generador-qr.js línea 85
function generarDatosQRBoleto(boleto) {
  return {
    boleto_id: boleto.id,
    evento_id: boleto.evento_id,
    usuario_id: boleto.usuario_id,
    codigo: boleto.codigo_qr,
    timestamp: new Date().toISOString()
  };
}
```

**5. Integración en Compra:**
```javascript
// backend/controladores/controlador-boletos.js línea 194
const boletosConQR = await Promise.all(
  boletosCreados.map(async (boleto) => {
    const datosQR = generarDatosQRBoleto(boleto);
    const qrDataURL = await generarQRDataURL(datosQR);
    return {
      ...boleto,
      qr_data_url: qrDataURL  // ← QR en base64 para mostrar
    };
  })
);
```

**6. Validación en Taquilla:**
- Frontend escanea QR → decodifica JSON
- Envía `codigo_qr` al backend: `POST /api/taquilla/validar`
- Backend busca boleto por `codigo_qr`
- Verifica estado, validez, evento
- Marca como usado si es válido

---

## 5. MODELOS DE BASE DE DATOS

### Tablas Principales

**1. `usuarios`**
- `id` (UUID) - PK
- `auth_id` (UUID) - FK a `auth.users`
- `nombre`, `apellido`, `email`, `telefono`
- `rol` - administrador/organizador/taquilla/asistente
- `activo` (boolean)

**2. `eventos`**
- `id` (UUID) - PK
- `organizador_id` (UUID) - FK a usuarios
- `nombre`, `descripcion`, `ubicacion`, `direccion`
- `fecha_inicio`, `fecha_fin`
- `aforo_maximo`, `aforo_actual`
- `estado` - activo/cancelado/finalizado/borrador

**3. `categorias_entradas`**
- `id` (UUID) - PK
- `evento_id` (UUID) - FK a eventos
- `nombre`, `descripcion`
- `precio` (DECIMAL)
- `cantidad_disponible`, `cantidad_vendida`

**4. `boletos`**
- `id` (UUID) - PK
- `evento_id` (UUID) - FK a eventos
- `usuario_id` (UUID) - FK a usuarios
- `categoria_id` (UUID) - FK a categorias_entradas
- `codigo_qr` (VARCHAR) - **ÚNICO**, usado para validación
- `precio_pagado` (DECIMAL)
- `estado` - valido/usado/cancelado
- `fecha_compra`, `fecha_uso`

**5. `registro_ingresos`**
- `id` (UUID) - PK
- `boleto_id` (UUID) - FK a boletos
- `evento_id` (UUID) - FK a eventos
- `usuario_taquilla_id` (UUID) - FK a usuarios
- `fecha_ingreso` (TIMESTAMP)
- `ubicacion_escaneo` (VARCHAR)

### Relaciones
- Usuario → muchos Eventos (como organizador)
- Evento → muchos Categorías
- Evento → muchos Boletos
- Usuario → muchos Boletos
- Boleto → muchos Registro_Ingresos (historial)

---

## 6. ESTRUCTURA DE LA API

### 6.1. Rutas (`backend/rutas/`)

**Función:** Definir endpoints HTTP y aplicar middlewares

**Archivos:**
- `rutas-auth.js` - Login, registro, refresh token
- `rutas-usuarios.js` - CRUD usuarios
- `rutas-eventos.js` - CRUD eventos
- `rutas-categorias.js` - CRUD categorías
- `rutas-boletos.js` - Compra, consulta, descarga PDF
- `rutas-taquilla.js` - Validar QR, estadísticas
- `rutas-reportes.js` - Reportes Excel/PDF

**Ejemplo:**
```javascript
// backend/rutas/rutas-boletos.js
router.post('/comprar',
  autenticacion,           // ← Middleware: verificar JWT
  validarComprarBoletos,   // ← Middleware: validar datos
  controladorBoletos.comprarBoletos  // ← Controlador
);
```

### 6.2. Controladores (`backend/controladores/`)

**Función:** Manejar request/response HTTP

**Responsabilidades:**
- Extraer datos de `req.body`, `req.params`
- Validar permisos (usando `req.usuario`)
- Llamar a servicios
- Formatear respuesta JSON
- Manejar errores

**Ejemplo:**
```javascript
// backend/controladores/controlador-boletos.js
async function comprarBoletos(req, res) {
  const usuario = req.usuario;  // ← Del middleware de autenticación
  const { evento_id, categoria_id, cantidad } = req.body;
  
  // Llamar a servicio
  const boletos = await servicioBoletos.crearBoletos(...);
  
  // Responder
  return res.status(201).json({
    exito: true,
    datos: { boletos }
  });
}
```

**Controladores:**
- `controlador-auth.js` - Autenticación
- `controlador-usuarios.js` - Gestión usuarios
- `controlador-eventos.js` - Gestión eventos
- `controlador-boletos.js` - Compra y gestión boletos
- `controlador-taquilla.js` - Validación QR
- `controlador-reportes.js` - Generación reportes

### 6.3. Servicios (`backend/servicios/`)

**Función:** Lógica de negocio e interacción con base de datos

**Responsabilidades:**
- Operaciones CRUD en base de datos
- Validaciones de negocio
- Transformaciones de datos
- Consultas complejas

**Ejemplo:**
```javascript
// backend/servicios/servicio-boletos.js
async function crearBoleto(datosBoleto) {
  // Generar código QR único
  const codigoUnico = generarCodigoUnico(...);
  
  // Preparar datos
  const boletoCompleto = {
    ...datosBoleto,
    codigo_qr: codigoUnico,
    estado: 'valido'
  };
  
  // Insertar en base de datos
  const { data, error } = await supabase
    .from('boletos')
    .insert(boletoCompleto)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

**Servicios:**
- `servicio-usuarios.js` - Operaciones con usuarios
- `servicio-eventos.js` - Operaciones con eventos
- `servicio-categorias.js` - Gestión de categorías
- `servicio-boletos.js` - Gestión de boletos
- `servicio-registros.js` - Registro de ingresos

### 6.4. Middlewares (`backend/middlewares/`)

**Función:** Procesar requests antes de llegar al controlador

**Middlewares Principales:**

1. **`autenticacion.js`** - Verifica JWT
   - Extrae token de `Authorization: Bearer <token>`
   - Valida con Supabase
   - Agrega `req.usuario`

2. **`autorizacion.js`** - Verifica permisos/roles
   - `esAdministrador` - Solo admins
   - `esOrganizadorOAdmin` - Organizadores o admins
   - `esPropietarioEventoOAdmin` - Verifica dueño del evento

3. **`validacion.js`** - Valida datos de entrada
   - Usa `express-validator`
   - Valida formato, rangos, tipos

4. **`manejo-errores.js`** - Manejo centralizado de errores
   - Captura errores de controladores
   - Formatea respuesta de error
   - Logs

---

## 7. FLUJO DE FUNCIONAMIENTO

### Flujo de Login
```
1. Cliente → POST /api/auth/login { email, password }
2. Controlador → Llama a Supabase Auth
3. Supabase → Verifica hash de contraseña
4. Supabase → Genera JWT
5. Controlador → Retorna JWT al cliente
6. Cliente → Almacena JWT en localStorage
```

### Flujo de Compra de Boletos
```
1. Cliente → POST /api/boletos/comprar { evento_id, categoria_id, cantidad }
   + Header: Authorization: Bearer <JWT>

2. Middleware autenticacion → Verifica JWT, agrega req.usuario

3. Controlador comprarBoletos → 
   - Valida cantidad (1-10)
   - Verifica evento activo
   - Verifica disponibilidad

4. Servicio crearBoletos →
   - Genera código QR único
   - Inserta boletos en BD
   - Actualiza aforo del evento

5. Utilidad generador-qr →
   - Genera imagen QR (base64)
   - Codifica datos del boleto

6. Controlador → Retorna boletos con QR al cliente

7. Cliente → Muestra QR y permite descarga PDF
```

### Flujo de Validación QR (Taquilla)
```
1. Taquilla escanea QR → Decodifica JSON

2. Cliente → POST /api/taquilla/validar { codigo_qr }

3. Middleware autenticacion → Verifica JWT (rol taquilla/admin)

4. Controlador validarBoleto →
   - Busca boleto por codigo_qr
   - Verifica estado (valido/usado/cancelado)
   - Verifica evento activo
   - Verifica fecha del evento

5. Servicio marcarBoletoUsado →
   - Actualiza estado a "usado"
   - Registra en tabla registro_ingresos

6. Controlador → Retorna resultado (válido/inválido)
```

---

## 📌 PUNTOS CLAVE PARA LA PRESENTACIÓN

### Seguridad
- ✅ Contraseñas: Hash bcrypt con salt único (Supabase Auth automático)
- ✅ JWT: Generado por Supabase al hacer login
- ✅ Autenticación: Middleware verifica JWT en cada request protegido
- ✅ Autorización: Middleware verifica roles (admin/organizador/taquilla)
- ✅ Rate Limiting, CORS, Helmet, Validación de inputs

### QR
- ✅ Código único: Generado con timestamp + random + microsegundos
- ✅ Almacenamiento: Guardado en tabla `boletos.codigo_qr` (único)
- ✅ Generación imagen: Librería `qrcode` convierte JSON a imagen base64
- ✅ Validación: Backend busca boleto por `codigo_qr` y verifica estado

### Arquitectura
- ✅ **Rutas** → Definen endpoints y middlewares
- ✅ **Controladores** → Manejan HTTP request/response
- ✅ **Servicios** → Lógica de negocio y BD
- ✅ **Middlewares** → Autenticación, autorización, validación

### Base de Datos
- ✅ **Supabase** (PostgreSQL)
- ✅ **Dos clientes:** Normal (RLS) y Admin (bypass RLS)
- ✅ **5 tablas principales:** usuarios, eventos, categorias_entradas, boletos, registro_ingresos

---

## 🎯 RESPUESTAS RÁPIDAS

**¿Dónde se hashea la clave?**
→ `backend/controladores/controlador-auth.js` (registro). Supabase Auth hashea automáticamente con bcrypt.

**¿Dónde se genera el token?**
→ `backend/controladores/controlador-auth.js` (login). Supabase genera JWT automáticamente al autenticar.

**¿Dónde se genera el QR?**
→ `backend/utils/generador-qr.js` (generarQRDataURL). Usado en `controlador-boletos.js` al comprar.

**¿Qué modelos hay?**
→ 5 tablas: usuarios, eventos, categorias_entradas, boletos, registro_ingresos.

**¿Qué hacen los controladores?**
→ Manejan HTTP request/response, validan permisos, llaman servicios.

**¿Qué hacen los servicios?**
→ Lógica de negocio, operaciones CRUD en BD, validaciones de negocio.

**¿Qué hacen las rutas?**
→ Definen endpoints HTTP, aplican middlewares (auth, validación).

---

**Última actualización:** Para presentación del proyecto

