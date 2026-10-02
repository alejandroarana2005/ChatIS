# Chat con MongoDB

Aplicación de chat global en tiempo real. Varios clientes pueden conectarse al mismo servidor, intercambiar mensajes y conservarlos en MongoDB para que sigan disponibles después de recargar la página.

## Funcionalidades

- Comunicación en tiempo real mediante Socket.IO.
- Persistencia de mensajes en MongoDB Atlas.
- Historial de los últimos 100 mensajes al conectarse un cliente.
- Validación de mensajes vacíos y límite de 2000 caracteres.
- Indicador de conexión y mensajes de error en el cliente.
- Endpoint `/health` para comprobar el estado del backend.

## Tecnologías

- **Frontend:** HTML y JavaScript del navegador.
- **Backend:** Node.js y Express.
- **Tiempo real:** Socket.IO.
- **Base de datos:** MongoDB Atlas con el driver oficial `mongodb`.
- **Configuración local:** `dotenv`.
- **Despliegue:** Render para el backend y Netlify para el frontend.

## Estructura

```text
Backend/
  .env.example
  .gitignore
  package.json
  server.js
Frontend/
  config.js
  index.html
```

El backend usa la base de datos indicada por `MONGODB_DB` (por defecto, `chat`) y la colección `messages`. MongoDB crea la base y la colección cuando se insertan los primeros mensajes si todavía no existen. El servidor conserva todos los mensajes; al conectarse, cada cliente recibe solo los 100 más recientes.

## Ejecución local

Se necesita Node.js y una base de datos de MongoDB accesible desde el equipo.

1. En una terminal, entra en la carpeta `Backend` e instala dependencias:

   ```bash
   cd Backend
   npm install
   ```

2. Crea un archivo `.env` en `Backend` a partir de `.env.example` y configura sus valores:

   ```dotenv
   MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/chat?retryWrites=true&w=majority
   MONGODB_DB=chat
   FRONTEND_URL=http://localhost:8888
   PORT=3000
   ```

   Sustituye los marcadores de la URI por las credenciales y el host de tu cluster. Si la contraseña contiene caracteres especiales, codifícala para URL. No publiques `.env` ni compartas su contenido.

3. Inicia el backend:

   ```bash
   npm start
   ```

4. En `Frontend/config.js`, configura la URL del servidor local:

   ```js
   window.CHAT_SERVER_URL = "http://localhost:3000";
   ```

5. Sirve la carpeta `Frontend` con un servidor web local, por ejemplo la extensión Live Server de VS Code. Abre la dirección local que proporcione y comprueba que el estado indique **Conectado**.

El backend también puede iniciarse sin `FRONTEND_URL`; en ese caso Socket.IO acepta cualquier origen. Para desarrollo y despliegue es preferible establecer el origen permitido explícitamente.

## Despliegue

### Backend en Render

- **Root Directory:** `Backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Configura estas variables en la sección **Environment** del servicio:

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | URI completa de MongoDB Atlas, guardada como secreto |
| `MONGODB_DB` | `chat` |
| `FRONTEND_URL` | Dominio público de Netlify, sin barra final |

Render define `PORT` automáticamente. No es necesario copiar el `.env` local al servicio. En MongoDB Atlas, revisa **Network Access** para permitir las conexiones desde Render.

Comprueba el servicio abriendo `https://<tu-servicio>.onrender.com/health`; la respuesta esperada es:

```json
{"status":"ok"}
```

### Frontend en Netlify

El archivo `Frontend/config.js` indica a qué backend se conecta el navegador. Debe contener la URL pública de Render:

```js
window.CHAT_SERVER_URL = "https://<tu-servicio>.onrender.com";
```

Al importar el repositorio de GitHub en Netlify, usa:

- **Base directory:** vacío
- **Build command:** vacío
- **Publish directory:** `Frontend`

Después de conocer el dominio público de Netlify, configúralo como `FRONTEND_URL` en Render y vuelve a desplegar el backend. Si cambias `config.js`, vuelve a desplegar el frontend.

## Probar el chat

1. Abre el sitio de Netlify en dos navegadores o en una ventana normal y otra privada.
2. Confirma que ambos indiquen **Conectado**.
3. Envía un mensaje desde un cliente y verifica que aparece en ambos.
4. Recarga una de las páginas y confirma que el mensaje aparece en el historial.

## Eventos de Socket.IO

| Evento | Dirección | Uso |
| --- | --- | --- |
| `message` | Cliente a servidor | Envía un mensaje nuevo |
| `message-history` | Servidor a cliente | Entrega los últimos 100 mensajes al conectar |
| `messages` | Servidor a todos los clientes | Difunde un mensaje guardado |
| `message-error` | Servidor a cliente | Informa un error al cargar o guardar mensajes |

## Seguridad

- No subas archivos `.env` ni credenciales a GitHub. `Backend/.gitignore` excluye `.env`.
- Usa contraseñas únicas y revoca o rota cualquier credencial que se haya expuesto.
- Mantén `FRONTEND_URL` limitado al dominio de Netlify en producción.
- Este proyecto de demostración no implementa autenticación: cualquier visitante con acceso al frontend puede enviar mensajes.