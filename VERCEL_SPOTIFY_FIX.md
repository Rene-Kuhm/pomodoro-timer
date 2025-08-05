# 🔧 Solución: No se puede conectar a Spotify en Vercel

## Problema
La aplicación funciona localmente pero no puede conectarse a Spotify cuando está desplegada en Vercel.

## Causa
Las variables de entorno no están configuradas en Vercel, por lo que `VITE_SPOTIFY_CLIENT_ID` es `undefined` en producción.

## Solución Paso a Paso

### 1. Configurar Variables de Entorno en Vercel

1. **Accede a Vercel Dashboard**:
   - Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
   - Inicia sesión con tu cuenta

2. **Selecciona tu proyecto**:
   - Busca y selecciona "pomodoro-timer"

3. **Configura las variables de entorno**:
   - Ve a **Settings** (en la barra lateral)
   - Selecciona **Environment Variables**
   - Haz clic en **Add New**

4. **Agrega la variable de Spotify**:
   ```
   Name: VITE_SPOTIFY_CLIENT_ID
   Value: 30c4052242ce4567a2df72cffd6b9159
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

5. **Guarda la configuración**:
   - Haz clic en **Save**

### 2. Redeploy la Aplicación

1. **Forzar un nuevo deploy**:
   - Ve a la pestaña **Deployments**
   - Haz clic en los tres puntos (...) del último deployment
   - Selecciona **Redeploy**
   - Confirma la acción

### 3. Verificar la Configuración

1. **Espera a que termine el deploy** (1-2 minutos)

2. **Prueba la aplicación**:
   - Ve a https://pomodoro-timer-psi-one.vercel.app/
   - Haz clic en "Conectar con Spotify"
   - Deberías ser redirigido a Spotify para autorizar

3. **Si aún no funciona, verifica en la consola**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña **Console**
   - Busca errores relacionados con "CLIENT_ID" o "undefined"

## Verificación Adicional

### Comprobar que las variables están cargadas:

Puedes agregar temporalmente este código en `SpotifyPlayer.tsx` para debug:

```javascript
console.log('CLIENT_ID:', CLIENT_ID);
console.log('Environment:', isProduction ? 'production' : 'development');
console.log('Redirect URI:', REDIRECT_URI);
```

### Configuración del Spotify Dashboard

Asegúrate de que en tu [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) tengas configurado:

- **Redirect URIs**:
  - `https://localhost:5173/callback`
  - `https://pomodoro-timer-psi-one.vercel.app/callback`

## Solución Alternativa

Si el problema persiste, puedes hardcodear temporalmente el CLIENT_ID en producción:

```javascript
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 
  (window.location.hostname === 'pomodoro-timer-psi-one.vercel.app' 
    ? '30c4052242ce4567a2df72cffd6b9159' 
    : 'your_spotify_client_id');
```

## Contacto

Si sigues teniendo problemas después de seguir estos pasos, verifica:
1. Que el CLIENT_ID sea correcto
2. Que las Redirect URIs estén bien configuradas en Spotify
3. Que no haya errores en la consola del navegador