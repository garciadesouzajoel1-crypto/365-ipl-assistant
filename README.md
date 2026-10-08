# 365 IPL Assistant V3 — puente privado

## Qué contiene
Mantiene los comandos Discord de V2 y añade una API HTTP privada para integrar un futuro conector MCP.

## Instalación
Sube **los archivos de dentro de esta carpeta** al directorio raíz de tu repositorio de GitHub. Railway ejecuta `npm install` y `npm start`.

Variables existentes: `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`; configura `OWNER_ID` para limitar los comandos privados en Discord. Para el asistente interno opcional: `OPENAI_API_KEY`. Nueva variable: `BRIDGE_API_KEY`, un secreto aleatorio largo (mínimo 32 caracteres) que **no debes compartir ni subir a GitHub**. Railway suministra `PORT` automáticamente.

## Endpoints privados (solo con Authorization: Bearer <BRIDGE_API_KEY>)
- GET `/bridge/status`
- GET `/bridge/channels`
- POST `/bridge/plan` con `{"action":"create_channel","name":"pruebas-365"}`; devuelve `approval_id`.
- POST `/bridge/execute` con `{"approval_id":"...","confirm":true}`. La propuesta caduca en cinco minutos y solo se puede ejecutar una vez.
- GET `/health` solo indica si está listo; no muestra secretos.

## Seguridad y límites
- No expongas la clave en URLs, chats, capturas o repositorios.
- No se permiten eliminaciones, cambios masivos ni menciones automáticas.
- **La API no es todavía un conector ChatGPT listo para instalar.** Para usarla directamente desde ChatGPT hace falta implementar un servidor MCP y autenticación OAuth compatible, además de que tu plan permita herramientas de escritura.
- En planes donde no esté disponible MCP con escritura, puedes usar comandos Discord o un cliente privado externo como alternativa.
- Las propuestas pendientes están en memoria: desaparecen al reiniciar Railway.
- No se han realizado pruebas contra tu servidor real.
