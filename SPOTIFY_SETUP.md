# Configuración de Spotify

## Configuración Completa de la Aplicación Spotify

### 1. Información de la Aplicación
- **App name**: Pomodoro Timer
- **App description**: Aplicación Pomodoro con integración de Spotify
- **Website**: `https://pomodoro-timer-psi-one.vercel.app/`

### 2. Redirect URIs (IMPORTANTE)
Agrega estas dos URIs en tu Spotify Dashboard:
- `https://localhost:5173/callback` (para desarrollo local)
- `https://pomodoro-timer-psi-one.vercel.app/callback` (para producción)

### 3. APIs Utilizadas
- Web API
- Web Playback SDK

### 4. Pasos de Configuración

1. **Crear aplicación en Spotify**:
   - Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Crea una nueva aplicación con la información de arriba
   - Copia el Client ID

2. **Configurar variables de entorno**:
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega: `VITE_SPOTIFY_CLIENT_ID=tu_client_id_aqui`

3. **Configurar Redirect URIs**:
   - En el dashboard de Spotify, ve a "Settings"
   - Agrega ambas URIs de redirección mencionadas arriba
   - Guarda los cambios

### 5. Funcionalidades Disponibles
- ✅ Autenticación OAuth automática
- ✅ Detección automática de entorno (desarrollo/producción)
- ✅ Búsqueda de música
- ✅ Reproducción de previews
- ✅ Visualización de playlists
- ✅ Control básico de reproducción
- ✅ Gestión de tokens con expiración
- ✅ Callback handling con React Router

### 6. Flujo de Autenticación
1. Usuario hace clic en "Conectar con Spotify"
2. Redirección a Spotify para autorización
3. Spotify redirige a `/callback` con el token
4. Token se guarda en localStorage con expiración
5. Usuario regresa a la aplicación principal
6. Aplicación usa el token para hacer requests a la API

### 7. Estructura de Archivos
- `src/SpotifyPlayer.tsx` - Componente principal de Spotify
- `src/SpotifyCallback.tsx` - Manejo del callback de autenticación
- `src/main.tsx` - Configuración de rutas con React Router

## Limitaciones:

- Solo se pueden reproducir previews de 30 segundos (limitación de Spotify Web API)
- Para reproducción completa, necesitarías implementar Spotify Web Playbook SDK
- Algunas canciones pueden no tener preview disponible

## Notas importantes:

- El token de acceso se guarda en localStorage
- La autenticación expira después de 1 hora

## Troubleshooting:

### Error: "INVALID_CLIENT: Invalid client"

Este error indica que el Client ID no está configurado correctamente. Para solucionarlo:

1. **Verifica que hayas creado la aplicación en Spotify Developer Dashboard**
2. **Asegúrate de haber copiado el Client ID correcto**
3. **Si usas variables de entorno (.env):**
   - Verifica que el archivo `.env` existe en la raíz del proyecto
   - Confirma que la variable se llama exactamente `VITE_SPOTIFY_CLIENT_ID`
   - Reinicia el servidor de desarrollo después de crear/modificar el archivo `.env`
4. **Si modificas el código directamente:**
   - Reemplaza `'your_spotify_client_id'` con tu Client ID real (sin comillas adicionales)
   - El Client ID debe ser una cadena de caracteres alfanuméricos

### Verificar configuración:

1. Abre las herramientas de desarrollador del navegador (F12)
2. Ve a la pestaña "Console"
3. Escribe: `console.log(import.meta.env.VITE_SPOTIFY_CLIENT_ID)`
4. Deberías ver tu Client ID real, no "your_spotify_client_id"

### Otros errores comunes:

- **Redirect URI mismatch**: Asegúrate de que `http://localhost:5173/callback` esté configurado en tu app de Spotify
- **App not found**: Verifica que la aplicación esté activa en el Spotify Developer Dashboard
- Para producción, necesitarás actualizar las URLs de redirect

## Solución de problemas:

1. **Error de CORS**: Asegúrate de que la URL de redirect esté configurada correctamente
2. **Token expirado**: Simplemente vuelve a autenticarte
3. **No se encuentran canciones**: Verifica que tu cuenta de Spotify tenga contenido

¡Disfruta de tu aplicación Pomodoro con música de Spotify! 🎵🍅