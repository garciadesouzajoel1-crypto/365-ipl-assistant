365 V4.1 OAuth (versión de prueba)

Archivos que debes subir a la RAÍZ de GitHub:
- index.js (reemplazar)
- mcp.js (reemplazar)
- oauth.js (nuevo)
- package.json (mantener o reemplazar)

En Railway > Variables, mantener DISCORD_TOKEN, CLIENT_ID, GUILD_ID, OWNER_ID y BRIDGE_API_KEY.
Añadir:
OAUTH_BASE_URL=https://365-ipl-assistant-production.up.railway.app
OAUTH_OWNER_SECRET=una contraseña aleatoria y PRIVADA de al menos 24 caracteres
OAUTH_SIGNING_KEY=otra clave aleatoria y PRIVADA de al menos 32 caracteres

Generar cada clave en PowerShell/Node con:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Ejecutar DOS veces; no reutilizar la misma clave.
No subir valores a GitHub ni publicarlos en el chat.

Tras despliegue, comprobar en navegador:
https://365-ipl-assistant-production.up.railway.app/.well-known/oauth-protected-resource
https://365-ipl-assistant-production.up.railway.app/.well-known/oauth-authorization-server

En ChatGPT, seleccionar OAuth, no 'Sin autenticación'.
OAuth permite autorizar el acceso escribiendo OAUTH_OWNER_SECRET en la página de Railway cuando ChatGPT la abra.
Los tokens caducan a los 60 minutos; puede ser necesario reconectar.
Los registros y códigos de autorización están en memoria: un reinicio puede interrumpir una conexión en curso.
No se ha probado la conexión real de ChatGPT: esta versión es de evaluación, no un servicio OAuth auditado.
Las acciones de escritura siguen necesitando confirmación explícita en ChatGPT, pero la comprobación de aprobación es conversacional, no una segunda autenticación criptográfica.
