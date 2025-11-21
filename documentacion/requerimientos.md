# Requerimientos del Sistema de Gestión de Eventos

## 1. Descripción General

Sistema completo de gestión de eventos que permite a organizadores crear y administrar eventos, a usuarios comprar boletos digitales, y al personal de taquilla validar el acceso mediante códigos QR.

## 2. Objetivos del Sistema

- Facilitar la creación y gestión de eventos
- Automatizar la venta y distribución de boletos digitales
- Proporcionar control de acceso mediante QR
- Generar reportes y estadísticas en tiempo real
- Gestionar el aforo de eventos en tiempo real

## 3. Roles y Permisos

### 3.1 Administrador
**Permisos:**
- Acceso total al sistema
- CRUD completo de usuarios
- CRUD completo de eventos (todos)
- CRUD de categorías de entradas
- Visualizar reportes globales
- Exportar datos (PDF/Excel)
- Monitorear aforo en tiempo real
- Gestionar configuración del sistema

### 3.2 Organizador
**Permisos:**
- CRUD de sus propios eventos
- Gestionar categorías de sus eventos
- Ver estadísticas de sus eventos
- Exportar reportes de sus eventos
- Monitorear aforo de sus eventos

**Restricciones:**
- No puede ver/editar eventos de otros organizadores
- No puede gestionar usuarios

### 3.3 Taquilla
**Permisos:**
- Escanear códigos QR
- Validar boletos
- Registrar ingresos al evento
- Ver información básica del boleto

**Restricciones:**
- No puede crear/editar eventos
- No puede ver estadísticas completas
- Solo acceso a funcionalidades de validación

### 3.4 Usuario Asistente
**Permisos:**
- Ver catálogo de eventos
- Comprar boletos
- Ver su perfil
- Ver historial de compras
- Descargar boletos con QR

**Restricciones:**
- No puede acceder a funciones administrativas
- Solo ve sus propios boletos

## 4. Funcionalidades del Sistema

### 4.1 Gestión de Usuarios
- Registro de nuevos usuarios
- Inicio de sesión (Supabase Auth)
- Recuperación de contraseña
- Actualización de perfil
- Asignación de roles (solo admin)
- Activación/desactivación de usuarios

### 4.2 Gestión de Eventos
- Crear nuevo evento
- Editar información del evento
- Subir imagen del evento
- Definir aforo máximo
- Establecer fechas y ubicación
- Cambiar estado (activo, cancelado, finalizado, borrador)
- Eliminar evento (admin)

### 4.3 Gestión de Categorías de Entradas
- Crear categorías por evento (General, VIP, Premium, etc.)
- Definir precio por categoría
- Establecer cantidad disponible
- Editar/eliminar categorías

### 4.4 Venta de Boletos
- Seleccionar evento
- Elegir categoría de entrada
- Especificar cantidad
- Procesar compra
- Generar código QR único
- Enviar confirmación por email
- Descargar boleto digital

### 4.5 Validación de Boletos
- Escanear código QR desde móvil/cámara
- Validar autenticidad del boleto
- Verificar estado (válido/usado/cancelado)
- Registrar ingreso al evento
- Actualizar aforo en tiempo real
- Mostrar información del asistente

### 4.6 Reportes y Estadísticas
**Reportes disponibles:**
- Total de boletos vendidos por evento
- Ingresos generados
- Tasa de ocupación
- Boletos por categoría
- Ingresos registrados vs boletos vendidos
- Exportación a PDF
- Exportación a Excel

### 4.7 Monitoreo en Tiempo Real
- Aforo actual del evento
- Registro de ingresos en vivo (Supabase Realtime)
- Alertas de capacidad máxima
- Dashboard con métricas actualizadas

## 5. Requerimientos Técnicos

### 5.1 Backend
- **Lenguaje:** JavaScript (Node.js)
- **Framework:** Express.js
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Almacenamiento:** Supabase Storage
- **Tiempo Real:** Supabase Realtime

### 5.2 Frontend
- **Tecnologías:** HTML5, CSS3, JavaScript vanilla
- **Responsive:** Mobile-first design
- **Compatibilidad:** Navegadores modernos (Chrome, Firefox, Safari, Edge)

### 5.3 Librerías Necesarias
- **QR Code:** qrcode para generación de QR
- **PDF:** pdfkit para generación de reportes
- **Excel:** exceljs para exportación de datos
- **Validación:** express-validator

### 5.4 Seguridad
- Autenticación mediante JWT (Supabase)
- Row Level Security (RLS) en base de datos
- Validación de entrada de datos
- Protección contra inyección SQL
- CORS configurado correctamente
- Variables de entorno para credenciales

## 6. Requerimientos No Funcionales

### 6.1 Rendimiento
- Tiempo de carga inicial < 3 segundos
- Respuesta del servidor < 500ms
- Actualización en tiempo real < 1 segundo

### 6.2 Disponibilidad
- Sistema disponible 99.5% del tiempo
- Manejo de errores graceful
- Mensajes de error informativos

### 6.3 Escalabilidad
- Soportar múltiples eventos simultáneos
- Manejo de 1000+ usuarios concurrentes
- Base de datos optimizada con índices

### 6.4 Usabilidad
- Interfaz intuitiva y clara
- Navegación simple
- Feedback visual inmediato
- Accesibilidad (WCAG AA)

### 6.5 Mantenibilidad
- Código modular y documentado
- Separación de responsabilidades
- Arquitectura limpia
- Comentarios en español

## 7. Flujos Principales

### 7.1 Flujo de Compra de Boleto
1. Usuario navega catálogo de eventos
2. Selecciona evento de interés
3. Elige categoría y cantidad
4. Confirma compra
5. Sistema genera boleto con QR
6. Usuario recibe confirmación
7. Usuario descarga boleto digital

### 7.2 Flujo de Validación de Entrada
1. Asistente llega al evento con QR
2. Personal de taquilla escanea QR
3. Sistema valida boleto
4. Si es válido: registra ingreso, actualiza aforo
5. Si es inválido: muestra error
6. Personal permite/rechaza acceso

### 7.3 Flujo de Creación de Evento
1. Organizador/Admin inicia sesión
2. Accede a "Crear Evento"
3. Completa formulario
4. Sube imagen (opcional)
5. Define categorías de entradas
6. Guarda evento
7. Sistema publica evento

## 8. Integraciones

### 8.1 Supabase
- **Auth:** Gestión de usuarios y sesiones
- **Database:** Almacenamiento de datos
- **Storage:** Imágenes de eventos
- **Realtime:** Actualizaciones en vivo

### 8.2 Futuras Integraciones (opcional)
- Pasarela de pagos (Stripe, PayPal)
- Notificaciones por email (SendGrid)
- SMS (Twilio)
- Google Maps para ubicación

## 9. Entregables

1. Código fuente completo (backend + frontend)
2. Scripts SQL de base de datos
3. Documentación técnica
4. Manual de usuario
5. README con instrucciones de instalación
6. Archivos de configuración (.env.example)

## 10. Criterios de Aceptación

- ✅ Todas las funcionalidades implementadas
- ✅ Sistema completamente funcional
- ✅ Roles y permisos correctamente aplicados
- ✅ Interfaz responsive y profesional
- ✅ Código limpio y documentado
- ✅ Sin errores críticos
- ✅ Validaciones funcionando
- ✅ Tiempo real operativo
- ✅ Reportes generándose correctamente

