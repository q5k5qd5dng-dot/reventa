# Handticket · servidor (API + base de datos)

Sin dependencias: Node ≥ 22.13 (usa `node:sqlite`), `node:crypto` y `node:http`.

```bash
cp .env.example .env     # opcional
npm run build            # genera dist/ (la web)
npm run api              # http://localhost:8787 → web + /api
npm run test:api         # 20 pruebas de humo (registro, login, venta, compra, cobros…)
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

## Pasar a PostgreSQL / Supabase
El mismo modelo está en `schema.postgres.sql`. Solo hay que sustituir `db.mjs` (las consultas son SQL estándar).

## Pendiente antes de producción
Almacenar los PDF originales (S3/R2) y entregarlos solo al comprador, verificación real del QR contra el organizador,
verificación de email, panel de administración y liquidación SEPA de `seller_payouts`.
