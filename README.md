# hotelsync-front

Frontend único de HotelSync (Next.js 15): sitio público + `/admin` para recepción y gestión.

Extraído del monorepo HotelSync como repo autocontenido.

## Stack

Next.js 15 · React 19 · Tailwind 3 · SWR · next-themes · react-day-picker

## Variables de entorno

| Variable                         | Apunta a              |
| -------------------------------- | --------------------- |
| `NEXT_PUBLIC_PROPERTY_API_URL`     | property-service      |
| `NEXT_PUBLIC_RATE_API_URL`         | rate-availability     |
| `NEXT_PUBLIC_BOOKING_API_URL`      | booking-service       |
| `NEXT_PUBLIC_FRONT_DESK_API_URL`   | front-desk-service    |
| `NEXT_PUBLIC_HOUSEKEEPING_API_URL` | housekeeping-service  |
| `NEXT_PUBLIC_BILLING_API_URL`      | billing-service       |

El front consume los backends vía rewrites (`/api/<servicio>/*` → URL base + `/:path*`,
ver `next.config.js`). Las `NEXT_PUBLIC_*` se inyectan **en el build**: en Vercel se
configuran como Environment Variables antes de desplegar; en local van en `.env.local`.

## Scripts

- `npm run dev` — desarrollo (`next dev --turbopack --port 3000`)
- `npm run build` / `npm start` — build de producción y arranque
- `npm run lint` — `next lint`
- `npm test` — Jest

## Despliegue (Vercel)

Conectar este repo en Vercel, setear las 6 `NEXT_PUBLIC_*_API_URL` con las URLs
`https://<servicio>.onrender.com/v1` de producción y desplegar. Cada cambio de URL
requiere redeploy (quedan fijas en el build).
