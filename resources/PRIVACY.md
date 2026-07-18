# Política de Privacidad — Hybridge Mentores Toolkit

**Última actualización:** julio de 2026

Hybridge Mentores Toolkit ("la extensión") es una herramienta de productividad
para mentores de Hybridge Education. Esta política describe qué datos procesa,
de dónde vienen y a dónde van.

## Resumen

La extensión funciona **exclusivamente dentro de `hub.hybridge.education`**.
No opera en ningún otro sitio, no recolecta datos de navegación general, no
usa analítica ni publicidad, y no vende ni comparte información con terceros
ajenos a los servicios que el propio mentor autoriza explícitamente (Google).

## Qué datos procesa

Mientras el mentor navega en `hub.hybridge.education`, la extensión lee las
respuestas de la propia API de Hybridge (a la que el mentor ya tiene acceso
por su sesión) para obtener datos del alumno que está consultando: nombre,
CURP, matrícula, calificaciones, cuatrimestre, y contactos de tutores. Estos
datos se usan **únicamente en el navegador del mentor** para:

- Generar el Kardex Oficial del alumno en Google Drive
- Copiar calificaciones con el formato requerido para reportes
- Generar correos de seguimiento académico prellenados
- Atajos de navegación dentro de la plataforma

Estos datos **no se envían a ningún servidor propio ni de terceros**, salvo
las excepciones descritas a continuación (Google Drive y el proxy de
autenticación).

## Acceso a Google (OAuth)

La extensión solicita autorización de Google para:

- Verificar la identidad del mentor (debe usar una cuenta `@hybridge.education`)
- Buscar, copiar, escribir y eliminar archivos dentro de las carpetas de
  Google Drive designadas para plantillas y Kardex generados

Este acceso a Drive ocurre en dos momentos distintos:

- **Verificación silenciosa**: al abrir la ficha de un alumno, la extensión
  busca (sin crear, leer ni modificar nada) si ya existe un Kardex para ese
  alumno, para mostrar el botón correcto ("Generar" o "Abrir"). Esto solo
  ocurre si el mentor ya tiene una sesión de Google activa en la extensión;
  nunca se le pide iniciar sesión automáticamente.
- **Creación o sobreescritura de archivos**: ocurre únicamente cuando el
  mentor hace clic explícitamente en "Generar" o "Volver a generar".

### Proxy de autenticación (Firefox y navegadores basados en Chromium alternos)

Para completar el inicio de sesión de Google en Firefox, Edge, Brave, Arc y
Zen, la extensión se comunica con un servicio propio y mínimo
(`hybridge-toolkit-oauth-proxy`, alojado en Cloudflare Workers) que reenvía
el código de autorización a Google para obtener el token de acceso. Este
servicio:

- Su código no guarda, registra ni conserva el contenido de las peticiones
  que procesa — es un intermediario sin estado (stateless) que solo reenvía
  la solicitud a Google y devuelve la respuesta
- Solo recibe el código de autorización temporal, el verificador PKCE
  generado por la extensión, y la URL de redirección — nunca ve las
  credenciales del mentor ni datos de alumnos
- Es operado por Hybridge Education (no un tercero externo), sobre la
  infraestructura de Cloudflare Workers, que puede conservar métricas
  agregadas de uso (número de peticiones) según sus propias políticas,
  sin acceso al contenido de los datos procesados

## Almacenamiento local

La extensión guarda en el almacenamiento local del navegador (no accesible
por otros sitios ni por Hybridge/Google):

- La sesión combinada de Google + Hybridge, con expiración automática (55
  minutos)
- El token de sesión de Hybridge, con expiración automática (24 horas)
- Preferencias del mentor sobre qué herramientas de la extensión tiene
  activadas

Ningún dato de alumnos se persiste más allá de la sesión activa del mentor.

## Portapapeles

Algunas funciones (copiar calificaciones, copiar correos) escriben texto al
portapapeles del sistema operativo cuando el mentor hace clic en el botón
correspondiente. Esto es una acción local, iniciada explícitamente por el
usuario, y no involucra ningún envío de datos a servidores.

## Lo que la extensión NO hace

- No usa cookies de rastreo ni analítica de terceros
- No muestra publicidad
- No vende ni comparte datos de alumnos con nadie
- No opera fuera de `hub.hybridge.education`
- No recolecta historial de navegación

## Permisos solicitados y por qué

| Permiso | Uso |
|---|---|
| `identity` | Autenticación con Google para acceso a Drive |
| `tabs` | Notificar cambios de configuración a la pestaña activa de Hybridge sin recargar la página |
| `storage` | Guardar sesión temporal y preferencias del mentor |
| `clipboardWrite` | Copiar calificaciones/correos al portapapeles cuando el mentor lo solicita |
| Acceso a `hub.hybridge.education` | Leer datos del alumno visible en pantalla e insertar mejoras en la interfaz |

## Contacto

Para preguntas sobre esta política o el manejo de datos, contactar a:
**marco.maldonado@hybridge.education**
