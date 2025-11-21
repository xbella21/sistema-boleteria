# Guía de UI/UX - Sistema de Gestión de Eventos

## 1. Principios de Diseño

### 1.1 Diseño Visual
- **Simplicidad:** Interfaces limpias y minimalistas
- **Consistencia:** Elementos coherentes en todo el sistema
- **Jerarquía visual:** Información importante destacada
- **Espaciado:** Uso generoso de espacios en blanco

### 1.2 Experiencia de Usuario
- **Intuitividad:** Flujos naturales y predecibles
- **Feedback:** Respuestas visuales inmediatas
- **Prevención de errores:** Validaciones en tiempo real
- **Recuperación:** Mensajes de error claros y soluciones

## 2. Paleta de Colores

### 2.1 Colores Principales
```css
--color-primario: #2B6CB0;      /* Azul profesional */
--color-secundario: #2F855A;    /* Verde éxito */
--color-error: #E53E3E;         /* Rojo error */
--color-advertencia: #DD6B20;   /* Naranja advertencia */
--color-info: #3182CE;          /* Azul información */
```

### 2.2 Colores Neutros
```css
--color-fondo: #F7FAFC;         /* Fondo general claro */
--color-blanco: #FFFFFF;        /* Blanco puro */
--color-gris-claro: #E2E8F0;    /* Bordes y separadores */
--color-gris-medio: #718096;    /* Texto secundario */
--color-gris-oscuro: #2D3748;   /* Texto principal */
--color-negro: #1A202C;         /* Texto títulos */
```

### 2.3 Aplicación de Colores
- **Botones primarios:** Color primario con hover más oscuro
- **Botones secundarios:** Bordes con color primario, fondo blanco
- **Botones de éxito:** Color secundario (verde)
- **Botones de peligro:** Color error (rojo)
- **Fondos:** Color fondo o blanco según contexto
- **Textos:** Gris oscuro/negro para lectura óptima

## 3. Tipografía

### 3.1 Fuentes
**Familia principal:** Inter, Poppins, Roboto o system-ui

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### 3.2 Tamaños
```css
--fuente-xs: 12px;    /* Etiquetas pequeñas */
--fuente-sm: 14px;    /* Texto normal */
--fuente-md: 16px;    /* Texto destacado */
--fuente-lg: 20px;    /* Subtítulos */
--fuente-xl: 24px;    /* Títulos secciones */
--fuente-2xl: 32px;   /* Títulos principales */
--fuente-3xl: 40px;   /* Títulos hero */
```

### 3.3 Pesos
- **Regular (400):** Texto normal
- **Medium (500):** Texto destacado
- **Semibold (600):** Subtítulos
- **Bold (700):** Títulos importantes

## 4. Componentes UI

### 4.1 Botones

**Tamaños:**
- Pequeño: `padding: 8px 16px; font-size: 14px;`
- Mediano: `padding: 12px 24px; font-size: 16px;`
- Grande: `padding: 16px 32px; font-size: 18px;`

**Estilos:**
- Border radius: `8px`
- Transición: `all 0.3s ease`
- Cursor: `pointer`
- Sin bordes por defecto

**Variantes:**
- Primario: Fondo color primario, texto blanco
- Secundario: Borde color primario, texto primario, fondo transparente
- Éxito: Fondo verde, texto blanco
- Peligro: Fondo rojo, texto blanco
- Deshabilitado: Opacidad 0.5, cursor not-allowed

### 4.2 Tarjetas (Cards)

```css
.tarjeta {
	background: white;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	padding: 24px;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.tarjeta:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

### 4.3 Formularios

**Campos de entrada:**
```css
.input {
	width: 100%;
	padding: 12px 16px;
	border: 2px solid #E2E8F0;
	border-radius: 8px;
	font-size: 14px;
	transition: border-color 0.3s ease;
}

.input:focus {
	outline: none;
	border-color: #2B6CB0;
}

.input.error {
	border-color: #E53E3E;
}
```

**Etiquetas:**
```css
.label {
	display: block;
	margin-bottom: 8px;
	font-weight: 500;
	color: #2D3748;
}
```

**Mensajes de error:**
```css
.mensaje-error {
	color: #E53E3E;
	font-size: 12px;
	margin-top: 4px;
}
```

### 4.4 Navegación

**Barra superior:**
- Altura: `64px`
- Fondo: Blanco con sombra sutil
- Logo a la izquierda
- Menú de navegación centrado
- Perfil/usuario a la derecha

**Menú lateral (admin/organizador):**
- Ancho: `280px`
- Fondo: Blanco o gris muy claro
- Iconos + texto para cada opción
- Resaltado del ítem activo

### 4.5 Modales

```css
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-contenido {
	background: white;
	border-radius: 12px;
	padding: 32px;
	max-width: 600px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
}
```

### 4.6 Alertas y Notificaciones

**Posición:** Superior derecha, fixed
**Tipos:**
- Éxito: Fondo verde claro, borde verde
- Error: Fondo rojo claro, borde rojo
- Advertencia: Fondo naranja claro, borde naranja
- Información: Fondo azul claro, borde azul

**Duración:** 5 segundos auto-dismiss con opción de cerrar

### 4.7 Tablas

```css
.tabla {
	width: 100%;
	border-collapse: collapse;
	background: white;
	border-radius: 8px;
	overflow: hidden;
}

