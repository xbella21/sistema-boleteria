# 🎓 DEMOSTRACIÓN DE SEGURIDAD - GUÍA RÁPIDA PARA PARCIAL

## ✅ CARACTERÍSTICAS IMPLEMENTADAS

### 1. 🔐 CONTRASEÑAS SEGURAS (Hash + Salt)
### 2. 🎫 LOGIN CON TOKEN JWT
### 3. 🔒 CONSUMO DE APIs SEGURAS (Bearer Token)

---

## 📍 UBICACIÓN DEL CÓDIGO

### Contraseñas Seguras
- **Archivo:** `backend/controladores/controlador-auth.js`
- **Líneas:** 14-70 (registro) y 233-266 (cambio de contraseña)
- **Tecnología:** Supabase Auth con bcrypt

### JWT Login
- **Archivo:** `backend/controladores/controlador-auth.js`
- **Líneas:** 72-117
- **Almacenamiento:** `frontend/scripts/auth.js` líneas 33-36

### APIs Seguras
- **Middleware:** `backend/middlewares/autenticacion.js` líneas 14-76
- **Cliente:** `frontend/scripts/api-cliente.js` líneas 10-60

---

## 🎬 DEMOSTRACIÓN PASO A PASO

### PASO 1: Mostrar Hash de Contraseñas

**En el código:**
```javascript
// backend/controladores/controlador-auth.js línea 25
const { data: authData, error: authError } = await supabase.auth.signUp({
	email,
	password,  // ← Se hashea automáticamente con bcrypt
	options: {
		data: { nombre, apellido }
	}
});
```

**Explicar:**
- "La contraseña se envía en texto plano solo entre cliente y servidor (HTTPS)"
- "Supabase Auth automáticamente genera un salt único"
- "Hashea la contraseña con bcrypt"
- "Almacena SOLO el hash, nunca la contraseña original"
- "El hash es irreversible - no se puede obtener la contraseña del hash"

### PASO 2: Mostrar Generación de JWT

**En el código:**
```javascript
// backend/controladores/controlador-auth.js líneas 76-111
async function login(req, res) {
	const { email, password } = req.body;

	// Supabase verifica el hash y genera JWT
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		throw new ErrorAutenticacion('Credenciales inválidas');
	}

	return res.json({
		exito: true,
		mensaje: 'Inicio de sesión exitoso',
		datos: {
			usuario: { ...usuarioData },
			sesion: data.session  // ← JWT aquí
		}
	});
}
```

**Mostrar respuesta JSON:**
```json
{
  "exito": true,
  "datos": {
    "usuario": {...},
    "sesion": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzAwMDAwMDAwLCJzdWIiOiJ1c2VyLWlkIn0.signature",
      "token_type": "bearer",
      "expires_in": 3600
    }
  }
}
```

### PASO 3: Mostrar Almacenamiento del JWT

**En el navegador:**
1. Abrir DevTools (F12)
2. Ir a Application → Local Storage
3. Buscar `sesion_data`
4. Mostrar el JWT almacenado

**En el código:**
```javascript
// frontend/scripts/auth.js línea 33
guardarSesion(sesion, usuario) {
	localStorage.setItem(CONFIG.STORAGE_KEYS.SESION, JSON.stringify(sesion));
	localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
}
```

### PASO 4: Mostrar Envío del JWT en Peticiones

**En el código del cliente:**
```javascript
// frontend/scripts/api-cliente.js líneas 13-40
obtenerToken() {
	const sesion = localStorage.getItem(CONFIG.STORAGE_KEYS.SESION);
	if (sesion) {
		const sesionData = JSON.parse(sesion);
		return sesionData.access_token;  // ← JWT
	}
	return null;
}

async request(endpoint, opciones = {}) {
	const token = this.obtenerToken();
	
	const headers = {
		'Content-Type': 'application/json',
		...opciones.headers
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;  // ← AQUÍ SE ENVÍA
	}

	return fetch(url, { ...opciones, headers });
}
```

**En el navegador:**
1. Abrir DevTools → Network
2. Hacer una petición (ej: ver mis boletos)
3. Click en la petición
4. Ir a Headers
5. **Mostrar:** `Authorization: Bearer eyJhbGc...`

### PASO 5: Mostrar Verificación del JWT en el Backend

**En el código del middleware:**
```javascript
// backend/middlewares/autenticacion.js líneas 14-66
async function autenticacion(req, res, next) {
	// 1. Extraer token del header
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({
			error: true,
			mensaje: 'No autenticado'
		});
	}

	// 2. Obtener el token
	const token = authHeader.substring(7); // Quita "Bearer "

	// 3. Verificar token con Supabase
	const { data: { user }, error } = await supabase.auth.getUser(token);

	if (error || !user) {
		return res.status(401).json({
			error: true,
			mensaje: 'Token inválido o expirado'
		});
	}

	// 4. Obtener datos del usuario
	const usuarioCompleto = await servicioUsuarios.obtenerUsuarioPorAuthId(user.id);
	
	// 5. Verificar que esté activo
	if (!usuarioCompleto.activo) {
		return res.status(403).json({
			error: true,
			mensaje: 'Usuario inactivo'
		});
	}

	// 6. Adjuntar al request
	req.usuario = usuarioCompleto;
	
	// 7. Continuar
	next();
}
```

**Mostrar uso en rutas:**
```javascript
// backend/rutas/rutas-boletos.js línea 17
router.get('/mis-boletos', 
	autenticacion,  // ← Middleware verifica JWT AQUÍ
	asyncHandler(controladorBoletos.obtenerMisBoletos)
);
```

