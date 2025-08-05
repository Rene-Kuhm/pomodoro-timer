# 🚨 SOLUCIÓN URGENTE - Error 400 Spotify

## Problema Identificado
El error `400 (Bad Request)` en la URL de Spotify se debe a que las variables de entorno **NO están configuradas en Vercel**.

## Solución Inmediata

### 1. Configurar Variables de Entorno en Vercel
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `pomodoro-timer`
3. Ve a **Settings** → **Environment Variables**
4. Agrega la siguiente variable:
   - **Name**: `VITE_SPOTIFY_CLIENT_ID`
   - **Value**: `30c4052242ce4567a2df72cffd6b9159`
   - **Environment**: Selecciona `Production`, `Preview`, y `Development`

### 2. Redesplegar la Aplicación
1. Ve a la pestaña **Deployments**
2. Haz clic en **Redeploy** en el último deployment
3. Espera a que termine el despliegue

### 3. Verificar la Solución
1. Abre la aplicación en producción
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña **Console**
4. Intenta conectar con Spotify
5. Deberías ver logs detallados que confirmen que `CLIENT_ID` tiene el valor correcto

## ¿Por qué ocurrió esto?
La aplicación funciona localmente porque tienes el archivo `.env` con las variables. Pero Vercel **NO lee automáticamente** los archivos `.env` locales - necesitas configurar las variables manualmente en el dashboard.

## Confirmación del Fix
Después de configurar las variables de entorno, la URL de autorización debería verse así:
```
https://accounts.spotify.com/authorize?client_id=30c4052242ce4567a2df72cffd6b9159&response_type=token&...
```

En lugar de:
```
https://accounts.spotify.com/authorize?client_id=VITE_SPOTIFY_CLIENT_ID=30c...  ❌
```

---
**⏱️ Tiempo estimado para la solución: 2-3 minutos**