.tabla th {
	background: #F7FAFC;
	padding: 16px;
	text-align: left;
	font-weight: 600;
	color: #2D3748;
}

.tabla td {
	padding: 16px;
	border-top: 1px solid #E2E8F0;
}

.tabla tr:hover {
	background: #F7FAFC;
}
```

### 4.8 Badges (Etiquetas de estado)

```css
.badge {
	display: inline-block;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
}

.badge-exito { background: #C6F6D5; color: #22543D; }
.badge-error { background: #FED7D7; color: #742A2A; }
.badge-info { background: #BEE3F8; color: #2C5282; }
.badge-advertencia { background: #FEEBC8; color: #7C2D12; }
```

## 5. Layouts y Grid

### 5.1 Contenedor Principal
```css
.contenedor {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 24px;
}
```

### 5.2 Grid de Eventos
```css
.grid-eventos {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 24px;
}
```

### 5.3 Layout de Dashboard
```css
.dashboard {
	display: grid;
	grid-template-columns: 280px 1fr;
	gap: 24px;
	min-height: 100vh;
}
```

## 6. Responsive Design

### 6.1 Breakpoints
```css
/* Móvil */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

### 6.2 Adaptaciones Móviles
- Menú lateral se convierte en menú hamburguesa
- Grid de eventos pasa a 1 columna
- Tablas con scroll horizontal
- Botones ocupan todo el ancho
- Padding reducido en contenedores

## 7. Animaciones y Transiciones

### 7.1 Transiciones Comunes
```css
transition: all 0.3s ease;
```

### 7.2 Loaders
- Spinner circular para carga de página
- Barra de progreso para uploads
- Skeleton screens para contenido

### 7.3 Microinteracciones
- Hover en botones: Cambio de color/elevación
- Hover en cards: Elevación y sombra
- Focus en inputs: Borde de color
- Click en botones: Efecto ripple

## 8. Iconografía

**Librería recomendada:** Feather Icons, Heroicons o Font Awesome

**Tamaños:**
- Pequeño: 16px
- Mediano: 20px
- Grande: 24px
- Extra grande: 32px

**Uso:**
- Botones: Icono + texto
- Navegación: Icono destacado
- Estados: Iconos de check, error, info

## 9. Accesibilidad

### 9.1 Contraste
- Ratio mínimo: 4.5:1 para texto normal
- Ratio mínimo: 3:1 para texto grande

### 9.2 Navegación por Teclado
- Orden lógico de tabs
- Focus visible en elementos interactivos
- Skip links para saltar navegación

### 9.3 Semántica HTML
- Uso correcto de headings (h1, h2, h3)
- Labels asociados a inputs
- Alt text en imágenes
- ARIA labels cuando sea necesario

## 10. Páginas y Vistas

### 10.1 Página de Inicio
- Hero section con imagen destacada
- Grid de eventos próximos
- Buscador de eventos
- Call-to-action claro

### 10.2 Detalle de Evento
- Imagen grande del evento
- Información completa
- Selector de categoría y cantidad
- Botón de compra destacado
- Mapa de ubicación (futuro)

### 10.3 Dashboard Administrador
- Sidebar con navegación
- Tarjetas con métricas principales
- Gráficos y estadísticas
- Tabla de eventos recientes

### 10.4 Perfil de Usuario
- Avatar/foto de perfil
- Información personal editable
- Historial de boletos
- Botones de acción (editar, cerrar sesión)

### 10.5 Validación QR (Taquilla)
- Vista centrada en scanner
- Feedback visual grande (✓ o ✗)
- Información mínima del boleto
- Botón para siguiente escaneo

## 11. Estados de la UI

### 11.1 Estados de Carga
- Mostrar loader mientras se cargan datos
- Deshabilitar botones durante operaciones
- Mostrar progress bar en uploads

### 11.2 Estados Vacíos
- Mensaje descriptivo cuando no hay datos
- Ilustración o icono representativo
- Call-to-action para primera acción

### 11.3 Estados de Error
- Mensaje de error claro
- Explicación del problema
- Acción sugerida para resolver

### 11.4 Estados de Éxito
- Confirmación visual clara
- Mensaje descriptivo
- Siguiente paso sugerido

## 12. Performance UI

- Imágenes optimizadas (WebP cuando sea posible)
- Lazy loading de imágenes
- CSS crítico inline
- JavaScript diferido cuando sea posible
- Minimizar repaints y reflows

