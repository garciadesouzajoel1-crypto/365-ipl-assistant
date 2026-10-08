# 365 | IPL Assistant — V1

## Requisitos
- Node.js 20 o superior
- Bot 365 ya instalado en el servidor IPL

## Configuración
1. Ejecuta `npm install` en esta carpeta.
2. Copia `.env.example` a `.env`.
3. Rellena `DISCORD_TOKEN` (en Developer Portal > Bot), `CLIENT_ID` (General Information > Application ID) y `GUILD_ID` (Discord > modo desarrollador > clic derecho servidor > Copiar ID).
4. Ejecuta `npm start`.
5. En Discord prueba `/ping`, `/anuncio` y `/crear-canal`.

Nunca publiques `.env` ni compartas el token. Para mantener el bot encendido 24/7, despliega el proyecto en un hosting de procesos Node.js con variables de entorno secretas y comando `npm start`.

La V1 usa solo el intent Guilds; no necesita Message Content ni Server Members Intent. Las acciones de administración requieren permisos de usuario y del bot.
