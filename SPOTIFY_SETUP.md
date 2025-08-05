# Configuración de Spotify para Pomodoro App

Para usar la funcionalidad de Spotify en tu aplicación Pomodoro, necesitas configurar una aplicación en Spotify Developer Dashboard.

## Pasos para configurar Spotify:

### 1. Crear una aplicación en Spotify Developer Dashboard

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Inicia sesión con tu cuenta de Spotify
3. Haz clic en "Create an App"
4. Completa los campos:
   - **App name**: Pomodoro Timer
   - **App description**: Aplicación Pomodoro con integración de Spotify
   - **Website**: http://localhost:5173 (para desarrollo)
   - **Redirect URI**: http://localhost:5173/callback
5. Acepta los términos y condiciones
6. Haz clic en "Create"

### 2. Obtener las credenciales

1. En el dashboard de tu aplicación, encontrarás:
   - **Client ID**: Copia este valor
   - **Client Secret**: No lo necesitas para esta implementación

### 3. Configurar la aplicación

**Opción A: Usando variables de entorno (Recomendado)**
1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` y reemplaza `your_spotify_client_id_here` con tu Client ID real
3. Reinicia el servidor de desarrollo (`npm run dev`)

**Opción B: Directamente en el código**
1. Abre el archivo `src/SpotifyPlayer.tsx`
2. Busca la línea que dice:
   ```typescript
   const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id';
   ```
3. Reemplaza `'your_spotify_client_id'` con tu Client ID real de Spotify

### 4. Configurar Redirect URI

1. En el dashboard de Spotify, ve a "Settings"
2. En "Redirect URIs", agrega:
   - `http://localhost:5173/callback`
   - `http://localhost:5173` (opcional)
3. Guarda los cambios

## Funcionalidades disponibles:

- ✅ Autenticación con Spotify
- ✅ Búsqueda de canciones
- ✅ Visualización de playlists del usuario
- ✅ Reproducción de previews de 30 segundos
- ✅ Control de reproducción (play/pause)
- ✅ Integración con el temporizador Pomodoro
- ✅ Interfaz moderna y responsive

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