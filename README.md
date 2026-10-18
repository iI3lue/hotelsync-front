# HotelSync — Front

Aplicación web única de HotelSync (Next.js 15 + React 19 + Tailwind): sitio público de reservas y panel `/admin` para recepción, housekeeping, staff y analytics. Actúa como BFF: el navegador nunca llama directamente a los microservicios.

- **Producción:** https://hotelsync-front.vercel.app
- **Puerto local:** 3000

## Responsabilidad

| Hace | No hace |
| --- | --- |
| UI pública: búsqueda, disponibilidad, reserva, cuenta y mis reservas | Persistir datos de negocio (viven en cada microservicio) |
| Panel `/admin` con guards por rol | Autorizar de verdad (la seguridad real está en cada API) |
| BFF: inyecta el Bearer desde la cookie y reescribe `/api/*` | Rotar tokens en el middleware |
| Login con Google vía Auth0 | Gestionar pagos reales |

## Tecnologías

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 3 · Auth0 · Jest.

## Rutas

**Público:** `/`, `/buscar`, `/hotels/[id]`, `/hotels/[id]/availability`, `/reservas/nueva`, `/mis-reservas`, `/cuenta/{crear,entrar,perfil,recuperar,restablecer}`.

**Admin:** `/admin`, `/admin/analytics`, `/admin/hotels` (alta, detalle, inventario y habitaciones), `/admin/housekeeping`, `/admin/login`, `/admin/recepcion`, `/admin/simulador`, `/admin/staff`.

## BFF y rewrites

| Prefijo del front | Destino |
| --- | --- |
| `/api/property/*` | `NEXT_PUBLIC_PROPERTY_API_URL` |
| `/api/rate/*` | `NEXT_PUBLIC_RATE_API_URL` |
| `/api/users/*` | `NEXT_PUBLIC_USER_API_URL` |
| `/api/booking/*` | `NEXT_PUBLIC_BOOKING_API_URL` |
| `/api/front-desk/*` | `NEXT_PUBLIC_FRONT_DESK_API_URL` |
| `/api/housekeeping/*` | `NEXT_PUBLIC_HOUSEKEEPING_API_URL` |
| `/api/billing/*` | `NEXT_PUBLIC_BILLING_API_URL` |
| `/api/loyalty/*` | `NEXT_PUBLIC_LOYALTY_API_URL` |
| `/api/payments/*` | `NEXT_PUBLIC_PAYMENT_API_URL` |
| `/api/analytics/*` | `NEXT_PUBLIC_ANALYTICS_API_URL` |
| `/api/simulator/reservations` | `CHANNEL_MANAGER_API_URL` (route handler, solo SUPER_ADMIN) |

Auth: `/api/auth/{login,register,google,callback,refresh,me,logout,providers,password/*}`. El middleware solo **inyecta** el Bearer en las llamadas de API; nunca rota tokens. La renovación ocurre en `/api/auth/refresh`, `/api/auth/me` y el retry del cliente (las `Set-Cookie` sobre `NextResponse.next()` se pierden en los rewrites).

## Guards

- `src/middleware.ts`: exige sesión en `/admin` y redirige al panel por rol (`RECEPTIONIST → /admin/recepcion`, `HOUSEKEEPER → /admin/housekeeping`, `MANAGER`/`SUPER_ADMIN → /admin`).
- `src/lib/routes.ts` (`isAllowedPathForRole`) y `src/lib/view-as.ts` (`adminSectionsFor`) repiten la matriz en cliente/servidor.
- `WarmUp.tsx` despierta 9 de los 11 servicios al entrar (`/health` en paralelo); channel-manager y analytics no están incluidos.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_PROPERTY_API_URL` | Sí | Base Property (con `/v1`) |
| `NEXT_PUBLIC_RATE_API_URL` | Sí | Base Rate & Availability |
| `NEXT_PUBLIC_USER_API_URL` | Sí | Base User |
| `NEXT_PUBLIC_BOOKING_API_URL` | Sí | Base Booking |
| `NEXT_PUBLIC_FRONT_DESK_API_URL` | Sí | Base Front Desk |
| `NEXT_PUBLIC_HOUSEKEEPING_API_URL` | Sí | Base Housekeeping |
| `NEXT_PUBLIC_BILLING_API_URL` | Sí | Base Billing |
| `NEXT_PUBLIC_LOYALTY_API_URL` | Sí | Base Loyalty |
| `NEXT_PUBLIC_PAYMENT_API_URL` | Sí | Base Payment |
| `NEXT_PUBLIC_ANALYTICS_API_URL` | Sí | Base Analytics |
| `CHANNEL_MANAGER_API_URL` | Sí | Base Channel Manager (solo servidor) |
| `CHANNEL_MANAGER_SIMULATOR_KEY` | Sí | Provider-key del canal simulado (solo servidor) |
| `APP_BASE_URL` | Sí | URL pública del front (callbacks/logout de Auth0) |
| `AUTH0_DOMAIN` | Sí | Tenant de Auth0 |
| `AUTH0_CLIENT_ID` | Sí | Client ID de la app |
| `AUTH0_CLIENT_SECRET` | Sí | Client secret (solo servidor) |

Las `NEXT_PUBLIC_*` se inyectan en **build time**: cambiarlas en Vercel exige un Redeploy.

## Ejecución local

```bash
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

Requiere los microservicios arriba. En Auth0, el callback permitido debe ser `http://localhost:3000/api/auth/callback`.

## Despliegue

Vercel: framework Next.js, build `next build`. Configurar todas las variables antes del build; `APP_BASE_URL=https://hotelsync-front.vercel.app`. Los previews cambian de URL por deploy, por eso no se whitelistean. Los backends en Render free tardan ~60 s en despertar: el BFF corta el simulador a los 45 s y devuelve 503 en vez de colgar el navegador.

## Pruebas y verificación

```bash
npm test
npm run lint
curl -I https://hotelsync-front.vercel.app
```

## Estructura

```
src/app/{page.tsx,admin,hotels,reservas,cuenta,api}
src/components/
src/lib/{api-client,auth-session,server-session,routes,view-as,use-availability}
```
