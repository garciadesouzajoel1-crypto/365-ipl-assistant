365 V4.2 — corrección de solicitudes OAuth caducadas

Sube oauth.js a la raíz de GitHub sustituyendo el anterior. No cambies variables en Railway. Espera ACTIVE y vuelve a iniciar la conexión desde ChatGPT.

Cambio: la solicitud de autorización ahora viaja firmada en el formulario y no depende del Map temporal de solicitudes. Sigue caducando a los 5 minutos.

Nota: clientes OAuth y códigos de canje siguen en memoria, así que reinicios o múltiples réplicas durante el flujo aún pueden provocar errores. Para producción robusta se necesita almacenamiento compartido, rotación de claves y auditoría de seguridad.