### PASO 6: Demostrar Seguridad Funcionando

**Prueba 1: Sin Token (❌ Falla)**
```javascript
// En consola del navegador:
fetch('http://localhost:3000/api/boletos/mis-boletos', {
	headers: {
		'Content-Type': 'application/json'
		// NO hay Authorization
	}
})
.then(r => r.json())
.then(console.log)

// Resultado: Error 401 "No autenticado"
```

**Prueba 2: Con Token Inválido (❌ Falla)**
```javascript
fetch('http://localhost:3000/api/boletos/mis-boletos', {
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer token-falso-123'  // Token inválido
	}
})
.then(r => r.json())
.then(console.log)

// Resultado: Error 401 "Token inválido"
```

**Prueba 3: Con Token Válido (✅ Funciona)**
```javascript
// Usar apiCliente que incluye el token automáticamente
apiCliente.get('/boletos/mis-boletos')
	.then(response => console.log(response))

// Resultado: 200 OK + lista de boletos
```

---

## 🎯 PUNTOS CLAVE PARA EXPLICAR

### Contraseñas Seguras
- ✅ "Usamos bcrypt para hashear contraseñas"
- ✅ "Cada contraseña tiene un salt único"
- ✅ "Las contraseñas NUNCA se almacenan en texto plano"
- ✅ "El hash es irreversible - no se puede recuperar la contraseña original"
- ✅ "El hash se guarda en la base de datos de Supabase Auth"

### Login con JWT
- ✅ "Al hacer login, el servidor genera un JWT firmado"
- ✅ "El JWT contiene información del usuario (payload)"
- ✅ "El JWT está firmado para prevenir modificaciones"
- ✅ "El JWT tiene expiración (1 hora por defecto)"
- ✅ "El cliente almacena el JWT en localStorage"

### APIs Seguras
- ✅ "El cliente envía el JWT en el header Authorization"
- ✅ "Formato: Authorization: Bearer <token>"
- ✅ "El servidor verifica el JWT en cada petición"
- ✅ "Si el token es inválido, retorna error 401"
- ✅ "El middleware extrae el usuario del token verificado"

---

## 📊 DIAGRAMA DEL FLUJO COMPLETO

```
┌─────────────┐                           ┌─────────────┐
│   CLIENTE   │                           │   SERVIDOR  │
│  (Browser)  │                           │   (Node.js) │
└─────────────┘                           └─────────────┘
      │                                           │
      │  1. POST /api/auth/login                 │
      │     { email, password }                  │
      ├──────────────────────────────────────────>
      │                                           │
      │                                    2. Hashear password
      │                                       y verificar
      │                                           │
      │  3. JWT firmado                          │
      │     { access_token: "eyJ..." }           │
      <─────────────────────────────────────────┤
      │                                           │
4. Guardar JWT                                   │
   en localStorage                               │
      │                                           │
      │  5. GET /api/boletos/mis-boletos         │
      │     Headers:                             │
      │     Authorization: Bearer eyJ...         │
      ├──────────────────────────────────────────>
      │                                           │
      │                                    6. Verificar JWT
      │                                       Extraer user_id
      │                                           │
      │  7. Datos del usuario                    │
      │     (solo sus boletos)                   │
      <─────────────────────────────────────────┤
      │                                           │
```

---

## 🔍 VERIFICACIÓN EN EL NAVEGADOR

### 1. Ver el JWT Almacenado
```
DevTools (F12) → Application → Local Storage → 
localhost:5500 → sesion_data
```

### 2. Ver el JWT Enviándose
```
DevTools (F12) → Network → Seleccionar petición → 
Headers → Request Headers → Authorization: Bearer ...
```

### 3. Decodificar el JWT
```
Copiar el token y pegarlo en: https://jwt.io
Mostrar el payload decodificado
```

---

## 📝 RESUMEN PARA EL PARCIAL

| Característica | Implementado | Ubicación del Código |
|----------------|--------------|---------------------|
| **Contraseñas Seguras** | ✅ | `backend/controladores/controlador-auth.js` |
| **Hash con bcrypt** | ✅ | Supabase Auth (automático) |
| **Salt único** | ✅ | Supabase Auth (automático) |
| **JWT al Login** | ✅ | `backend/controladores/controlador-auth.js:76-117` |
| **JWT Almacenado** | ✅ | `frontend/scripts/auth.js:33-36` |
| **JWT en Peticiones** | ✅ | `frontend/scripts/api-cliente.js:38-40` |
| **Verificación JWT** | ✅ | `backend/middlewares/autenticacion.js:14-76` |
| **Rate Limiting** | ✅ | `backend/servidor.js:43-55` |
| **CORS** | ✅ | `backend/servidor.js:30` |
| **Helmet** | ✅ | `backend/servidor.js:27` |

---

## ✅ CHECKLIST DE DEMOSTRACIÓN

- [ ] Mostrar código de hash de contraseñas
- [ ] Mostrar código de generación de JWT
- [ ] Abrir DevTools y mostrar JWT en localStorage
- [ ] Abrir Network tab y mostrar Authorization header
- [ ] Mostrar middleware de autenticación
- [ ] Probar sin token (debe fallar)
- [ ] Probar con token válido (debe funcionar)
- [ ] Explicar el flujo completo

---

**🎉 TODAS LAS CARACTERÍSTICAS ESTÁN IMPLEMENTADAS Y FUNCIONANDO**

Este proyecto cumple 100% con los requerimientos de seguridad del parcial.

