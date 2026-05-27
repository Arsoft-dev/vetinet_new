# 🧪 Hallazgos y Decisiones Técnicas

## 📊 Vistas vs Relaciones Directas
- **Decisión**: Usar la vista `view_inventory_kardex` para el historial de movimientos.
- **Razón**: Supabase/PostgREST presentaba errores de caché de esquema al intentar detectar relaciones entre `inventory_transactions` y `users`. La vista centraliza la lógica de nombres y pre-calcula los balances, evitando fallos de cliente.

## 🎨 Simetría UI
- **Decisión**: Agrupación de acciones secundarias en un contenedor `grid/flex` unificado.
- **Razón**: El diseño previo era asimétrico y dificultaba la navegación rápida. Se estableció un estándar de botones de gestión de 40px de altura con bordes redondeados Apple-style.

## 🛡️ Estabilidad del Kardex
- **Decisión**: La columna `created_by` es vital.
- **Razón**: Sin el responsable, el sistema pierde valor legal/administrativo. Se forzó su creación en la migración v33.

## 🔒 Consistencia en Políticas RLS (Supabase)
- **Decisión**: Declarar explícitamente políticas RLS para todas las tablas base (`inventory_transfers`, `inventory_transfer_items`) al crearse.
- **Razón**: Supabase puede habilitar RLS por defecto de forma restrictiva. Sin políticas asignadas, las inserciones de fila fallan con el error `42501 (new row violates row-level security policy)`, incluso para usuarios clínicos con sesión activa en Next.js.

## 📱 Altura Máxima Adaptable en Modales Complejos
- **Decisión**: Emplear altura máxima de `90vh` con `flex flex-col` y `overflow-y-auto` en el cuerpo central de modales con gran cantidad de campos o tablas.
- **Razón**: Los modales altos se desbordan del navegador en pantallas de resolución compacta, bloqueando la visibilidad del encabezado y los botones de acción fijos. Con esta estructura, los controles principales quedan siempre accesibles.

## 🎨 Normalización de Clases de Color Tailwind
- **Decisión**: Evitar el uso de clases no oficiales en la paleta de colores (como `slate-850`, `slate-650`).
- **Razón**: Tailwind CSS no las compila y provocan que el elemento renderice con fondos transparentes o bordes blancos de alto contraste inapropiados, rompiendo la armonía estética del Tema Oscuro Premium. Se normalizó al uso de clases oficiales como `slate-800`, `slate-900` y `slate-950`.

## 🧠 Trazabilidad de Discrepancias Inteligentes (Pilar 6)
- **Decisión**: Integrar una columna `discrepancy_reason` en la tabla de ítems de auditoría, sugerir pistas basadas en transacciones del Kardex de los últimos 7 días y calcular el impacto financiero en base a `sale_price` de los productos.
- **Razón**: En la logística de inventario, las diferencias numéricas son solo síntomas de errores operativos. Para tomar decisiones acertadas (ej. corregir omisiones de registro clínico o pérdidas por hurto), es imperativo clasificar la causa raíz en origen. Valorizar la discrepancia permite al administrador priorizar la investigación de los productos con mayor pérdida económica neta.

## Alertas Log�sticas (Cron)
- **Decisi�n T�cnica (Global vs Main Storage):** El stock cr�tico se eval�a tomando el \Stock Global\ de la cl�nica (suma de existencias en todos los almacenes f�sicos). Esto previene que se disparen falsas alarmas para la compra a proveedores externos si la mercanc�a simplemente est� distribuida en un consultorio distinto.
- **Implementaci�n de Correo:** Se utiliz� la inyecci�n v�a CID del logotipo para garantizar la correcta previsualizaci�n y disminuir la puntuaci�n de Spam.

### Lógica de Notificaciones (Mayo 2026)
- **Tabla Inexistente:** Originalmente, `NotificationCenter` solo solicitaba notificaciones, pero no fallaba porque Supabase devuelve `null` con error de tabla inexistente.
- **Eliminación y RLS:** Para permitir eliminar notificaciones, se requiere una política de RLS específica para la acción `DELETE`, de lo contrario, la función de Supabase falla silenciosamente en el cliente.
- **Script de Limpieza (Advertencia de Migraciones):** Al ejecutar un script general de purgado de inventario, se reveló que algunas tablas satélite (`requisitions`, `product_kits`) podrían no estar presentes en todas las clínicas/ambientes, indicando una desincronización de migraciones en Supabase que debe ser auditada.

## 📄 PDFs Dinámicos en Cron Jobs (API Routes)
- **Decisión**: Generar el PDF de alerta de stock "al vuelo" en memoria (usando buffers nativos de Node/PDFKit) dentro del endpoint `/api/cron/inventory-alerts/route.ts`.
- **Razón**: Evita la escritura en disco (que es problemática en entornos serverless como Vercel) y no requiere guardar el documento en Supabase Storage si su único propósito es ser enviado como archivo adjunto efímero por correo electrónico. Esto mantiene la base de datos limpia y sin costos de almacenamiento innecesarios.
