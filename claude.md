# 🛰️ VETINET ELITE — Constitución del Proyecto

## 📜 VISIÓN GENERAL
Vetinet Elite es un ecosistema veterinario avanzado diseñado para la profesionalización de clínicas. El sistema es "Billing-Aware", permitiendo operar en modo exclusivamente clínico o con facturación integrada.

## 🛠️ STACK TECNOLÓGICO
- **Frontend**: Next.js 16 (App Router + Turbopack)
- **Base de Datos**: Supabase (PostgreSQL)
- **Estética**: Dark Premium / Bento Grid / Neo-minimalismo
- **Iconografía**: Lucide React
- **Animaciones**: Framer Motion

## 🏰 ARQUITECTURA DE INVENTARIO (7 PILARES)
1. **Multialmacén**: Gestión de stock por ubicaciones físicas.
2. **Trazabilidad (Kardex)**: Historial profesional con responsables y balances.
3. **Lotes e Inteligencia FEFO**: Control de vencimientos (First Expired, First Out).
4. **Proveedores y OC**: Directorio comercial y órdenes de compra.
5. **Kits y Recetas**: Combos de productos para consumo rápido.
6. **Auditorías**: Tomas físicas y conciliación de discrepancias.
7. **Código de Barras**: Integración con lectores para agilidad operativa.

## 🔒 REGLAS DE ORO
- Nunca hardcodear API keys (usar `.env`).
- Todos los comentarios en español.
- Las vistas de base de datos se usan para reportes complejos (Kardex).
- Los montos financieros se ocultan si `billingEnabled` es falso.
