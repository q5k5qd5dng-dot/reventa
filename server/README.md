# Handticket · servidor (API + base de datos)

Sin dependencias: Node ≥ 22.13 (usa `node:sqlite`), `node:crypto` y `node:http`.

```bash
cp .env.example .env     # opcional
npm run build            # genera dist/ (la web)
npm run api              # http://localhost:8787 → web + /api
npm run test:api         # 36 pruebas de humo (registro, login, venta, compra, cobros…)
```

Si la web se abre desde el propio servidor (o cualquier origen con `/api`), detecta `/api/health` y
pasa a **modo servidor**; si no, sigue en modo demostración con `localStorage`.

## Qué incluye
| Área | Detalle |
|---|---|
| Registro / login | `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me` · scrypt + sal, sesión en cookie `HttpOnly; SameSite=Lax` (en BD solo el hash del token), límite de intentos, mismo mensaje exista o no el email |
| Recuperar contraseña | `POST /api/auth/forgot` y `/reset` (token de 1 h, cierra el resto de sesiones). Sin `RESEND_API_KEY` el email se imprime en consola |
| Cuenta | `PATCH /api/me`, `DELETE /api/me`, `POST /api/auth/password`, `GET/PUT /api/me/payout` (IBAN validado con módulo 97 y cifrado AES‑256‑GCM) |
| Eventos | `GET /api/events`, `/api/events/:id` (con anuncios reales) · se siembran desde `src/data` con `npm run seed:export` |
| Vender | `POST /api/listings` (límite 130 %, exige IBAN, evita duplicados), `GET /api/me/listings`, `PATCH/DELETE /api/listings/:id` |
| Comprar | `POST /api/orders` (transacción: reserva stock, comisión 8 %, entradas con código QR), `GET /api/me/orders`, `/api/me/tickets` |
| Cobros del vendedor | tabla `seller_payouts`: retenidos hasta 2 días después del evento (venta − 10 %) |
| Pagos | `payments.mjs`: modo *mock* sin claves; con `STRIPE_SECRET_KEY` usa Stripe Checkout + webhook firmado `POST /api/webhooks/stripe` |
| Seguridad | CSRF (origen + JSON), cabeceras, límite de tamaño, `audit_log`, `DATA_KEY` obligatoria en producción |

## Panel de administración (`/admin/`)
```bash
npm run build && npm run seed:demo   # 120 días de datos de ejemplo → admin@handticket.es / admin1234
npm run api                          # abre http://localhost:8787/admin/
npm run admin:create tu@correo.es "una-contraseña-larga"   # crear/promocionar un administrador real
```
| Sección | Qué incluye |
|---|---|
| Resumen | GMV, ingresos (bruto y neto de IVA), pedidos, ticket medio, take rate, altas, reembolsos, retenido; comparativa con el periodo anterior, sparklines, gráficos, top eventos/ciudades/categorías, actividad en vivo |
| Estadísticas | embudo, retención por cohortes, mapa de calor día×hora, sobreprecio, valor del pedido, tiempo hasta vender, mejores vendedores y compradores |
| Pedidos / Anuncios / Eventos / Usuarios | búsqueda, filtros, orden, paginación, export CSV, ficha lateral, reembolso con abonos, retirada de anuncios, alta/edición/cancelación de eventos, suspensión y roles |
| Liquidaciones | retenido → listo → liberado → pagado, selección múltiple, remesa CSV con IBAN descifrado (queda en auditoría) |
| Facturación | facturas por gastos de gestión y comisiones con numeración correlativa, abonos HT‑R, resumen de IVA por trimestre, libro de facturas CSV, factura imprimible |
| Riesgo y fraude | sobreprecio, cuentas nuevas con muchos anuncios, reembolsos repetidos, accesos fallidos por IP, tickets prioritarios |
| Soporte | tickets creados desde el Centro de ayuda, conversación, prioridad y respuesta por email |
| Auditoría / Ajustes | registro de acciones sensibles; comisiones, IVA, tope de precio y días de retención editables en caliente con simulador |
Atajos: `⌘K` / `Ctrl+K` o `/` abren la paleta de comandos; el tema claro/oscuro se recuerda.

## Pasar a PostgreSQL / Supabase
El mismo modelo está en `schema.postgres.sql`. Solo hay que sustituir `db.mjs` (las consultas son SQL estándar).

## Pendiente antes de producción
Almacenar los PDF originales (S3/R2) y entregarlos solo al comprador, verificación real del QR contra el organizador,
verificación de email, panel de administración y liquidación SEPA de `seller_payouts`.
