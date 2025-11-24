# BirthdayInvitation

Aplicación web para que una persona (el cumpleañero) pueda crear y personalizar una página pública de invitación a su fiesta. Permite configurar pantallas de invitación, subir imágenes, importar canciones desde Spotify, y gestionar invitados y confirmaciones.

## Funcionalidades
- Crear y editar una invitación pública con múltiples pantallas (screens) que contienen bloques de contenido (texto, botones, imágenes, gallery, playlist, etc.).
- Vista previa en tiempo real: modal flotante con alternancia Escritorio / Móvil que renderiza la invitación tal como se verá públicamente.
- Fondo global y fondos por pantalla: color, gradiente o imagen (con subida y almacenamiento en S3 configurado en `src/lib/s3.ts`).
- Gestor de galería: subir, borrar y reordenar imágenes usadas en la invitación.
- Integración con Spotify: importar playlists, sincronizar y mostrar estadísticas básicas; soporte para login de Spotify.
- Gestión de invitados: crear invitaciones públicas con token para confirmar asistencia, listado y estado de confirmación.
- Sistema de autenticación: `next-auth` para login/registro de usuarios (cumpleañeros) y control de sesión para el dashboard.
- Panel de administración (dashboard) con editores de bloques, tipografías, paleta de colores y configuración de tema.

## Estructura del proyecto (resumen)

- `src/app/` — rutas de la aplicación (Next.js App Router).
    - `auth/` — páginas de `login` y `register`.
    - `dashboard/` — interfaz privada para editar la invitación, subir medios, gestionar invitados y playlists.
    - `[username]/` — ruta pública de visualización de la invitación por `username`.

- `src/components/` — componentes reutilizables (ej. `InvitationRenderer`, `ThemeController`).
- `src/lib/` — utilidades y adaptadores (Prisma client, S3 helpers, Spotify helpers).
- `src/app/globals.css` — estilos globales y variables CSS.
- `prisma/` — esquema de base de datos y migraciones.

## Modelos (resumen / Prisma)
El proyecto usa Prisma para el modelo de datos. A modo de referencia simplificada:

- `BirthdayPeople` (usuario anfitrión):
    - `username` (string, PK)
    - `password` (hashed)
    - `profile` (metadatos: nombre, tipografía, paleta, etc.)

- `Guests`:
    - `token` (string, PK)
    - `name` (string)
    - `confirmed` (boolean)
    - `invitationId` (relación)

- `Invitations` / `Screens` / `Fragments`:
    - Estructura JSON para pantallas y bloques (texto, imagen, split, botones, etc.) almacenada en campos JSON cuando aplica.

Consulta `prisma/schema.prisma` para la definición completa.

## Tecnologías y librerías principales
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS para utilidades y diseño
- Prisma ORM para acceso a base de datos
- next-auth para autenticación
- react-hot-toast para mensajes estilo toast
- AWS S3 (o compatible) para almacenamiento de medios (helper en `src/lib/s3.ts`)
- Integración con la API de Spotify (helpers en `src/lib/spotify.ts`)

## Scripts útiles
- `npm run dev` — ejecutar la app en modo desarrollo
- `npm run build` — construir para producción
- `npm run start` — iniciar servidor en modo producción (después de `build`)

## Cómo ejecutar (rápido)

1. Copia `.env.example` a `.env` y configura las variables: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, AWS_* (si usas S3), SPOTIFY_CLIENT_ID/SECRET, etc.
2. Instala dependencias: `npm install`
3. Migra la base de datos (con precaución en producción): `npx prisma migrate dev` o `npx prisma db push` para aplicar esquema.
4. Ejecuta en desarrollo: `npm run dev`

## Notas sobre desarrollo
- La app usa componentes cliente y servidor del App Router de Next.js. Hay algunos hooks de cliente (ej. `useSearchParams`) que deben ejecutarse en componentes marcados como `"use client"` para evitar errores de prerender.
- Los previews y modales se renderizan en cliente y ofrecen alternancia para ver el resultado en móvil (stacked) o escritorio.

## Contribuciones
- Abre un issue con una descripción clara del bug o feature.
- Para cambios grandes, crea un branch por feature y un pull request describiendo el propósito y pruebas realizadas.

---
Si quieres que añada una sección de despliegue (Vercel) o ejemplos de API (endpoints) lo hago a continuación.

